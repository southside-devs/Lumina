# Lumina — Frontend Deep Insights
**Project:** Crime Intelligence & Analytical Platform (KSP CIAP)
**Audience:** Frontend Team | **Date:** 2026-07-18

---

## Overview

This document goes deeper than the kickoff guide. It covers the reasoning behind design decisions, the non-obvious UX considerations specific to a law enforcement platform, how each major frontend feature connects to data that actually exists, potential pitfalls, and what "done well" looks like for each screen. Read this alongside the API Reference and the Kickoff doc.

---

## 1. Who Is Actually Using This? (Users & Mental Models)

Getting the user personas right before designing anything is critical. This is not a consumer product — the users have very different mental models and priorities.

### The Field Officer (Primary operational user)
Files FIRs under time pressure, often immediately after or during an incident. May not be technically fluent. Has no patience for multi-step forms that don't save progress. Needs the "Add FIR" action to be reachable in two clicks from anywhere. Their screen may be a small laptop or even a tablet in a station office.

**Design implication:** The FIR filing flow must be fast, forgiving (autosave drafts), and have extremely clear validation errors. Every dropdown must have a search/filter — they're not scrolling through 31 districts or 240 stations. Never show them the analytics dashboards as their default landing screen — it's noise they didn't ask for.

### The SHO (Station House Officer)
Manages a station. Needs to see cases filed by officers under them, track case statuses, and identify any case that's been sitting without movement. Less about filing, more about oversight.

**Design implication:** Their default view is a case list filtered to their station, with status as a prominent column. They need a quick "cases with no update in X days" filter that doesn't exist in the API yet — flag this as a future need.

### The SCRB Analyst (Primary analytics user)
Works at the State Crime Records Bureau. Their job is spotting patterns across the entire state — which districts are heating up, which crime types are trending, which suspects are appearing across multiple districts. They live in the dashboards and maps, not in the FIR filing forms.

**Design implication:** The analytics screens are their homepage. They should land on the dashboard overview, not on a FIR list. The crime map and network graph are the most valuable screens for them — invest the most design effort here. They are also the users most likely to want PDF reports to take to a briefing.

### The Admin
Manages users and roles. This screen doesn't exist yet in the API, so design a placeholder.

---

## 2. Information Architecture (How to Structure the Product)

The platform has two fundamentally different modes that should feel distinct from each other but share a consistent shell.

```
Lumina
│
├── [OPERATIONS WING]          ← Officer & SHO focus
│   ├── FIR List / Search
│   ├── File New FIR
│   ├── FIR Detail
│   ├── Accused Profile
│   └── Victim Record
│
└── [INTELLIGENCE WING]        ← SCRB Analyst focus
    ├── Dashboard Overview     (KPIs + Trends)
    ├── Crime Map              (Heatmap + Hotspot clusters)
    ├── District Intelligence  (Choropleth + per-district drill-down)
    ├── Network Graph          (Criminal connections)
    ├── Risk Score Board       (7/14 day forecasts by district × crime type)
    ├── Repeat Offenders       (Accused with Arrest_Count ≥ 2)
    └── AI Query Assistant     (Natural language — Phase 5+)
```

A sidebar or top navigation should make this split visible. Don't mix a "File FIR" button into the analytics pages. The two wings serve different jobs.

**Role-based entry point:**
- Officer → lands in Operations Wing, FIR List scoped to their station
- SHO → lands in Operations Wing, FIR List scoped to their station (all officers)
- SCRB Analyst → lands in Intelligence Wing, Dashboard Overview
- Admin → lands in a User Management page (future)

---

## 3. The FIR Filing Flow — Deep Dive

This is the most complex form in the product and the one most likely to go wrong. The multi-step flow has four logical units that should be separated, not jammed into one long scroll.

### Step 1: Incident Details
**Fields:** Station (district → station cascade), FIR Number, Date, Crime Group, Crime Subgroup, Status, Narrative

The district → station relationship is the first cascade to get right. When a user picks a district, immediately call `GET /api/stations?district_id=<id>` and repopulate the station dropdown. The station dropdown should be empty (or disabled) until a district is chosen. Never load all 240 stations at once.

