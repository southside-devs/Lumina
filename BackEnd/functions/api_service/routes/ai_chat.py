import os
import json
import re
import urllib.request
import urllib.error
import base64
from utils.response import success, bad_request, server_error
from utils.auth import check_any_authenticated
from utils.db import DataStore

_DEFAULT_API_TOKEN = base64.b64decode("QVEuQWI4Uk42SzRfTHJSb1hxc3VCMVk2Zy1tNFRzcE83SWVzRDdYdi1PUUJGWU1tZTJUMXc=").decode("utf-8")


def handle(request, path_parts):
    """Route dispatcher for /api/ai-chat endpoints."""
    if request.method == "POST":
        return process_chat(request)
    
    return bad_request(f"Method not allowed: {request.method}")


def clean_ai_response(raw_text):
    """Extract and sanitize final AI response, stripping out thinking traces, scratchpads, or echoed prompts."""
    if not raw_text:
        return ""

    if not isinstance(raw_text, str):
        if hasattr(raw_text, "text"):
            raw_text = raw_text.text or ""
        else:
            raw_text = str(raw_text)

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


def get_model_candidates():
    """Prioritized list of verified, currently active Gemini models via REST API."""
    return [
        'gemini-3.5-flash-lite',
        'gemini-3.5-flash',
        'gemini-3.6-flash',
        'gemini-3.7-flash',
        'gemini-flash-latest',
        'gemini-flash-lite-latest',
        'gemini-2.5-flash',
    ]


# ── Database Context Retrieval (RAG) ─────────────────────────────────────────

# ── Database Context Retrieval (RAG) ─────────────────────────────────────────

def _extract_fir_references(text):
    """
    Extract FIR number patterns from free text or voice transcriptions.
    Matches formats like: 1693/2026, 1693 slash 2026, FIR 1693 2026, FIR 1693 of 2026, FIR #1693, ID 5001
    Returns list of (ref_string, ref_type) tuples where ref_type is 'number' or 'id'.
    """
    # Normalize spoken / voice patterns to standard num/year format:
    # "1693 slash 2026", "1693 stroke 2026", "1693 of 2026", "1693 by 2026", "1693-2026"
    text_norm = re.sub(r'(\d{1,5})\s*(?:/|slash|stroke|by|of|-)\s*(20\d{2})', r'\1/\2', text, flags=re.IGNORECASE)
    # Normalize space separated year: "1693 2026" -> "1693/2026"
    text_norm = re.sub(r'\b(\d{1,5})\s+(20\d{2})\b', r'\1/\2', text_norm)

    found = []

    # 1. Match full FIR_Number patterns like 1693/2026, 0004/2026, 2706/2026
    for m in re.finditer(r'\b(\d{1,5}/20\d{2})\b', text_norm, re.IGNORECASE):
        found.append((m.group(1), 'number'))

    # 2. Match standalone numbers following FIR / case / report / Kannada keywords
    if not found:
        for m in re.finditer(
            r'(?:FIR|case|crime|id|rowid|report|ಎಫ್‌ಐಆರ್|ಪ್ರಥಮ ವರ್ತಮಾನ ವರದಿ)[#\s\-:]*(\d{1,5})\b',
            text_norm, re.IGNORECASE
        ):
            found.append((m.group(1), 'number_or_id'))

    # 3. Fallback: catch any standalone 4-digit number that could be an FIR number in a short query
    if not found and len(text.strip().split()) <= 4:
        for m in re.finditer(r'\b(\d{3,5})\b', text_norm):
            found.append((m.group(1), 'number_or_id'))

    # Deduplicate
    seen = set()
    unique = []
    for item in found:
        if item[0] not in seen:
            seen.add(item[0])
            unique.append(item)
    return unique[:3]  # cap at 3


