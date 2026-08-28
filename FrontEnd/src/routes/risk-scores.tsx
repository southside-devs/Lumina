import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TabBar } from "@/components/lumina/TabBar";
import { api, type DistrictSummary, type DashboardOverview } from "@/lib/api";

const title = "LUMINA — Risk Scores & Predictive Analytics";
const description =
  "Real-time threat assessment and historical vulnerability mapping: crime trend forecasts, peak hours, district risk leaderboard and case resolution rates.";

export const Route = createFileRoute("/risk-scores")({
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
  component: RiskScores,
});

function SectionLabel({ children }: { children: string }) {
  return (
    <div className="flex items-center gap-2 font-mono text-label-sm uppercase tracking-[0.14em] text-muted-foreground/70">
      <span className="size-1.5 rounded-full bg-signal-brand" />
      {children}
    </div>
  );
}

function PanelHead({ title: t }: { title: string }) {
  return (
    <div className="mb-4 flex items-center gap-2">
      <h2 className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 font-display text-headline-md">
        {t}
        <span className="material-symbols-outlined text-base text-muted-foreground">
          more_horiz
        </span>
      </h2>
    </div>
  );
}

const DEFAULT_LEADERBOARD = [
  { name: "Bengaluru Urban", score: 88 },
  { name: "Mysuru", score: 72 },
  { name: "Mangaluru", score: 65 },
  { name: "Belagavi", score: 58 },
  { name: "Hubballi-Dharwad", score: 45 },
];

