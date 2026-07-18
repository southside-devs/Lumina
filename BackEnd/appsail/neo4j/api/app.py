"""
Lumina — Neo4j Graph API Proxy
Flask application serving graph query endpoints on port 9000.

Accepts HTTP requests from Catalyst Serverless functions and translates
them to Cypher queries against the local Neo4j instance.

Endpoints:
  GET  /health                     — Health check
  GET  /graph/suspect/<id>         — Suspect network (2-hop neighborhood)
  GET  /graph/incident/<id>        — Incident connections
  GET  /graph/network/community    — Community detection (connected components)
  GET  /graph/network/top-suspects — Most connected suspects
  POST /graph/import               — Bulk import data from Data Store CSVs
  POST /graph/query                — Execute a raw Cypher query
"""

import os
import json
import logging
from flask import Flask, request, jsonify
from neo4j import GraphDatabase

# ── Configuration ───────────────────────────────────────────────────────
NEO4J_URI = os.environ.get("NEO4J_URI", "bolt://localhost:7687")
NEO4J_USER = os.environ.get("NEO4J_USER", "neo4j")
NEO4J_PASSWORD = os.environ.get("NEO4J_PASSWORD", "")
PORT = int(os.environ.get("PORT", 9000))

# ── App Setup ───────────────────────────────────────────────────────────
app = Flask(__name__)
logging.basicConfig(level=logging.INFO)
logger = logging.getLogger("lumina.graph")

driver = GraphDatabase.driver(NEO4J_URI, auth=(NEO4J_USER, NEO4J_PASSWORD))


# ── Health Check ────────────────────────────────────────────────────────

@app.route("/health", methods=["GET"])
def health():
    """Health check — verifies Neo4j connectivity."""
    try:
        with driver.session() as session:
            result = session.run("RETURN 1 AS ok")
            result.single()
        return jsonify({"status": "ok", "neo4j": "connected"}), 200
    except Exception as e:
        return jsonify({"status": "error", "neo4j": str(e)}), 503


# ── Suspect Network (2-hop) ────────────────────────────────────────────

