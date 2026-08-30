# 🎙️ LUMINA — Complete Hackathon & Evaluator Demo Script
### *AI-Driven Crime Intelligence & Analytical Platform (CIAP)*
**Karnataka State Police (KSP) × Hack2Skill Datathon 2026**

---

## ⏱️ Demo Overview & Timing (Total: ~5 to 7 Minutes)

| Section | Phase | Duration | Focus Area |
| :--- | :--- | :--- | :--- |
| **01** | **The Hook & Problem Statement** | 45 sec | Fragmented records $\rightarrow$ Actionable Real-Time Intelligence |
| **02** | **Tactical Command Center & Hotspot GIS** | 90 sec | Interactive Map, ST-DBSCAN Clustering, Patrol Dispatch |
| **03** | **Global Search Intelligence & Voice Briefings** | 90 sec | Instant FIR Search, Pinned Dossiers, Bilingual Neural TTS |
| **04** | **Strategic Analytics & Risk Scoreboard** | 60 sec | Repeat Offender Matrix, Crime Distribution, District KPIs |
| **05** | **Criminal Network Topology** | 45 sec | Multi-Accused Syndicates, Hub Isolation, Graph Topology |
| **06** | **AI Copilot & Bilingual Voice Assistant** | 60 sec | Gemini 2.5 Flash RAG, Kannada/English Toggle, Ground Truth |
| **07** | **Official Strategic PDF Briefing & Config** | 45 sec | KSP Sealed Executive Dossier, System Settings, Wrap-up |

---

## 🎬 Step-by-Step Demonstration Walkthrough

### Phase 1: The Hook & Introduction (0:00 - 0:45)
**Visual**: Show the Lumina Command Hub with dark tactical glassmorphic UI loaded.

* **Speaker Script**:
  > *"Respected judges and senior officers: Today, law enforcement faces a critical bottleneck. Across 31 districts and 209 police stations in Karnataka, thousands of FIRs and suspect records are stored in siloed tabular formats. When an incident occurs, identifying repeat offenders, active crime corridors, or multi-jurisdiction syndicates takes hours of manual dossier searches.*
  >
  > *Introducing **LUMINA** — an AI-powered Crime Intelligence and Spatiotemporal Analytics Platform built natively for the Karnataka State Police on Zoho Catalyst. Lumina transforms raw case records into sub-second predictive intelligence, visual graph topology, and automated tactical patrol dispatch."*

---

### Phase 2: Tactical Command Center & Hotspot GIS (0:45 - 2:15)
**Visual**: Open the **Command Hub (`/`)**. Hover over hotspot clusters on the map and click a precinct.

* **Actions**:
  1. Pan across the Karnataka state map displaying 5,005 FIR points and active precinct boundaries.
  2. Point out the **Live Spatiotemporal Hotspot Corridor** (ST-DBSCAN clustering).
  3. Click a cluster (e.g., *Bengaluru Urban / Indiranagar Corridor*) to expand the **Automated Tactical Patrol Dispatch** recommendation card.
  4. Toggle the cartographic base layer (Esri Dark Canvas $\leftrightarrow$ Tactical Midnight $\leftrightarrow$ Satellite).

* **Speaker Script**:
  > *"On the primary Command Hub, Lumina runs real-time ST-DBSCAN spatiotemporal clustering across every active FIR. Rather than static heatmaps, our algorithm groups incidents by geographic radius and temporal density.*
  >
  > *Notice this critical cluster in the Indiranagar–MG Road corridor: with a single click, Lumina calculates the threat score (94/100), isolates the predominant crime group (Cybercrime & Extortion), and generates an automated tactical patrol route — recommending **Patrol Alpha-4** with an estimated response time of 6 minutes.*
  >
  > *Officers can toggle instantly between Esri Dark night operations, tactical midnight, and high-resolution satellite imagery."*

---

### Phase 3: Global Search Intelligence & Bilingual Neural Audio (2:15 - 3:45)
**Visual**: Press `Cmd/Ctrl + K` or click the search bar to trigger the **Search Intelligence Center**.

* **Actions**:
  1. Open the search modal. Show the **📌 Pinned Priority Dossiers** section.
  2. Type a query: `"1693"` or `"Cybercrime"` or `"Ramesh"`. Notice instant sub-50ms keystroke filtering across 5,005 cases.
  3. Click the **⭐ Pin** button on a critical FIR to demonstrate persistent watchlist caching.
  4. Click the **🎙️ Audio Intelligence Briefing** button. Listen to the calibrated neural voice narration.
  5. Toggle language from **EN** to **ಕನ್ನಡ (KN)** and play the briefing in Kannada.

* **Speaker Script**:
  > *"Pressing `Ctrl + K` launches our Universal Search Intelligence modal. Lumina searches across case numbers, accused aliases, victim profiles, IPC sections, and narrative text.*
  >
  > *Let's look up FIR `#1693/2026`. Immediately, the full intelligence brief loads: primary accused, threat level, and station jurisdiction. Watch as I click 'Play Audio Briefing' — our integrated Google Neural TTS synthesizes a real-time spoken debriefing for officers on patrol.*
  >
  > *With one toggle, Lumina translates and vocalizes the briefing in pure Kannada, guaranteeing full regional accessibility for field personnel."*

