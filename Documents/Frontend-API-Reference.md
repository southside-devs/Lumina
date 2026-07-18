# Lumina — Frontend API Reference
**Project:** Crime Intelligence & Analytical Platform (KSP) | **Platform:** Zoho Catalyst  
**Answered by:** Backend (derived from source code) | **For:** Phase 3 Frontend Build  
**Last Updated:** 2026-07-18

---

## 1. Environment & Access

### Base URL
All API routes are served through the Catalyst Advanced I/O function named **`api_service`**.

```
# Pattern
https://<project-id>.catalystapps.com/baas/v1/project/<project-id>/function/api_service/api/<resource>

# Health Check (use this to verify connectivity)
GET /api/health
```
> **Action needed:** Replace `<project-id>` with the actual Catalyst project ID. Check `catalyst.json` in the project root.

### Catalyst Config
The function is of type `advancedio`, stack `python`, entry point `main.py`, timeout `30,000 ms`.

### Authentication / SDK
- Catalyst uses **session-based authentication** managed by the Catalyst SDK.
- From a Next.js frontend, use the `@zohocatalyst/catalyst-js-sdk` or make plain `fetch` calls with the session cookie that Catalyst sets after login.
- No separate API key is needed for same-origin / same-project calls.

### CORS
> **Action needed:** Confirm with the team whether `localhost:3000` and the deployed frontend domain are whitelisted in the Catalyst console under **Security → CORS**.

---

## 2. Authentication

> **Note:** Authentication is handled entirely by the **Catalyst Auth module**, not by a custom API endpoint. The `api_service` function does not expose login/logout routes.

### Login Flow
1. Redirect the user to the Catalyst-hosted login page **or** use the Catalyst JS SDK `signIn()` method.
2. On success, Catalyst sets a **session cookie** automatically.
3. All subsequent API calls from the browser will carry this cookie — no manual token attachment needed.

### Token / Session
- Catalyst uses a **server-side session** (cookie-based), not a JWT you manage.
- No `Authorization: Bearer` header is required for browser calls.
- For server-side Next.js calls (SSR/RSC), forward the session cookie from the incoming request.

### Roles
> **Action needed:** Role-based access (Officer, SHO, SCRB Analyst, Admin) is **not yet implemented** in the current API code. All authenticated users currently have equal access. Plan client-side role hiding now; server-side enforcement is a future sprint.

### Logout
Use the Catalyst JS SDK `signOut()` method or redirect to the Catalyst-hosted logout URL.

---

## 3. Core API Endpoints

All endpoints follow this URL pattern:
```
/api/<resource>[/<id>][/<action>]
```

### Standard Response Envelopes

**Success:**
```json
{
  "status": "success",
  "message": "...",
  "data": { ... }
}
```

**Paginated Success:**
```json
{
  "status": "success",
  "message": "Success",
  "data": [ ... ],
  "meta": {
    "total": 120,
    "limit": 50,
    "offset": 0,
    "has_more": true
  }
}
```

**Error:**
```json
{
  "status": "error",
  "message": "Human-readable error",
  "details": ["'FIR_Number' is required", "'Date' must be in YYYY-MM-DD format"]
}
```

---

### 3.1 Districts

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/districts` | List all districts (paginated) |
| `GET` | `/api/districts/<id>` | Get district by ID |
| `POST` | `/api/districts` | Create a district |

**Query params for list:** `limit` (default 50), `offset` (default 0)

**POST body:**
```json
{
  "Name": "Bengaluru Urban",
  "Code": "BLR",
  "Population": 12000000,
  "Latitude": 12.9716,
  "Longitude": 77.5946
}
```

Required: `Name`, `Code`, `Population`. Optional: `Latitude`, `Longitude`.

---

### 3.2 Police Stations

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/stations` | List stations (paginated, filterable) |
| `GET` | `/api/stations/<id>` | Get station by ID |
| `POST` | `/api/stations` | Create a station |

**Query params for list:** `limit` (default 100), `offset` (default 0), `district_id` (optional integer filter)

**POST body:**
```json
{
  "District_ID": 1,
  "Name": "Koramangala PS",
  "Jurisdiction_Area": "Ward 68",
  "Latitude": 12.9352,
  "Longitude": 77.6245
}
```

Required: `District_ID`, `Name`. Optional: `Jurisdiction_Area`, `Latitude`, `Longitude`.

> **Tip:** Call `GET /api/stations?district_id=<id>` after district selection to populate station dropdown.

---

