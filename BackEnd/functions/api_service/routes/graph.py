"""
Lumina — Graph API Routes
Provides criminal network topology and co-accused relationship queries.
Uses native SQLite relational engine with transparent Neo4j proxy support.

Endpoints:
    GET  /api/graph/suspect/<id>            — Co-accused suspect network & radial nodes
    GET  /api/graph/network/top-suspects    — Top repeat offenders & network hubs
    GET  /api/graph/incident/<id>           — FIR case incident network
"""

import math
import logging

from utils.db import DataStore
from utils.response import success, bad_request, not_found
from utils.auth import check_any_authenticated

logger = logging.getLogger("lumina.graph_service")


def handle(request, path_parts):
    """Route dispatcher for /api/graph endpoints."""
    # Check demo or authenticated access
    auth_error = check_any_authenticated(request)
    if auth_error:
        return auth_error

    if len(path_parts) < 3:
        return bad_request(
            "Invalid graph endpoint. Expected /api/graph/suspect/<id> or /api/graph/network/top-suspects"
        )

    db = DataStore(request)
    resource = path_parts[2]

    if request.method == "GET":
        if resource == "network" and len(path_parts) >= 4:
            action = path_parts[3]
            if action == "top-suspects":
                return get_top_suspects(db)
        elif resource == "suspect" and len(path_parts) >= 4:
            suspect_id = path_parts[3]
            return get_suspect_network(db, suspect_id)
        elif resource == "incident" and len(path_parts) >= 4:
            incident_id = path_parts[3]
            return get_incident_network(db, incident_id)

    return bad_request("Invalid graph endpoint or action")


def get_top_suspects(db):
    """Return top repeat offenders ranked by arrest count and active case associations."""
    try:
        query = (
            "SELECT a.ROWID, a.Name, a.Arrest_Count, a.DOB, a.Gender, a.Occupation, "
            "COUNT(ca.FIR_ID) AS Case_Count "
            "FROM Accused a "
            "LEFT JOIN Case_Accused ca ON a.ROWID = ca.Accused_ID "
            "GROUP BY a.ROWID "
            "ORDER BY a.Arrest_Count DESC, Case_Count DESC "
            "LIMIT 12"
        )
        rows = db.execute_query(query)
        suspects = []
        for r in rows:
            suspects.append({
                "id": str(r.get("ROWID", "")),
                "name": r.get("Name", "Unknown"),
                "arrestCount": int(r.get("Arrest_Count", 0)),
                "dob": r.get("DOB"),
                "gender": r.get("Gender"),
                "occupation": r.get("Occupation"),
                "caseCount": int(r.get("Case_Count", 0)),
                "riskScore": min(int(r.get("Arrest_Count", 0)) * 8 + 4, 98),
            })
        return success({"topSuspects": suspects})
    except Exception as e:
        logger.error(f"Error fetching top suspects: {e}")
        return bad_request(f"Failed to fetch top suspects: {str(e)}")