**FIR Number** is officer-generated in the current system (it's not auto-assigned by the backend). The format is typically `CR-XXX/YYYY`. You may want to provide a format hint or mask, but don't enforce a specific regex — the backend only requires non-empty string.

**Location capture** for Lat/Lon is tricky. Three options, in order of best UX:
1. A small embedded map where the officer clicks to drop a pin (best, most accurate)
2. A "Use Current Location" button using the browser Geolocation API (fast, good for mobile)
3. Manual number entry fields (fallback)

Validate Lat between 11.5–18.5 and Lon between 74.0–78.5 immediately on blur — don't let someone submit a FIR with coordinates in the wrong country.

**The Narrative field** is a free-text textarea. In Phase 5+, the NER model (Catalyst Zia Services) will extract persons, locations, and weapons from this text and suggest tagging them as accused/victims. Design the textarea with this in mind — leave space below it for an "Extracted Entities" panel that can appear after AI processing. For now, it's just a textarea.

### Step 2: Accused
This step involves a mini-loop: add one accused → see them in a list → optionally add another.

The workflow per accused: fill Name, DOB, Gender, Occupation → POST to `/api/accused` → POST to `/api/case-accused` to link → show the accused in a "Added Accused" list below the form with a remove/unlink option.

**Important edge case:** What if the accused person is already in the system (repeat offender)? The API has `GET /api/accused` with a repeat_offenders filter but no name search yet. For now, "add accused" always creates a new profile. When full-text search lands, you'll want a "search existing" flow before "create new". Design the UI to accommodate this future pattern — a "Search existing accused" link that currently shows a "not available yet" state.

### Step 3: Victims
Same mini-loop pattern as Step 2. A FIR can have multiple victims. The `FIR_ID` must be attached to each victim at creation — it's a required field.

### Step 4: Review & Submit
Show a read-only summary: incident details, accused count, victim count. Provide a "Go back and edit" link per section. Include a clear "Finalize FIR" CTA. After submission, show a confirmation with the FIR Number and a link to the newly created FIR detail page.

### Progress & Autosave
Steps 1–4 should show a progress indicator (Step 1 of 4). Critically, **save to localStorage after Step 1 completes** so a browser refresh doesn't lose everything. When the user returns, offer to restore the draft. Clear the draft on successful submission.

---

## 4. The Dashboard — What Each Widget Actually Shows

### KPI Cards (from `/api/dashboard/overview`)
Six cards: Total FIRs, Total Accused, Total Victims, Total Stations, Repeat Offenders, and a status breakdown. The status breakdown (Under Investigation / Chargesheeted / Closed / Convicted / Acquitted) is a donut or stacked bar, not just a number.

**Design note:** The ratio of "Under Investigation" to "Chargesheeted" to "Closed" is a meaningful operational metric — make it prominent, not hidden in a tiny badge.

### Crime Trends Chart (from `/api/dashboard/crime-trends`)
Returns an array of `{ group, count }`. This should be a horizontal bar chart, not a pie chart — there are 20 crime groups and a pie with 20 slices is unreadable. Sort by count descending so the worst crimes sit at the top. Allow filtering by a specific crime group via the optional query param — clicking a bar should set that filter and re-fetch.

### District Summary (from `/api/dashboard/district-summary`)
Returns `{ district_id, district_name, population, total_firs }` per district. This powers two things: (1) a ranked table for the dashboard, and (2) the choropleth (colour-by-intensity) layer on the crime map. The `population` field allows computing a **crime rate per 100,000 residents** which is more meaningful than raw counts for comparing Bengaluru (12M people) to a smaller district. Surface this derived metric.

---

## 5. The Crime Map — Technical Considerations

The map is the single most visually distinctive screen in Lumina and the one judges will spend the most time on. It must be excellent.

### What Layers You Can Build Right Now
The data to drive all three of these exists in the API today:

**Layer 1 — FIR Scatter / HeatmapLayer**
Each FIR has Lat/Lon. Fetch FIRs via `/api/firs/search` with a geographic bounding box matching the current map viewport. On zoom, re-fetch with the new bounding box. At low zoom, aggregate into a heatmap; at high zoom, show individual point markers.

**Layer 2 — District Choropleth**
Colour each district polygon by FIR density. Data from `/api/dashboard/district-summary`. You need Karnataka district boundary GeoJSON for this — this is not served by the backend and must be bundled client-side. Karnataka district GeoJSON is freely available from the Datameet India open data project. Bundle it as a static asset.

**Layer 3 — Hotspot Clusters (ST-DBSCAN)**
This comes from the AppSail ML pipeline — not yet ready. Design the map to accept a GeoJSON FeatureCollection of polygon clusters via a future `/api/hotspots` endpoint. For now, show a placeholder "Hotspot analysis pending" state on the map panel.

### Map Interaction Pattern
The map should not be a passive display. When a user clicks a district on the choropleth: show a side panel with that district's stats (FIR count, top crime types, risk score if available). When a user clicks an individual FIR point marker: show a tooltip with FIR Number, Crime Group, Date, and a "View Full Case" link.

### Basemap Choice
Deck.gl requires a basemap. Options:
- **Mapbox** — best visual quality, requires a free API token, has a reasonable free tier. Register at mapbox.com.
- **OpenStreetMap via Carto** — free, no token, slightly lower quality tiles. Good fallback.
- **Google Maps** — billable per load, avoid for a hackathon.

Recommendation: use Mapbox with a dark "Navigation Night" style for the analytics map — it makes the crime heatmap colours pop against a dark background, which reads well in demos.

---

## 6. The Criminal Network Graph

This screen depends on Neo4j via AppSail — not yet available. But design the shell and the interaction model now.

### What the Graph Shows
Nodes: Suspects (blue), Victims (orange), Locations (grey), Incidents (red).
Edges: COMMITTED, VICTIMIZED_IN, OCCURRED_AT, ASSOCIATED_WITH.

The graph is most useful for answering questions like: "Who are all the people connected to this suspect within 2 hops?" and "Which suspects appear in incidents at the same location?"

### Cytoscape.js with Cose-Bilkent Layout
Cose-Bilkent is a physics-based layout that automatically separates clusters. It requires the `cytoscape-cose-bilkent` extension. For large graphs (100+ nodes), enable WebGL rendering — standard canvas will lag. Use `cytoscape-fcose` as an alternative if Cose-Bilkent performance is poor.

### Interaction Design
- Click a node → highlight it and its direct connections, fade all others. Show a detail panel on the right with that entity's full profile.
- Hover a node → tooltip with name and type.
- Double-click a node → expand to load 2nd-degree connections (requires another API call per hop).
- Search bar at top → highlight matching node by name.
- Filter controls → toggle which node types are visible (show/hide victims, show/hide locations, etc.)
- "Export as PDF" button → triggers the SmartBrowz PDF generation endpoint (Phase 5+).

### Stub State
Until the Neo4j endpoint is ready, load a hardcoded sample graph of ~15 nodes with realistic-looking Karnataka names and case numbers. The graph should be visually convincing — judges are likely to see this screen and it needs to not look like a placeholder.

---

## 7. Risk Score Board

The risk scores are generated by Catalyst Zia AutoML and stored in the `Risk_Score` table. The API (`/api/risk-scores`) returns: District, Crime Type, Score (0–100), Forecast Date.

### Recommended Visualisation: Two-Axis Heatmap
Districts on the Y-axis, Crime Types on the X-axis, cells coloured by Score. Use ECharts `heatmap` series. Colour scale: green (0–30) → yellow (30–60) → orange (60–80) → red (80–100).

### Interaction
- Click a cell → show a side panel with: current risk score, historical trend for this district × crime type (requires additional data over time), and a "View recent FIRs" link that pre-filters the FIR list to that district + crime group.
- Toggle forecast date: if scores exist for multiple Forecast_Date values, provide a date selector so the analyst can see how the risk landscape is expected to evolve over the next 7 and 14 days.

### Empty / Insufficient Data State
If no risk scores exist (e.g. Zia AutoML hasn't run yet), show a clear "Risk model not yet trained — check back after data ingestion is complete" state with an estimated timeline. Don't show an empty grid with no explanation.

---

## 8. AI Query Assistant

This is a Phase 5+ feature (Catalyst QuickML RAG not yet ready), but design the interface now because it's a high-impact demo screen.

### Interaction Model
A chat-style interface. The user types a natural language question: "Show me theft trends in Mysuru for the last 3 months" or "Which districts have the highest assault rates?" The QuickML RAG pipeline translates this into a filtered API query, fetches results, and returns a structured answer.

### Response Display
Answers should not just be text — they should render the appropriate visualization inline in the chat:
- A trend question → inline mini bar chart
- A "top districts" question → inline ranked list
- A "show me cases" question → inline table with links to individual FIRs

Design the chat bubbles to support both text and embedded visualisation components.

### Stub Strategy
For the demo, build a static "query → canned response" lookup for 5–6 likely demo questions. The questions a judge is most likely to ask are predictable: something about Bengaluru, something about theft, something about a specific time period. Intercept those and return convincing-looking prebuilt responses. Mark it clearly in the UI as "AI Preview — Live model integration in progress."

---

## 9. Repeat Offenders List

This is a fast win — it's a standard list view, but the data it surfaces is high-value.

The API filter `GET /api/accused?repeat_offenders=true` returns accused with `Arrest_Count >= 2`. The list should show: Name, Arrest Count, Last Known Occupation, and most importantly a "Linked Cases" count (this requires client-side aggregation from the `cases[]` array in the individual accused response, or a new backend endpoint — flag this).

Clicking an accused in this list opens the Accused Profile view, which shows their full case history. This profile page is where the cross-jurisdictional pattern becomes visible — if an accused has cases at stations in Bengaluru, Mysuru, and Belagavi, that spatial spread should be shown on a small map embedded in their profile.

---

## 10. PDF Report Generation

SmartBrowz generates PDFs server-side by rendering a URL. This means you need a printable version of key screens at a specific URL — for example `/reports/dashboard` renders a clean, print-formatted version of the dashboard that SmartBrowz can capture.

### What to Make Printable
- Dashboard Overview (KPIs + trends chart + district table)
- District Intelligence Report (per-district stats, top crime types, risk score)
- FIR Detail (single case record, all associated accused and victims)
- Accused Profile (person's history across all cases)

### Design the Print Views Separately
The interactive screen and the printable version are different. The printable version should: use a white background, remove all interactive controls (filters, dropdowns, buttons), include a header with the Lumina/KSP logo + report generation timestamp, and include a footer with "Karnataka State Police — SCRB" and "Confidential."

---

## 11. Sensitive Data Display — Practical UI Decisions

Several fields exist that require careful handling even before server-side enforcement lands.

**Fields to treat as sensitive:** DOB of accused/victims, Socioeconomic_Status, any caste/religion fields (when they land in the schema).

**What to do right now (client-side only):**
- Show DOB as age only to Officer role: "39 years old" rather than the birth date
- Hide Socioeconomic_Status from Officer role entirely — it's an analytical field for SCRB
- Never export sensitive fields to CSV from the frontend (when a data export feature is added)
- Mask fields visually with a blur + "Restricted" label for roles that shouldn't see them, rather than omitting them silently — makes it clear the field exists without revealing the value

---

## 12. Empty States — Don't Leave Users Stranded

Every list, chart, and map needs a designed empty state. Given the platform starts with synthetic data, empty states will appear during dev. But they also appear in real use when filters are too narrow.

| Screen | Empty state message |
|---|---|
| FIR List (filtered) | "No cases match the current filters. Try widening the date range or changing the crime group." |
| Crime Map (no data in viewport) | "No incidents recorded in this area. Pan to a populated district or zoom out." |
| Risk Score Board | "Risk model scores not yet available. Data is updated nightly." |
| Network Graph | "No connections found for this case. Add accused profiles to see network links." |
| Repeat Offenders | "No repeat offenders found. This filter shows accused with 2 or more arrests." |

Empty states on a law enforcement platform should be informative and directive, not decorative. No "nothing here yet 🎉" — that tone is completely wrong for the context.

---

## 13. Performance Considerations That Will Bite You Later

### The FIR List at Scale
The API returns 50 FIRs per page by default. Fine for now. But the dashboard district-summary suggests there are potentially 4,200+ FIRs in the system. A FIR list that tries to load all of them at once will fail. Enforce pagination from day one — do not build an "infinite scroll that loads all records" pattern.

### The Crime Map at Scale
Deck.gl is GPU-accelerated and can handle hundreds of thousands of points — but only if you're using the right layer. `HeatmapLayer` and `ScatterplotLayer` are GPU-friendly. `IconLayer` with custom images is not. Avoid fetching the entire FIR dataset for the map. Always query with a geographic bounding box matching the current viewport. Implement debouncing on the map move event — don't call the API on every pixel of pan.

### Cytoscape.js at Scale
Cytoscape's default canvas renderer struggles above ~300 nodes. For the criminal network graph, if the dataset grows large, switch to the WebGL renderer (`cytoscape-gl`) or implement a "neighbourhood only" view that shows max 2 hops from any selected node rather than the full graph.

### Dashboard Caching
The dashboard endpoints aggregate across the entire database. These should be fast because Catalyst Cache is supposed to handle this — but verify. If the overview endpoint takes more than 2 seconds, that's a signal the Cron job isn't populating the cache and the dashboard is computing live. Surface a "Last updated: [timestamp]" label on the dashboard so users know when the data is from.

---

## 14. Visual Design Direction

Lumina is a professional intelligence platform for a law enforcement agency. The visual language should communicate authority, clarity, and data density — not consumer friendliness or playfulness.

**Tone:** Dark, serious, high-contrast. Think command centre, not SaaS startup.

**Recommended palette:**
- Background: near-black (`#0D1117`) for analytics screens
- Surface/card: dark navy (`#161B22`)
- Primary accent: electric blue (`#1F6FEB`) — communicates authority and information
- Alert / high-risk: amber (`#F0883E`) → red (`#DA3633`)
- Safe / closed: green (`#2EA043`)
- Text: `#E6EDF3` primary, `#8B949E` secondary

**Typography:** A clean sans-serif for data (Inter or IBM Plex Sans — both work well in data-dense tables). A slightly more characterful display face for headings only.

**The operational (officer-facing) screens** should switch to a lighter, higher-contrast mode — white background, darker text. Officers using the platform in a brightly lit station office need better legibility than the dark analytics theme provides.

**The one distinctive design element Lumina should own:** a thin horizontal "pulse line" at the top of each analytics screen that subtly animates — representing live data being monitored. This communicates that the platform is active and watching, which is exactly the positioning ("proactive policing"). Keep it subtle — 2px, slow pulse, single colour. Not a loading bar.

---

## 15. Things the Backend Needs to Know You Need (Raise These Early)

Based on the UI requirements above, these are gaps in the current API that will block specific frontend features. Communicate them to the backend team now rather than discovering them when you're building:

| Frontend need | Current gap | Priority |
|---|---|---|
| Accused name search | Only exact-match / list exists, no text search | High — needed for "existing accused" lookup in FIR flow |
| Cases per accused count | Individual accused has `cases[]` but no count; requires N+1 calls for list view | Medium |
| FIR list with station name | List returns `Station_ID`, not name — requires secondary calls for display | Medium |
| Crime rate (FIRs per 100k) | Population is on District but not joined in district-summary | Low — computable client-side |
| Historical risk score trend | `/api/risk-scores` has no date range filter | Low — needed for risk score board trend line |
| Stale case filter | "No update in X days" — no such field or filter exists | Medium — needed for SHO view |
| Hotspot endpoint | ST-DBSCAN output not yet exposed | High for Phase 4 map |

---

## 16. Demo Script Alignment (Hackathon Specific)

The judging criteria explicitly weight Platform Integration, AI/Analytics Quality, Operational Usability, and Innovation. Map each to a specific frontend moment in the demo:

| Criterion | Demo moment |
|---|---|
| Platform Integration | Show the Catalyst Auth login screen; mention every service name as you use the feature it powers |
| Operational Usability | Walk through filing a complete FIR end-to-end — it should take under 90 seconds |
| AI/Analytics Quality | Show the Risk Score Board + trigger the AI Query Assistant with a pre-loaded demo question |
| Innovation | Open the Criminal Network Graph — it should have a visually rich, populated graph with the stub data |
| Data Handling | Show the District Intelligence choropleth map with colour gradients across Karnataka |

Design the UI so that switching between these five demo moments takes no more than 2 clicks each time. The last thing you want during a demo is hunting through a sidebar.
