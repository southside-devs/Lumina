"""
Lumina — Spatiotemporal Hotspot Detection Route (ST-DBSCAN)
Clusters active database FIRs by geographical proximity (Haversine km)
and temporal proximity (days) to identify emerging crime hot corridors.

Endpoints:
    GET  /api/hotspots/clusters — Get active spatiotemporal clusters & patrol dispatch
    GET  /api/hotspots/detect   — Run ST-DBSCAN on recent FIR data
    POST /api/hotspots/detect   — Run ST-DBSCAN on custom submitted points
"""

from collections import deque
from datetime import datetime
import math
from flask import request

from utils.db import DataStore
from utils.response import success, bad_request, server_error
from utils.auth import check_any_authenticated

# Epoch for date conversion
EPOCH = datetime(2020, 1, 1)


def handle(request, path_parts):
    """Route dispatcher for /api/hotspots endpoints."""
    auth_error = check_any_authenticated(request)
    if auth_error:
        return auth_error

    db = DataStore(request)

    if request.method == "GET":
        return get_clusters(db)
    elif request.method == "POST":
        return detect_custom_hotspots(db)

    return bad_request("Unsupported HTTP method for /api/hotspots")


def _date_to_days(date_str: str) -> float:
    """Convert YYYY-MM-DD to days since 2020-01-01."""
    try:
        dt = datetime.strptime(str(date_str).split("T")[0], "%Y-%m-%d")
        return float((dt - EPOCH).days)
    except Exception:
        return 0.0


def _days_to_date(days: float) -> str:
    """Convert days since epoch back to YYYY-MM-DD."""
    from datetime import timedelta
    dt = EPOCH + timedelta(days=int(days))
    return dt.strftime("%Y-%m-%d")


def haversine_distance(lat1: float, lon1: float, lat2: float, lon2: float) -> float:
    """Calculate Haversine distance in km between two points in pure Python."""
    r = 6371.0  # Earth radius in km
    phi1 = math.radians(lat1)
    phi2 = math.radians(lat2)
    delta_phi = math.radians(lat2 - lat1)
    delta_lambda = math.radians(lon2 - lon1)

    a = (
        math.sin(delta_phi / 2.0) ** 2
        + math.cos(phi1) * math.cos(phi2) * (math.sin(delta_lambda / 2.0) ** 2)
    )
    c = 2 * math.atan2(math.sqrt(max(0.0, a)), math.sqrt(max(0.0, 1.0 - a)))
    return r * c


