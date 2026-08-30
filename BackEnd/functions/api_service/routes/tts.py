"""
Lumina — Text-to-Speech (TTS) Engine
Provides bilingual voice narration for English and Kannada (ಕನ್ನಡ).
"""

import re
import urllib.request
import urllib.parse
from flask import make_response, Response
from utils.response import bad_request, server_error


def handle(request, path_parts):
    """
    Route dispatcher for /api/tts.
    Accepts GET /api/tts?text=...&lang=kn or POST /api/tts with JSON body.
    """
    if request.method == "OPTIONS":
        resp = make_response("", 204)
        resp.headers["Access-Control-Allow-Origin"] = "*"
        resp.headers["Access-Control-Allow-Methods"] = "GET, POST, OPTIONS"
        resp.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Lumina-Demo-Key"
        return resp

    text = ""
    lang = "kn"

    if request.method == "GET":
        text = request.args.get("text", "").strip()
        lang = request.args.get("lang", "kn").strip().lower()
    elif request.method == "POST":
        body = request.get_json(silent=True) or {}
        text = body.get("text", "").strip()
        lang = body.get("lang", "kn").strip().lower()

    if not text:
        return bad_request("Missing 'text' parameter for speech synthesis")

    # Sanitize markdown, emojis, asterisks, URLs, and tables from input text
    clean_text = _clean_for_speech(text)
    if not clean_text:
        return bad_request("Text is empty after sanitization")

    try:
        audio_bytes = _synthesize_audio(clean_text, lang)
        
        response = Response(audio_bytes, mimetype="audio/mpeg")
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Cache-Control"] = "public, max-age=86400"
        response.headers["Content-Length"] = str(len(audio_bytes))
        return response
    except Exception as e:
        print(f"TTS synthesis error: {e}")
        return server_error(f"Failed to synthesize speech: {str(e)}")


def _clean_for_speech(raw: str) -> str:
    """Strip markdown formatting, symbols, hashtags, backticks, and emojis."""
    text = re.sub(r'[*#_`~>[\]()|]', ' ', raw)
    text = re.sub(r'https?://\S+', '', text)
    text = re.sub(r'===.*?===', '', text)
    text = re.sub(r'[\U00010000-\U0010ffff]', '', text)  # remove emojis
    text = re.sub(r'\s+', ' ', text)
    return text.strip()


def _synthesize_audio(text: str, lang: str) -> bytes:
    """
    Split text into sentence chunks (< 150 chars) and fetch natural Google TTS audio stream.
    Supports Kannada ('kn') and English ('en').
    """
    target_lang = "kn" if lang in ("kn", "kannada") else "en"

    # Split on sentence end punctuation
    raw_sentences = [s.strip() for s in re.split(r'[।.\n!?]+', text) if s.strip()]
    if not raw_sentences:
        raw_sentences = [text]

    chunks = []
    for sent in raw_sentences:
        words = sent.split()
        curr = ""
        for w in words:
            if len(curr) + len(w) + 1 < 140:
                curr += (" " if curr else "") + w
            else:
                if curr:
                    chunks.append(curr)
                curr = w
        if curr:
            chunks.append(curr)

    # Limit to top 15 chunks (~2 minutes of audio) for optimal responsiveness
    chunks = chunks[:15]
    if not chunks:
        chunks = [text[:140]]

    combined_audio = bytearray()
    headers = {
        "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36"
    }

    for chunk in chunks:
        if not chunk.strip():
            continue
        try:
            encoded_q = urllib.parse.quote(chunk.strip())
            url = f"https://translate.google.com/translate_tts?ie=UTF-8&q={encoded_q}&tl={target_lang}&client=tw-ob"
            req = urllib.request.Request(url, headers=headers)
            with urllib.request.urlopen(req, timeout=8) as resp:
                if resp.status == 200:
                    combined_audio.extend(resp.read())
        except Exception as err:
            print(f"TTS chunk error for '{chunk[:30]}': {err}")
            continue

    if not combined_audio:
        raise RuntimeError("No audio could be synthesized from the service")

    return bytes(combined_audio)
