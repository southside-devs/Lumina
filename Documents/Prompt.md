# Lumina – Crime Intelligence & Analytical Platform (KSP CIAP)

Version: 1.0
Project: Lumina
Client: Karnataka State Police (KSP)
Platform: Zoho Catalyst
Frontend Stack: React 19 + Vite

---

# Project Overview

Lumina is a Crime Intelligence & Analytical Platform (CIAP) built for the Karnataka State Police.

The application provides investigators, analysts, and officers with a centralized platform for managing FIRs, accused records, crime analytics, intelligence dashboards, geographical crime visualization, and AI-assisted querying.

The frontend is a production-grade React application deployed on Zoho Catalyst and communicates with backend REST APIs exposed under `/api`.

---

# Technology Stack

Frontend

- React 19
- Vite
- React Router DOM
- Recharts
- Cytoscape.js
- react-cytoscapejs

Styling

- Pure Inline CSS
- Global CSS Variables
- No Tailwind
- No TypeScript
- No CSS Modules

Deployment

- Zoho Catalyst

---

# Design Philosophy

The application follows a dark intelligence command-centre aesthetic.

Goals:

- High information density
- Professional police workflow
- Fast navigation
- Minimal distractions
- Dashboard-first experience

The UI should resemble intelligence software rather than consumer SaaS products.

---

# Design System

## Theme

Dark Intelligence Theme

### Primary Colors

| Variable         | Value   |
| ---------------- | ------- |
| --bg-primary     | #0d1117 |
| --bg-surface     | #161b22 |
| --bg-elevated    | #1c2333 |
| --bg-hover       | #21262d |
| --border         | #30363d |
| --border-subtle  | #21262d |
| --text-primary   | #e6edf3 |
| --text-secondary | #8b949e |
| --text-muted     | #484f58 |
| --accent         | #1f6feb |
| --accent-hover   | #388bfd |
| --danger         | #da3633 |
| --warning        | #f0883e |
| --success        | #2ea043 |

Fonts

- Inter
- JetBrains Mono

Loaded from Google Fonts.

---

# Global Layout

```
Root
│
├── Sidebar
│
└── Main
      │
      ├── Topbar
      │
      └── Page Content
```

Layout Rules

- display:flex
- height:100vh
- overflow:hidden

Sidebar

- Collapsible
- Navigation
- Live Pulse Indicator

Main Area

- Topbar
- Scrollable content

---

# Animations

fadeIn

- opacity
- translateY

pulse-live

- live indicator animation

spin

- loading spinner

---

# Folder Structure

```
src/

index.css
main.jsx
App.jsx

constants/
    index.js

utils/
    api.js
    auth.js
    helpers.js

components/

    layout/
        Sidebar.jsx
        Topbar.jsx

    shared/
        UI.jsx

pages/

    Dashboard.jsx
    FIRList.jsx
    FIRDetail.jsx
    NewFIR.jsx

    AccusedList.jsx
    AccusedDetail.jsx
    RepeatOffenders.jsx

    CrimeMap.jsx
    RiskBoard.jsx
    NetworkGraph.jsx
    CrimeTrends.jsx

    AIQuery.jsx
```

---

# Application Pages

## Dashboard

Purpose

Overall crime analytics dashboard.

Features

- KPI Cards
- Crime Statistics
- Horizontal Bar Chart
- FIR Status Breakdown
- District Summary Table

---

## FIR List

Purpose

Manage all FIRs.

Features

- Pagination
- Search
- Filtering
- Create FIR CTA

---

## FIR Detail

Purpose

Complete FIR information.

Features

- Incident Details
- Victim List
- Accused List
- Status Update

---

## New FIR

Purpose

Create FIR through guided workflow.

Workflow

Step 1

Incident Details

↓

Step 2

Accused

↓

Step 3

Victims

↓

Step 4

Review

↓

Submit

---

## Accused List

Purpose

Browse accused records.

Columns

- Name
- Gender
- Arrest Count
- Occupation

Features

- Pagination
- Repeat Offender Toggle
- Row Navigation

Business Rule

Arrest Count ≥ 2

Display danger badge.

---

## Accused Detail

Purpose

Complete accused profile.

Information

- Name
- DOB
- Gender
- Occupation
- Arrest Count

Officer Role

DOB must be hidden.

Repeat Offender

If Arrest Count ≥ 2

Display warning banner.

Case History

Columns

- FIR ID
- Involvement Type
- FIR Link

---

## Repeat Offenders

Purpose

Dedicated repeat offender investigation page.

Source

```
GET /api/accused?repeat_offenders=true
```

Features

- Pagination
- Sorted by Arrest Count
- Dashboard Count
- Empty State

---

## Crime Map

Purpose

Geographical crime visualization.

Features

- Karnataka SVG Map
- FIR Markers
- Choropleth District Circles
- Filters
- Legend

---

## Risk Board

Purpose

District risk analysis.

Features

- Heatmap
- Risk Cards
- Color Scale

---

## Network Graph

Purpose

