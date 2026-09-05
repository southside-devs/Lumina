"""
Lumina — File Upload Routes & Evidence Management Engine
Supports:
    POST /api/uploads/fir/<fir_id>          — Multipart evidence file upload for an FIR
    GET  /api/uploads/fir/<fir_id>          — List all uploaded evidence attachments for an FIR
    GET  /api/uploads/files/<fir_id>/<file> — Direct preview & stream of uploaded evidence file
    POST /api/uploads/signed-url            — Catalyst Stratus signed upload URL (cloud fallback)
    GET  /api/uploads/<file_id>             — Catalyst Stratus file retrieval
"""

import os
import json
import time
import mimetypes
import secrets
import logging
from datetime import datetime
from flask import Request, Response, make_response, jsonify
import zcatalyst_sdk

from utils.auth import check_any_authenticated
from utils.response import success, created, bad_request, not_found, server_error

logger = logging.getLogger("lumina.uploads")

# Catalyst Stratus folder for FIR attachments
STRATUS_FOLDER = "fir-attachments"

# Max file size: 15MB
MAX_FILE_SIZE_BYTES = 15 * 1024 * 1024

# Allowed content types
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/jpg",
    "image/png",
    "image/webp",
    "image/gif",
    "application/pdf",
    "text/plain",
    "application/msword",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
}

ALLOWED_EXTENSIONS = {
    ".jpg", ".jpeg", ".png", ".webp", ".gif", ".pdf", ".txt", ".doc", ".docx"
}

# Local persistent storage paths
UPLOAD_DIR = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "uploads"))
ATTACHMENTS_FILE = os.path.abspath(os.path.join(os.path.dirname(__file__), "..", "data", "attachments_store.json"))

_ATTACHMENTS_CACHE: dict[str, list[dict]] = {}
_ATTACHMENTS_INITIALIZED = False


def _init_attachments():
    """Load attachments index from disk into memory."""
    global _ATTACHMENTS_CACHE, _ATTACHMENTS_INITIALIZED
    if _ATTACHMENTS_INITIALIZED:
        return

    for path in [ATTACHMENTS_FILE, "/tmp/lumina_attachments_store.json"]:
        if os.path.exists(path):
            try:
                with open(path, "r", encoding="utf-8") as f:
                    data = json.load(f)
                    if isinstance(data, dict):
                        _ATTACHMENTS_CACHE = data
                        break
            except Exception as e:
                logger.warning(f"Failed loading attachments store from {path}: {e}")

    _ATTACHMENTS_INITIALIZED = True


def _save_attachments():
    """Persist attachments index to disk."""
    global _ATTACHMENTS_CACHE
    try:
        os.makedirs(os.path.dirname(ATTACHMENTS_FILE), exist_ok=True)
        with open(ATTACHMENTS_FILE, "w", encoding="utf-8") as f:
            json.dump(_ATTACHMENTS_CACHE, f, indent=2)
    except Exception as e:
        logger.warning(f"Could not persist attachments to primary file: {e}")
        try:
            tmp_path = "/tmp/lumina_attachments_store.json"
            with open(tmp_path, "w", encoding="utf-8") as f:
                json.dump(_ATTACHMENTS_CACHE, f)
        except Exception:
            pass


def get_attachments_for_fir(fir_id: int | str) -> list[dict]:
    """Public helper to get attachments for a given FIR ID."""
    _init_attachments()
    key = str(fir_id).strip()
    return _ATTACHMENTS_CACHE.get(key, [])


# ── Route Dispatcher ─────────────────────────────────────────────────────────

def handle(request: Request, path_parts: list[str]):
    """Route dispatcher for /api/uploads endpoints."""
    _init_attachments()

    # Route: /api/uploads/files/<fir_id>/<file_name> (Public stream/download)
    if len(path_parts) >= 5 and path_parts[2] == "files":
        fir_id = path_parts[3]
        file_name = path_parts[4]
        return serve_uploaded_file(request, fir_id, file_name)

    # All upload modification / management endpoints require auth or demo key
    auth_error = check_any_authenticated(request)
    if auth_error:
        return auth_error

    if request.method == "POST":
        # POST /api/uploads/fir/<fir_id> (Upload evidence files)
        if len(path_parts) >= 4 and path_parts[2] == "fir":
            return upload_fir_attachments(request, path_parts[3])

        # POST /api/uploads/signed-url (Legacy Stratus direct upload)
        if len(path_parts) == 3 and path_parts[2] == "signed-url":
            return generate_signed_url(request)

    elif request.method == "GET":
        # GET /api/uploads/fir/<fir_id> (List attachments)
        if len(path_parts) >= 4 and path_parts[2] == "fir":
            fir_id = path_parts[3]
            items = get_attachments_for_fir(fir_id)
            return success({"attachments": items, "count": len(items)})

        # GET /api/uploads/<file_id> (Legacy Stratus get URL)
        if len(path_parts) == 3 and path_parts[2] not in ("signed-url", "fir", "files"):
            return get_file_url(request, path_parts[2])

    return bad_request(
        "Invalid uploads endpoint. Expected: "
        "POST /api/uploads/fir/<id>, GET /api/uploads/fir/<id>, or GET /api/uploads/files/<id>/<filename>"
    )