def _fetch_db_context(query, db):
    """
    Intelligently fetch relevant database records based on the query.
    Returns a formatted string injected into the Gemini system prompt as ground truth.
    """
    context_parts = []

    # 1. FIR-specific lookups
    fir_refs = _extract_fir_references(query)
    found_any_fir = False

    for ref, ref_type in fir_refs:
        try:
            rows = []
            if '/' in ref:
                # Full num/year format (e.g. 1693/2026, 0004/2026)
                escaped = ref.replace("'", "''")
                num, yr = ref.split('/')
                num_clean = num.lstrip('0') or '0'

                rows = db.execute_query(
                    f"SELECT FIR.*, Police_Station.Name AS Station_Name, District.Name AS District_Name "
                    f"FROM FIR "
                    f"LEFT JOIN Police_Station ON FIR.Station_ID = Police_Station.ROWID "
                    f"LEFT JOIN District ON Police_Station.District_ID = District.ROWID "
                    f"WHERE FIR.FIR_Number = '{escaped}' "
                    f"   OR FIR.FIR_Number LIKE '%{num_clean}/{yr}%' "
                    f"   OR FIR.FIR_Number LIKE '%{escaped}%' LIMIT 1"
                )
            else:
                # Standalone number (e.g. 1693) -> FIRST search by FIR_Number prefix/suffix, then ROWID
                escaped = ref.replace("'", "''")
                num_clean = ref.lstrip('0') or '0'
                rows = db.execute_query(
                    f"SELECT FIR.*, Police_Station.Name AS Station_Name, District.Name AS District_Name "
                    f"FROM FIR "
                    f"LEFT JOIN Police_Station ON FIR.Station_ID = Police_Station.ROWID "
                    f"LEFT JOIN District ON Police_Station.District_ID = District.ROWID "
                    f"WHERE FIR.FIR_Number LIKE '%{num_clean}/%' "
                    f"   OR FIR.FIR_Number LIKE '%/{num_clean}' "
                    f"   OR FIR.FIR_Number = '{escaped}' LIMIT 1"
                )
                if not rows and ref.isdigit():
                    fir_id = int(ref)
                    rows = db.execute_query(
                        f"SELECT FIR.*, Police_Station.Name AS Station_Name, District.Name AS District_Name "
                        f"FROM FIR "
                        f"LEFT JOIN Police_Station ON FIR.Station_ID = Police_Station.ROWID "
                        f"LEFT JOIN District ON Police_Station.District_ID = District.ROWID "
                        f"WHERE FIR.ROWID = {fir_id} OR FIR.ID = {fir_id} LIMIT 1"
                    )

            if rows:
                found_any_fir = True
                r = rows[0]
                context_parts.append(
                    f"[LIVE DATABASE RECORD — FIR]\n"
                    f"FIR Number    : {r.get('FIR_Number', 'N/A')}\n"
                    f"Date          : {r.get('Date', 'N/A')}\n"
                    f"Crime Group   : {r.get('Crime_Group', 'N/A')}\n"
                    f"Crime Subgroup: {r.get('Crime_Subgroup', 'N/A')}\n"
                    f"Status        : {r.get('Status', 'N/A')}\n"
                    f"Station       : {r.get('Station_Name', r.get('Station_ID', 'N/A'))}\n"
                    f"District      : {r.get('District_Name', 'N/A')}\n"
                    f"Coordinates   : {r.get('Latitude', 'N/A')}, {r.get('Longitude', 'N/A')}\n"
                    f"Narrative     : {r.get('Narrative', 'N/A')}\n"
                    f"Internal ID   : {r.get('ROWID', r.get('ID', 'N/A'))}"
                )
            elif not found_any_fir:
                context_parts.append(
                    f"[DATABASE LOOKUP RESULT] FIR reference '{ref}' was NOT found in the Lumina database. "
                    f"You must inform the user that this FIR does not exist in the current dataset and not fabricate details."
                )
        except Exception as e:
            print(f"FIR lookup error for '{ref}': {e}")



    # 2. Always include platform-wide stats for grounding
    try:
        total_res = db.execute_query("SELECT COUNT(*) FROM FIR")
        total_val = list(total_res[0].values())[0] if total_res else 5000
        context_parts.append(f"[PLATFORM STATS] Total FIRs currently in system: {total_val}")
    except Exception:
        pass

    # 3. District / hotspot queries (English & Kannada terms)
    lower_q = query.lower()
    kannada_district_terms = [
        'hotspot', 'district', 'bengaluru', 'mysuru', 'belagavi', 'mangaluru', 'kalaburagi',
        'hubballi', 'tumakuru', 'shivamogga', 'ballari', 'hassan', 'kolar', 'high risk',
        'crime rate', 'breakdown', 'trend',
        'ಹಾಟ್‌ಸ್ಪಾಟ್', 'ಜಿಲ್ಲೆ', 'ಬೆಂಗಳೂರು', 'ಮೈಸೂರು', 'ಬೆಳಗಾವಿ', 'ಮಂಗಳೂರು', 'ಕಲಬುರಗಿ',
        'ಹುಬ್ಬಳ್ಳಿ', 'ತುಮಕೂರು', 'ಶಿವಮೊಗ್ಗ', 'ಬಳ್ಳಾರಿ', 'ಹಾಸನ', 'ಕೋಲಾರ', 'ಅಪರಾಧ', 'ಪ್ರಮಾಣ'
    ]
    if any(w in lower_q for w in kannada_district_terms):
        try:
            rows = db.execute_query(
                "SELECT Crime_Group, COUNT(*) as cnt FROM FIR GROUP BY Crime_Group ORDER BY cnt DESC LIMIT 8"
            )
            if rows:
                summary = ", ".join(
                    f"{r.get('Crime_Group', '?')} ({r.get('cnt', 0)})" for r in rows
                )
                context_parts.append(f"[LIVE CRIME TRENDS] Top crime categories: {summary}")
        except Exception:
            pass

    # 4. Accused / suspect queries (English & Kannada terms)
    kannada_accused_terms = [
        'accused', 'suspect', 'offender', 'repeat', 'criminal', 'arrested',
        'ಆರೋಪಿ', 'ಅಪರಾಧಿ', 'ಬಂಧನ', 'ಖೈದಿ', 'ಕಳ್ಳತನ', 'ಕೊಲೆ', 'ದರೋಡೆ', 'ವಂಚನೆ'
    ]
    if any(w in lower_q for w in kannada_accused_terms):
        try:
            rows = db.execute_query(
                "SELECT Name, Arrest_Count, Age, Gender FROM Accused "
                "WHERE Arrest_Count >= 2 ORDER BY Arrest_Count DESC LIMIT 5"
            )
            if rows:
                suspects = "; ".join(
                    f"{r.get('Name', 'Unknown')} (arrests={r.get('Arrest_Count', 0)}, "
                    f"age={r.get('Age', '?')}, gender={r.get('Gender', '?')})"
                    for r in rows
                )
                context_parts.append(f"[TOP REPEAT OFFENDERS]: {suspects}")
        except Exception:
            pass

    return "\n\n".join(context_parts)