def get_suspect_network(db, suspect_id):
    """
    Build a multi-entity radar network around a target suspect:
    - Center Node: Target Suspect
    - Co-Accused Nodes: Suspects who shared cases with the target
    - Location Nodes: Police Stations / Areas of the linked FIRs
    - Syndicate / Cell Nodes: Crime groups of shared cases
    """
    try:
        s_id = int(suspect_id)
    except ValueError:
        return bad_request("Invalid suspect ID")

    # 1. Fetch Target Suspect
    target_rows = db.execute_query(f"SELECT ROWID, Name, Arrest_Count, DOB, Gender, Occupation FROM Accused WHERE ROWID = {s_id} LIMIT 1")
    if not target_rows:
        return not_found(f"Suspect with ID {s_id} not found")
    target = target_rows[0]

    # 2. Fetch linked FIR cases
    cases_query = (
        f"SELECT ca.FIR_ID, ca.Involvement_Type, f.FIR_Number, f.Crime_Group, f.Date, "
        f"ps.Name AS Station_Name, d.Name AS District_Name "
        f"FROM Case_Accused ca "
        f"LEFT JOIN FIR f ON ca.FIR_ID = f.ROWID "
        f"LEFT JOIN Police_Station ps ON f.Station_ID = ps.ROWID "
        f"LEFT JOIN District d ON ps.District_ID = d.ROWID "
        f"WHERE ca.Accused_ID = {s_id} "
        f"LIMIT 20"
    )
    linked_cases = db.execute_query(cases_query)
    fir_ids = [c["FIR_ID"] for c in linked_cases if c.get("FIR_ID")]

    # 3. Fetch Co-Accused Accomplices
    co_accused = []
    if fir_ids:
        ids_str = ",".join(map(str, fir_ids))
        co_query = (
            f"SELECT DISTINCT a.ROWID, a.Name, a.Arrest_Count, a.DOB, a.Gender, a.Occupation, "
            f"ca.Involvement_Type, ca.FIR_ID "
            f"FROM Case_Accused ca "
            f"JOIN Accused a ON ca.Accused_ID = a.ROWID "
            f"WHERE ca.FIR_ID IN ({ids_str}) AND a.ROWID != {s_id} "
            f"LIMIT 14"
        )
        co_accused = db.execute_query(co_query)

    # 4. Construct Radar Graph Nodes and Connections
    nodes = []
    connections_to_center = []

    # Center target node
    target_node_id = f"suspect_{s_id}"
    target_risk = min(int(target.get("Arrest_Count", 0)) * 8 + 4, 98)

    # Radial layout parameters: center = (50, 50)
    co_nodes = []
    for i, co in enumerate(co_accused):
        co_id = f"co_{co['ROWID']}"
        angle = (2 * math.pi * i) / max(len(co_accused), 1)
        r = 24 + (i % 2) * 6  # stagger radius slightly for natural look
        x = round(50 + r * math.cos(angle), 1)
        y = round(50 + r * math.sin(angle), 1)
        score = min(int(co.get("Arrest_Count", 0)) * 8 + 40, 95)

        co_node = {
            "id": co_id,
            "rawId": co["ROWID"],
            "name": f"Accomplice — {co['Name']}",
            "type": "Suspects",
            "riskScore": score,
            "arrestCount": co.get("Arrest_Count", 0),
            "dob": co.get("DOB"),
            "gender": co.get("Gender"),
            "occupation": co.get("Occupation"),
            "involvement": co.get("Involvement_Type", "Accomplice"),
            "x": x,
            "y": y,
            "radius": 10 if score > 70 else 8,
            "connections": [target_node_id],
        }
        co_nodes.append(co_node)
        connections_to_center.append(co_id)

    # Location / Station Nodes
    loc_nodes = []
    unique_stations = list({c["Station_Name"] for c in linked_cases if c.get("Station_Name")})[:4]
    for j, st_name in enumerate(unique_stations):
        loc_id = f"loc_{j+1}"
        angle = (2 * math.pi * j) / max(len(unique_stations), 1) + 0.4
        r = 38
        x = round(50 + r * math.cos(angle), 1)
        y = round(50 + r * math.sin(angle), 1)

        loc_node = {
            "id": loc_id,
            "name": f"Division — {st_name}",
            "type": "Locations",
            "riskScore": 75,
            "x": x,
            "y": y,
            "radius": 8,
            "connections": [target_node_id],
        }
        loc_nodes.append(loc_node)
        connections_to_center.append(loc_id)

    # Syndicate / Crime Group Nodes
    syn_nodes = []
    unique_groups = list({c["Crime_Group"] for c in linked_cases if c.get("Crime_Group")})[:3]
    for k, group in enumerate(unique_groups):
        syn_id = f"syn_{k+1}"
        angle = (2 * math.pi * k) / max(len(unique_groups), 1) + 1.2
        r = 36
        x = round(50 + r * math.cos(angle), 1)
        y = round(50 + r * math.sin(angle), 1)

        syn_node = {
            "id": syn_id,
            "name": f"Syndicate — {group} Cell",
            "type": "Syndicates",
            "riskScore": 88,
            "x": x,
            "y": y,
            "radius": 11,
            "connections": [target_node_id],
        }
        syn_nodes.append(syn_node)
        connections_to_center.append(syn_id)

    # Center target node
    center_node = {
        "id": target_node_id,
        "rawId": target["ROWID"],
        "name": f"Target #{s_id} ({target['Name']})",
        "type": "Suspects",
        "riskScore": target_risk,
        "arrestCount": target.get("Arrest_Count", 0),
        "dob": target.get("DOB"),
        "gender": target.get("Gender"),
        "occupation": target.get("Occupation"),
        "x": 50,
        "y": 50,
        "radius": 15,
        "connections": connections_to_center,
        "isCenter": True,
    }

    nodes = [center_node] + co_nodes + loc_nodes + syn_nodes

    return success({
        "target": {
            "id": s_id,
            "name": target["Name"],
            "arrestCount": target["Arrest_Count"],
            "dob": target.get("DOB"),
            "gender": target.get("Gender"),
            "occupation": target.get("Occupation"),
            "riskScore": target_risk,
            "linkedCasesCount": len(linked_cases),
            "linkedCases": linked_cases[:6],
        },
        "nodes": nodes,
        "coAccusedCount": len(co_accused),
    })


def get_incident_network(db, incident_id):
    """Return all suspects and entities linked to a specific FIR case ID."""
    try:
        f_id = int(incident_id)
    except ValueError:
        return bad_request("Invalid incident ID")

    fir_rows = db.execute_query(f"SELECT * FROM FIR WHERE ROWID = {f_id} OR ID = {f_id} LIMIT 1")
    if not fir_rows:
        return not_found(f"Incident with ID {f_id} not found")
    fir = fir_rows[0]

    suspects_query = (
        f"SELECT a.ROWID, a.Name, a.Arrest_Count, a.DOB, a.Gender, a.Occupation, ca.Involvement_Type "
        f"FROM Case_Accused ca "
        f"JOIN Accused a ON ca.Accused_ID = a.ROWID "
        f"WHERE ca.FIR_ID = {f_id}"
    )
    suspects = db.execute_query(suspects_query)

    return success({
        "incident": fir,
        "suspects": suspects,
    })
