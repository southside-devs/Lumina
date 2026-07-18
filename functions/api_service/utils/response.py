"""
Lumina — Standard JSON Response Builder
Provides consistent API response formatting with proper HTTP status codes.
"""

from flask import jsonify, make_response


def success(data=None, message="Success", status_code=200, meta=None):
    """
    Build a successful JSON response.

    Args:
        data: Response payload (dict, list, or None).
        message: Human-readable message.
        status_code: HTTP status code (default 200).
        meta: Optional metadata (pagination info, etc.).

    Returns:
        Flask Response object.
    """
    body = {
        "status": "success",
        "message": message,
    }
    if data is not None:
        body["data"] = data
    if meta is not None:
        body["meta"] = meta
    return make_response(jsonify(body), status_code)


def created(data=None, message="Resource created"):
    """201 Created response."""
    return success(data=data, message=message, status_code=201)


def no_content(message="Resource deleted"):
    """204 No Content response (for deletions)."""
    # 204 cannot have a body per HTTP spec, but we return 200 with message
    # for consistency in JSON APIs
    return success(message=message, status_code=200)


def error(message="An error occurred", status_code=400, details=None):
    """
    Build an error JSON response.

    Args:
        message: Human-readable error message.
        status_code: HTTP status code (default 400).
        details: Optional error details (validation errors, etc.).

    Returns:
        Flask Response object.
    """
    body = {
        "status": "error",
        "message": message,
    }
    if details is not None:
        body["details"] = details
    return make_response(jsonify(body), status_code)


def bad_request(message="Bad request", details=None):
    """400 Bad Request response."""
    return error(message=message, status_code=400, details=details)


def not_found(message="Resource not found"):
    """404 Not Found response."""
    return error(message=message, status_code=404)


def method_not_allowed(message="Method not allowed"):
    """405 Method Not Allowed response."""
    return error(message=message, status_code=405)


def server_error(message="Internal server error"):
    """500 Internal Server Error response."""
    return error(message=message, status_code=500)


def paginated(data, total, limit, offset):
    """
    Build a paginated success response.

    Args:
        data: List of items for current page.
        total: Total count of items across all pages.
        limit: Items per page.
        offset: Current offset.

    Returns:
        Flask Response object with pagination metadata.
    """
    meta = {
        "total": total,
        "limit": limit,
        "offset": offset,
        "has_more": (offset + limit) < total,
    }
    return success(data=data, meta=meta)