# ── FIR Multipart Upload & Serving ──────────────────────────────────────────

def upload_fir_attachments(request: Request, fir_id_raw: str):
    """
    Upload one or more evidence files for an FIR.
    Accepts standard multipart/form-data or JSON with base64 data.
    """
    try:
        fir_id = int(fir_id_raw)
        if fir_id <= 0:
            raise ValueError
    except (ValueError, TypeError):
        return bad_request("FIR ID must be a positive integer.")

    fir_dir = os.path.join(UPLOAD_DIR, str(fir_id))
    try:
        os.makedirs(fir_dir, exist_ok=True)
    except Exception as e:
        logger.warning(f"Could not create primary upload dir: {e}")
        fir_dir = os.path.join("/tmp/uploads", str(fir_id))
        os.makedirs(fir_dir, exist_ok=True)

    saved_items = []

    # 1. Check for standard multipart form uploads
    files = request.files.getlist("files") or request.files.getlist("file") or list(request.files.values())

    if files:
        for f in files:
            if not f or not f.filename:
                continue

            orig_filename = os.path.basename(f.filename.strip())
            _, ext = os.path.splitext(orig_filename.lower())
            if ext not in ALLOWED_EXTENSIONS:
                return bad_request(
                    f"File type '{ext}' is not supported. Allowed: {', '.join(sorted(ALLOWED_EXTENSIONS))}"
                )

            # Read file bytes & check size limit
            f_bytes = f.read()
            if len(f_bytes) > MAX_FILE_SIZE_BYTES:
                return bad_request(f"File '{orig_filename}' exceeds maximum 15MB limit.")

            # Guess content type
            mime_type = f.content_type or mimetypes.guess_type(orig_filename)[0] or "application/octet-stream"

            # Create safe unique stored filename
            clean_name = "".join(c for c in os.path.splitext(orig_filename)[0] if c.isalnum() or c in "-_")[:40]
            stored_name = f"evidence_{int(time.time())}_{secrets.token_hex(4)}_{clean_name}{ext}"

            file_path = os.path.join(fir_dir, stored_name)
            with open(file_path, "wb") as out_f:
                out_f.write(f_bytes)

            attachment_id = f"att_{secrets.token_hex(6)}"
            entry = {
                "id": attachment_id,
                "fir_id": fir_id,
                "file_name": orig_filename,
                "stored_name": stored_name,
                "content_type": mime_type,
                "file_size": len(f_bytes),
                "uploaded_at": datetime.utcnow().isoformat() + "Z",
                "url": f"/api/uploads/files/{fir_id}/{stored_name}",
            }
            saved_items.append(entry)

    # 2. Check for JSON payload fallback with base64 encoded attachments
    if not saved_items and request.is_json:
        data = request.get_json(silent=True) or {}
        raw_attachments = data.get("attachments") or []
        for raw in raw_attachments:
            orig_filename = os.path.basename(raw.get("name", "evidence.png").strip())
            _, ext = os.path.splitext(orig_filename.lower())
            if ext not in ALLOWED_EXTENSIONS:
                continue

            b64_data = raw.get("data") or ""
            if "," in b64_data:
                b64_data = b64_data.split(",", 1)[1]

            import base64
            try:
                f_bytes = base64.b64decode(b64_data)
            except Exception:
                continue

            if len(f_bytes) > MAX_FILE_SIZE_BYTES:
                continue

            clean_name = "".join(c for c in os.path.splitext(orig_filename)[0] if c.isalnum() or c in "-_")[:40]
            stored_name = f"evidence_{int(time.time())}_{secrets.token_hex(4)}_{clean_name}{ext}"
            file_path = os.path.join(fir_dir, stored_name)
            with open(file_path, "wb") as out_f:
                out_f.write(f_bytes)

            mime_type = raw.get("type") or mimetypes.guess_type(orig_filename)[0] or "application/octet-stream"
            attachment_id = f"att_{secrets.token_hex(6)}"
            entry = {
                "id": attachment_id,
                "fir_id": fir_id,
                "file_name": orig_filename,
                "stored_name": stored_name,
                "content_type": mime_type,
                "file_size": len(f_bytes),
                "uploaded_at": datetime.utcnow().isoformat() + "Z",
                "url": f"/api/uploads/files/{fir_id}/{stored_name}",
            }
            saved_items.append(entry)

    if not saved_items:
        return bad_request("No valid files provided for upload.")

    # Record into persistent index
    key = str(fir_id)
    if key not in _ATTACHMENTS_CACHE:
        _ATTACHMENTS_CACHE[key] = []
    _ATTACHMENTS_CACHE[key].extend(saved_items)
    _save_attachments()

    logger.info(f"Successfully uploaded {len(saved_items)} evidence file(s) for FIR #{fir_id}.")

    return created({
        "attachments": saved_items,
        "count": len(saved_items),
        "fir_id": fir_id,
    }, message=f"Successfully stored {len(saved_items)} evidence attachment(s).")