@app.route("/graph/suspect/<int:accused_id>", methods=["GET"])
def get_suspect_network(accused_id):
    """
    Get the 2-hop network around a suspect.
    Returns nodes and edges for Cytoscape.js visualization.
    """
    depth = request.args.get("depth", 2, type=int)
    depth = min(depth, 4)  # Cap at 4 hops for performance

    query = """
    MATCH (s:Suspect {accused_id: $accused_id})
    CALL apoc.path.subgraphAll(s, {
        maxLevel: $depth,
        relationshipFilter: "COMMITTED|ASSOCIATED_WITH"
    })
    YIELD nodes, relationships
    RETURN nodes, relationships
    """

    # Fallback query without APOC (in case APOC isn't installed)
    fallback_query = """
    MATCH path = (s:Suspect {accused_id: $accused_id})-[*1..%(depth)d]-(connected)
    WITH COLLECT(DISTINCT connected) AS nodes_list,
         COLLECT(DISTINCT relationships(path)) AS rels_list,
         s
    UNWIND nodes_list AS n
    WITH COLLECT(DISTINCT {
        id: COALESCE(n.accused_id, n.fir_id, n.victim_id, id(n)),
        label: COALESCE(n.name, n.fir_number, 'Unknown'),
        type: LABELS(n)[0],
        properties: properties(n)
    }) AS nodes,
    s, rels_list
    RETURN
        [{id: s.accused_id, label: s.name, type: 'Suspect',
          properties: properties(s)}] + nodes AS nodes
    """ % {"depth": depth}

    # Simpler, more robust query
    cypher = """
    MATCH (s:Suspect {accused_id: $accused_id})-[r1]-(n1)
    OPTIONAL MATCH (n1)-[r2]-(n2)
    WHERE n2 <> s
    WITH COLLECT(DISTINCT {
        id: toString(id(s)),
        label: s.name,
        type: 'Suspect',
        properties: properties(s)
    }) +
    COLLECT(DISTINCT {
        id: toString(id(n1)),
        label: COALESCE(n1.name, n1.fir_number, 'Node'),
        type: LABELS(n1)[0],
        properties: properties(n1)
    }) +
    COLLECT(DISTINCT CASE WHEN n2 IS NOT NULL THEN {
        id: toString(id(n2)),
        label: COALESCE(n2.name, n2.fir_number, 'Node'),
        type: LABELS(n2)[0],
        properties: properties(n2)
    } END) AS all_nodes,
    COLLECT(DISTINCT {
        source: toString(id(startNode(r1))),
        target: toString(id(endNode(r1))),
        type: type(r1),
        properties: properties(r1)
    }) +
    COLLECT(DISTINCT CASE WHEN r2 IS NOT NULL THEN {
        source: toString(id(startNode(r2))),
        target: toString(id(endNode(r2))),
        type: type(r2),
        properties: properties(r2)
    } END) AS all_edges
    RETURN
        [n IN all_nodes WHERE n IS NOT NULL] AS nodes,
        [e IN all_edges WHERE e IS NOT NULL] AS edges
    """

    try:
        with driver.session() as session:
            result = session.run(cypher, accused_id=accused_id)
            record = result.single()

            if not record:
                return jsonify({
                    "status": "error",
                    "message": f"Suspect {accused_id} not found"
                }), 404

            return jsonify({
                "status": "success",
                "data": {
                    "nodes": record["nodes"],
                    "edges": record["edges"],
                }
            }), 200
    except Exception as e:
        logger.exception(f"Suspect network query failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ── Incident Connections ───────────────────────────────────────────────

@app.route("/graph/incident/<int:fir_id>", methods=["GET"])
def get_incident_connections(fir_id):
    """Get all nodes connected to a specific incident."""
    cypher = """
    MATCH (i:Incident {fir_id: $fir_id})-[r]-(connected)
    RETURN COLLECT(DISTINCT {
        id: toString(id(connected)),
        label: COALESCE(connected.name, connected.fir_number, 'Node'),
        type: LABELS(connected)[0],
        properties: properties(connected)
    }) AS nodes,
    COLLECT(DISTINCT {
        source: toString(id(startNode(r))),
        target: toString(id(endNode(r))),
        type: type(r),
        properties: properties(r)
    }) AS edges,
    properties(i) AS incident
    """

    try:
        with driver.session() as session:
            result = session.run(cypher, fir_id=fir_id)
            record = result.single()

            if not record:
                return jsonify({
                    "status": "error",
                    "message": f"Incident {fir_id} not found"
                }), 404

            return jsonify({
                "status": "success",
                "data": {
                    "incident": dict(record["incident"]),
                    "nodes": record["nodes"],
                    "edges": record["edges"],
                }
            }), 200
    except Exception as e:
        logger.exception(f"Incident query failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ── Community Detection ────────────────────────────────────────────────

@app.route("/graph/network/community", methods=["GET"])
def detect_communities():
    """
    Detect criminal communities using connected components.
    Returns groups of suspects who are linked through shared incidents.
    """
    cypher = """
    MATCH (s:Suspect)-[:COMMITTED]->(i:Incident)<-[:COMMITTED]-(s2:Suspect)
    WHERE s <> s2
    WITH s, COLLECT(DISTINCT s2.name) AS associates,
         COUNT(DISTINCT i) AS shared_incidents
    RETURN {
        suspect: s.name,
        accused_id: s.accused_id,
        arrest_count: s.arrest_count,
        associates: associates,
        shared_incidents: shared_incidents
    } AS community_member
    ORDER BY shared_incidents DESC
    LIMIT 100
    """

    try:
        with driver.session() as session:
            result = session.run(cypher)
            members = [record["community_member"] for record in result]

            return jsonify({
                "status": "success",
                "data": {
                    "members": members,
                    "total": len(members),
                }
            }), 200
    except Exception as e:
        logger.exception(f"Community detection failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ── Top Connected Suspects ─────────────────────────────────────────────

@app.route("/graph/network/top-suspects", methods=["GET"])
def top_suspects():
    """Get the most connected suspects by number of relationships."""
    limit = request.args.get("limit", 20, type=int)

    cypher = """
    MATCH (s:Suspect)-[r]-()
    WITH s, COUNT(r) AS connections
    RETURN {
        accused_id: s.accused_id,
        name: s.name,
        arrest_count: s.arrest_count,
        connections: connections
    } AS suspect
    ORDER BY connections DESC
    LIMIT $limit
    """

    try:
        with driver.session() as session:
            result = session.run(cypher, limit=limit)
            suspects = [record["suspect"] for record in result]

            return jsonify({
                "status": "success",
                "data": suspects
            }), 200
    except Exception as e:
        logger.exception(f"Top suspects query failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ── Bulk Import ────────────────────────────────────────────────────────

@app.route("/graph/import", methods=["POST"])
def bulk_import():
    """
    Bulk import data from Data Store into Neo4j.
    Expected JSON body with arrays: suspects, incidents, victims,
    case_accused, locations.
    """
    data = request.get_json(silent=True)
    if not data:
        return jsonify({"status": "error", "message": "Invalid JSON body"}), 400

    stats = {"suspects": 0, "incidents": 0, "victims": 0,
             "locations": 0, "relationships": 0}

    try:
        with driver.session() as session:
            # Import suspects
            for s in data.get("suspects", []):
                session.run(
                    """
                    MERGE (s:Suspect {accused_id: $id})
                    SET s.name = $name,
                        s.gender = $gender,
                        s.arrest_count = $arrest_count,
                        s.occupation = $occupation
                    """,
                    id=s.get("ID"), name=s.get("Name"),
                    gender=s.get("Gender"), arrest_count=s.get("Arrest_Count", 0),
                    occupation=s.get("Occupation", ""),
                )
                stats["suspects"] += 1

            # Import incidents
            for i in data.get("incidents", []):
                session.run(
                    """
                    MERGE (i:Incident {fir_id: $id})
                    SET i.fir_number = $fir_number,
                        i.crime_group = $crime_group,
                        i.date = $date,
                        i.status = $status,
                        i.lat = $lat, i.lon = $lon
                    """,
                    id=i.get("ID"), fir_number=i.get("FIR_Number"),
                    crime_group=i.get("Crime_Group"), date=i.get("Date"),
                    status=i.get("Status"), lat=i.get("Latitude"),
                    lon=i.get("Longitude"),
                )
                stats["incidents"] += 1

            # Import victims
            for v in data.get("victims", []):
                session.run(
                    """
                    MERGE (v:Victim {victim_id: $id})
                    SET v.name = $name, v.gender = $gender
                    WITH v
                    MATCH (i:Incident {fir_id: $fir_id})
                    MERGE (v)-[:VICTIMIZED_IN]->(i)
                    """,
                    id=v.get("ID"), name=v.get("Name"),
                    gender=v.get("Gender"), fir_id=v.get("FIR_ID"),
                )
                stats["victims"] += 1

            # Import case-accused relationships
            for ca in data.get("case_accused", []):
                session.run(
                    """
                    MATCH (s:Suspect {accused_id: $accused_id})
                    MATCH (i:Incident {fir_id: $fir_id})
                    MERGE (s)-[:COMMITTED {involvement: $involvement}]->(i)
                    """,
                    accused_id=ca.get("Accused_ID"),
                    fir_id=ca.get("FIR_ID"),
                    involvement=ca.get("Involvement_Type", "Primary"),
                )
                stats["relationships"] += 1

            # Build ASSOCIATED_WITH edges (co-accused in same FIR)
            session.run("""
                MATCH (s1:Suspect)-[:COMMITTED]->(i:Incident)<-[:COMMITTED]-(s2:Suspect)
                WHERE id(s1) < id(s2)
                WITH s1, s2, COUNT(DISTINCT i) AS shared
                MERGE (s1)-[r:ASSOCIATED_WITH]->(s2)
                SET r.shared_cases = shared
            """)

        return jsonify({
            "status": "success",
            "message": "Bulk import complete",
            "stats": stats,
        }), 200

    except Exception as e:
        logger.exception(f"Bulk import failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


# ── Raw Cypher Query ───────────────────────────────────────────────────

@app.route("/graph/query", methods=["POST"])
def raw_query():
    """Execute a raw Cypher query (for development/debugging)."""
    data = request.get_json(silent=True)
    if not data or "query" not in data:
        return jsonify({
            "status": "error",
            "message": "Missing 'query' field in request body"
        }), 400

    cypher = data["query"]
    params = data.get("params", {})

    try:
        with driver.session() as session:
            result = session.run(cypher, **params)
            records = [dict(record) for record in result]

            # Convert Neo4j types to JSON-serializable format
            serialized = _serialize_records(records)

            return jsonify({
                "status": "success",
                "data": serialized,
                "count": len(serialized),
            }), 200
    except Exception as e:
        logger.exception(f"Raw query failed: {e}")
        return jsonify({"status": "error", "message": str(e)}), 500


def _serialize_records(records):
    """Convert Neo4j records to JSON-serializable dicts."""
    serialized = []
    for record in records:
        row = {}
        for key, value in record.items():
            row[key] = _serialize_value(value)
        serialized.append(row)
    return serialized


def _serialize_value(value):
    """Recursively serialize a Neo4j value."""
    if value is None:
        return None
    elif isinstance(value, (int, float, str, bool)):
        return value
    elif isinstance(value, dict):
        return {k: _serialize_value(v) for k, v in value.items()}
    elif isinstance(value, (list, tuple)):
        return [_serialize_value(v) for v in value]
    else:
        # For Neo4j Node, Relationship objects etc.
        try:
            return dict(value)
        except (TypeError, ValueError):
            return str(value)


# ── Main ───────────────────────────────────────────────────────────────

if __name__ == "__main__":
    logger.info(f"Starting Neo4j Graph API on port {PORT}")
    app.run(host="0.0.0.0", port=PORT, debug=False)
