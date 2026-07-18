"""
Lumina — Hotspot Detection Proxy Routes
Proxies ST-DBSCAN hotspot requests from api_service to the ML pipeline AppSail container.

All routes require SCRB_Analyst or Admin role.

Frontend URL pattern:       /api/hotspots/<sub-path>
Proxied to ML pipeline at:  <ML_PIPELINE_URL>/<sub-path>

Endpoints:
    POST /api/hotspots/detect     — Run ST-DBSCAN, return cluster metadata JSON
    POST /api/hotspots/geojson    — Run ST-DBSCAN, return GeoJSON FeatureCollection
    GET  /api/hotspots/health     — Health check for ML pipeline container

Request body for detect / geojson:
    {
        "events": [
            {
                "latitude":    12.9716,
                "longitude":   77.5946,
                "date":        "2026-01-15",
                "crime_group": "Theft",
                "fir_id":      42
            },
            ...
        ],
        "eps_spatial":  2.0,    // km  (default 2.0)
        "eps_temporal": 30,     // days (default 30)
        "min_samples":  5       // min cluster size (default 5)
    }
"""

import logging

from utils.auth import ROLES, check_roles
from utils.proxy import ML_PIPELINE_URL, forward_to
from utils.response import bad_request

logger = logging.getLogger("lumina.hotspots_proxy")

# path_parts = ['api', 'hotspots', ...] — strip first 2 to get /detect, /geojson etc.
_STRIP = 2

# Valid sub-paths
_VALID_ENDPOINTS = {"detect", "geojson", "health"}


def handle(request, path_parts):
    """Route dispatcher for /api/hotspots endpoints."""

    # Health check is open to all authenticated users
    sub = path_parts[_STRIP] if len(path_parts) > _STRIP else ""

    if sub == "health":
        auth_error = check_roles(request, *ROLES.ALL)
    else:
        auth_error = check_roles(request, ROLES.SCRB_ANALYST, ROLES.ADMIN)

    if auth_error:
        return auth_error

    if len(path_parts) < 3 or sub not in _VALID_ENDPOINTS:
        return bad_request(
            f"Unknown hotspot endpoint '{sub}'. "
            f"Valid options: {', '.join(sorted(_VALID_ENDPOINTS))}"
        )

    return forward_to(
        request=request,
        path_parts=path_parts,
        base_url=ML_PIPELINE_URL,
        strip_n_prefix_segments=_STRIP,
    )
