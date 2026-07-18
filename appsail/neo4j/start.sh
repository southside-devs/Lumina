#!/bin/bash
# =============================================================================
# Lumina — Neo4j + Flask API Startup Script
# Starts Neo4j in the background, then launches the Flask API proxy.
# =============================================================================

echo "Starting Neo4j..."
/startup/docker-entrypoint.sh neo4j &

# Wait for Neo4j to be ready
echo "Waiting for Neo4j to start..."
for i in $(seq 1 30); do
    if cypher-shell -u neo4j -p "" "RETURN 1" > /dev/null 2>&1; then
        echo "Neo4j is ready!"
        break
    fi
    echo "  Attempt $i/30 — waiting..."
    sleep 2
done

# Run Cypher initialization scripts
echo "Running initialization scripts..."
for f in /docker-entrypoint-initdb.d/*.cypher; do
    if [ -f "$f" ]; then
        echo "  Executing: $f"
        cypher-shell -u neo4j -p "" < "$f" || true
    fi
done

echo "Starting Flask API proxy on port 9000..."
cd /app && python3 app.py
