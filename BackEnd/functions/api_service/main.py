"""
Lumina — API Service Entry Point
Catalyst Advanced I/O Function (Python)

Routes incoming HTTP requests to the appropriate resource handler
based on request.path and request.method.

URL Pattern: /api/<resource>[/<id>][/<action>]
"""

import logging
import zcatalyst_sdk
from flask import Request, make_response, jsonify

from routes import districts, stations, firs, accused, victims
from routes import case_accused, risk_scores, dashboard
from routes import graph, hotspots, uploads, ai_chat

# ── Logging ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(name)s %(levelname)s: %(message)s",
)
logger = logging.getLogger("lumina.api")

# ── Route registry ─────────────────────────────────────────────────────
# Maps the second path segment (resource name) to its handler module.
ROUTES = {
    "districts":    districts,
    "stations":     stations,
    "firs":         firs,
    "accused":      accused,
    "victims":      victims,
    "case-accused": case_accused,
    "risk-scores":  risk_scores,
    "dashboard":    dashboard,
    # ── AppSail Proxy Routes ──────────────────────────────
    "graph":        graph,      # → Neo4j AppSail container
    "hotspots":     hotspots,   # → ML pipeline AppSail container
    # ── File Uploads ──────────────────────────────────────
    "uploads":      uploads,    # → Catalyst Stratus
    # ── AI Copilot ────────────────────────────────────────
    "ai-chat":      ai_chat,
}


def handler(request: Request):
    """
    Main Catalyst Advanced I/O handler.
    Parses the URL path and dispatches to the appropriate resource handler.
    Expected path format: /api/<resource>[/<id>][/<action>]
    """
    # ── Handle CORS Preflight ─────────────────────────────────────
    if request.method == "OPTIONS":
        response = make_response("", 204)
        response.headers["Access-Control-Allow-Origin"] = "*"
        response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
        response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Lumina-Demo-Key"
        return response

    try:
        # Initialize Catalyst SDK
        try:
            zcatalyst_sdk.initialize()
        except Exception as ie:
            logger.warning(f"SDK initialize note: {ie}")

        path = request.path.rstrip("/")
        path_parts = [p for p in path.split("/") if p]

        logger.info(f"{request.method} {path}")

        # ── Health check ────────────────────────────────────────────
        if path in ("/", "/health", "/api/health"):
            return make_response(jsonify({
                "status": "ok",
                "service": "Lumina API",
                "version": "1.0.0",
            }), 200)

        # ── Validate path structure ─────────────────────────────────
        # Minimum: /api/<resource> -> ['api', 'resource']
        if len(path_parts) < 2 or path_parts[0] != "api":
            return make_response(jsonify({
                "status": "error",
                "message": f"Unknown endpoint: {path}. "
                           f"All endpoints start with /api/",
            }), 404)

        resource = path_parts[1]

        # ── Dispatch to resource handler ────────────────────────────
        if resource in ROUTES:
            # Handle the resource request
            response_data = ROUTES[resource].handle(request, path_parts)
            
            # Ensure we always return a valid Flask response object
            if isinstance(response_data, tuple):
                response = make_response(*response_data)
            elif not hasattr(response_data, "headers"):
                response = make_response(response_data)
            else:
                response = response_data
                
            # Add CORS headers to all responses
            response.headers["Access-Control-Allow-Origin"] = "*"
            response.headers["Access-Control-Allow-Methods"] = "GET, POST, PUT, DELETE, OPTIONS"
            response.headers["Access-Control-Allow-Headers"] = "Content-Type, Authorization, X-Lumina-Demo-Key"
            
            return response
        else:
            return make_response(jsonify({
                "status": "error",
                "message": f"Unknown resource: {resource}",
                "available_resources": list(ROUTES.keys()),
            }), 404)

    except Exception as e:
        logger.exception(f"Unhandled error: {str(e)}")
        return make_response(jsonify({
            "status": "error",
            "message": "Internal server error",
            "detail": str(e),
        }), 500)
