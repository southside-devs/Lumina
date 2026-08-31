import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { toast } from "sonner";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";

const title = "LUMINA — Help & Documentation";
const description =
  "Find guides, references, and support resources to effectively use the Lumina intelligence platform.";

export const Route = createFileRoute("/help")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: HelpPage,
});

export interface DocCardItem {
  id: string;
  title: string;
  shortDescription: string;
  icon: string;
  tags: string[];
  targetRoute: string;
  content: {
    summary?: string;
    steps?: string[];
    operators?: Record<string, string>;
    sampleSearch?: string;
    engine?: string;
    modelInputs?: string;
    outputSchema?: Record<string, string>;
    databaseEngine?: string;
    nodeTypes?: string[];
    relationshipTypes?: string[];
    queryLanguage?: { name: string; query: string };
    supportUnit?: string;
    email?: string;
    emergencyHelpline?: string;
    operatingHours?: string;
    clearanceLevels?: Array<{ level: string; desc: string }>;
    dataCompliance?: string;
  };
}

export const DOC_CARDS: DocCardItem[] = [
  {
    id: "doc-001",
    title: "Quick Start Guide",
    shortDescription: "Learn the basics of navigating the Tactical Command Hub and interpreting GIS threat data.",
    icon: "quick_reference_all",
    tags: ["Onboarding", "Navigation", "Risk Assessment", "Basics"],
    targetRoute: "/docs/quick-start",
    content: {
      summary: "Overview of core dashboard navigation, node metrics, ST-DBSCAN clusters, and real-time incident streams.",
      steps: [
        "Log in using authorized multi-factor credentials.",
        "Check live system metrics across 209 Karnataka Police Stations.",
        "Use the global search modal (Cmd + K / Ctrl + K) to query FIR numbers, suspects, or IPC sections.",
        "Interact with ST-DBSCAN hotspot pins and click to open real-time case dossiers.",
      ],
    },
  },
  {
    id: "doc-002",
    title: "FIR Search & Filter Syntax",
    shortDescription: "Advanced search operators for finding specific incident reports and criminal records.",
    icon: "manage_search",
    tags: ["FIR", "Querying", "Search Operators", "Filters"],
    targetRoute: "/docs/search-syntax",
    content: {
      summary: "Comprehensive query syntax supported across the Karnataka State Police FIR master registry.",
      operators: {
        EXACT_MATCH: '"BNS Section 103" OR "IPC Section 302"',
        WILDCARD: "theft_* OR assault_*",
        BOOLEAN: "district:Belagavi AND status:PENDING",
        RANGE: "date:[2026-01-01 TO 2026-08-30]",
        STATION: 'station:"Cubbon Park" OR station:"Vidhana Soudha"',
      },
      sampleSearch: 'type:"Cybercrime" AND status:"Open" AND district:"Bengaluru"',
    },
  },
  {
    id: "doc-003",
    title: "Predictive Risk Analytics",
    shortDescription: "How Zia AutoML predictive analytics models generate district risk scores and forecasts.",
    icon: "timeline",
    tags: ["AI", "Zia AutoML", "Predictive Analytics", "Risk Scores"],
    targetRoute: "/docs/forecasts",
    content: {
      engine: "Zia AutoML Engine v2.4 (Time-Series & Spatial Regression)",
      modelInputs:
        "Historical 5,005 FIR crime density, spatio-temporal clustering, repeat offender nodes, seasonal patterns.",
      outputSchema: {
        riskScore: "0.0 - 100.0 (Normalized Composite Threat Score)",
        confidenceInterval: "95% Upper / Lower Bound",
        threatCategory: '["Low (0-40)", "Moderate (41-70)", "High (71-89)", "Critical (90-100)"]',
      },
    },
  },
  {
    id: "doc-004",
    title: "Syndicate Network Analysis",
    shortDescription: "Using the Neo4j topology graph to identify criminal syndicates and isolated hubs.",
    icon: "hub",
    tags: ["Neo4j", "Graph Database", "Topology", "Syndicate Mapping"],
    targetRoute: "/docs/network-analysis",
    content: {
      databaseEngine: "Neo4j v5 Enterprise (Graph Relational Engine)",
      nodeTypes: ["Suspect", "FIR Incident", "Location / Station", "Vehicle", "Criminal Syndicate"],
      relationshipTypes: ["ACCOMPLICE_OF", "LINKED_TO_FIR", "OPERATES_IN", "MEMBER_OF", "COMMUNICATED_WITH"],
      queryLanguage: {
        name: "Cypher",
        query: "MATCH (s:Suspect)-[r:ACCOMPLICE_OF]->(syn:Syndicate {district: 'Bengaluru'}) RETURN s, r, syn LIMIT 50",
      },
    },
  },
  {
    id: "doc-005",
    title: "ST-DBSCAN Spatial Hotspot Tuning",
    shortDescription: "How to tune epsilon spatial radius, temporal window, and min density points on the live map.",
    icon: "radar",
    tags: ["ST-DBSCAN", "Clustering", "Spatial GIS", "Algorithms"],
    targetRoute: "/docs/st-dbscan",
    content: {
      summary: "ST-DBSCAN (Spatio-Temporal Density-Based Spatial Clustering of Applications with Noise) clusters incidents across geographic distance and calendar days simultaneously.",
      operators: {
        EPS_SPATIAL: "Spatial distance threshold in kilometers (e.g. 1.5 km to 25.0 km)",
        EPS_TEMPORAL: "Temporal window in calendar days (e.g. 7 days to 90 days)",
        MIN_PTS: "Minimum incident threshold required to form a high-risk cluster (e.g. 3 to 15 FIRs)",
      },
      engine: "Fast In-Memory LRU Cached Python ML Engine with 0ms pre-computed clusters",
    },
  },
  {
    id: "doc-006",
    title: "AI Copilot & Intelligence RAG",
    shortDescription: "Querying the multi-lingual voice AI Copilot for case dossiers and station briefings.",
    icon: "auto_awesome",
    tags: ["AI", "Gemini", "Copilot", "RAG", "Speech"],
    targetRoute: "/docs/ai-copilot",
    content: {
      summary: "Multi-lingual conversational AI assistant powered by Google Gemini with live Catalyst database RAG integration.",
      steps: [
        "Ask queries in English or Kannada (e.g., 'What are the top crime hotspots in Belagavi?').",
        "Lookup specific FIR case dossiers (e.g., 'Summarize FIR 1693/2026').",
        "Request officer shift briefings and patrol deployment recommendations.",
        "Listen to natural voice speech synthesis in real-time.",
      ],
    },
  },
  {
    id: "doc-007",
    title: "SmartBrowz PDF Dossier Export",
    shortDescription: "Automated executive intelligence dossier compilation and PDF export.",
    icon: "picture_as_pdf",
    tags: ["Reports", "PDF", "SmartBrowz", "Export"],
    targetRoute: "/docs/pdf-reports",
    content: {
      summary: "One-click generation of professional law enforcement intelligence reports formatted for command review.",
      steps: [
        "Navigate to Overview or FIR Explorer.",
        "Click 'Export Briefing' or 'Generate PDF Report'.",
        "Zoho SmartBrowz compiles real-time telemetry, threat charts, and case details into an executive PDF.",
        "Download or distribute directly to field officers.",
      ],
    },
  },
  {
    id: "doc-008",
    title: "Contact Support & Emergency Dispatch",
    shortDescription: "Get technical assistance from the KSP IT Command Center.",
    icon: "contact_support",
    tags: ["Support", "Helpdesk", "KSP IT", "Ticketing"],
    targetRoute: "/support/contact",
    content: {
      supportUnit: "KSP IT Command Center (Bengaluru)",
      email: "support@ksp.gov.in",
      emergencyHelpline: "112 / Command Extension: 8080",
      operatingHours: "24/7 Command Room Support",
    },
  },
  {
    id: "doc-009",
    title: "Security Clearance & Data Policies",
    shortDescription: "Documentation on data classification, clearance levels, and compliance.",
    icon: "security",
    tags: ["Security", "Role-Based Access", "Clearance", "Compliance"],
    targetRoute: "/docs/access-policies",
    content: {
      clearanceLevels: [
        {
          level: "Level 1 - Station Operator",
          desc: "Read-only access to localized incident feeds and FIR registries.",
        },
        {
          level: "Level 2 - Inspector / Investigator",
          desc: "Full case file access, suspect network graph analysis, and AI Copilot queries.",
        },
        {
          level: "Level 3 - Command Admin",
          desc: "Global model overrides, ST-DBSCAN parameter tuning, and audit log inspection.",
        },
      ],
      dataCompliance: "ISO 27001 Certified, Encrypted at Rest (AES-256) & Transit (TLS 1.3).",
    },
  },
];