### 3.3 FIRs

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/firs` | List FIRs (paginated, filterable) |
| `GET` | `/api/firs/<id>` | Get FIR by ID (includes victims + accused) |
| `GET` | `/api/firs/search` | Advanced search with multiple filters |
| `POST` | `/api/firs` | Create a new FIR |
| `PUT` | `/api/firs/<id>` | Update an FIR |

**Query params for list (`GET /api/firs`):**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Items per page (default 50) |
| `offset` | int | Pagination offset (default 0) |
| `station_id` | int | Filter by station |
| `crime_group` | string | Filter by crime group |
| `status` | string | Filter by status |

**Query params for search (`GET /api/firs/search`):**

| Param | Type | Description |
|-------|------|-------------|
| `limit` | int | Default 50 |
| `offset` | int | Default 0 |
| `crime_group` | string | Exact match |
| `date_from` | string | YYYY-MM-DD, inclusive |
| `date_to` | string | YYYY-MM-DD, inclusive |
| `station_id` | int | Filter by station |
| `lat_min`, `lat_max`, `lon_min`, `lon_max` | float | Geospatial bounding box |

**POST body (Create FIR):**
```json
{
  "Station_ID": 3,
  "FIR_Number": "CR-001/2026",
  "Date": "2026-07-18",
  "Crime_Group": "Theft",
  "Latitude": 12.9716,
  "Longitude": 77.5946,
  "Crime_Subgroup": "Shoplifting",
  "Narrative": "Incident description...",
  "Status": "Under Investigation"
}
```

Required: `Station_ID`, `FIR_Number`, `Date`, `Crime_Group`, `Latitude`, `Longitude`.  
Optional: `Crime_Subgroup`, `Narrative`, `Status` (defaults to `"Under Investigation"`).

**GET `/api/firs/<id>` response `data`** (enriched):
```json
{
  "ROWID": 42,
  "Station_ID": 3,
  "FIR_Number": "CR-001/2026",
  "Date": "2026-07-18",
  "Crime_Group": "Theft",
  "Crime_Subgroup": "Shoplifting",
  "Latitude": 12.9716,
  "Longitude": 77.5946,
  "Narrative": "...",
  "Status": "Under Investigation",
  "victims": [
    { "ROWID": 1, "FIR_ID": 42, "Name": "John Doe", "Gender": "Male", "DOB": "1990-01-01", "Socioeconomic_Status": "Middle" }
  ],
  "accused": [...]
}
```

**PUT body (Update FIR)** — only send fields to update:
```json
{ "Status": "Chargesheeted", "Narrative": "Updated narrative..." }
```

Updatable: `Station_ID`, `FIR_Number`, `Date`, `Crime_Group`, `Crime_Subgroup`, `Latitude`, `Longitude`, `Narrative`, `Status`.

---

### 3.4 Accused

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/accused` | List accused (paginated) |
| `GET` | `/api/accused/<id>` | Get accused by ID (includes case history) |
| `POST` | `/api/accused` | Create an accused profile |
| `PUT` | `/api/accused/<id>` | Update accused details |

**Query params for list:** `limit` (default 50), `offset` (default 0), `repeat_offenders=true` (filter `Arrest_Count >= 2`)

**POST body:**
```json
{
  "Name": "Jane Smith",
  "DOB": "1985-06-15",
  "Gender": "Female",
  "Occupation": "Unknown",
  "Arrest_Count": 0
}
```

Required: `Name`. Optional: `DOB`, `Gender`, `Occupation`, `Arrest_Count` (defaults 0).

**GET `/api/accused/<id>` response `data`:**
```json
{
  "ROWID": 5,
  "Name": "Jane Smith",
  "DOB": "1985-06-15",
  "Gender": "Female",
  "Occupation": "Unknown",
  "Arrest_Count": 2,
  "cases": [
    { "ROWID": 10, "FIR_ID": 42, "Accused_ID": 5, "Involvement_Type": "Primary" }
  ]
}
```

---

### 3.5 Victims

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/victims` | List victims (paginated) |
| `GET` | `/api/victims/<id>` | Get victim by ID |
| `POST` | `/api/victims` | Create a victim record |

**Query params for list:** `limit` (default 50), `offset` (default 0), `fir_id` (optional filter)

**POST body:**
```json
{
  "FIR_ID": 42,
  "Name": "John Doe",
  "DOB": "1990-01-01",
  "Gender": "Male",
  "Socioeconomic_Status": "Middle"
}
```

Required: `FIR_ID`, `Name`. Optional: `DOB`, `Gender`, `Socioeconomic_Status`.

---

### 3.6 Case-Accused Links

Links an accused person to a FIR.

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/case-accused` | List links (filterable) |
| `GET` | `/api/case-accused/<id>` | Get link by ID |
| `POST` | `/api/case-accused` | Create FIR-Accused link |
| `DELETE` | `/api/case-accused/<id>` | Remove a link |

