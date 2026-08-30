# 🛠️ LUMINA — Technical Stack & System Architecture Specification
### *AI-Driven Crime Intelligence & Analytical Platform (CIAP)*
**Karnataka State Police (KSP) × Zoho Catalyst Serverless Cloud Architecture**

---

## 🏛️ High-Level Architectural Blueprint

```
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                                 PRESENTATION TIER                                      │
│  React 19 · TypeScript · Vite · Tailwind CSS v4 · TanStack Router (SPA Hash History)  │
│  Tactical Dark UI · Glassmorphism · Web Audio API · Lucide / Material Symbols          │
└──────────────────────────────────────────┬─────────────────────────────────────────────┘
                                           │ HTTPS / WSS / REST
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                            ZOHO CATALYST SERVERLESS CLOUD                              │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────┐ │
│  │     Web Client Host    │  │  Advanced I/O Service  │  │        ETL Cron Job       │ │
│  │    (lumina-client)     │  │     (api_service)      │  │        (etl_cron)         │ │
│  │   SPA Static Assets    │  │  Python 3.13 Handlers  │  │ Nightly Ingestion & Sync  │ │
│  └────────────────────────┘  └───────────┬────────────┘  └─────────────┬─────────────┘ │
│                                          │                             │               │
│  ┌───────────────────────────────────────┴─────────────────────────────┴─────────────┐ │
│  │                                 DATA ACCESS LAYER                                 │ │
│  │      Dual-Engine Architecture: Zoho Catalyst Data Store (ZCQL) / SQLite Engine    │ │
│  │         5,005 Live FIRs · 31 Districts · 209 Police Stations · Accused & Victims  │ │
│  └───────────────────────────────────────┬───────────────────────────────────────────┘ │
└──────────────────────────────────────────┼─────────────────────────────────────────────┘
                                           │
                                           ▼
┌────────────────────────────────────────────────────────────────────────────────────────┐
│                              INTELLIGENCE & AI SERVICES                                │
│                                                                                        │
│  ┌────────────────────────┐  ┌────────────────────────┐  ┌───────────────────────────┐ │
│  │   Google Gemini 2.5    │  │   Google Neural TTS    │  │      ST-DBSCAN Engine     │ │
│  │ Bilingual RAG Copilot  │  │ Multi-Rate Voice Synth │  │ Spatiotemporal Hotspots   │ │
│  │  (Kannada & English)   │  │   (0.75x — 1.70x Speed)│  │ Dynamic Patrol Routing    │ │
│  └────────────────────────┘  └────────────────────────┘  └───────────────────────────┘ │
└────────────────────────────────────────────────────────────────────────────────────────┘
```

---

## 💻 1. Frontend Technology Stack

| Layer / Concern | Technology | Purpose / Implementation |
| :--- | :--- | :--- |
| **Framework & Runtime** | **React 19** + **TypeScript** | Strict type safety, component modularity, modern hooks |
| **Build Tooling** | **Vite 8.1** | Instant HMR, roll-up bundling, relative path resolution (`base: "./"`) |
| **Routing** | **@tanstack/react-router** | Type-safe routing with `createHashHistory` for seamless SPA deployment on `/app/` subpaths |
| **Styling & Design System** | **Tailwind CSS v4** + **Vanilla CSS** | Tactical dark mode theme, glassmorphic surfaces, custom scrollbars, backdrop filters |
| **GIS & Mapping** | **Leaflet 1.9** + **Esri Cartography** | Multi-layer raster tiles (Esri Dark Canvas, Tactical Midnight, Satellite), hotspot markers |
| **Network Graphs** | **Cytoscape.js** | Accused-case relationship graph, syndicate hub detection, degree centrality |
| **Data Visualization** | **ECharts** & **SVG Canvas** | Multi-axis crime trends, district breakdowns, status distribution donuts |
| **Voice & Audio** | **Web Audio API** + **Google TTS** | Dynamic voice streaming, custom playback speeds (`0.75x` to `1.70x`), Kannada vocalization |
| **Document Generation** | **jsPDF** + **jspdf-autotable** | Client-side sealed PDF generation for official KSP Executive Intelligence Briefings |
| **Notifications & Toast** | **Sonner** | Non-blocking dark tactical operational alerts and telemetry toasts |

---

## ⚙️ 2. Backend & Serverless Architecture

| Component | Technology / Runtime | Specification |
| :--- | :--- | :--- |
| **Serverless Compute** | **Zoho Catalyst Advanced I/O** | `python_3_13` runtime, entry point `main.py`, sub-second execution latency |
| **API Architecture** | **RESTful Microservices** | Modular route handlers: `/api/districts`, `/api/stations`, `/api/firs`, `/api/accused`, `/api/hotspots`, `/api/ai-chat`, `/api/tts` |
| **Cron Scheduling** | **Zoho Catalyst Cron** | `etl_cron` running nightly batch data validation, deduplication, and schema updates |
| **Local Standalone Engine** | **In-Memory SQLite** | Zero-configuration fallback engine with automatic CSV schema bootstrap |
| **Package Optimization** | **Zero-Heavy Dependency Architecture** | Pure Python math routines and standard `urllib.request` REST clients (<1MB package) avoiding upload limits |

---

## 🧠 3. AI, Machine Learning & Analytics