Relationship analysis.

Technology

- Cytoscape.js

Node Types

- Suspect
- Victim
- Incident
- Location

Edge Types

- COMMITTED
- ASSOCIATED_WITH

Features

- Interactive Graph
- Node Details
- Legend

---

## Crime Trends

Purpose

Crime trend analytics.

Charts

- Bar Chart
- Pie Chart

Additional

District Summary Table

---

## AI Query

Purpose

Future AI-powered investigation assistant.

Current State

Preview Mode

Features

- Chat Interface
- Demo Responses
- Typing Indicator
- Preview Badge

Sample Queries

- Theft trends in Mysuru
- Assault hotspots
- FIRs filed last month
- Repeat offenders in Bengaluru
- Narcotics trends

---

# Routing

| Route             | Page               |
| ----------------- | ------------------ |
| /                 | Dashboard Redirect |
| /dashboard        | Dashboard          |
| /firs             | FIR List           |
| /firs/new         | New FIR            |
| /firs/:id         | FIR Detail         |
| /accused          | Accused List       |
| /accused/:id      | Accused Detail     |
| /repeat-offenders | Repeat Offenders   |
| /crime-map        | Crime Map          |
| /risk-board       | Risk Board         |
| /network          | Network Graph      |
| /trends           | Crime Trends       |
| /ai-query         | AI Query           |

---

# API Architecture

Base URL

```
/api
```

Authentication

```
credentials: include
```

Headers

```
Content-Type: application/json
```

---

# API Modules

## FIR API

- list()
- search()
- get()
- create()
- update()

---

## Accused API

- list()
- get()
- create()
- update()

---

## Victim API

- list()
- get()
- create()

---

## Case Accused API

- create()
- delete()

---

## Dashboard API

- overview()
- trends()
- districtSummary()

---

## District API

- list()

---

## Station API

- list()

---

## Risk API

- list()

---

# API Response Format

Success

```json
{
  "status": "success",
  "data": {},
  "meta": {
    "total": 0,
    "limit": 20,
    "offset": 0,
    "has_more": false
  }
}
```

Error

```json
{
  "status": "error",
  "message": "...",
  "details": []
}
```

---

# Primary Key

All database entities use

```
ROWID
```

---

# FIR Creation Workflow

```
Create FIR

↓

POST /firs

↓

Create Accused

↓

POST /accused

↓

Link FIR & Accused

↓

POST /case-accused

↓

Create Victims

↓

POST /victims

↓

Workflow Complete
```

---

# Business Rules

## FIR

Required Fields

- Station_ID
- FIR_Number
- Date
- Crime_Group
- Latitude
- Longitude

Latitude Range

11.5 → 18.5

Longitude Range

74.0 → 78.5

---

## Accused

Required

Name

---

## Victim

Required

- FIR_ID
- Name

---

## Repeat Offender

Definition

```
Arrest_Count >= 2
```

---

## Officer Access

Officer role cannot view:

- Date of Birth

---

# Shared Components

Reusable UI Components

- Card
- CardHeader
- Badge
- Button
- Input
- Select
- Spinner
- ErrorState
- EmptyState
- StatCard
- Table
- Pagination

---

# Utility Modules

## auth.js

Responsibilities

- Mock User
- Permission Checks
- Analytics Access
- Sensitive Data Access

---

## helpers.js

Utilities

- formatDate()
- formatNumber()
- getRiskColor()
- getRiskLabel()
- paginate()
- debounce()

---

## constants/index.js

Contains

- Crime Groups
- FIR Statuses
- Gender List
- Involvement Types
- SES Levels
- Karnataka Map Constants
- Roles
- Status Colors
- Crime Color Map

---

# Deliverables

The frontend must include:

- Complete React application
- Production-ready routing
- Responsive layout
- Dashboard
- FIR management
- Accused management
- Crime analytics
- Geographic visualization
- Risk analysis
- Network graph
- AI Preview Chat
- Shared UI component library
- Utility modules
- API abstraction layer
- Global design system

---

# Expected Final Directory

```
FrontEnd/

package.json
vite.config.js
index.html

src/

index.css
main.jsx
App.jsx

constants/
    index.js

utils/
    api.js
    auth.js
    helpers.js

components/

    layout/
        Sidebar.jsx
        Topbar.jsx

    shared/
        UI.jsx

pages/

    Dashboard.jsx
    FIRList.jsx
    FIRDetail.jsx
    NewFIR.jsx

    AccusedList.jsx
    AccusedDetail.jsx
    RepeatOffenders.jsx

    CrimeMap.jsx
    RiskBoard.jsx
    NetworkGraph.jsx
    CrimeTrends.jsx
    AIQuery.jsx
```

---

# Success Criteria

The application will be considered complete when:

- All routes are functional
- All API integrations are implemented
- Shared UI components are reusable
- Design system is consistently applied
- Pagination and filtering work across data tables
- Crime analytics and visualization render correctly
- AI Preview interface functions with demo responses
- The application is production-ready for deployment on Zoho Catalyst