**Query params for list:** `limit`, `offset`, `fir_id`, `accused_id`

**POST body:**
```json
{
  "FIR_ID": 42,
  "Accused_ID": 5,
  "Involvement_Type": "Primary"
}
```

Required: `FIR_ID`, `Accused_ID`. Optional: `Involvement_Type` (default `"Primary"`).

> **Typical workflow:** `POST /api/accused` → get `accused_id` → `POST /api/case-accused` to link.

---

### 3.7 Risk Scores

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/risk-scores` | List risk scores (filterable) |
| `GET` | `/api/risk-scores/<id>` | Get risk score by ID |
| `POST` | `/api/risk-scores` | Create a risk score entry |

**Query params for list:** `limit` (default 100), `offset`, `district_id`, `crime_type`

**POST body:**
```json
{
  "District_ID": 1,
  "Crime_Type": "Theft",
  "Score": 72.5,
  "Forecast_Date": "2026-08-01"
}
```

All fields required.

---

### 3.8 Dashboard (Analytics — GET only)

| Method | Path | Description |
|--------|------|-------------|
| `GET` | `/api/dashboard/overview` | Platform-wide KPI statistics |
| `GET` | `/api/dashboard/crime-trends` | Crime counts by group |
| `GET` | `/api/dashboard/district-summary` | Per-district FIR breakdown |

**`/api/dashboard/overview` response `data`:**
```json
{
  "total_firs": 4200,
  "total_accused": 1800,
  "total_victims": 3100,
  "total_stations": 240,
  "total_districts": 31,
  "repeat_offenders": 320,
  "status_breakdown": {
    "Under Investigation": 2100,
    "Chargesheeted": 1400,
    "Closed": 700
  }
}
```

**`/api/dashboard/crime-trends`** (optional `crime_group` query param):
```json
[
  { "group": "Theft", "count": 1200 },
  { "group": "Assault", "count": 800 }
]
```

**`/api/dashboard/district-summary`:**
```json
[
  { "district_id": 1, "district_name": "Bengaluru Urban", "population": 12000000, "total_firs": 1400 }
]
```

---

## 4. Enum / Dropdown Values

These are hardcoded in the backend validators — **embed them as frontend constants, no lookup API exists.**

### Crime Groups (`Crime_Group`, `Crime_Type`)
```
Murder | Attempt to Murder | Robbery | Dacoity | Theft |
Burglary | Kidnapping & Abduction | Assault | Rioting |
Cheating & Fraud | Criminal Breach of Trust | Counterfeiting |
Arson | Dowry Death | Cybercrime | Sexual Offences |
Narcotics (NDPS Act) | Arms Act Violations | SC/ST Atrocities |
Motor Vehicle Theft
```

### FIR Status
```
Under Investigation | Chargesheeted | Closed | Convicted | Acquitted
```

### Gender
```
Male | Female | Other
```

### Involvement Type
```
Primary | Accomplice | Abettor | Conspirator
```

### Socioeconomic Status
```
Lower | Lower-Middle | Middle | Upper-Middle | Upper
```

---

## 5. Sensitive Data & Field-Level Access

> **Current status:** Role-based field filtering is **not yet server-side enforced**. All fields are returned for all authenticated users. Implement client-side hiding of sensitive fields (DOB, Socioeconomic_Status, etc.) based on user role from Catalyst profile. Server-side enforcement is planned for a future sprint.

---

## 6. Pagination Pattern

All list endpoints use **offset-based pagination**.

| Param | Default | Description |
|-------|---------|-------------|
| `limit` | 50 (or 100) | Items per page |
| `offset` | 0 | Items to skip |

Response `meta`:
```json
{ "total": 500, "limit": 50, "offset": 100, "has_more": true }
```

**Next page:** `offset = offset + limit` while `has_more === true`.

---

## 7. Error Handling

### HTTP Status Codes

| Code | When |
|------|------|
| `200` | Success |
| `201` | Resource created |
| `400` | Bad request / validation failure |
| `404` | Resource not found |
| `405` | Method not allowed |
| `500` | Internal server error |

### Field Validation Rules (mirror in frontend forms)

| Field | Rule |
|-------|------|
| `FIR_Number` | Required, non-empty string |
| `Date`, `DOB`, `Forecast_Date` | YYYY-MM-DD format |
| `Latitude` | Float, 11.5 – 18.5 (Karnataka) |
| `Longitude` | Float, 74.0 – 78.5 (Karnataka) |
| `Crime_Group` / `Crime_Type` | Must be one of 20 valid values |
| `Status` | Must be one of 5 valid values |
| `Gender` | Male, Female, or Other |
| `Involvement_Type` | One of 4 valid values |
| `Socioeconomic_Status` | One of 5 valid values |
| `Arrest_Count`, `Population`, IDs | Non-negative integer |
| `Score` | Float, 0.0 – 100.0 |

---

## 8. File Uploads

> **Not yet implemented.** When built, expect either a `/api/uploads` endpoint returning a Stratus signed URL, or direct Catalyst JS SDK `filestore` upload.

---

## 9. Location / Map Data

- **Lat/Lng stored per FIR** — required on every FIR creation.
- `GET /api/firs/search` supports **geographic bounding box** (`lat_min`, `lat_max`, `lon_min`, `lon_max`).
- District centroids also optionally stored on District records.
- `/api/dashboard/district-summary` provides total FIR count per district for choropleth maps.
- Fine-grained heatmaps: planned for Phase 4/6.
- **Karnataka center:** Lat `15.3173`, Lon `75.7139`.

---

## 10. Real-time / Alerts

> **Not yet implemented.** Plan for polling a notifications endpoint in Phase 5.

---

## 11. Dev Workflow

### Health Check
```
GET /api/health
→ { "status": "ok", "service": "Lumina API", "version": "1.0.0" }
```

### Calling from Next.js

**Client-side (cookie auto-sent):**
```javascript
const res = await fetch('/api/firs?limit=20&offset=0');
const json = await res.json();
// json.data = array, json.meta = pagination
```

**Server-side (forward cookie):**
```javascript
const res = await fetch(`${process.env.CATALYST_API_BASE}/api/firs`, {
  headers: { Cookie: req.headers.cookie },
});
```

---

## 12. Additional Frontend Developer Notes

### ID Convention (ROWID)
- All records use `ROWID` (integer) as the primary key in Zoho Catalyst DataStore.
- `POST` response: extract `data.ROWID` as the new record's ID.
- Pass this ID in URL paths: `/api/firs/42`.

### Foreign Key Representation
- Foreign keys are **IDs only** in list responses (no nested objects).
- Example: FIR has `"Station_ID": 3`, not a nested station object.
- **Exception:** `GET /api/firs/<id>` includes nested `victims[]` and `accused[]` arrays.
- Join data client-side or make additional calls for display names.

### Date/Time Convention
- Format: **`YYYY-MM-DD`** (ISO date, no time/timezone component).
- Use `<input type="date">` in forms — value is already `YYYY-MM-DD`.

### Multi-Step FIR Workflow

```
Step 1: POST /api/firs          → save fir_id = response.data.ROWID
Step 2: POST /api/accused       → save accused_id = response.data.ROWID
Step 3: POST /api/case-accused  → { FIR_ID: fir_id, Accused_ID: accused_id, Involvement_Type: "Primary" }
Step 4: POST /api/victims       → { FIR_ID: fir_id, Name: "...", ... }
```

### Error Handling Pattern
```javascript
const res = await fetch('/api/firs', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify(data),
});
const json = await res.json();

