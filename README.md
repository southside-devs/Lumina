# 🔵 Lumina — Crime Intelligence & Analytical Platform

> **KSP Datathon 2026 — Karnataka State Police × Hack2Skill**
> Track 2: AI-Driven Crime Analytics & Visualization Platform
> Deployment: 100% Zoho Catalyst Native

---

## Overview

Lumina transforms the Karnataka State Police's fragmented, Excel-based crime records into a **real-time, AI-powered Strategic Intelligence Hub** — enabling proactive policing, criminal network analysis, and spatiotemporal crime visualization.

### Key Features

| Feature | Technology |
|---|---|
| 🗺️ State Overview Heatmap | Deck.gl HeatmapLayer |
| 🔴 Hotspot Explorer | ST-DBSCAN on AppSail |
| 🕸️ Criminal Network Graph | Cytoscape.js + Neo4j |
| 📊 Predictive Risk Scoreboard | Zia AutoML + ECharts |
| 💬 AI Query Assistant | Catalyst QuickML (RAG) |
| 📄 One-Click Briefing Reports | Catalyst SmartBrowz |

---

## Repository Structure

```
Lumina/
├── catalyst.json              # Catalyst project manifest
├── client/                    # React + Vite SPA (Web Client Hosting)
├── functions/
│   ├── api_service/           # Serverless CRUD APIs (Advanced I/O)
│   └── etl_cron/              # Cron-triggered ETL functions
├── appsail/
│   ├── neo4j/                 # Neo4j Docker container
│   └── ml_pipeline/           # ST-DBSCAN Python runtime
├── data/
│   ├── synthetic/             # Generated CSV datasets
│   └── generator/             # Python data generation scripts
└── docs/                      # Architecture & schema docs
```

---

## Quick Start

### 1. Generate Synthetic Data

```bash
cd data/generator
pip install -r requirements.txt
python generate_synthetic_data.py
```

This produces 7 CSV files in `data/synthetic/` covering Districts, Police Stations, FIRs, Accused, Victims, Case-Accused links, and Risk Scores.

### 2. Run Frontend (Sprint 3)

```bash
cd client
npm install
npm run dev
```

### 3. Deploy to Catalyst

```bash
catalyst deploy
```

---

## Tech Stack

| Layer | Catalyst Service |
|---|---|
| Frontend Hosting | Catalyst Web Client Hosting |
| Frontend Framework | React 18 + Vite + Deck.gl + Cytoscape.js |
| API Gateway | Catalyst API Gateway |
| Authentication | Catalyst Authentication (RBAC) |
| Backend Compute | Catalyst Serverless (Advanced I/O) |
| Custom Containers | Catalyst AppSail (Neo4j, ST-DBSCAN) |
| Relational DB | Catalyst Data Store |
| Object Storage | Catalyst Stratus |
| Caching | Catalyst Cache |
| LLM / RAG | Catalyst QuickML |
| NLP | Catalyst Zia Services |
| PDF Reports | Catalyst SmartBrowz |
| Job Scheduling | Catalyst Cron |
| Event Routing | Catalyst Signals |

---

## Documentation

- [Full Documentation](./KSP_CIAP_Documentation.md)
- [Solution Architecture](./solution_architecture.md)
- [Data Store Schema](./docs/schema.sql)

---

## License

This project was built for the KSP Datathon 2026. All rights reserved.
