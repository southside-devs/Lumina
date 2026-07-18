// =============================================================================
// Lumina — Neo4j Graph Schema Initialization
// Criminal Network Graph (Section 5.2 of KSP_CIAP_Documentation)
// =============================================================================
//
// Graph Model:
//   (:Suspect)-[:COMMITTED]->(:Incident)
//   (:Victim)-[:VICTIMIZED_IN]->(:Incident)
//   (:Incident)-[:OCCURRED_AT]->(:Location)
//   (:Suspect)-[:ASSOCIATED_WITH]->(:Suspect)
//
// =============================================================================

// ── Constraints (uniqueness) ───────────────────────────────────────────

CREATE CONSTRAINT suspect_id IF NOT EXISTS
  FOR (s:Suspect) REQUIRE s.accused_id IS UNIQUE;

CREATE CONSTRAINT incident_id IF NOT EXISTS
  FOR (i:Incident) REQUIRE i.fir_id IS UNIQUE;

CREATE CONSTRAINT victim_id IF NOT EXISTS
  FOR (v:Victim) REQUIRE v.victim_id IS UNIQUE;

CREATE CONSTRAINT location_name IF NOT EXISTS
  FOR (l:Location) REQUIRE l.name IS UNIQUE;

// ── Indexes (for fast lookups) ─────────────────────────────────────────

CREATE INDEX suspect_name_idx IF NOT EXISTS
  FOR (s:Suspect) ON (s.name);

CREATE INDEX incident_crime_idx IF NOT EXISTS
  FOR (i:Incident) ON (i.crime_group);

CREATE INDEX incident_date_idx IF NOT EXISTS
  FOR (i:Incident) ON (i.date);

CREATE INDEX location_district_idx IF NOT EXISTS
  FOR (l:Location) ON (l.district);

// ── Sample seed data for validation ────────────────────────────────────
// (This creates a small test graph to verify the schema works)

MERGE (s1:Suspect {accused_id: 1, name: "Test Suspect A", gender: "Male", arrest_count: 3})
MERGE (s2:Suspect {accused_id: 2, name: "Test Suspect B", gender: "Male", arrest_count: 5})
MERGE (s3:Suspect {accused_id: 3, name: "Test Suspect C", gender: "Female", arrest_count: 2})

MERGE (i1:Incident {fir_id: 1, fir_number: "0001/2025", crime_group: "Robbery", date: "2025-01-15", status: "Chargesheeted"})
MERGE (i2:Incident {fir_id: 2, fir_number: "0002/2025", crime_group: "Theft", date: "2025-03-20", status: "Under Investigation"})

MERGE (v1:Victim {victim_id: 1, name: "Test Victim X", gender: "Female"})

MERGE (l1:Location {name: "Koramangala, Bengaluru", district: "Bengaluru Urban", lat: 12.9352, lon: 77.6245})

// ── Create relationships ───────────────────────────────────────────────

MERGE (s1)-[:COMMITTED {involvement: "Primary"}]->(i1)
MERGE (s2)-[:COMMITTED {involvement: "Accomplice"}]->(i1)
MERGE (s2)-[:COMMITTED {involvement: "Primary"}]->(i2)
MERGE (s3)-[:COMMITTED {involvement: "Abettor"}]->(i2)

MERGE (v1)-[:VICTIMIZED_IN]->(i1)

MERGE (i1)-[:OCCURRED_AT]->(l1)
MERGE (i2)-[:OCCURRED_AT]->(l1)

MERGE (s1)-[:ASSOCIATED_WITH {shared_cases: 1}]->(s2)
MERGE (s2)-[:ASSOCIATED_WITH {shared_cases: 1}]->(s3);