### A. Spatiotemporal Hotspot Clustering (ST-DBSCAN)
- **Mathematical Model**: Calculates geographic distance via the spherical **Haversine formula** combined with temporal date-delta thresholds:
  $$\Delta \sigma = 2 \cdot R \cdot \arcsin\left(\sqrt{\sin^2\left(\frac{\Delta \phi}{2}\right) + \cos(\phi_1)\cos(\phi_2)\sin^2\left(\frac{\Delta \lambda}{2}\right)}\right)$$
- **Spatial Radius**: $\varepsilon_{spatial} \in [500\text{m}, 2500\text{m}]$ (Configurable in UI: Fine, Balanced, Broad).
- **Temporal Window**: $\varepsilon_{temporal} = 45\text{ days}$.
- **Patrol Dispatch Optimizer**: Automatically calculates centroid, incident density, violent crime ratios, and assigns tactical patrol units with response ETAs.

### B. Predictive Threat & Risk Scoring Algorithm
- **Formula**:
  $$\text{Threat Score} = \min\left(98, \max\left(28, 18.0 + 58.0 \cdot \sqrt{\frac{\text{Cluster Size}}{\text{Max Size}}} + 26.0 \cdot \frac{\text{Violent Crimes}}{\text{Total Crimes}}\right)\right)$$
- **Repeat Offender Index**: Evaluates arrest frequency, IPC crime severity, and active court status to flag high-risk suspects ($\ge 85$).

### C. Bilingual Generative AI Copilot (RAG Pipeline)
- **LLM Backbone**: **Google Gemini 2.5 Flash / 2.0 Flash**.
- **Retrieval Augmented Generation (RAG)**:
  1. Detects FIR number patterns (`#1693/2026`, spoken "1693 slash 2026", suspect names).
  2. Queries live Data Store records for matching primary documents.
  3. Injects factual records into system instructions as immutable ground truth (eliminating hallucination).
  4. Enforces strict bilingual translation rules (English $\leftrightarrow$ Kannada script).

### D. Calibrated Neural Text-to-Speech (TTS)
- **Voice Engine**: High-fidelity Google Neural Bilingual Voice (`en-IN` / `kn-IN`).
- **Speed Calibration Map**:
  - `Ultra Slow`: **0.75x**
  - `Slow`: **0.95x**
  - `Normal (Default)`: **1.18x**
  - `Fast`: **1.40x**
  - `Ultra Fast`: **1.70x**

---

## 🗄️ 4. Data Store Schema & Entity Relations

```
┌──────────────────┐       ┌────────────────────────┐       ┌──────────────────┐
│     District     │ 1   * │     Police_Station     │ 1   * │       FIR        │
│ ──────────────── │───────│ ────────────────────── │───────│ ──────────────── │
│ ROWID (PK)       │       │ ROWID (PK)             │       │ ROWID (PK)       │
│ Name             │       │ District_ID (FK)       │       │ Station_ID (FK)  │
│ Code             │       │ Name                   │       │ FIR_Number       │
│ Population       │       │ Jurisdiction_Area      │       │ Date             │
│ Latitude         │       │ Latitude               │       │ Crime_Group      │
│ Longitude        │       │ Longitude              │       │ Latitude / Long  │
└──────────────────┘       └────────────────────────┘       └────────┬─────────┘
                                                                     │ 1
                                                                     │
                                                                     │ *
┌──────────────────┐       ┌────────────────────────┐       ┌────────┴─────────┐
│     Accused      │ 1   * │      Case_Accused      │ *   1 │      Victim      │
│ ──────────────── │───────│ ────────────────────── │───────│ ──────────────── │
│ ROWID (PK)       │       │ ROWID (PK)             │       │ ROWID (PK)       │
│ Name             │       │ Case_ID (FK FIR.ROWID) │       │ FIR_ID (FK)      │
│ DOB / Gender     │       │ Accused_ID (FK)        │       │ Name / Age       │
│ Arrest_Count     │       │ Primary_Accused (Bool) │       │ Gender           │
│ Threat_Score     │       │ Chargesheet_Status     │       │ Socioeconomic    │
└──────────────────┘       └────────────────────────┘       └──────────────────┘
```

---

## 🔒 5. Security, Governance & Compliance

1. **Role-Based Access Control (RBAC)**: Support for Station Officer, District SP, and State HQ Superintendent clearance levels.
2. **Encrypted Local State**: User preferences, pinned case dossiers, and recent searches stored with AES-256 GCM client storage protection.
3. **Data Sanitization**: Complete input validation on search queries, parameter bounds checking, and SQL/ZCQL injection mitigation.
4. **Resilient Failover**: Seamless graceful degradation between cloud Catalyst Data Store and in-memory local caching.

---

## 📊 6. Performance Benchmarks

| Metric | Measured Benchmark | Target SLA |
| :--- | :--- | :--- |
| **Search Keystroke Response** | `< 45 ms` | `< 100 ms` |
| **ST-DBSCAN Hotspot Computation** | `< 85 ms` (5,005 records) | `< 250 ms` |
| **AI Copilot Response (RAG + LLM)** | `850 ms — 1.2 s` | `< 2.5 s` |
| **PDF Briefing Generation** | `220 ms` | `< 500 ms` |
| **Initial Bundle Load (Gzipped)** | `~231 KB` | `< 500 KB` |
