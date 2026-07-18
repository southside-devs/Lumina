# Backend Info Request — Frontend Integration
**Project:** Crime Intelligence & Analytical Platform (KSP) | **Platform:** Zoho Catalyst
**Requested by:** Frontend Team | **For:** Phase 3 (Basic Frontend) build

---

Hey team — I'm starting on the frontend (login, Add FIR form, case list/search, later maps + dashboards). To build against the real API instead of guessing, I need the following from whoever owns the backend/data layer. Answer inline or point me to docs/Postman collection if this already exists.

---

## 1. Environment & Access
- [ ] Base URL(s) for the Catalyst API Gateway — dev / staging / prod
- [ ] Is there a Postman collection or OpenAPI/Swagger spec I can import?
- [ ] Do I need an API key, project ID, or any Catalyst SDK config to call functions from a Next.js app?
- [ ] CORS — is the frontend origin (localhost + deployed domain) already whitelisted?

## 2. Authentication (Catalyst Authentication)
- [ ] What's the login flow — Catalyst-hosted login page, or a custom API I call from my own form?
- [ ] Token type (JWT/session) and where do I attach it (header name, `Bearer` format)?
- [ ] Token expiry + refresh flow — do I need a refresh endpoint, or does Catalyst SDK handle it?
- [ ] What are the defined roles (Officer, SHO, SCRB Analyst, Admin)? Is role returned in the token/user profile, or do I need a separate "get my permissions" call?
- [ ] Logout endpoint/behavior?

## 3. Core API Endpoints (Phase 2 functions)
For each of these, I need: **method, path, request body shape, response shape, and possible error codes.**
- [ ] Create FIR
- [ ] Get FIR by ID
- [ ] List/Search FIRs (filters? pagination? sort options?)
- [ ] Update Case Status
- [ ] Add Accused (linked to a case)
- [ ] Add Victim (linked to a case)
- [ ] Add Complainant
- [ ] File Chargesheet
- [ ] Add Arrest/Surrender event
- [ ] Any endpoint for Act/Section association on a case

## 4. Data Models / Schema Reference
I've got the ER diagram, so I know the tables (CaseMaster, Victim, Accused, Employee, District, Unit, Rank, Designation, CaseCategory, GravityOffence, ChargesheetDetails, ArrestSurrender, Court, Act, Section, etc.), but I need the **API-facing shape**, which may differ from raw DB columns:
- [ ] Exact field names, types, and required-vs-optional for each request/response payload (esp. `CaseMaster`, `Victim`, `Accused`, `Employee`)
- [ ] Enum/lookup values I need for dropdowns — CaseCategory, GravityOffence, CaseStatusMaster, UnitType, Rank, Designation, ReligionMaster, CasteMaster, OccupationMaster, Act, Section — are these served via API, or should I hardcode a seed list?
- [ ] Date/time format convention (ISO 8601?) and timezone handling
- [ ] How are foreign keys represented in responses — just the ID, or nested objects (e.g. does a Case response include full District/Unit objects or just `DistrictID`)?

## 5. Sensitive Data & Field-Level Access Control
Per the project doc, caste/religion/personal fields need strict access control.
- [ ] Which fields are role-restricted, and how is that enforced — does the API just omit them for unauthorized roles, or return a 403, or do I need to hide them client-side based on role?
- [ ] Is there a single "current user permissions" endpoint I should call on login to know what to show/hide?

## 6. Pagination, Filtering, Sorting
- [ ] Standard pagination pattern (page/limit? cursor-based?) for case list/search
- [ ] What filters are supported server-side (district, date range, category, status, officer)?
- [ ] Is search full-text (e.g. FIR number, complainant name) or exact-match only?

## 7. Error Handling
- [ ] Standard error response shape (e.g. `{ "error": { "code": ..., "message": ... } }`)
- [ ] List of expected error codes (validation failure, auth failure, not found, etc.)
- [ ] Any field-level validation rules I should mirror in the frontend form (required fields, max lengths, regex patterns for FIR number/KGID/etc.)

## 8. File Uploads (Catalyst Stratus)
- [ ] Endpoint/pattern for uploading scanned FIR copies, photos, PDFs
- [ ] Direct upload to Stratus with a signed URL, or does it go through a Catalyst Function?
- [ ] Accepted file types/size limits
- [ ] How do I retrieve/display an uploaded file later (public URL vs. authenticated fetch)?

## 9. Location / Map Data (for Phase 4, good to know early)
- [ ] Is lat/long captured per-case (via `Inv_OccuranceTime` or similar) and available in the case response?
- [ ] Any existing endpoint for aggregated hotspot data (counts by district/date), or will that be built later in Phase 4/6?

## 10. Real-time / Alerts (Signals) — Phase 5, informational for now
- [ ] Will alerts be pushed to the frontend (WebSocket/Catalyst Signals subscription), or should I just poll a "notifications" endpoint?

## 11. Dev Workflow
- [ ] How do I get seed/dummy data locally so I'm not building UI against an empty DB?
- [ ] Any staging environment already live I can point the frontend at, or do I need to run Catalyst locally?
- [ ] Who's my point of contact for API questions/blockers, and what's the fastest channel (Slack/GitHub issue/etc.)?

---

### Nice-to-have (not blocking, but helpful)
- API versioning strategy (in case endpoints change mid-project)
- Rate limits I should be aware of when building list views with auto-refresh
- Any Catalyst-specific SDK snippets for calling Functions from a Next.js frontend (vs. plain REST fetch)

---

*Once I have sections 1–4, I can start on the login page and Add FIR form. Sections 5–8 I'll need before those forms are feature-complete. Sections 9–11 are for planning ahead into Phase 4.*