const ALL_TAGS = [
  "All",
  "Onboarding",
  "Navigation",
  "Risk Assessment",
  "FIR",
  "Search Operators",
  "AI",
  "Zia AutoML",
  "Neo4j",
  "Topology",
  "ST-DBSCAN",
  "Copilot",
  "Reports",
  "PDF",
  "Support",
  "Security",
];

function HelpPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedTag, setSelectedTag] = useState("All");
  const [activeDoc, setActiveDoc] = useState<DocCardItem | null>(null);

  const filteredCards = useMemo(() => {
    return DOC_CARDS.filter((card) => {
      const matchTag =
        selectedTag === "All" || card.tags.some((t) => t.toLowerCase() === selectedTag.toLowerCase());
      const q = searchQuery.toLowerCase().trim();
      const matchSearch =
        !q ||
        card.title.toLowerCase().includes(q) ||
        card.shortDescription.toLowerCase().includes(q) ||
        card.tags.some((t) => t.toLowerCase().includes(q));
      return matchTag && matchSearch;
    });
  }, [selectedTag, searchQuery]);

  const copyToClipboard = (text: string, label: string) => {
    navigator.clipboard?.writeText?.(text);
    toast.success("Copied to Clipboard", { description: `${label} copied.` });
  };

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-5xl space-y-8">
            {/* Header */}
            <section className="flex flex-col items-start gap-3">
              <div className="flex items-center gap-2 ui-no-select">
                <span className="size-2 rounded-full bg-[#3B82F6] shadow-[0_0_8px_#3B82F6]" />
                <span className="font-mono text-label-sm font-bold uppercase tracking-[0.16em] text-[#3B82F6]">
                  TOPICS
                </span>
              </div>

              <h1 className="font-display text-3xl sm:text-4xl font-extrabold tracking-tight text-white ui-no-select">
                Help &amp; Documentation
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-zinc-400">
                Find guides, references, and support resources to effectively use the Lumina platform.
              </p>

              {/* Search Bar */}
              <div className="mt-2 relative flex w-full max-w-xl items-center">
                <span className="material-symbols-outlined absolute left-3.5 text-[18px] text-zinc-400">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search articles, syntax operators, models, compliance..."
                  className="w-full rounded-xl border border-white/10 bg-[#0a0c12]/80 py-2.5 pr-4 pl-11 text-sm text-white placeholder:text-zinc-500 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_16px_rgba(0,0,0,0.3)] backdrop-blur-md transition-all focus:border-[#3B82F6]/50 focus:bg-black focus:outline-none focus:ring-1 focus:ring-[#3B82F6]/50"
                />
                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="absolute right-3 text-xs text-zinc-500 hover:text-zinc-300"
                  >
                    Clear
                  </button>
                )}
              </div>

              {/* Tag Filters */}
              <div className="flex flex-wrap items-center gap-1.5 pt-1">
                {ALL_TAGS.map((tag) => (
                  <button
                    key={tag}
                    type="button"
                    onClick={() => setSelectedTag(tag)}
                    className={`rounded-full px-3 py-1 font-mono text-[11px] font-semibold transition-all duration-150 cursor-pointer ${
                      selectedTag === tag
                        ? "border border-[#3B82F6]/40 bg-[#3B82F6]/15 text-[#3B82F6] shadow-[0_0_12px_rgba(59,130,246,0.3)]"
                        : "border border-white/10 bg-white/[0.03] text-zinc-400 hover:border-white/20 hover:bg-white/[0.08] hover:text-zinc-200"
                    }`}
                  >
                    {tag}
                  </button>
                ))}
              </div>
            </section>

            {/* Documentation Cards Grid */}
            <section className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="font-mono text-xs text-zinc-400">
                  Showing {filteredCards.length} of {DOC_CARDS.length} Guides
                </span>
              </div>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-3">
                {filteredCards.map((card) => (
                  <div
                    key={card.id}
                    onClick={() => setActiveDoc(card)}
                    className="group relative flex flex-col justify-between rounded-2xl border border-white/[0.08] bg-[#0b0d14]/80 p-5 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_8px_24px_rgba(0,0,0,0.35)] backdrop-blur-xl transition-all duration-200 hover:border-[#3B82F6]/40 hover:bg-[#111420]/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_12px_32px_rgba(0,0,0,0.5)] active:scale-[0.985] cursor-pointer"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#3B82F6] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.4)] transition-colors group-hover:border-[#3B82F6]/30 group-hover:bg-[#3B82F6]/10">
                          <span className="material-symbols-outlined text-xl">{card.icon}</span>
                        </div>
                        <span className="font-mono text-[10px] text-zinc-500 uppercase tracking-wider">
                          {card.id}
                        </span>
                      </div>

                      <div>
                        <h3 className="text-[15px] font-bold text-white group-hover:text-[#3B82F6] transition-colors">
                          {card.title}
                        </h3>
                        <p className="mt-1 text-xs leading-relaxed text-zinc-400">
                          {card.shortDescription}
                        </p>
                      </div>
                    </div>

                    <div className="mt-4 pt-3 border-t border-white/[0.06] flex flex-wrap items-center gap-1.5">
                      {card.tags.slice(0, 3).map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md border border-white/10 bg-white/[0.03] px-2 py-0.5 font-mono text-[10px] text-zinc-400"
                        >
                          {tag}
                        </span>
                      ))}
                      {card.tags.length > 3 && (
                        <span className="font-mono text-[10px] text-zinc-500">
                          +{card.tags.length - 3}
                        </span>
                      )}
                    </div>
                  </div>
                ))}
              </div>
            </section>

            {/* Help Desk Callout */}
            <section className="rounded-2xl border border-white/10 bg-[#090b12]/90 p-6 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_12px_36px_rgba(0,0,0,0.5)] backdrop-blur-xl">
              <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-bold text-white text-base">Need immediate assistance?</h3>
                  <p className="text-xs text-zinc-400 mt-0.5">
                    Our KSP Command Support team is available 24/7 for critical incidents &amp; system
                    access.
                  </p>
                </div>
                <button
                  type="button"
                  onClick={() =>
                    toast.info("Command Support Channel", {
                      description: "Contact support@ksp.gov.in or direct dial ext #8080.",
                    })
                  }
                  className="inline-flex items-center justify-center gap-2 rounded-full border border-blue-500/30 bg-[#007AFF] px-5 py-2.5 text-xs font-bold text-white shadow-[0_0_16px_rgba(0,122,255,0.4),inset_0_1px_0_rgba(255,255,255,0.3)] transition-all hover:bg-[#0066d6] active:scale-95 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-base">support_agent</span>
                  Open Support Ticket
                </button>
              </div>
            </section>

            <div className="h-4" />
          </div>
        </main>
      </div>

      {/* Interactive Detail Modal / Sheet */}
      {activeDoc && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 p-4 backdrop-blur-md animate-in fade-in-0 duration-200">
          <div
            role="dialog"
            aria-label={activeDoc.title}
            className="relative flex w-full max-w-2xl max-h-[85vh] flex-col overflow-hidden rounded-[1.5rem] border border-white/15 bg-[#08090f]/95 p-6 shadow-[0_30px_90px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-3xl"
          >
            {/* Modal Header */}
            <div className="flex items-start justify-between border-b border-white/10 pb-4">
              <div className="flex items-center gap-3">
                <div className="flex size-10 items-center justify-center rounded-xl border border-white/10 bg-white/[0.04] text-[#3B82F6]">
                  <span className="material-symbols-outlined text-xl">{activeDoc.icon}</span>
                </div>
                <div>
                  <h2 className="text-lg font-bold text-white">{activeDoc.title}</h2>
                  <p className="text-xs text-zinc-400 font-mono">{activeDoc.id} · {activeDoc.targetRoute}</p>
                </div>
              </div>

              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="flex size-8 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 transition-all hover:bg-white/10 hover:text-white"
              >
                <span className="material-symbols-outlined text-base">close</span>
              </button>
            </div>

            {/* Modal Body */}
            <div className="custom-scrollbar min-h-0 flex-1 space-y-5 overflow-y-auto py-5 pr-1">
              <p className="text-sm leading-relaxed text-zinc-300 font-medium">
                {activeDoc.shortDescription}
              </p>

              {/* Quick Start Guide Steps */}
              {activeDoc.content.steps && (
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-[#3B82F6]">
                    Execution Sequence
                  </h4>
                  <div className="space-y-2 rounded-xl border border-white/10 bg-[#0c0e16] p-4">
                    {activeDoc.content.steps.map((step, idx) => (
                      <div key={idx} className="flex items-start gap-3 text-xs text-zinc-300">
                        <span className="flex size-5 shrink-0 items-center justify-center rounded-full bg-blue-500/20 font-mono text-[10px] font-bold text-blue-400">
                          {idx + 1}
                        </span>
                        <span className="leading-relaxed">{step}</span>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* FIR Search Operators */}
              {activeDoc.content.operators && (
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-[#3B82F6]">
                    Supported Query Operators
                  </h4>
                  <div className="space-y-2 rounded-xl border border-white/10 bg-[#0c0e16] p-3.5">
                    {Object.entries(activeDoc.content.operators).map(([key, val]) => (
                      <div
                        key={key}
                        className="flex flex-col sm:flex-row sm:items-center justify-between gap-1 border-b border-white/[0.04] pb-2 last:border-0 last:pb-0"
                      >
                        <span className="font-mono text-[11px] font-bold text-zinc-400">{key}</span>
                        <code className="rounded bg-black/60 px-2 py-0.5 font-mono text-[11px] text-emerald-400 border border-white/5">
                          {val}
                        </code>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Sample Search String */}
              {activeDoc.content.sampleSearch && (
                <div className="space-y-1.5">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-zinc-400">
                    Sample Search Query
                  </h4>
                  <div className="flex items-center justify-between rounded-xl border border-white/10 bg-black/60 p-3">
                    <code className="font-mono text-xs text-sky-300">
                      {activeDoc.content.sampleSearch}
                    </code>
                    <button
                      type="button"
                      onClick={() =>
                        copyToClipboard(activeDoc.content.sampleSearch!, "Sample Search String")
                      }
                      className="rounded border border-white/10 bg-white/5 px-2.5 py-1 font-mono text-[10px] text-zinc-300 hover:bg-white/10"
                    >
                      Copy
                    </button>
                  </div>
                </div>
              )}

              {/* Forecasts Model Info */}
              {activeDoc.content.engine && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-[#0c0e16] p-4 text-xs">
                  <div>
                    <span className="font-mono text-zinc-400 uppercase">Engine: </span>
                    <span className="font-bold text-white">{activeDoc.content.engine}</span>
                  </div>
                  <div>
                    <span className="font-mono text-zinc-400 uppercase">Model Inputs: </span>
                    <span className="text-zinc-300">{activeDoc.content.modelInputs}</span>
                  </div>
                  {activeDoc.content.outputSchema && (
                    <div className="pt-2 border-t border-white/[0.06] space-y-1">
                      <span className="font-mono text-[#3B82F6] uppercase font-bold">
                        Output Schema
                      </span>
                      {Object.entries(activeDoc.content.outputSchema).map(([k, v]) => (
                        <div key={k} className="flex items-center justify-between">
                          <span className="font-mono text-zinc-400">{k}</span>
                          <span className="font-mono text-emerald-400 font-semibold">{v}</span>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )}

              {/* Network Analysis Info */}
              {activeDoc.content.databaseEngine && (
                <div className="space-y-3 rounded-xl border border-white/10 bg-[#0c0e16] p-4 text-xs">
                  <div>
                    <span className="font-mono text-zinc-400 uppercase">Database Engine: </span>
                    <span className="font-bold text-white">{activeDoc.content.databaseEngine}</span>
                  </div>
                  <div>
                    <span className="font-mono text-zinc-400 uppercase">Node Types: </span>
                    <span className="text-zinc-300">
                      {activeDoc.content.nodeTypes?.join(", ")}
                    </span>
                  </div>
                  <div>
                    <span className="font-mono text-zinc-400 uppercase">Relationships: </span>
                    <span className="text-zinc-300">
                      {activeDoc.content.relationshipTypes?.join(", ")}
                    </span>
                  </div>
                  {activeDoc.content.queryLanguage && (
                    <div className="pt-2 border-t border-white/[0.06]">
                      <div className="flex items-center justify-between mb-1">
                        <span className="font-mono text-[#3B82F6] font-bold">
                          {activeDoc.content.queryLanguage.name} Query
                        </span>
                        <button
                          type="button"
                          onClick={() =>
                            copyToClipboard(
                              activeDoc.content.queryLanguage!.query,
                              "Cypher Query",
                            )
                          }
                          className="rounded border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-300 hover:bg-white/10"
                        >
                          Copy Query
                        </button>
                      </div>
                      <code className="block rounded bg-black/60 p-2.5 font-mono text-[11px] text-amber-300 border border-white/5 overflow-x-auto">
                        {activeDoc.content.queryLanguage.query}
                      </code>
                    </div>
                  )}
                </div>
              )}

              {/* Support Unit Contacts */}
              {activeDoc.content.supportUnit && (
                <div className="space-y-2 rounded-xl border border-white/10 bg-[#0c0e16] p-4 text-xs">
                  <div className="flex justify-between">
                    <span className="font-mono text-zinc-400">Support Unit</span>
                    <span className="font-bold text-white">{activeDoc.content.supportUnit}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-zinc-400">Official Email</span>
                    <span className="font-bold text-[#3B82F6]">{activeDoc.content.email}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-zinc-400">Emergency Helpline</span>
                    <span className="font-bold text-emerald-400">
                      {activeDoc.content.emergencyHelpline}
                    </span>
                  </div>
                  <div className="flex justify-between">
                    <span className="font-mono text-zinc-400">Operating Hours</span>
                    <span className="font-bold text-zinc-300">
                      {activeDoc.content.operatingHours}
                    </span>
                  </div>
                </div>
              )}

              {/* Access Clearance Levels */}
              {activeDoc.content.clearanceLevels && (
                <div className="space-y-2">
                  <h4 className="font-mono text-xs uppercase tracking-wider text-[#3B82F6]">
                    Clearance Hierarchy
                  </h4>
                  <div className="space-y-2">
                    {activeDoc.content.clearanceLevels.map((lvl) => (
                      <div
                        key={lvl.level}
                        className="rounded-xl border border-white/10 bg-[#0c0e16] p-3 text-xs"
                      >
                        <span className="font-bold text-white block">{lvl.level}</span>
                        <span className="text-zinc-400 mt-0.5 block">{lvl.desc}</span>
                      </div>
                    ))}
                  </div>
                  {activeDoc.content.dataCompliance && (
                    <div className="mt-3 rounded-xl border border-emerald-500/20 bg-emerald-500/5 p-3 text-xs font-mono text-emerald-300">
                      Compliance: {activeDoc.content.dataCompliance}
                    </div>
                  )}
                </div>
              )}
            </div>

            {/* Modal Footer */}
            <div className="flex items-center justify-between border-t border-white/10 pt-4">
              <div className="flex flex-wrap items-center gap-1.5">
                {activeDoc.tags.map((tag) => (
                  <span
                    key={tag}
                    className="rounded-md border border-white/10 bg-white/5 px-2 py-0.5 font-mono text-[10px] text-zinc-400"
                  >
                    {tag}
                  </span>
                ))}
              </div>
              <button
                type="button"
                onClick={() => setActiveDoc(null)}
                className="rounded-full bg-white px-4 py-1.5 text-xs font-bold text-black hover:bg-zinc-200 transition-colors"
              >
                Done
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