def run_st_dbscan(events, eps_spatial=8.0, eps_temporal=45, min_samples=4):
    """
    Run ST-DBSCAN on a list of crime events in pure Python.
    Each event must have: 'lat', 'lon', 'days', 'fir_id', 'crime_group', 'station_name'.
    """
    n = len(events)
    if n < min_samples:
        return [], 0

    lats = [float(e["lat"]) for e in events]
    lons = [float(e["lon"]) for e in events]
    days = [float(e["days"]) for e in events]

    labels = [-1] * n
    visited = [False] * n
    cluster_id = 0

    for i in range(n):
        if visited[i]:
            continue
        visited[i] = True

        # Find spatial and temporal neighbors of point i
        neighbors = []
        for k in range(n):
            if abs(days[k] - days[i]) <= eps_temporal:
                if haversine_distance(lats[i], lons[i], lats[k], lons[k]) <= eps_spatial:
                    neighbors.append(k)

        if len(neighbors) < min_samples:
            continue

        labels[i] = cluster_id
        seed_set = deque(neighbors)

        while seed_set:
            j = seed_set.popleft()
            if not visited[j]:
                visited[j] = True
                j_neighbors = []
                for k in range(n):
                    if abs(days[k] - days[j]) <= eps_temporal:
                        if haversine_distance(lats[j], lons[j], lats[k], lons[k]) <= eps_spatial:
                            j_neighbors.append(k)

                if len(j_neighbors) >= min_samples:
                    seed_set.extend(j_neighbors)

            if labels[j] == -1:
                labels[j] = cluster_id

        cluster_id += 1

    # Compile cluster objects
    clusters = []
    unique_clusters = set(labels) - {-1}

    patrol_divisions = [
        ("Patrol Alpha-4", "Indiranagar -> MG Road Corridor", "~6m"),
        ("Patrol Delta-2", "Camp Area -> Tilakwadi Sector", "~11m"),
        ("Patrol Coastal-1", "Panambur Port -> Hampankatta", "~9m"),
        ("Patrol Bravo-3", "Devaraja -> Vijayanagar Ring", "~14m"),
        ("Patrol Echo-7", "Station Bazaar -> Sedam Road", "~16m"),
        ("Patrol Transit-5", "Vidyanagar -> Old Hubballi", "~8m"),
        ("Patrol Sector-9", "Cowl Bazaar -> Cantonment Checkpoint", "~12m"),
        ("Patrol Western-2", "Durgigudi -> Bypass Junction", "~10m"),
    ]

    # Find max cluster size for normalization
    cluster_sizes = [labels.count(cid) for cid in unique_clusters]
    max_size = max(cluster_sizes) if cluster_sizes else 1

    for cid in unique_clusters:
        indices = [idx for idx, l in enumerate(labels) if l == cid]
        c_lats = [lats[idx] for idx in indices]
        c_lons = [lons[idx] for idx in indices]
        c_days = [days[idx] for idx in indices]

        centroid_lat = float(sum(c_lats) / len(c_lats))
        centroid_lon = float(sum(c_lons) / len(c_lons))

        # Cluster radius in km (max distance from centroid)
        dists_from_centroid = [
            haversine_distance(centroid_lat, centroid_lon, lat, lon)
            for lat, lon in zip(c_lats, c_lons)
        ]
        radius_km = max(round(max(dists_from_centroid) if dists_from_centroid else 1.5, 2), 1.5)

        # Crime type counts
        crime_counts = {}
        fir_ids = []
        district_counts = {}
        for idx in indices:
            ct = events[idx].get("crime_group") or "Theft"
            crime_counts[ct] = crime_counts.get(ct, 0) + 1
            fir_ids.append(events[idx].get("fir_id"))
            dist = events[idx].get("district_name") or "Karnataka Command"
            district_counts[dist] = district_counts.get(dist, 0) + 1

        primary_district = (
            max(district_counts, key=district_counts.get)
            if district_counts
            else "Karnataka Sector"
        )

        # Calibrated Threat Score (30-98) based on incident density curve, violent crime ratio, and recency
        size = len(indices)
        violent_crimes = sum(
            crime_counts.get(k, 0)
            for k in ["Assault", "Murder", "Robbery", "Extortion", "Arms Act", "Cybercrime"]
        )
        violent_ratio = violent_crimes / max(size, 1)

        # Dynamic density component normalized against max cluster size
        density_component = ((size / max_size) ** 0.5) * 58.0
        # Severity component (violent/cyber percentage)
        severity_component = violent_ratio * 26.0
        baseline_score = 18.0

        threat_score = int(
            min(max(baseline_score + density_component + severity_component, 28), 98)
        )





        patrol_idx = cid % len(patrol_divisions)
        patrol_unit, patrol_sector, eta = patrol_divisions[patrol_idx]

        clusters.append(
            {
                "id": f"cluster_{cid + 1}",
                "cluster_id": int(cid),
                "name": f"{primary_district} (Cluster #{cid + 1})",
                "code": f"SEC-{cid + 1:02d}",
                "size": size,
                "centroid_lat": round(centroid_lat, 5),
                "centroid_lon": round(centroid_lon, 5),
                "lat": round(centroid_lat, 5),
                "lng": round(centroid_lon, 5),
                "radius_km": radius_km,
                "threatScore": int(threat_score),
                "firCount": size,
                "date_start": _days_to_date(float(min(c_days))),
                "date_end": _days_to_date(float(max(c_days))),
                "crime_types": crime_counts,
                "category": max(crime_counts, key=crime_counts.get) if crime_counts else "Theft",
                "activePatrol": f"{patrol_unit} ({patrol_sector})",
                "eta": eta,
                "distance": f"{round(radius_km * 1.8, 1)} km",
                "fir_ids": fir_ids[:15],
            }
        )

    # Sort clusters by threat score descending
    clusters.sort(key=lambda c: c["threatScore"], reverse=True)
    noise_count = labels.count(-1)

    return clusters, noise_count


