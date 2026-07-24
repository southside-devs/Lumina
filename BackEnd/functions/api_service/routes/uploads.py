"""
Lumina — File Upload Routes (Catalyst Stratus)
Handles FIR attachment uploads via Catalyst Stratus object storage.

Endpoints:
    POST /api/uploads/signed-url    — Generate a Stratus signed upload URL
    GET  /api/uploads/<file_id>     — Get a downloadable URL for a stored file

All endpoints require any authenticated role.

Upload flow:
    1. Frontend calls POST /api/uploads/signed-url with file metadata.
    2. Backend generates a Stratus signed URL and returns it.
    3. Frontend uploads the file directly to Stratus using the signed URL.
    4. Frontend stores the returned file_id alongside the FIR record.
    5. Frontend calls GET /api/uploads/<file_id> to retrieve the file later.

Stratus folder structure:
    fir-attachments/
        <fir_id>/
            <file_name>
"""

import logging
import zcatalyst_sdk

from utils.auth import ROLES, check_any_authenticated
from utils.response import success, bad_request, not_found, server_error

logger = logging.getLogger("lumina.uploads")

# Catalyst Stratus folder for FIR attachments
STRATUS_FOLDER = "fir-attachments"

# Allowed MIME types for uploaded files
ALLOWED_CONTENT_TYPES = {
    "image/jpeg",
    "image/png",
    "image/webp",
    "application/pdf",
}

# Max file name length
MAX_FILENAME_LENGTH = 255


def handle(request, path_parts):
    """Route dispatcher for /api/uploads endpoints."""

    # All upload endpoints require authentication
    auth_error = check_any_authenticated(request)
    if auth_error:
        return auth_error

    if request.method == "POST":
        if len(path_parts) == 3 and path_parts[2] == "signed-url":
            return generate_signed_url(request)

    elif request.method == "GET":
        if len(path_parts) == 3:
            return get_file_url(request, path_parts[2])

    return bad_request(
        "Invalid uploads endpoint. "
        "Use POST /api/uploads/signed-url or GET /api/uploads/<file_id>"
    )


def generate_signed_url(request):
    """
    Generate a Catalyst Stratus signed URL for direct file upload.

    Request body:
        {
            "file_name":    "scan_fir_001.pdf",   // required
            "fir_id":       42,                    // required
            "content_type": "application/pdf"      // required
        }

    Response:
        {
            "status": "success",
            "data": {
                "upload_url": "https://...",
                "file_id":    "stratus-object-id",
                "folder":     "fir-attachments/42",
                "expires_in": 900
            }
        }
    """
    data = request.get_json(silent=True)
    if not data:
        return bad_request("Request body must be valid JSON")

    # Validate required fields
    file_name    = data.get("file_name", "").strip()
    fir_id       = data.get("fir_id")
    content_type = data.get("content_type", "").strip()

    errors = []
    if not file_name:
        errors.append("'file_name' is required")
    elif len(file_name) > MAX_FILENAME_LENGTH:
        errors.append(f"'file_name' must be {MAX_FILENAME_LENGTH} characters or fewer")

    if fir_id is None:
        errors.append("'fir_id' is required")
    else:
        try:
            fir_id = int(fir_id)
            if fir_id <= 0:
                raise ValueError
        except (ValueError, TypeError):
            errors.append("'fir_id' must be a positive integer")

    if not content_type:
        errors.append("'content_type' is required")
    elif content_type not in ALLOWED_CONTENT_TYPES:
        errors.append(
            f"'content_type' must be one of: {', '.join(sorted(ALLOWED_CONTENT_TYPES))}"
        )

    if errors:
        return bad_request("Validation failed", details=errors)

    try:
        app = zcatalyst_sdk.initialize(req=request)
        stratus = app.stratus()

        # Ensure the per-FIR folder exists (or get it if it does)
        folder_path = f"{STRATUS_FOLDER}/{fir_id}"
        folder = _get_or_create_folder(stratus, folder_path)

        if not folder:
            return server_error(f"Could not access Stratus folder: {folder_path}")

        # Generate a signed upload URL via the Stratus API
        # The Catalyst SDK exposes generate_signed_url on the folder object
        signed = stratus.generate_upload_url(
            folder_id=folder["id"],
            file_name=file_name,
        )

        logger.info(
            f"Generated signed URL for fir_id={fir_id} "
            f"file={file_name} content_type={content_type}"
        )

        return success({
            "upload_url": signed.get("upload_url"),
            "file_id":    signed.get("file_id"),
            "folder":     folder_path,
            "expires_in": 900,  # 15 minutes (Stratus default)
        }, message="Signed upload URL generated")

    except Exception as e:
        logger.exception(f"Failed to generate signed URL: {e}")
        return server_error(f"Failed to generate upload URL: {str(e)}")


def get_file_url(request, file_id):
    """
    Return a downloadable URL for a file stored in Catalyst Stratus.

    Path:   GET /api/uploads/<file_id>

    Response:
        {
            "status": "success",
            "data": {
                "file_id":    "<file_id>",
                "file_name":  "scan_fir_001.pdf",
                "download_url": "https://..."
            }
        }
    """
    if not file_id or not file_id.strip():
        return bad_request("Invalid file ID")

    try:
        app = zcatalyst_sdk.initialize(req=request)

        stratus = app.stratus()

        # Get file metadata from Stratus
        file_info = stratus.get_file_details(file_id)
        if not file_info:
            return not_found(f"File '{file_id}' not found in Stratus")

        # Generate a signed download URL
        download_url = stratus.get_file_download_url(file_id)

        logger.info(f"Generated download URL for file_id={file_id}")

        return success({
            "file_id":      file_id,
            "file_name":    file_info.get("file_name", ""),
            "file_size":    file_info.get("file_size"),
            "download_url": download_url,
        })

    except Exception as e:
        logger.exception(f"Failed to get file URL for {file_id}: {e}")
        return server_error(f"Failed to retrieve file: {str(e)}")


# ── Stratus Folder Helpers ───────────────────────────────────────────────

def _get_or_create_folder(stratus, folder_path):
    """
    Get an existing Stratus folder by path, or create it.

    Handles nested paths like 'fir-attachments/42' by creating
    each segment if it doesn't exist.

    Returns the folder metadata dict, or None on failure.
    """
    try:
        segments = folder_path.split("/")
        parent_id = None  # Root folder

        for segment in segments:
            folder = _find_folder(stratus, segment, parent_id)
            if not folder:
                # Create this segment
                folder = stratus.create_folder(
                    folder_name=segment,
                    parent_id=parent_id,
                )
            if not folder:
                return None
            parent_id = folder.get("id") or folder.get("folder_id")

        return folder

    except Exception as e:
        logger.error(f"Could not get/create Stratus folder '{folder_path}': {e}")
        return None


def _find_folder(stratus, name, parent_id=None):
    """Find a Stratus folder by name under a given parent."""
    try:
        folders = stratus.get_all_folders()
        for f in folders:
            f_name      = f.get("folder_name", f.get("name", ""))
            f_parent_id = f.get("parent_id")
            if f_name == name and f_parent_id == parent_id:
                return f
    except Exception:
        pass
    return None
