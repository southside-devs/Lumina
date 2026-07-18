# 🔵 Lumina — Crime Intelligence & Analytical Platform

> **KSP Datathon 2026 — Karnataka State Police × Hack2Skill**
> Track 2: AI-Driven Crime Analytics & Visualization Platform
> Deployment: 100% Zoho Catalyst Native

---

## Overview

Lumina transforms the Karnataka State Police's fragmented, Excel-based crime records into a **real-time, AI-powered Strategic Intelligence Hub** — enabling proactive policing, criminal network analysis, and spatiotemporal crime visualization.

### Key Features

| Feature                       | Technology             |
| ----------------------------- | ---------------------- |
| 🗺️ State Overview Heatmap     | Deck.gl HeatmapLayer   |
| 🔴 Hotspot Explorer           | ST-DBSCAN on AppSail   |
| 🕸️ Criminal Network Graph     | Cytoscape.js + Neo4j   |
| 📊 Predictive Risk Scoreboard | Zia AutoML + ECharts   |
| 💬 AI Query Assistant         | Catalyst QuickML (RAG) |
| 📄 One-Click Briefing Reports | Catalyst SmartBrowz    |

---

## Repository Structure

```
Lumina/
├── catalyst.json               # Catalyst project manifest
├── BackEnd/                    # Backend services, containers, and functions
│   ├── appsail/                # Custom container runtimes
│   │   ├── neo4j/              # Neo4j Docker container + API
│   │   └── ml_pipeline/        # ST-DBSCAN Python runtime
│   ├── client/                 # React + Vite SPA (Web client)
│   └── functions/              # Serverless backend functions
│       ├── api_service/        # Serverless CRUD APIs
│       └── etl_cron/           # Cron-triggered ETL jobs
├── DataBase/                   # Data files, schema, and generation scripts
│   ├── data/                   # Generated dataset files
│   ├── docs/                   # Database schema and docs
│   └── generator/              # Synthetic data generation scripts
├── Documents/                  # Documentation, architecture, and API references
└── FrontEnd/                   # Frontend assets / UI project
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

| Layer              | Catalyst Service                         |
| ------------------ | ---------------------------------------- |
| Frontend Hosting   | Catalyst Web Client Hosting              |
| Frontend Framework | React 18 + Vite + Deck.gl + Cytoscape.js |
| API Gateway        | Catalyst API Gateway                     |
| Authentication     | Catalyst Authentication (RBAC)           |
| Backend Compute    | Catalyst Serverless (Advanced I/O)       |
| Custom Containers  | Catalyst AppSail (Neo4j, ST-DBSCAN)      |
| Relational DB      | Catalyst Data Store                      |
| Object Storage     | Catalyst Stratus                         |
| Caching            | Catalyst Cache                           |
| LLM / RAG          | Catalyst QuickML                         |
| NLP                | Catalyst Zia Services                    |
| PDF Reports        | Catalyst SmartBrowz                      |
| Job Scheduling     | Catalyst Cron                            |
| Event Routing      | Catalyst Signals                         |

---

## Documentation

- [Full Documentation](./KSP_CIAP_Documentation.md)
- [Solution Architecture](./solution_architecture.md)
- [Data Store Schema](./docs/schema.sql)

---

## License

This project was built for the KSP Datathon 2026. All rights reserved.
