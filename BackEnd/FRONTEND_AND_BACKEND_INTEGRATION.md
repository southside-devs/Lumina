# 🔵 LUMINA — Frontend Overview & Backend Integration Guide

> **Project:** Lumina — KSP Datathon 2026  
> **Architecture:** React 18 + Vite (Client) × Zoho Catalyst Native (Backend)  
> **Design System:** Dark Glassmorphism (`#000000` Canvas, `#E85002` Branding Orange, `#333333` Glass Panels, Syne + Outfit fonts)

---

## 🎨 1. Completed Frontend Architecture & UI Modules

All constructed visual modules located in `FrontEnd/src/` adhere strictly to the Lumina Dark Glassmorphism design system.

### A. State Overview Heatmap
- **Component File:** `FrontEnd/src/components/maps/StateOverviewMap.jsx`
- **Tech Stack:** Deck.gl (`HeatmapLayer`) + Mapbox GL JS (`mapbox://styles/mapbox/dark-v11`).
- **UI Capabilities:** Dynamic color ramp (Green -> Yellow -> Orange -> Glowing Red), zoom-level density aggregation, spatiotemporal timeline slider (`Jan 2026 – Jul 2026`), category filter selector (`Cybercrime`, `Narcotics`, `Violent Crime`, `Financial Fraud`), and interactive hover inspector.

### B. Hotspot Explorer
- **Component File:** `FrontEnd/src/components/maps/HotspotExplorerMap.jsx`
- **Tech Stack:** Deck.gl (`PolygonLayer`, `ScatterplotLayer`) + Mapbox GL JS + Lucide Icons.
- **UI Capabilities:** Renders convex/concave hull polygons around ST-DBSCAN clusters, parameter tuning panel (`Eps1` spatial radius, `Eps2` temporal window, `MinPts` density threshold sliders), right-side glass cluster inspection drawer, and tactical report export triggers.

### C. Criminal Network Graph
- **Component File:** `FrontEnd/src/modules/analytics/NetworkGraph.jsx`
- **Tech Stack:** Cytoscape.js with force-directed physics layout (`cose` / `cola`).
- **UI Capabilities:** Color-coded node topology (Red = Accused, Blue = FIR, Yellow = Associate), degree-of-separation slider, centrality ringleader highlight, and node profile inspector.

### D. Predictive Risk Scoreboard
- **Component File:** `FrontEnd/src/modules/dashboard/AlertsPanel.jsx`
- **Tech Stack:** ECharts + Tailwind Glass Cards.
- **UI Capabilities:** Zia AutoML risk scorecards, high-risk suspect recidivism rankings, and 30-day forecasted incident time-series charts.

### E. AI Intelligence Assistant (RAG Copilot)
- **Component File:** `FrontEnd/src/shell/ContextualDrawer.jsx`
- **UI Capabilities:** Slide-out drawer with natural language FIR query input, suggested prompt chips, markdown responses, and inline citations back to FIR records.

### F. Notification Popover & Navigation Header
- **Component File:** `FrontEnd/src/shell/NotificationsPopover.jsx` & `FrontEnd/src/shell/Topbar.jsx`
- **UI Capabilities:** Anchored popover under the top-bar bell icon, color-coded threat alerts (High / Medium / System), relative timestamps, "Mark as read" trigger, and deep-linking card click triggers.

---

## ⚡ 2. Backend Integration & API Requirements

Detailing the serverless endpoints, AppSail containers, and Catalyst native services connected to the Lumina frontend:

