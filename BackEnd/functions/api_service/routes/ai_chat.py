import os
import json
import re
from utils.response import success, bad_request, server_error
from utils.auth import check_any_authenticated
from utils.db import DataStore

try:
    import google.generativeai as genai
    HAS_GENAI = True
except ImportError:
    HAS_GENAI = False


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

    lines = raw_text.split('\n')
    cleaned_lines = []

    for line in lines:
        sline = line.strip()
        if (sline.startswith('* User input:') or sline.startswith('* Context:') or 
            sline.startswith('* Instruction:') or sline.startswith('* Tone:') or 
            sline.startswith('* Goal:') or sline.startswith('Thought:') or 
            sline.startswith('Thinking:')):
            continue
        
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
    """Retrieve available Gemini models that support generateContent, prioritized by latest stable versions."""
    defaults = [
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-3.5-flash',
        'gemini-flash-latest',
        'gemini-2.5-pro',
        'gemini-pro-latest',
    ]

    if not HAS_GENAI:
        return defaults

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

    # Ensure top working models are first in order
    sorted_candidates = []
    for d in defaults:
        if d in candidates and d not in sorted_candidates:
            sorted_candidates.append(d)
    for c in candidates:
        if c not in sorted_candidates:
            sorted_candidates.append(c)

    return sorted_candidates if sorted_candidates else defaults


def process_chat(request):
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return bad_request("Missing 'query' in request payload")

        query = data['query']
        chat_history = data.get('history', [])
        context_data = data.get('context', '')

        # Check for Gemini API Key from environment or .env
        api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY')

        if not api_key:
            return server_error("GEMINI_API_KEY is not set.")

        genai.configure(api_key=api_key)

        system_instruction = (
            "You are Lumina AI, an elite intelligence and crime analytics assistant for the Karnataka State Police (KSP).\n"
            "You have access to 5,000 Karnataka FIR records, 209 police stations, 31 districts, and 456 flagged repeat offenders.\n"
            "CRITICAL INSTRUCTIONS:\n"
            "- Respond DIRECTLY and professionally to the user with helpful, precise, and investigative reasoning.\n"
            "- NEVER output internal scratchpads, reasoning tokens, prompt analysis, or bullets starting with '* User input:' or '* Instruction:'.\n"
            "- For casual greetings (e.g., 'hi', 'hello', 'good morning', 'namaskara'), respond in 1-2 friendly, professional sentences.\n"
            "- For analytical and investigative queries, provide structured, concise, data-driven answers using Markdown formatting."
        )
        if context_data:
            system_instruction += f"\n\nLive Database Telemetry:\n{context_data}"

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