if (json.status === 'error') {
  showToast(json.message);
  // json.details is an array of field-level error strings
  json.details?.forEach(err => highlightField(err));
} else {
  const newId = json.data.ROWID;
}
```

### Resource Summary

| Route Prefix | DB Table | Key Features |
|---|---|---|
| `/api/districts` | `District` | Reference data for dropdowns |
| `/api/stations` | `Police_Station` | Filter by `district_id` |
| `/api/firs` | `FIR` | Core entity; search + geo bbox |
| `/api/accused` | `Accused` | Repeat offender filter |
| `/api/victims` | `Victim` | Filter by `fir_id` |
| `/api/case-accused` | `Case_Accused` | Junction table; supports DELETE |
| `/api/risk-scores` | `Risk_Score` | Analytics data |
| `/api/dashboard/overview` | Aggregated | KPI widgets |
| `/api/dashboard/crime-trends` | Aggregated | Bar/pie charts |
| `/api/dashboard/district-summary` | Aggregated | Map choropleth |

### Not Yet Implemented (plan accordingly)

| Feature | Status |
|---|---|
| Chargesheet endpoint | ❌ Pending |
| Arrest/Surrender event endpoint | ❌ Pending |
| Act/Section association endpoint | ❌ Pending |
| File upload (Catalyst Stratus) | ❌ Pending |
| Role-based field access control (server-side) | ❌ Pending |
| Real-time alerts / Signals | ❌ Pending |
| Lookup/seed-data API (caste, religion, occupation, rank, designation, court) | ❌ Pending |
| Employee/Officer management endpoints | ❌ Pending |
| FIR full-text search (name, FIR number) | ❌ Exact-match only currently |
