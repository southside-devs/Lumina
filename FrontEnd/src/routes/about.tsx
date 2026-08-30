import { createFileRoute } from "@tanstack/react-router";
import { LuminaLogo } from "@/components/lumina/LuminaLogo";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";

const title = "LUMINA — About";
const description =
  "Lumina is a modern security and risk management platform providing clear visibility into infrastructure, risks, network relationships, and access management.";

export const Route = createFileRoute("/about")({
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
  component: AboutPage,
});

const CAPABILITIES = [
  {
    icon: "grid_view",
    label: "Command Hub",
    desc: "Live GIS crime map with real-time FIR plotting across 209 Karnataka police stations.",
  },
  {
    icon: "assessment",
    label: "Risk Analytics",
    desc: "Zia AutoML-powered forecasts, district risk leaderboards, and resolution rate tracking.",
  },
  {
    icon: "hub",
    label: "Network Topology",
    desc: "Neo4j graph engine for criminal network mapping, suspect link isolation, and entity relational analysis.",
  },
  {
    icon: "folder_open",
    label: "FIR Registry",
    desc: "Structured incident registry with full search, status tracking, and report generation.",
  },
  {
    icon: "auto_awesome",
    label: "AI Copilot",
    desc: "Conversational intelligence assistant for pattern analysis, hotspot queries, and briefing generation.",
  },
  {
    icon: "assignment",
    label: "SmartBrowz Reports",
    desc: "One-click PDF briefing export for strategic intelligence dissemination.",
  },
];

const STACK = [
  { label: "Developed By", value: "Southside Devs" },
  { label: "Deployment Partner", value: "Karnataka State Police" },
  { label: "Data Engine", value: "Zoho Catalyst Serverless + AppSail" },
  { label: "Graph DB", value: "Neo4j (ST-DBSCAN spatial clustering)" },
  { label: "ML Forecasting", value: "Zia AutoML" },
  { label: "Version", value: "2.0.0-dev" },
  { label: "Build", value: "2026" },
];

function AboutPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-4xl space-y-10">

            {/* Hero */}
            <section className="flex flex-col items-start gap-4">
              <div className="flex items-center gap-3 ui-no-select">
                <LuminaLogo className="h-5 w-auto text-foreground" />
                <span className="inline-flex items-center rounded-full border border-signal-brand/30 bg-signal-brand/10 px-3 py-0.5 font-mono text-[10px] font-semibold text-signal-brand">
                  v2.0.0-dev
                </span>
              </div>

              <h1 className="font-display text-headline-lg tracking-tight ui-no-select">
                Strategic Intelligence Platform
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Lumina is a modern security and risk management platform designed to provide clear
                visibility into infrastructure, risks, network relationships, notifications, and
                access management — all from a unified operational dashboard.
              </p>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Built for Karnataka State Police, Lumina consolidates real-time FIR data, predictive
                crime analytics, and criminal network intelligence into a single command surface —
                enabling faster decisions, better resource allocation, and proactive threat response.
              </p>
            </section>

            {/* Capabilities grid */}
            <section>
              <div className="mb-4 flex items-center gap-2 ui-no-select">
                <span className="size-1.5 rounded-full bg-signal-brand" />
                <span className="font-mono text-label-sm uppercase tracking-[0.14em] text-muted-foreground/70">
                  Capabilities
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-3">
                {CAPABILITIES.map((cap) => (
                  <div
                    key={cap.label}
                    className="glass-panel flex flex-col gap-3 p-5 transition-colors hover:border-hairline/60"
                  >
                    <div className="flex items-center gap-3 ui-no-select">
                      <div className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface-2">
                        <span className="material-symbols-outlined text-base text-muted-foreground">
                          {cap.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{cap.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{cap.desc}</p>
                  </div>
                ))}
              </div>
            </section>

            {/* Technical info */}
            <section className="glass-panel p-6">
              <div className="mb-4 flex items-center gap-2 ui-no-select">
                <span className="size-1.5 rounded-full bg-signal-brand" />
                <span className="font-mono text-label-sm uppercase tracking-[0.14em] text-muted-foreground/70">
                  System Information
                </span>
              </div>
              <dl className="space-y-3">
                {STACK.map((item) => (
                  <div
                    key={item.label}
                    className="flex items-center justify-between border-b border-hairline pb-3 last:border-0 last:pb-0"
                  >
                    <dt className="font-mono text-label-sm text-muted-foreground ui-no-select">
                      {item.label}
                    </dt>
                    <dd className="font-mono text-label-sm font-semibold text-foreground">
                      {item.value}
                    </dd>
                  </div>
                ))}
              </dl>
            </section>

            {/* Purpose statement */}
            <section className="rounded-2xl border border-signal-brand/20 bg-signal-brand/5 px-6 py-5">
              <p className="text-sm leading-relaxed text-muted-foreground">
                <span className="font-semibold text-foreground">Purpose — </span>
                Lumina exists to make law enforcement intelligence accessible, actionable, and fast.
                By unifying disparate data streams into a coherent visual interface, it reduces the
                cognitive load on officers and analysts, enabling them to focus on what matters most:
                protecting communities.
              </p>
            </section>

            {/* Engineering & Attribution */}
            <section className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-hairline bg-surface-1 px-5 py-3.5 text-xs font-mono text-muted-foreground">
              <span>
                Engineered & Developed by <strong className="text-foreground">Southside Devs</strong>
              </span>
              <span className="text-signal-ok">Official Deployment · Karnataka State Police</span>
            </section>

            <div className="h-4" />
          </div>
        </main>
      </div>
    </div>
  );
}
