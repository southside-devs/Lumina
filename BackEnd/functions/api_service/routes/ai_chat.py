import os
import json
import re
import google.generativeai as genai
from utils.response import success, bad_request, server_error
from utils.auth import check_any_authenticated

def handle(request, path_parts):
    """Route dispatcher for /api/ai-chat endpoints."""
    if request.method == "POST":
        return process_chat(request)
    
    return bad_request(f"Method not allowed: {request.method}")


def clean_ai_response(response):
    """Extract and sanitize final AI response, stripping out thinking traces, scratchpads, or echoed prompts."""
    if not response:
        return ""

    raw_text = ""
    # Try extracting non-thought parts from candidate content if available
    try:
        if hasattr(response, 'candidates') and response.candidates:
            cand = response.candidates[0]
            if hasattr(cand, 'content') and hasattr(cand.content, 'parts'):
                non_thought_parts = []
                for p in cand.content.parts:
                    is_thought = getattr(p, 'thought', False)
                    if not is_thought and hasattr(p, 'text') and p.text:
                        non_thought_parts.append(p.text)
                if non_thought_parts:
                    raw_text = "".join(non_thought_parts)
    except Exception as e:
        print(f"Part extraction note: {e}")

    if not raw_text and hasattr(response, 'text'):
        raw_text = response.text or ""

    if not raw_text:
        return ""

    # Clean out scratchpad/thinking blocks if echoed in output text
    lines = raw_text.split('\n')
    cleaned_lines = []

    for line in lines:
        sline = line.strip()
        # Check if line looks like an internal reasoning / chain of thought step
        if sline.startswith('* User input:') or sline.startswith('* Context:') or sline.startswith('* Instruction:') or sline.startswith('* Tone:') or sline.startswith('* Goal:') or sline.startswith('Thought:') or sline.startswith('Thinking:'):
            continue
        
        # Handle merged single-line scratchpads (e.g. "* User input: ... * Tone: ... \"Actual answer\"")
        if '* User input:' in sline or '* Instruction:' in sline or '* Context:' in sline:
            quoted = re.findall(r'"([^"]+)"', sline)
            if quoted:
                cleaned_lines.append(quoted[-1])
                continue
            subparts = sline.split('* ')
            last_subpart = subparts[-1].strip()
            if last_subpart and not last_subpart.startswith('User input') and not last_subpart.startswith('Instruction'):
                cleaned_lines.append(last_subpart)
            continue

        cleaned_lines.append(line)

    result = "\n".join(cleaned_lines).strip()
    return result if result else raw_text.strip()


def get_model_candidates(api_key):
    """Retrieve available Gemini models that support generateContent, with standard fallbacks."""
    genai.configure(api_key=api_key)
    candidates = []
    
    try:
        models = genai.list_models()
        for m in models:
            methods = getattr(m, 'supported_generation_methods', [])
            if 'generateContent' in methods:
                name = m.name.replace('models/', '')
                candidates.append(name)
    except Exception as e:
        print(f"Warning listing genai models: {e}")

    # Standard model candidates ordered by preference
    defaults = [
        'gemini-1.5-flash',
        'gemini-1.5-flash-latest',
        'gemini-2.0-flash',
        'gemini-2.5-flash',
        'gemini-1.5-pro',
        'gemini-1.5-pro-latest',
        'gemini-pro',
    ]
    for d in defaults:
        if d not in candidates:
            candidates.append(d)

    return candidates


def process_chat(request):
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return bad_request("Missing 'query' in request payload")

        query = data['query']
        chat_history = data.get('history', [])
        context_data = data.get('context', '')

        # Use os.environ for Zoho Catalyst environment variables
        api_key = os.environ.get('GEMINI_API_KEY')
        if not api_key:
            return server_error("Backend Configuration Error: GEMINI_API_KEY is not set in the Catalyst server environment variables.")

        genai.configure(api_key=api_key)

        system_instruction = (
            "You are Lumina AI, an elite intelligence assistant for the Karnataka State Police (KSP).\n"
            "CRITICAL:\n"
            "- Respond DIRECTLY to the user. NEVER output scratchpads, internal thoughts, prompt analysis, or bullet points starting with '* User input:' or '* Instruction:'.\n"
            "- For casual greetings (e.g., 'hi', 'hello', 'good morning', 'namaskara'), reply in 1-2 direct, friendly, professional sentences asking how you can assist their investigation today.\n"
            "- For analytical queries, provide concise, professional, data-driven answers using Markdown.\n"
        )
        if context_data:
            system_instruction += f"\n\nLive System Data:\n{context_data}"

        formatted_history = []
        for msg in chat_history:
            role = 'model' if msg.get('role') == 'assistant' else 'user'
            text = msg.get('text', '')
            if text:
                formatted_history.append({'role': role, 'parts': [text]})

        candidates = get_model_candidates(api_key)
        last_error = None

        for model_name in candidates:
            try:
                try:
                    model = genai.GenerativeModel(model_name, system_instruction=system_instruction)
                except Exception:
                    model = genai.GenerativeModel(model_name)

                chat = model.start_chat(history=formatted_history)
                response = chat.send_message(query)
                cleaned_text = clean_ai_response(response)
                if cleaned_text:
                    return success({'response': cleaned_text})
            except Exception as model_err:
                print(f"Model '{model_name}' failed: {model_err}")
                last_error = model_err

        raise last_error or Exception("No valid Gemini model was able to generate a response.")

    except Exception as e:
        print(f"Error in ai_chat: {str(e)}")
        return server_error(f"Failed to generate AI response: {str(e)}")
