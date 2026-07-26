import os
import json
import google.generativeai as genai
from utils.response import success, bad_request, server_error
from utils.auth import check_any_authenticated

def handle(request, path_parts):
    """Route dispatcher for /api/ai-chat endpoints."""
    if request.method == "POST":
        # auth_error = check_any_authenticated(request)
        # if auth_error:
        #     return auth_error
        return process_chat(request)
    
    return bad_request(f"Method not allowed: {request.method}")


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
        model = genai.GenerativeModel('gemini-1.5-flash')

        formatted_history = []
        if context_data:
            formatted_history.append({'role': 'user', 'parts': [context_data]})
            formatted_history.append({'role': 'model', 'parts': ["Acknowledged. I am ready to assist."]})

        for msg in chat_history:
            role = 'model' if msg.get('role') == 'assistant' else 'user'
            formatted_history.append({'role': role, 'parts': [msg.get('text', '')]})

        chat = model.start_chat(history=formatted_history)
        response = chat.send_message(query)

        return success({'response': response.text})

    except Exception as e:
        print(f"Error in ai_chat: {str(e)}")
        return server_error(f"Failed to generate AI response: {str(e)}")
