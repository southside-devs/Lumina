"""
Lumina — Graph API Proxy Routes
Proxies criminal network queries from api_service to the Neo4j AppSail container.

All routes require SCRB_Analyst or Admin role.

Frontend URL pattern:   /api/graph/<sub-path>
Proxied to Neo4j at:    <NEO4J_SERVICE_URL>/<sub-path>

Endpoints:
    GET  /api/graph/suspect/<id>            — 2-hop suspect network
    GET  /api/graph/suspect/<id>?depth=N    — N-hop suspect network (max 4)
    GET  /api/graph/incident/<id>           — Incident connections
    GET  /api/graph/network/community       — Community detection
    GET  /api/graph/network/top-suspects    — Most connected suspects
    POST /api/graph/import                  — Bulk import (Admin only)
"""

import logging

from utils.auth import ROLES, check_roles
from utils.proxy import NEO4J_SERVICE_URL, forward_to
from utils.response import bad_request

logger = logging.getLogger("lumina.graph_proxy")

# Segments to strip from /api/graph/... → /graph/... before proxying
# path_parts = ['api', 'graph', ...] — strip the first 2
_STRIP = 2


def handle(request, path_parts):
    """Route dispatcher for /api/graph endpoints."""

    # All graph routes require analytics-level access
    # Import endpoint is Admin only
    if request.method == "POST" and _sub_path(path_parts) == "import":
        auth_error = check_roles(request, ROLES.ADMIN)
    else:
        auth_error = check_roles(request, ROLES.SCRB_ANALYST, ROLES.ADMIN)

    if auth_error:
        return auth_error

    # Need at least /api/graph/<something>
    if len(path_parts) < 3:
        return bad_request(
            "Invalid graph endpoint. "
            "Expected /api/graph/suspect/<id>, /api/graph/incident/<id>, "
            "or /api/graph/network/<type>"
        )

    return forward_to(
        request=request,
        path_parts=path_parts,
        base_url=NEO4J_SERVICE_URL,
        strip_n_prefix_segments=_STRIP,
    )


def _sub_path(path_parts):
    """Return the sub-path after /api/graph/ as a joined string."""
    return "/".join(path_parts[_STRIP:])
