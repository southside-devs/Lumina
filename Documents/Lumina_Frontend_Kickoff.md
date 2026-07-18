# Lumina — Frontend Development Kickoff
**Project:** Crime Intelligence & Analytical Platform (KSP CIAP)
**Platform:** Zoho Catalyst | **Prepared for:** Frontend Team
**Date:** 2026-07-18

---

## 1. What We're Building

Lumina is a **two-part product**:

**Part A — Operational Tool (for officers)**
A form-driven interface for filing FIRs, adding accused/victim records, updating case statuses, and searching past cases. Think of this as a clean, structured replacement for the current Excel workflow.

**Part B — Analytics & Intelligence Hub (for SCRB Analysts)**
A data-rich dashboard with crime maps, trend charts, network graphs, risk score boards, and eventually an AI query assistant. This is the "intelligence" layer that makes the platform more than a database.

Both parts are used by different roles (Officer, SHO, SCRB Analyst, Admin) but live in the same product — the UI should adapt to what the logged-in user's role permits.

---

## 2. What the Backend Has Ready (Right Now)

The API is live. Here is exactly what you can build against today, without waiting for anything else.

### Available Endpoints

| What it does | Endpoint |
|---|---|
| Health check | `GET /api/health` |
| List / get districts | `GET /api/districts`, `GET /api/districts/<id>` |
| List / get police stations (filterable by district) | `GET /api/stations`, `GET /api/stations/<id>` |
| Create / list / get / update FIRs | `POST /api/firs`, `GET /api/firs`, `GET /api/firs/<id>`, `PUT /api/firs/<id>` |
| Search FIRs (date range, crime group, station, geo bounding box) | `GET /api/firs/search` |
| Create / list / get / update accused profiles | `POST /api/accused`, `GET /api/accused`, `GET /api/accused/<id>` |
| Create / list / get victims | `POST /api/victims`, `GET /api/victims`, `GET /api/victims/<id>` |
| Link accused to a FIR | `POST /api/case-accused`, `DELETE /api/case-accused/<id>` |
| Risk scores (per district / crime type) | `GET /api/risk-scores`, `POST /api/risk-scores` |
| Dashboard KPIs | `GET /api/dashboard/overview` |
| Crime trend counts | `GET /api/dashboard/crime-trends` |
| Per-district FIR breakdown | `GET /api/dashboard/district-summary` |

### What Is NOT Ready Yet (Don't Design Screens For These Yet)
- Chargesheet filing endpoint
- Arrest / Surrender event endpoint
- Act / Section associations
- File uploads (scanned FIR copies, photos)
- Server-side role-based field access control
- Real-time alerts / notifications
- Full-text search (currently exact-match only)
- Lookup APIs for caste, religion, occupation, court, rank, designation

For anything in the "not ready" list, design the UI screen but stub it out — placeholder state with a "Coming Soon" or a mock display is fine.

---

## 3. Key Things to Know Before Writing a Single Screen