def get_clusters(db):
    """
    Fetch FIRs from DataStore and compute ST-DBSCAN hotspots.
    Query params:
      eps_spatial (default: 15.0 km)
      eps_temporal (default: 60 days)
      min_samples (default: 4)
      limit (default: 2000 most recent FIRs)
    """
    try:
        eps_spatial = float(request.args.get("eps_spatial", 15.0))
        eps_temporal = int(request.args.get("eps_temporal", 60))
        min_samples = int(request.args.get("min_samples", 4))
        limit = int(request.args.get("limit", 2000))

        # Query recent FIRs with lat/lon
        query = (
            f"SELECT f.ROWID, f.ID, f.Latitude, f.Longitude, f.Date, f.Crime_Group, "
            f"ps.Name AS Station_Name, d.Name AS District_Name "
            f"FROM FIR f "
            f"LEFT JOIN Police_Station ps ON f.Station_ID = ps.ROWID "
            f"LEFT JOIN District d ON ps.District_ID = d.ROWID "
            f"WHERE f.Latitude IS NOT NULL AND f.Longitude IS NOT NULL "
            f"ORDER BY f.Date DESC LIMIT {limit}"
        )
        rows = db.execute_query(query)

        events = []
        for r in rows:
            try:
                lat = float(r.get("Latitude"))
                lon = float(r.get("Longitude"))
                d_str = str(r.get("Date") or "2026-01-01")
                events.append(
                    {
                        "fir_id": r.get("ROWID") or r.get("ID"),
                        "lat": lat,
                        "lon": lon,
                        "days": _date_to_days(d_str),
                        "crime_group": r.get("Crime_Group") or "Theft",
                        "station_name": r.get("Station_Name") or "KSP Station",
                        "district_name": r.get("District_Name") or "Bengaluru Urban",
                    }
                )
            except (ValueError, TypeError):
                continue

        clusters, noise_count = run_st_dbscan(
            events,
            eps_spatial=eps_spatial,
            eps_temporal=eps_temporal,
            min_samples=min_samples,
        )

        return success(
            {
                "total_events_analyzed": len(events),
                "total_clusters": len(clusters),
                "noise_events": noise_count,
                "parameters": {
                    "eps_spatial_km": eps_spatial,
                    "eps_temporal_days": eps_temporal,
                    "min_samples": min_samples,
                },
                "clusters": clusters,
            }
        )

    except Exception as e:
        return server_error(f"Hotspot clustering error: {str(e)}")



def detect_custom_hotspots(db):
    """POST endpoint to run ST-DBSCAN on custom submitted points."""
    try:
        body = request.get_json() or {}
        raw_events = body.get("events", [])
        if not raw_events:
            return bad_request("Missing 'events' list in request payload")

        eps_spatial = float(body.get("eps_spatial", 8.0))
        eps_temporal = int(body.get("eps_temporal", 30))
        min_samples = int(body.get("min_samples", 4))

        events = []
        for e in raw_events:
            events.append(
                {
                    "fir_id": e.get("fir_id", 0),
                    "lat": float(e["latitude"]),
                    "lon": float(e["longitude"]),
                    "days": _date_to_days(e["date"]),
                    "crime_group": e.get("crime_group", "Theft"),
                }
            )

        clusters, noise_count = run_st_dbscan(
            events,
            eps_spatial=eps_spatial,
            eps_temporal=eps_temporal,
            min_samples=min_samples,
        )

        return success(
            {
                "total_events": len(events),
                "total_clusters": len(clusters),
                "noise_points": noise_count,
                "clusters": clusters,
            }
        )

    except Exception as e:
        return server_error(f"Custom hotspot error: {str(e)}")