def serve_uploaded_file(request: Request, fir_id_raw: str, file_name: str):
    """Serve/stream an uploaded evidence file with safe mime typing and cache control."""
    try:
        fir_id = int(fir_id_raw)
    except (ValueError, TypeError):
        return bad_request("Invalid FIR ID.")

    # Prevent directory traversal attacks
    safe_name = os.path.basename(file_name)

    candidate_paths = [
        os.path.join(UPLOAD_DIR, str(fir_id), safe_name),
        os.path.join("/tmp/uploads", str(fir_id), safe_name),
    ]

    target_path = None
    for p in candidate_paths:
        if os.path.exists(p) and os.path.isfile(p):
            target_path = p
            break

    if not target_path:
        return not_found(f"Evidence file '{safe_name}' not found for FIR #{fir_id}.")

    try:
        with open(target_path, "rb") as f:
            file_bytes = f.read()

        mime_type, _ = mimetypes.guess_type(safe_name)
        if not mime_type:
            mime_type = "application/octet-stream"

        response = Response(file_bytes, mimetype=mime_type)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Content-Disposition"] = f'inline; filename="{safe_name}"'
        response.headers["Cache-Control"] = "public, max-age=86400"
        response.headers["Content-Length"] = str(len(file_bytes))
        return response

    except Exception as e:
        logger.error(f"Error reading evidence file '{target_path}': {e}")
        return server_error(f"Failed reading file: {str(e)}")


# ── Catalyst Stratus Direct Signed URL (Cloud Fallback) ──────────────────────

def generate_signed_url(request: Request):
    """Generate a Catalyst Stratus signed URL for direct cloud file upload."""
    data = request.get_json(silent=True) or {}
    file_name = data.get("file_name", "").strip()
    fir_id = data.get("fir_id")
    content_type = data.get("content_type", "").strip()

    if not file_name or fir_id is None or not content_type:
        return bad_request("'file_name', 'fir_id', and 'content_type' are required.")

    try:
        app = zcatalyst_sdk.get_app()
        stratus = app.stratus()
        folder_path = f"{STRATUS_FOLDER}/{fir_id}"
        folder = _get_or_create_folder(stratus, folder_path)

        if not folder:
            return server_error(f"Could not access Stratus folder: {folder_path}")

        signed = stratus.generate_upload_url(
            folder_id=folder["id"],
            file_name=file_name,
        )

        return success({
            "upload_url": signed.get("upload_url"),
            "file_id": signed.get("file_id"),
            "folder": folder_path,
            "expires_in": 900,
        }, message="Signed upload URL generated")

    except Exception as e:
        logger.warning(f"Stratus signed URL fallback: {e}")
        return server_error(f"Stratus storage unavailable: {str(e)}")


def get_file_url(request: Request, file_id: str):
    """Return a downloadable URL for a file stored in Catalyst Stratus."""
    if not file_id or not file_id.strip():
        return bad_request("Invalid file ID")

    try:
        app = zcatalyst_sdk.get_app()
        stratus = app.stratus()
        file_info = stratus.get_file_details(file_id)
        if not file_info:
            return not_found(f"File '{file_id}' not found in Stratus")

        download_url = stratus.get_file_download_url(file_id)
        return success({
            "file_id": file_id,
            "file_name": file_info.get("file_name", ""),
            "file_size": file_info.get("file_size"),
            "download_url": download_url,
        })
    except Exception as e:
        return server_error(f"Failed to retrieve file from Stratus: {str(e)}")


def _get_or_create_folder(stratus, folder_path):
    """Get an existing Stratus folder by path, or create it."""
    try:
        segments = folder_path.split("/")
        parent_id = None
        for segment in segments:
            folder = _find_folder(stratus, segment, parent_id)
            if not folder:
                folder = stratus.create_folder(
                    folder_name=segment,
                    parent_id=parent_id,
                )
            if not folder:
                return None
            parent_id = folder.get("id") or folder.get("folder_id")
        return folder
    except Exception:
        return None


def _find_folder(stratus, name, parent_id=None):
    """Find a Stratus folder by name under a given parent."""
    try:
        folders = stratus.get_all_folders()
        for f in folders:
            f_name = f.get("folder_name", f.get("name", ""))
            f_parent_id = f.get("parent_id")
            if f_name == name and f_parent_id == parent_id:
                return f
    except Exception:
        pass
    return None
