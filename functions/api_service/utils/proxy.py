"""
Lumina — HTTP Proxy Utility
Forwards requests from the Catalyst api_service function to AppSail containers.

AppSail containers run as separate services with their own internal URLs.
Since the frontend must use a single base URL (the Catalyst API Gateway),
this module proxies requests from api_service to those internal services.

Environment Variables:
    NEO4J_SERVICE_URL   — Base URL of the Neo4j Graph API container
                          e.g. https://neo4j-lumina-<id>.appsail.zoho.com
    ML_PIPELINE_URL     — Base URL of the ST-DBSCAN ML pipeline container
                          e.g. https://ml-lumina-<id>.appsail.zoho.com

Usage:
    from utils.proxy import forward_to

    def handle(request, path_parts):
        # Strips /api/graph prefix and forwards to Neo4j container
        return forward_to(request, path_parts, base_url=NEO4J_URL, strip_prefix=2)
"""

import os
import logging
import json
import urllib.request
import urllib.error

from flask import jsonify, make_response

logger = logging.getLogger("lumina.proxy")

# ── AppSail Service URLs (set in Catalyst environment variables) ──────────
NEO4J_SERVICE_URL  = os.environ.get("NEO4J_SERVICE_URL", "").rstrip("/")
ML_PIPELINE_URL    = os.environ.get("ML_PIPELINE_URL", "").rstrip("/")

# Timeout for upstream requests (seconds)
PROXY_TIMEOUT = 25


def forward_to(request, path_parts, base_url, strip_n_prefix_segments):
    """
    Forward an incoming Catalyst request to an upstream AppSail service.

    The path is rebuilt by stripping the first `strip_n_prefix_segments`
    path segments (e.g. ['api', 'graph']) and joining the remainder.

    Example:
        Incoming path: /api/graph/suspect/5?depth=2
        strip_n_prefix_segments=2  →  strips ['api', 'graph']
        Forwarded to: <NEO4J_SERVICE_URL>/suspect/5?depth=2

    Args:
        request:                    The Catalyst Flask request object.
        path_parts:                 List of path segments (no empty strings).
        base_url:                   Upstream service base URL.
        strip_n_prefix_segments:    How many leading segments to drop.

    Returns:
        Flask Response mirroring the upstream response.
    """
    if not base_url:
        logger.error(
            "Upstream service URL not configured. "
            "Set the corresponding environment variable in Catalyst."
        )
        return _service_unavailable(
            "Upstream service is not configured. "
            "Contact the backend team."
        )

    # Build the upstream path
    remaining = path_parts[strip_n_prefix_segments:]
    upstream_path = "/" + "/".join(remaining) if remaining else "/"

    # Append query string if present
    query_string = request.query_string.decode("utf-8")
    if query_string:
        upstream_path += "?" + query_string

    upstream_url = base_url + upstream_path
    logger.info(f"Proxying {request.method} {upstream_url}")

    try:
        # Build the upstream request
        body = None
        headers = {"Content-Type": "application/json"}

        if request.method in ("POST", "PUT", "PATCH"):
            raw = request.get_data(as_text=True)
            body = raw.encode("utf-8") if raw else None

        req = urllib.request.Request(
            url=upstream_url,
            data=body,
            headers=headers,
            method=request.method,
        )

        with urllib.request.urlopen(req, timeout=PROXY_TIMEOUT) as resp:
            status_code  = resp.status
            response_body = resp.read().decode("utf-8")

        # Parse and re-serialize to guarantee valid JSON
        try:
            payload = json.loads(response_body)
        except json.JSONDecodeError:
            payload = {"raw": response_body}

        return make_response(jsonify(payload), status_code)

    except urllib.error.HTTPError as e:
        # Upstream returned an HTTP error — relay it faithfully
        try:
            error_body = json.loads(e.read().decode("utf-8"))
        except Exception:
            error_body = {"status": "error", "message": str(e)}
        logger.warning(f"Upstream returned {e.code}: {error_body}")
        return make_response(jsonify(error_body), e.code)

    except urllib.error.URLError as e:
        logger.error(f"Could not reach upstream service {base_url}: {e.reason}")
        return _service_unavailable(
            f"Could not reach upstream service. "
            f"Is the AppSail container running? ({e.reason})"
        )

    except Exception as e:
        logger.exception(f"Proxy error: {e}")
        return make_response(jsonify({
            "status": "error",
            "message": "Proxy encountered an unexpected error",
            "detail": str(e),
        }), 500)


def _service_unavailable(message):
    """503 Service Unavailable response."""
    return make_response(jsonify({
        "status": "error",
        "message": message,
    }), 503)
