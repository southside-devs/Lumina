# Electron Integration & Project Validation Guide

## Lumina - Crime Intelligence & Analytical Platform (Desktop Edition)

Version: 1.0

---

# Objective

Convert the existing React frontend into a fully functional Electron desktop application while ensuring the project follows a clean enterprise architecture.

This phase is **NOT** about adding new features.

The goals are:

- Integrate Electron
- Verify the current project structure
- Detect inconsistencies
- Fix architecture issues
- Ensure every module works together
- Prepare the application for future modules

---

# Phase 1 — Project Audit

Before writing any code, inspect the entire frontend.

## Verify Directory Structure

Ensure the following folders exist.

```
src/

components/
common/
cards/
charts/
tables/

modules/
dashboard/

services/
dashboard/

store/

hooks/

styles/

shell/

router/

utils/
```

---

## Verify Files

Check that the following files exist.

```
Button.jsx
Card.jsx
Badge.jsx
Input.jsx
Loader.jsx
EmptyState.jsx

KPIWidget.jsx
InfoCard.jsx
PanelCard.jsx

Dashboard.jsx
DashboardHeader.jsx
KPIGrid.jsx
CrimeTrend.jsx
DistrictHeatMap.jsx
AlertsPanel.jsx
ActivityFeed.jsx
RecentCases.jsx

dashboardStore.js

useDashboard.js

dashboard.api.js
dashboard.mock.js

components.css
dashboard.css
dashboard-module.css
```

If anything is missing,

create it.

---

# Phase 2 — Detect Anomalies

Inspect the entire frontend.

Look for:

## Broken imports

Example

```
../../components/card
```

instead of

```
../../components/cards
```

---

## Missing exports

Example

```
index.js
```

not exporting newly created components.

---

## Incorrect folder references

Example

```
import Button from "../Button"
```

instead of

```
../../components/common/Button
```

---

## Duplicate components

Remove duplicate versions of

```
Card

Button

Badge

Loader
```

There should only be one implementation.

---

## Duplicate CSS

Merge repeated styles into

```
components.css

dashboard.css

dashboard-module.css
```

---

## Unused Components

Identify components that are never imported.

Either

- remove them

or

- connect them properly.

---

## Circular Imports

Check for

```
Dashboard

↓

KPIGrid

↓

Dashboard
```

or similar cycles.

Resolve them.

---

## Missing Dependencies

Verify that the following packages exist.

```
react-router-dom

zustand

axios

lucide-react

recharts
```

Install missing packages.

---

## Verify Build

Run

```
npm install

npm run dev
```

Ensure

- zero errors
- zero warnings

---

# Phase 3 — Electron Integration

Convert the project into an Electron desktop application.

---

## Install

```
electron

electron-builder

concurrently

wait-on

cross-env
```

---

## Create Structure

```
FrontEnd/

electron/

main.js

preload.js

package.json
```

---

## main.js

Create Electron main process.

Responsibilities

- Create desktop window
- Disable unnecessary browser features
- Load Vite during development
- Load built files in production

---

## preload.js

Expose secure APIs.

Use

```
contextBridge
```

Do not enable

```
nodeIntegration
```

Keep

```
contextIsolation
```

enabled.

---

## package.json

Add scripts

```
dev

electron

electron:dev

build

dist
```

---

# Phase 4 — Desktop Shell

Verify

```
shell/

AppShell.jsx

Sidebar.jsx

Topbar.jsx

Workspace.jsx

StatusBar.jsx
```

If missing,

generate them.

---

## AppShell

Contains

```
Sidebar

Topbar

Workspace

StatusBar
```

No module logic.

---

## Workspace

Loads modules.

Initially

```
Dashboard
```

Later

```
FIR

Analytics

Graph

AI
```

---

# Phase 5 — Router

Verify

```
router/

routes.jsx
```

If absent,

create it.

Routes

```
Dashboard

FIR

Analytics

Graph

AI

Settings
```

---

# Phase 6 — Dashboard Integration

Ensure

Dashboard

does NOT contain

hardcoded data.

Everything must come from

```
useDashboard()

↓

dashboardStore

↓

dashboard.api

↓

dashboard.mock
```

No arrays inside components.

---

# Phase 7 — Styling Audit

Inspect

```
components.css

dashboard.css

dashboard-module.css
```

Remove

- duplicate classes
- conflicting rules
- unused styles

Ensure

consistent spacing

consistent typography

consistent colors

consistent border radius

consistent shadows

---

# Phase 8 — Responsive Desktop Layout

The application is desktop-first.

Do NOT optimize for phones.

Target

```
1366×768

1600×900

1920×1080

2560×1440
```

Support window resizing.

---

# Phase 9 — Performance Audit

Check

- unnecessary rerenders
- duplicate state
- large inline objects
- unnecessary hooks
- repeated API calls

Optimize.

---

# Phase 10 — Code Quality

Ensure

- reusable components
- no duplicated logic
- no magic numbers
- proper naming
- descriptive variables
- clean imports

---

# Phase 11 — Future Module Readiness

Ensure

new modules can be added simply by creating

```
modules/

new-module/
```

and registering it inside

```
router/routes.jsx
```

without changing

```
AppShell

Sidebar

Workspace
```

---

# Final Validation Checklist

## Application

- Electron launches successfully
- React loads correctly
- No white screen
- No console errors
- No warnings

---

## Dashboard

- KPI cards load
- Charts render
- Alerts display
- Activity feed works
- Recent cases render

---

## Store

- Zustand initializes
- Refresh works
- Mock API works
- Loading state works
- Error state works

---

## Architecture

- No circular imports
- No duplicate components
- No duplicate CSS
- No broken imports
- No missing exports

---

## Shell

- Sidebar works
- Workspace loads Dashboard
- Topbar renders
- Status bar renders

---

## Electron

- Main process loads
- Preload loads
- Context isolation enabled
- Node integration disabled
- Dev mode works
- Production build works

---

# Deliverables

At the end of this phase, the project should provide:

- A fully integrated Electron desktop application
- A validated and cleaned frontend architecture
- A reusable desktop shell
- A working Dashboard module
- A verified dependency tree
- A build that runs without errors or warnings
- A scalable foundation ready for FIR, Analytics, Graph, AI, and future modules
