import { createFileRoute } from "@tanstack/react-router";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";

const title = "LUMINA — Help & Documentation";
const description =
  "Access documentation, user guides, and support resources for the Lumina intelligence platform.";

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

const DOC_SECTIONS = [
  {
    icon: "quick_reference_all",
    label: "Quick Start Guide",
    desc: "Learn the basics of navigating the Command Hub and interpreting risk data.",
  },
  {
    icon: "manage_search",
    label: "FIR Search Syntax",
    desc: "Advanced search operators for finding specific incident reports.",
  },
  {
    icon: "timeline",
    label: "Understanding Forecasts",
    desc: "How Zia AutoML predictive analytics models generate risk scores.",
  },
  {
    icon: "group_work",
    label: "Network Analysis",
    desc: "Using the Neo4j topology graph to identify criminal syndicates.",
  },
  {
    icon: "contact_support",
    label: "Contact Support",
    desc: "Get technical assistance from the KSP IT Command Center.",
  },
  {
    icon: "security",
    label: "Access Policies",
    desc: "Documentation on data classification, clearance levels, and compliance.",
  },
];

function HelpPage() {
  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto px-6 py-8">
          <div className="mx-auto max-w-4xl space-y-10">

            {/* Header */}
            <section className="flex flex-col items-start gap-4">
              <h1 className="font-display text-headline-lg tracking-tight ui-no-select">
                Help &amp; Documentation
              </h1>

              <p className="max-w-2xl text-sm leading-relaxed text-muted-foreground">
                Find guides, references, and support resources to effectively use the Lumina platform.
              </p>
            </section>

            {/* Documentation Topics */}
            <section>
              <div className="mb-4 flex items-center gap-2 ui-no-select">
                <span className="size-1.5 rounded-full bg-signal-brand" />
                <span className="font-mono text-label-sm uppercase tracking-[0.14em] text-muted-foreground/70">
                  Topics
                </span>
              </div>
              <div className="grid grid-cols-1 gap-3 sm:grid-cols-2">
                {DOC_SECTIONS.map((doc) => (
                  <button
                    key={doc.label}
                    type="button"
                    className="glass-panel flex flex-col gap-3 p-5 text-left transition-colors hover:border-hairline/60 hover:bg-surface-1/50"
                  >
                    <div className="flex items-center gap-3 ui-no-select">
                      <div className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface-2 text-primary">
                        <span className="material-symbols-outlined text-base">
                          {doc.icon}
                        </span>
                      </div>
                      <span className="text-sm font-semibold text-foreground">{doc.label}</span>
                    </div>
                    <p className="text-xs leading-relaxed text-muted-foreground">{doc.desc}</p>
                  </button>
                ))}
              </div>
            </section>

            {/* Help Desk Callout */}
            <section className="rounded-2xl border border-hairline bg-surface-1 px-6 py-5">
              <div className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
                <div>
                  <h3 className="font-semibold text-foreground">Need immediate assistance?</h3>
                  <p className="text-sm text-muted-foreground">
                    Our technical support team is available 24/7 for critical system issues.
                  </p>
                </div>
                <button
                  type="button"
                  className="mt-3 inline-flex items-center justify-center gap-2 rounded-lg bg-primary px-4 py-2 text-sm font-medium text-primary-foreground shadow-sm transition-colors hover:bg-primary/90 sm:mt-0"
                >
                  <span className="material-symbols-outlined text-sm">support_agent</span>
                  Open Support Ticket
                </button>
              </div>
            </section>

            <div className="h-4" />
          </div>
        </main>
      </div>
    </div>
  );
}
