"""
Lumina — ST-DBSCAN Hotspot Detection API
FastAPI application serving spatiotemporal crime cluster analysis.

Endpoints:
  GET  /health            — Health check
  POST /hotspots/detect   — Run ST-DBSCAN on FIR data, return cluster JSON
  POST /hotspots/geojson  — Run ST-DBSCAN, return GeoJSON FeatureCollection
"""

import logging
from datetime import datetime, date
from typing import List, Optional

import numpy as np
from fastapi import FastAPI, HTTPException
from fastapi.middleware.cors import CORSMiddleware
from pydantic import BaseModel, Field

from models.st_dbscan import STDBSCAN

# ── Logging ─────────────────────────────────────────────────────────────
logging.basicConfig(
    level=logging.INFO,
    format="[%(asctime)s] %(name)s %(levelname)s: %(message)s",
)
logger = logging.getLogger("lumina.ml")

# ── FastAPI App ─────────────────────────────────────────────────────────
app = FastAPI(
    title="Lumina Hotspot Detection API",
    description="Spatiotemporal crime clustering using ST-DBSCAN",
    version="1.0.0",
)

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# ── Reference epoch for day conversion ──────────────────────────────────
EPOCH = datetime(2020, 1, 1)


# ── Request / Response Models ──────────────────────────────────────────

class CrimeEvent(BaseModel):
    """A single crime event with spatial and temporal coordinates."""
    latitude: float = Field(..., ge=-90, le=90)
    longitude: float = Field(..., ge=-180, le=180)
    date: str = Field(..., description="Date in YYYY-MM-DD format")
    crime_group: Optional[str] = None
    fir_id: Optional[int] = None


class HotspotRequest(BaseModel):
    """Request body for hotspot detection."""
    events: List[CrimeEvent] = Field(
        ..., min_length=1,
        description="List of crime events to cluster"
    )
    eps_spatial: float = Field(
        default=2.0, gt=0,
        description="Spatial radius in km"
    )
    eps_temporal: int = Field(
        default=30, gt=0,
        description="Temporal window in days"
    )
    min_samples: int = Field(
        default=5, gt=0,
        description="Minimum cluster size"
    )


class ClusterInfo(BaseModel):
    """Information about a detected crime cluster."""
    cluster_id: int
    size: int
    centroid_lat: float
    centroid_lon: float
    radius_km: float
    date_range: List[float]
    point_indices: List[int]
    crime_types: Optional[dict] = None


class HotspotResponse(BaseModel):
    """Response from hotspot detection."""
    status: str = "success"
    total_events: int
    total_clusters: int
    noise_points: int
    clusters: List[ClusterInfo]


# ── Helpers ─────────────────────────────────────────────────────────────

def _date_to_days(date_str: str) -> float:
    """Convert a date string to days since epoch."""
    try:
        dt = datetime.strptime(date_str, "%Y-%m-%d")
        return (dt - EPOCH).days
    except ValueError:
        raise HTTPException(
            status_code=400,
            detail=f"Invalid date format: {date_str}. Expected YYYY-MM-DD."
        )


def _days_to_date(days: float) -> str:
    """Convert days since epoch back to a date string."""
    from datetime import timedelta
    dt = EPOCH + timedelta(days=int(days))
    return dt.strftime("%Y-%m-%d")


def _build_geojson(clusters: list, events: list) -> dict:
    """Build a GeoJSON FeatureCollection from clusters."""
    features = []
    for cluster in clusters:
        # Cluster centroid as a Point feature
        feature = {
            "type": "Feature",
            "geometry": {
                "type": "Point",
                "coordinates": [
                    cluster["centroid_lon"],
                    cluster["centroid_lat"],
                ],
            },
            "properties": {
                "cluster_id": cluster["cluster_id"],
                "size": cluster["size"],
                "radius_km": cluster["radius_km"],
                "date_start": _days_to_date(cluster["date_range"][0]),
                "date_end": _days_to_date(cluster["date_range"][1]),
                "intensity": min(cluster["size"] / 10.0, 1.0),
            },
        }
        if cluster.get("crime_types"):
            feature["properties"]["crime_types"] = cluster["crime_types"]
        features.append(feature)

        # Cluster member points
        for idx in cluster["point_indices"]:
            event = events[idx]
            features.append({
                "type": "Feature",
                "geometry": {
                    "type": "Point",
                    "coordinates": [event.longitude, event.latitude],
                },
                "properties": {
                    "type": "event",
                    "cluster_id": cluster["cluster_id"],
                    "date": event.date,
                    "crime_group": event.crime_group,
                    "fir_id": event.fir_id,
                },
            })

    return {
        "type": "FeatureCollection",
        "features": features,
    }


def _run_clustering(req: HotspotRequest):
    """Core clustering logic shared by both endpoints."""
    # Convert events to numpy array [lat, lon, days]
    points = np.array([
        [e.latitude, e.longitude, _date_to_days(e.date)]
        for e in req.events
    ])

    logger.info(
        f"Running ST-DBSCAN on {len(points)} events "
        f"(eps_spatial={req.eps_spatial}km, "
        f"eps_temporal={req.eps_temporal}d, "
        f"min_samples={req.min_samples})"
    )

    # Run ST-DBSCAN
    model = STDBSCAN(
        eps_spatial=req.eps_spatial,
        eps_temporal=req.eps_temporal,
        min_samples=req.min_samples,
    )
    model.fit(points)
    clusters = model.get_clusters(points)

    # Enrich clusters with crime type distribution
    for cluster in clusters:
        crime_counts = {}
        for idx in cluster["point_indices"]:
            ct = req.events[idx].crime_group
            if ct:
                crime_counts[ct] = crime_counts.get(ct, 0) + 1
        cluster["crime_types"] = crime_counts

    noise_count = int((model.labels_ == -1).sum())

    return clusters, noise_count


# ── Endpoints ──────────────────────────────────────────────────────────

@app.get("/health")
def health():
    """Health check endpoint."""
    return {"status": "ok", "service": "Lumina Hotspot Detection", "version": "1.0.0"}


@app.post("/hotspots/detect", response_model=HotspotResponse)
def detect_hotspots(req: HotspotRequest):
    """
    Run ST-DBSCAN clustering on submitted crime events.
    Returns cluster metadata in JSON format.
    """
    try:
        clusters, noise_count = _run_clustering(req)

        return HotspotResponse(
            total_events=len(req.events),
            total_clusters=len(clusters),
            noise_points=noise_count,
            clusters=[ClusterInfo(**c) for c in clusters],
        )
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"Clustering failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))


@app.post("/hotspots/geojson")
def detect_hotspots_geojson(req: HotspotRequest):
    """
    Run ST-DBSCAN clustering and return results as a
    GeoJSON FeatureCollection for direct use with Deck.gl.
    """
    try:
        clusters, noise_count = _run_clustering(req)
        geojson = _build_geojson(clusters, req.events)

        return {
            "status": "success",
            "total_events": len(req.events),
            "total_clusters": len(clusters),
            "noise_points": noise_count,
            "geojson": geojson,
        }
    except HTTPException:
        raise
    except Exception as e:
        logger.exception(f"GeoJSON generation failed: {e}")
        raise HTTPException(status_code=500, detail=str(e))
