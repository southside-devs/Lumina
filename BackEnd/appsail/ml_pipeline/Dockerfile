# =============================================================================
# Lumina — ST-DBSCAN ML Pipeline Container
# Catalyst AppSail Deployment (Linux AMD64)
# =============================================================================

FROM python:3.11-slim

WORKDIR /app

# ── Install dependencies ────────────────────────────────────────────────
COPY requirements.txt .
RUN pip install --no-cache-dir -r requirements.txt

# ── Copy application code ──────────────────────────────────────────────
COPY . .

# ── AppSail requires port 9000 ─────────────────────────────────────────
EXPOSE 9000

# ── Start FastAPI with uvicorn ──────────────────────────────────────────
CMD ["uvicorn", "app:app", "--host", "0.0.0.0", "--port", "9000"]