---

### Phase 4: Strategic Analytics & Risk Scoreboard (3:45 - 4:45)
**Visual**: Navigate to the **Overview (`/overview`)** and **Risk Scores (`/risk-scores`)** tabs.

* **Actions**:
  1. Click **Overview** in the sidebar. Show the sliding glass rail animation.
  2. Walk through the live KPIs: **5,005 Total FIRs**, **456 Repeat Offenders**, **209 Police Stations**, **31 Districts**.
  3. Switch between **Overview** and **Risk Scores** using the centered sliding glass tab bar.
  4. Point out the Repeat Offender Flagging Index with risk scores $\ge 85$.

* **Speaker Script**:
  > *"Switching to the Overview tab, Lumina provides state-level supervisory situational awareness. We track live status breakdowns — cases under investigation, chargesheeted, and closed.*
  >
  > *Under the Risk Scoreboard, our predictive weighting algorithm analyzes criminal history, repeat arrest counts, and violent crime severity to compute a dynamic 0–100 threat score. Any offender exceeding our supervisory threshold is automatically flagged for surveillance."*

---

### Phase 5: Criminal Network Topology (4:45 - 5:30)
**Visual**: Click **Network Topology (`/network`)** in the sidebar.

* **Actions**:
  1. Load the interactive Cytoscape graph showing accused-to-case relationships.
  2. Click an accused node (e.g., a central repeat offender) to highlight all connected co-conspirators and cases.
  3. Highlight isolated crime rings vs. syndicate hubs.

* **Speaker Script**:
  > *"Organized crime rarely operates in isolation. In the Network Topology module, Lumina visualizes multi-accused syndicates. Red nodes represent high-threat offenders, while blue nodes represent specific FIRs.*
  >
  > *By clicking any suspect, officers instantly uncover shared accomplices across different police stations that would remain hidden in standard tabular files."*

---

### Phase 6: AI Copilot & Ground-Truth RAG Assistant (5:30 - 6:30)
**Visual**: Open the **AI Chatbot (`/ai-chatbot`)**.

* **Actions**:
  1. Ask a question: `"Identify repeat offenders involved in cyber fraud across Bengaluru Urban."`
  2. Show that the answer cites exact FIR numbers and station names directly from the live database.
  3. Toggle Kannada mode and ask: `"ಬೆಂಗಳೂರು ನಗರದ ಪ್ರಮುಖ ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ತೋರಿಸಿ"` (Show top crime hotspots in Bengaluru Urban).
  4. Show that the response adheres strictly to Kannada script and police terminology without hallucinations.

* **Speaker Script**:
  > *"Lumina features a dedicated AI Copilot backed by Gemini 2.5 Flash with strict RAG ground-truth injection. When an officer queries the copilot, it queries the live database first and injects factual context into the system prompt.*
  >
  > *It never hallucinates fake FIRs. In Kannada mode, it enforces Karnataka Police terminology, providing seamless bilingual intelligence."*

---

### Phase 7: Official Briefing PDF Export & System Config (6:30 - 7:15)
**Visual**: Return to `/overview` and click **[ 📄 Export Briefing ]**, then open **⚙️ System Config**.

* **Actions**:
  1. Click **Export Briefing** $\rightarrow$ download the generated KSP Executive Intelligence Report PDF.
  2. Open the PDF: show the official Karnataka State Police seal, generated date/time, live metric summaries, and officer sign-off block.
  3. Open **⚙️ System Config** on the sidebar: show the 5 discrete voice speeds (*Ultra Slow*, *Slow*, *Normal 1.18x*, *Fast*, *Ultra Fast*) and test audio.

* **Speaker Script**:
  > *"Finally, supervisory officers can click 'Export Briefing' on the overview page to instantly compile an official, sealed Karnataka State Police Intelligence Dossier ready for morning briefings.*
  >
  > *In the System Configuration drawer, officers can tune ST-DBSCAN cluster radii, alert chimes, map layers, and calibrate neural speech playback from Ultra Slow to Ultra Fast.*
  >
  > *Lumina is 100% deployed on Zoho Catalyst serverless infrastructure, scalable, secure, and ready for production deployment across Karnataka State Police. Thank you!"*

---

## 💡 Evaluator FAQ & Quick Answers

| Question | Answer |
| :--- | :--- |
| **How does it handle offline/field environments?** | Lumina features full local caching with encrypted state fallback, resilient in-memory query capability, and offline audio synthesis. |
| **How do you prevent AI hallucinations?** | The backend RAG pipeline extracts FIR references, executes database queries first, and injects the live rows as immutable ground truth into the system prompt. |
| **What is the backend compute architecture?** | Zoho Catalyst Advanced I/O Python Serverless functions with sub-second execution, zero server maintenance, and automated nightly cron ETL synchronization. |