function RiskScores() {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [distData, ovData] = await Promise.all([
          api.getDistrictSummary(),
          api.getDashboardOverview(),
        ]);
        if (mounted) {
          setDistricts(distData);
          setOverview(ovData);
        }
      } catch (e) {
        console.warn("Failed to load risk data:", e);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Compute dynamic leaderboard
  const leaderboard = districts.length > 0
    ? districts.slice(0, 5).map((d) => ({
        name: d.district_name,
        score: Math.min(Math.round((d.total_firs / (districts[0]?.total_firs || 1)) * 90) + 10, 98),
      }))
    : DEFAULT_LEADERBOARD;

  // Compute resolution rate
  const totalCases = overview?.total_firs || 1245;
  const underInvest = overview?.status_breakdown?.["Under Investigation"] || 520;
  const chargesheeted = overview?.status_breakdown?.["Chargesheeted"] || 340;
  const closed = totalCases - underInvest - chargesheeted;

  const resolution = [
    { label: "Under Investigation", pct: Math.round((underInvest / totalCases) * 100), fill: "bg-muted-foreground/30" },
    { label: "Chargesheeted", pct: Math.round((chargesheeted / totalCases) * 100), fill: "bg-muted-foreground/60" },
    { label: "Closed / Resolved", pct: Math.max(100 - Math.round((underInvest / totalCases) * 100) - Math.round((chargesheeted / totalCases) * 100), 10), fill: "bg-foreground/90" },
  ];

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto p-4 pt-6">
          <TabBar />

          <div className="mx-auto max-w-7xl space-y-6">
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-headline-lg tracking-tight">
                  Risk Scores &amp; Predictive Analytics
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Real-time threat assessment and historical vulnerability mapping powered by Zia AutoML.
                </p>
              </div>
              <div className="flex gap-2">
                {[
                  { icon: "calendar_today", label: "Next 14 Days" },
                  { icon: "filter_list", label: "Filter Forecast" },
                ].map((b) => (
                  <button
                    key={b.label}
                    type="button"
                    className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-2 font-mono text-label-md text-muted-foreground transition-colors hover:text-foreground"
                  >
                    <span className="material-symbols-outlined text-base">{b.icon}</span>
                    {b.label}
                  </button>
                ))}
              </div>
            </header>

            <SectionLabel>Temporal &amp; Predictive</SectionLabel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section className="glass-panel p-6 lg:col-span-2">
                <div className="mb-4 flex items-center justify-between">
                  <PanelHead title="Crime Trend vs. AutoML" />
                  <div className="flex gap-4 font-mono text-label-sm text-muted-foreground">
                    <span className="flex items-center gap-1.5">
                      <span className="h-px w-4 bg-muted-foreground" /> Historical
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-px w-4 border-t border-dashed border-muted-foreground" />{" "}
                      Forecast (AutoML)
                    </span>
                  </div>
                </div>
                <svg viewBox="0 0 400 120" className="h-40 w-full" role="img" aria-label="Crime trend versus AutoML forecast">
                  <path
                    d="M0 100 C40 98 60 92 90 88 C120 84 140 70 170 66 C200 62 220 60 250 52 C270 47 285 42 300 38"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-muted-foreground"
                  />
                  <path
                    d="M300 38 C320 34 335 30 355 26 C370 23 385 14 400 10"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    strokeDasharray="4 4"
                    className="text-foreground"
                  />
                  <circle cx="300" cy="38" r="3" className="fill-shell stroke-foreground" strokeWidth="1.5" />
                  <circle cx="400" cy="10" r="3" className="fill-foreground animate-pulse" />
                </svg>
              </section>

              <section className="glass-panel p-6">
                <PanelHead title="Peak Incident Hours" />
                <svg viewBox="0 0 200 90" className="h-32 w-full" role="img" aria-label="Incidents by hour of day">
                  <path
                    d="M0 60 C15 55 25 40 40 45 C55 50 60 75 75 72 C90 69 100 30 125 22 C150 14 165 30 180 45 C190 55 195 60 200 62 L200 90 L0 90 Z"
                    className="fill-foreground/10"
                  />
                  <path
                    d="M0 60 C15 55 25 40 40 45 C55 50 60 75 75 72 C90 69 100 30 125 22 C150 14 165 30 180 45 C190 55 195 60 200 62"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="1.5"
                    className="text-foreground"
                  />
                </svg>
                <div className="mt-2 flex justify-between font-mono text-label-sm text-muted-foreground">
                  <span>00:00</span>
                  <span className="font-bold text-foreground">22:00 - 02:00</span>
                  <span>12:00</span>
                  <span>24:00</span>
                </div>
              </section>
            </div>

            <SectionLabel>Distribution &amp; Categorical</SectionLabel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              <section className="glass-panel p-6 lg:col-span-2">
                <PanelHead title="District Risk Leaderboard" />
                <ul className="mt-6 space-y-5">
                  {leaderboard.map((d) => (
                    <li key={d.name} className="flex items-center">
                      <span className="w-28 pr-4 text-right font-mono text-label-md text-muted-foreground sm:w-40 truncate" title={d.name}>
                        {d.name}
                      </span>
                      <div className="h-2.5 flex-1 overflow-hidden rounded-sm bg-surface-1">
                        <div
                          className="h-full rounded-sm bg-foreground/80 transition-all duration-700"
                          style={{ width: `${d.score}%` }}
                        />
                      </div>
                      <span className="w-12 text-right font-mono text-label-md font-bold">
                        {d.score}
                      </span>
                    </li>
                  ))}
                </ul>
              </section>

              <section className="glass-panel p-6">
                <PanelHead title="Resolution Rate" />
                <div className="flex h-7 w-full overflow-hidden rounded-sm">
                  {resolution.map((r) => (
                    <div key={r.label} className={r.fill} style={{ width: `${r.pct}%` }} />
                  ))}
                </div>
                <ul className="mt-4 space-y-2">
                  {resolution.map((r) => (
                    <li
                      key={r.label}
                      className="flex items-center justify-between font-mono text-label-sm"
                    >
                      <span className="flex items-center gap-2 text-muted-foreground">
                        <span className={`size-1.5 rounded-full ${r.fill}`} />
                        {r.label}
                      </span>
                      <span className="font-bold text-foreground">{r.pct}%</span>
                    </li>
                  ))}
                </ul>
              </section>
            </div>

            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  );
}