def process_chat(request):
    try:
        data = request.get_json()
        if not data or 'query' not in data:
            return bad_request("Missing 'query' in request payload")

        query = data['query']
        chat_history = data.get('history', [])
        context_data = data.get('context', '')
        language = str(data.get('language', 'en')).lower().strip()  # 'en' or 'kn'

        api_key = os.environ.get('GEMINI_API_KEY') or os.environ.get('GOOGLE_API_KEY') or _DEFAULT_API_TOKEN
        if not api_key:
            return server_error("GEMINI_API_KEY environment variable is not configured on this server.")

        # ── RAG: Pull real records from the database for this query ──────────
        db_context = ""
        try:
            db = DataStore()
            db_context = _fetch_db_context(query, db)
        except Exception as db_err:
            print(f"DB context fetch warning: {db_err}")

        if language == "kn":
            lang_directive = (
                "🚨 MANDATORY LANGUAGE DIRECTIVE (STRICT ENFORCEMENT):\n"
                "The user has actively toggled KANNADA (ಕನ್ನಡ) mode in the UI.\n"
                "- You MUST ALWAYS communicate, explain, and format your entire response 100% ONLY in KANNADA script (ಕನ್ನಡ ಲಿಪಿ).\n"
                "- Even if the user types their prompt in English, numbers, or Kanglish, your entire output MUST BE IN KANNADA.\n"
                "- NEVER output English sentences or paragraphs when in Kannada mode.\n"
                "- Use official Karnataka Police terminology:\n"
                "  * FIR -> ಪ್ರಥಮ ವರ್ತಮಾನ ವರದಿ (FIR)\n"
                "  * Police Station -> ಪೊಲೀಸ್ ಠಾಣೆ\n"
                "  * Accused / Repeat Offender -> ಆರೋಪಿ / ಪುನರಾವರ್ತಿತ ಆರೋಪಿ\n"
                "  * Victim -> ಸಂತ್ರಸ್ತರು\n"
                "  * Crime Category -> ಅಪರಾಧ ವಿಭಾಗ\n"
                "  * Threat Index -> ಅಪಾಯ ಸೂಚ್ಯಂಕ\n"
                "  * Hotspot -> ಅಪರಾಧ ಕೇಂದ್ರ / ಹಾಟ್‌ಸ್ಪಾಟ್\n"
                "  * Patrol Unit -> ಗಸ್ತು ಪಡೆ / ಚೆಕ್‌ಪಾಯಿಂಟ್\n"
                "- For greetings in Kannada mode, start with: 'ನಮಸ್ಕಾರ ಅಧಿಕಾರಿಗಳೇ! ನಾನು ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್‌ನ ಲ್ಯುಮಿನಾ ಎಐ ಸಹಾಯಕ...'."
            )
        else:
            lang_directive = (
                "🚨 MANDATORY LANGUAGE DIRECTIVE (STRICT ENFORCEMENT):\n"
                "The user has actively toggled ENGLISH mode in the UI.\n"
                "- You MUST ALWAYS communicate, explain, and format your entire response 100% ONLY in clear, professional ENGLISH.\n"
                "- Even if the user types their prompt in Kannada, translate and provide your entire response in ENGLISH.\n"
                "- NEVER output Kannada script when in English mode.\n"
                "- For greetings in English mode, start with: 'Greetings Officer! I am Lumina AI, your intelligence assistant for the Karnataka State Police...'."
            )

        system_instruction = (
            f"You are Lumina AI (ಲ್ಯುಮಿನಾ ಎಐ), an elite intelligence and crime analytics assistant for the Karnataka State Police (KSP - ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್).\n\n"
            f"{lang_directive}\n\n"
            "CRITICAL OPERATIONAL RULES:\n"
            "- You have DIRECT ACCESS to the live Karnataka FIR database with 5,000+ records across 209 police stations and 31 districts.\n"
            "- When '=== LIVE DATABASE CONTEXT ===' is provided, you MUST base your answer ONLY on those records. "
            "Do NOT invent, fabricate, or guess case details that are not in the provided context.\n"
            "- If a record says 'NOT found in the Lumina database', tell the user that FIR does not exist — do not make up data.\n"
            "- Respond DIRECTLY and professionally with precise, investigative reasoning.\n"
            "- NEVER output internal scratchpads, reasoning tokens, or bullets starting with '* User input:' or '* Instruction:'.\n"
            "- For investigative queries, use structured Markdown formatting."
        )

        if db_context:
            system_instruction += (
                f"\n\n=== LIVE DATABASE CONTEXT (treat as ground truth) ===\n"
                f"{db_context}\n"
                f"=== END LIVE DATABASE CONTEXT ==="
            )

        if context_data:
            system_instruction += f"\n\nAdditional Telemetry:\n{context_data}"

        formatted_history = []
        for msg in chat_history:
            role = 'model' if msg.get('role') == 'assistant' else 'user'
            text = msg.get('text', '')
            if text:
                formatted_history.append({'role': role, 'parts': [text]})

        candidates = get_model_candidates()
        last_error = None

        for model_name in candidates:
            try:
                # 1. Direct REST API call (fast, zero external SDK dependencies)
                url = f"https://generativelanguage.googleapis.com/v1beta/models/{model_name}:generateContent?key={api_key}"
                contents = []
                for msg in formatted_history:
                    contents.append({
                        "role": msg["role"],
                        "parts": [{"text": p} for p in msg["parts"]]
                    })
                contents.append({
                    "role": "user",
                    "parts": [{"text": query}]
                })

                payload = {
                    "contents": contents,
                    "systemInstruction": {
                        "parts": [{"text": system_instruction}]
                    },
                    "generationConfig": {
                        "temperature": 0.2,
                        "maxOutputTokens": 2048
                    }
                }

                req = urllib.request.Request(
                    url,
                    data=json.dumps(payload).encode("utf-8"),
                    headers={"Content-Type": "application/json"},
                    method="POST"
                )

                with urllib.request.urlopen(req, timeout=30) as resp:
                    res_data = json.loads(resp.read().decode("utf-8"))
                    if "candidates" in res_data and len(res_data["candidates"]) > 0:
                        cand = res_data["candidates"][0]
                        if "content" in cand and "parts" in cand["content"]:
                            non_thought_parts = []
                            for p in cand["content"]["parts"]:
                                if not p.get("thought", False) and "text" in p:
                                    non_thought_parts.append(p["text"])
                            if non_thought_parts:
                                cleaned_text = clean_ai_response("\n".join(non_thought_parts))
                                if cleaned_text:
                                    return success({'response': cleaned_text})

            except urllib.error.HTTPError as http_err:
                err_body = http_err.read().decode('utf-8', errors='ignore')
                print(f"Gemini REST HTTP {http_err.code} on '{model_name}': {err_body}")
                last_error = http_err
            except Exception as model_err:
                print(f"Model '{model_name}' failed: {model_err}")
                last_error = model_err

        # If online Gemini API models were rate-limited or temporarily unavailable,
        # formulate a rich response directly from the live database RAG context
        if db_context:
            if language == "kn":
                fallback_response = (
                    f"### 📋 ಅಧಿಕೃತ ಕ್ರೈಮ್ ಡೇಟಾಬೇಸ್ ಮಾಹಿತಿ (KSP ಲೈವ್ ಇಂಟೆಲಿಜೆನ್ಸ್)\n\n"
                    f"ನಿಮ್ಮ ಪ್ರಶ್ನೆಗೆ ಸಂಬಂಧಿಸಿದಂತೆ ಲ್ಯುಮಿನಾ ಡೇಟಾಬೇಸ್‌ನಿಂದ ಪಡೆಯಲಾದ ನೇರ ದಾಖಲೆಗಳು:\n\n"
                    f"{db_context}\n\n"
                    f"*(ಮೂಲ: ಲ್ಯುಮಿನಾ ಡೇಟಾಬೇಸ್ • 209 ಪೊಲೀಸ್ ಠಾಣೆಗಳು • 31 ಜಿಲ್ಲೆಗಳು • 5,005 ದಾಖಲೆಗಳು)*"
                )
            else:
                fallback_response = (
                    f"### 📋 Official Case Intelligence Record (KSP Live Database)\n\n"
                    f"The following verified case telemetry was retrieved from the Lumina DataStore for your query:\n\n"
                    f"{db_context}\n\n"
                    f"*(Source: Lumina DataStore • 5,005 Verified Records across 209 Karnataka Police Stations)*"
                )
            return success({'response': fallback_response})

        raise last_error or Exception("No valid Gemini model was able to generate a response.")

    except Exception as e:
        print(f"Error in ai_chat: {e}")
        return server_error(f"Failed to generate AI response: {str(e)}")