### 3.1 Authentication
- Login is handled by Catalyst's own auth module, not a custom form you build from scratch.
- After login, Catalyst sets a **session cookie automatically** — you do not manually attach tokens to API calls from the browser. They just work.
- For any server-side rendering calls, forward the session cookie from the incoming request.
- **Roles are not yet server-side enforced.** All authenticated users currently see all data. Plan your UI to conditionally show/hide sensitive elements based on role (you'll get the role from the Catalyst user profile), but don't rely on the backend to block anything yet.

### 3.2 Data Shapes to Internalize Early
The two things that will trip you up if you don't know them upfront:

**Primary keys are called `ROWID`**, not `id`. Every record from the API has a `ROWID` integer field. When you need to reference a record (e.g. link an accused to a FIR), you use its `ROWID`.

**Foreign keys are IDs, not nested objects** — except for one case. `GET /api/firs/<id>` returns nested `victims[]` and `accused[]` arrays. All other list responses return only IDs (e.g. `"Station_ID": 3`, not a full station object). You'll need a secondary call or client-side join to show human-readable names in list views.

### 3.3 Enum Values (Hardcode These as Constants)
There are no lookup APIs for these yet. Embed them in the frontend:

**Crime Groups (20 values):**
Murder, Attempt to Murder, Robbery, Dacoity, Theft, Burglary, Kidnapping & Abduction, Assault, Rioting, Cheating & Fraud, Criminal Breach of Trust, Counterfeiting, Arson, Dowry Death, Cybercrime, Sexual Offences, Narcotics (NDPS Act), Arms Act Violations, SC/ST Atrocities, Motor Vehicle Theft

**FIR Status:** Under Investigation | Chargesheeted | Closed | Convicted | Acquitted

**Gender:** Male | Female | Other

**Involvement Type:** Primary | Accomplice | Abettor | Conspirator

**Socioeconomic Status:** Lower | Lower-Middle | Middle | Upper-Middle | Upper

### 3.4 Field Validation — Mirror These in Your Forms
| Field | Rule |
|---|---|
| FIR Number | Required, non-empty |
| All dates (Date, DOB) | YYYY-MM-DD format |
| Latitude | Float between 11.5 and 18.5 (Karnataka bounds) |
| Longitude | Float between 74.0 and 78.5 (Karnataka bounds) |
| Crime Group, Status, Gender, etc. | Must match one of the enum values above |
| Score (risk) | Float between 0.0 and 100.0 |
| Arrest Count, IDs | Non-negative integer |

### 3.5 Pagination
All list endpoints use offset-based pagination with a `limit` and `offset` query param. The response always includes a `meta` object:
```
{ "total": 500, "limit": 50, "offset": 100, "has_more": true }
```
Next page: `offset = offset + limit`, keep going while `has_more === true`.

### 3.6 Karnataka Map Reference
When you build any map view, the center of Karnataka is Lat `15.3173`, Lon `75.7139`. Geospatial bounding box search is available on `/api/firs/search`.

---

## 4. Screens to Build (Phased)

### Phase 3 — Core Operational Screens (Build These First)

**Screen 1: Login**
Entry point for all users. Uses Catalyst-hosted auth — you may be redirecting to their page or triggering their SDK method. Either way, on success you have a session and a user profile with a role.

**Screen 2: FIR List / Case Search**
The main landing screen for officers after login. Needs:
- A table/list of FIRs with key columns (FIR Number, Date, Station, Crime Group, Status)
- Filters: Station (dropdown), Crime Group (dropdown), Status (dropdown), Date range
- Pagination controls
- A link/button per row to open the FIR detail
- A prominent "File New FIR" button

**Screen 3: Add New FIR (Multi-Step Form)**
The most complex Phase 3 screen. The workflow is sequential:

Step 1 — FIR Core Details: Station (dropdown populated from `/api/stations`), FIR Number, Date, Crime Group, Crime Subgroup, Lat/Lon (map picker or manual entry), Status, Narrative.

Step 2 — Add Accused: Name, DOB, Gender, Occupation. After save, link to the FIR via the case-accused endpoint. Allow adding multiple accused.

Step 3 — Add Victim(s): Name, DOB, Gender, Socioeconomic Status, linked to the FIR. Allow multiple victims.

A "Review & Submit" summary before final submission is good UX but not required for MVP.

**Screen 4: FIR Detail View**
Read view for a single case. Show all core FIR fields, plus the linked victims and accused (both come back in the single FIR GET response). Include an "Update Status" action at minimum.

**Screen 5: Accused Profile View**
Shows one accused person's details plus their case history (list of linked FIRs). The `GET /api/accused/<id>` response includes a `cases[]` array.

### Phase 4 — Analytics & Visualization Screens

**Screen 6: Dashboard / Overview**
KPI cards at the top (total FIRs, accused, victims, repeat offenders, status breakdown) — all from `/api/dashboard/overview`. Below that: a crime trends bar chart from `/api/dashboard/crime-trends`, and a district-breakdown table/list from `/api/dashboard/district-summary`.

**Screen 7: Crime Map**
Map of Karnataka with FIR location markers or a heatmap layer. Use the geo bounding box search to fetch only what's visible in the map viewport. District summary data can power a choropleth layer (color districts by FIR density).

**Screen 8: Risk Score Board**
Heatmap grid or ranked table of districts × crime types, colored by risk score. Data from `/api/risk-scores`. Forecast date should be visible.

**Screen 9: Repeat Offenders List**
Filter view of accused using `?repeat_offenders=true` on the accused list endpoint. Shows profiles with `Arrest_Count >= 2`.

### Phase 5+ — Screens to Design Now, Build Later

**Screen 10: Criminal Network Graph** — Cytoscape.js visualization of suspect–victim–location links. Backend (Neo4j via AppSail) not yet ready; design the shell.

**Screen 11: AI Query Assistant** — Chat interface. QuickML RAG backend not yet exposed; stub with a mock response UI.

**Screen 12: Chargesheet Filing** — Endpoint not yet built; placeholder screen only.

**Screen 13: Alerts / Notifications Panel** — Real-time anomaly alerts. Signals integration not yet built.

---

## 5. Error Handling Pattern (Standardize This Early)

The API always returns the same shape on error:
```
{
  "status": "error",
  "message": "Human-readable summary",
  "details": ["'FIR_Number' is required", "'Date' must be YYYY-MM-DD"]
}
```

Build a shared error handler from day one. At minimum it should: show a toast/snackbar with `message`, and highlight the specific form fields called out in `details`. Doing this once in a shared utility is much better than copy-pasting it into every form.

---

## 6. Role-Based UI Plan

Even though the backend doesn't enforce roles yet, plan UI visibility now so you're not redesigning later.

| Role | What they primarily need |
|---|---|
| Officer | File FIR, view own station's cases, update case status |
| SHO (Station Head) | All officer access + cross-officer case view within station |
| SCRB Analyst | Read-only on operational screens; full access to all dashboards, maps, and analytics |
| Admin | Everything, including user management (future) |

Fields to hide from Officer / SHO roles until server-side enforcement lands: DOB, Socioeconomic Status (sensitive personal data). Drive this off the role in the Catalyst user profile.

---

## 7. Work Sequence Recommendation

The order below is intentional — each item unblocks the next.

1. Confirm base URL and verify health check returns `200 OK`.
2. Confirm login flow works end-to-end (you can see a session cookie after auth).
3. Build the shared API client / fetch wrapper with the standard error handler.
4. Build the FIR List screen (read-only, proves pagination and filters work).
5. Build Add New FIR form Step 1 (proves POST to FIR endpoint works).
6. Extend to Steps 2 & 3 (accused + victim creation and linking).
7. Build FIR Detail view.
8. Build Accused Profile view.
9. Switch to Phase 4: Dashboard KPI cards (simplest analytics screen).
10. Add the crime map.
11. Add the risk score board.
12. Add remaining analytics screens as backend features land.

Don't start the network graph, AI assistant, or alerts screens until the Phase 4 screens are solid — those are stretch goals.

---

## 8. Open Questions / Blockers to Resolve Before Starting

These are action items, not design decisions:

- [ ] Get the actual `<project-id>` from `catalyst.json` to construct the base URL.
- [ ] Confirm CORS is whitelisted for `localhost` and the deployed frontend domain — the backend team needs to do this in the Catalyst console.
- [ ] Decide on the login UX: Catalyst-hosted redirect page vs. custom form using the Catalyst JS SDK. This determines whether you need a login screen at all or just a redirect.
- [ ] Confirm whether Catalyst JS SDK (`@zohocatalyst/catalyst-js-sdk`) will be used, or plain `fetch` calls. Either works; just pick one and standardize.
- [ ] Get seed/dummy data loaded into the dev Data Store so there's something to see when you hit the list endpoints.
- [ ] Confirm the map tile provider — Deck.gl needs a basemap (Mapbox, Google Maps, or OpenStreetMap-based). Mapbox requires a token; OpenStreetMap is free.

---

## 9. Quick Reference Card

| Thing | Value |
|---|---|
| API base pattern | `https://<project-id>.catalystapps.com/baas/v1/project/<project-id>/function/api_service/api/` |
| Health check | `GET /api/health` |
| Primary key field name | `ROWID` |
| Date format | `YYYY-MM-DD` |
| Karnataka lat bounds | 11.5 – 18.5 |
| Karnataka lon bounds | 74.0 – 78.5 |
| Karnataka center | Lat 15.3173, Lon 75.7139 |
| Pagination params | `limit`, `offset` |
| Pagination response key | `meta.has_more`, `meta.total` |
| Auth mechanism | Catalyst session cookie (auto, no token management) |
| Error response key | `status === "error"`, `message`, `details[]` |
| New record ID after POST | `response.data.ROWID` |