| Frontend Feature | Required Backend Endpoint / Service | Repository File Location | Data Payload / Payload Contract |
| :--- | :--- | :--- | :--- |
| **State Heatmap** | `GET /ba/api/v1/crime-telemetry` | `BackEnd/functions/api_service/` | Returns Array of `{ id, districtName, stationId, category, threatScore, firCount, latitude, longitude, timestamp }` |
| **Hotspot Clusters** | `POST /appsail/ml-pipeline/st-dbscan` | `BackEnd/appsail/ml_pipeline/` | Body: `{ eps1, eps2, minPts, districtId }` -> Returns Array of `{ clusterId, name, coordinates, threatLevel, firCount, polygonHulls, recentFIRs }` |
| **Network Graph** | `GET /appsail/neo4j/cypher/network` | `BackEnd/appsail/neo4j/` | Query Params: `targetId`, `degree` -> Returns `{ nodes: [{ id, label, type, riskScore }], edges: [{ source, target, relation }] }` |
| **Risk Scoreboard** | `GET /ba/api/v1/predictive-risk` | `BackEnd/functions/api_service/` | Connects to `Zia AutoML` -> Returns `{ highRiskSuspects: [], forecasts: [], districtRiskScores: {} }` |
| **AI Copilot** | `POST /ba/api/v1/ai-query` | `BackEnd/functions/api_service/` | Connects to `Catalyst QuickML` -> Body: `{ prompt, contextFilter }` -> Returns `{ answer, citedFIRs: [{ firId, summary, matchScore }] }` |
| **Briefing PDF** | `POST /ba/api/v1/export-brief` | `BackEnd/functions/api_service/` | Connects to `Catalyst SmartBrowz` -> Body: `{ snapshotId, moduleName }` -> Returns `{ downloadUrl, expiresAt }` |
| **RBAC Auth** | `POST /ba/api/v1/auth/login` | `BackEnd/functions/api_service/` | Connects to `Catalyst Authentication` -> Body: `{ email, password }` -> Returns `{ userRole, officerName, token, stationId }` |

---

## 📁 3. Repository Directory Reference & Code Locations

Comprehensive file index across the Lumina repository:

```
Lumina/
├── BackEnd/
│   ├── FRONTEND_AND_BACKEND_INTEGRATION.md  <-- Integration Specification Document
│   ├── appsail/                             <-- AppSail Containers (ML Pipeline & Neo4j Graph Engine)
│   ├── client/                              <-- Catalyst Web Hosting Static Build Target
│   └── functions/                           <-- Serverless API Functions (Express / Catalyst Node.js SDK)
│       └── api_service/                     <-- Core Telemetry, AI, Auth & Risk Score API Service
├── FrontEnd/                                <-- React 18 + Vite Frontend Application
│   ├── index.html                           <-- Syne & Outfit Google Fonts & Mapbox GL CSS
│   ├── tailwind.config.js                   <-- Strict Design Tokens (#E85002, #000000, #F9F9F9, #333333)
│   └── src/
│       ├── App.css                          <-- Core CY FOCUS layout styles & CTA gradient rules
│       ├── components/
│       │   ├── maps/
│       │   │   ├── StateOverviewMap.jsx     <-- Karnataka GIS Heatmap Overlay & Inspector
│       │   │   └── HotspotExplorerMap.jsx   <-- ST-DBSCAN Cluster Engine & Parameter Tuning Panel
│       │   └── Spline3DViewer.jsx           <-- 3D Telemetry Canvas Component
│       ├── lib/
│       │   └── utils.js                     <-- Tailwind class merging utility (clsx + tailwind-merge)
│       ├── modules/
│       │   ├── analytics/
│       │   │   └── AnalyticsModule.jsx      <-- State Overview Analytics Layout
│       │   └── dashboard/
│       │       ├── Dashboard.jsx            <-- Hotspot Explorer Command Center Dashboard
│       │       ├── ActivityFeed.jsx         <-- Real-Time System Intelligence Feed
│       │       └── AlertsPanel.jsx          <-- Predictive Threat Alerts & Risk Board
│       ├── shell/
│       │   ├── AppShell.jsx                 <-- Main Application Layout Shell
│       │   ├── Topbar.jsx                   <-- KSP Beta Branding Header & Officer Profile (Ramachandra Rao)
│       │   ├── Sidebar.jsx                  <-- Navigation Bar & + New Investigation CTA
│       │   ├── NotificationsPopover.jsx     <-- Threat Alert Bell Popover
│       │   └── ContextualDrawer.jsx         <-- AI Copilot & Real-Time Log Drawer
│       └── styles/
│           ├── variables.css                <-- Strict design system CSS variable tokens
│           ├── global.css                   <-- Fluid shader card styles & typography rules
│           └── dashboard.css                <-- Header & command panel dashboard styling
├── DataBase/                                <-- Schema Definitions & Sample Datasets
├── Documents/                               <-- System Architecture Docs & Datathon Briefs
├── catalyst.json                            <-- Catalyst Service Configuration Manifest
└── README.md                                <-- Root Project Readme & Execution Instructions
```
