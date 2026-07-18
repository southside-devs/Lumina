# =============================================================================
# Lumina — Neo4j + Flask API Proxy Container
# Catalyst AppSail Deployment (Linux AMD64)
# =============================================================================
# This container runs:
#   1. Neo4j Community Edition (bolt://localhost:7687)
#   2. A Flask API proxy on port 9000 (required by AppSail)
#
# The Flask API accepts HTTP requests from Catalyst Serverless functions
# and translates them to Cypher queries against the local Neo4j instance.
# =============================================================================

FROM neo4j:5-community

# ── Environment ─────────────────────────────────────────────────────────
ENV NEO4J_AUTH=none
ENV NEO4J_PLUGINS='[]'
ENV NEO4J_dbms_memory_heap_initial__size=256m
ENV NEO4J_dbms_memory_heap_max__size=512m

# ── Install Python for the Flask API proxy ──────────────────────────────
USER root
RUN apt-get update && \
    apt-get install -y --no-install-recommends python3 python3-pip && \
    rm -rf /var/lib/apt/lists/*

# ── Install Python dependencies ────────────────────────────────────────
COPY api/requirements.txt /app/requirements.txt
RUN pip3 install --no-cache-dir --break-system-packages -r /app/requirements.txt

# ── Copy application code ──────────────────────────────────────────────
COPY api/ /app/
COPY init/ /docker-entrypoint-initdb.d/

# ── Copy startup script ────────────────────────────────────────────────
COPY start.sh /start.sh
RUN chmod +x /start.sh

# ── AppSail requires port 9000 ─────────────────────────────────────────
EXPOSE 9000 7687 7474

# ── Start both Neo4j and the Flask API proxy ───────────────────────────
CMD ["/start.sh"]
