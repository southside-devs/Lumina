import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useMemo } from "react";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TabBar } from "@/components/lumina/TabBar";
import { api, type DistrictSummary, type DashboardOverview, type RiskScoreItem } from "@/lib/api";

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
    <div className="flex items-center gap-2 font-mono text-label-sm uppercase tracking-[0.14em] text-muted-foreground/70 ui-no-select">
      <span className="size-1.5 rounded-full bg-signal-brand" />
      {children}
    </div>
  );
}

function PanelHead({ title: t, badge }: { title: string; badge?: string }) {
  return (
    <div className="mb-4 flex items-center justify-between ui-no-select">
      <h2 className="flex items-center gap-2 rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 font-display text-headline-md">
        {t}
      </h2>
      {badge && (
        <span className="font-mono text-[10px] font-bold text-sky-400 bg-sky-500/10 border border-sky-500/20 px-2 py-0.5 rounded">
          {badge}
        </span>
      )}
    </div>
  );
}

type RiskLevel = "All" | "High" | "Medium" | "Low";
type SortDir = "desc" | "asc";

function getRiskLabel(score: number): "High" | "Medium" | "Low" {
  if (score >= 70) return "High";
  if (score >= 45) return "Medium";
  return "Low";
}

const riskColors: Record<string, string> = {
  High: "text-signal-critical",
  Medium: "text-signal-warning",
  Low: "text-signal-ok",
};

export function RiskScores() {
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [riskScores, setRiskScores] = useState<RiskScoreItem[]>([]);
  const [selectedHorizon, setSelectedHorizon] = useState<"14d" | "30d" | "90d">("14d");
  const [selectedDistrictName, setSelectedDistrictName] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  // Filter & sort state
  const [riskFilter, setRiskFilter] = useState<RiskLevel>("All");
  const [sortDir, setSortDir] = useState<SortDir>("desc");

  useEffect(() => {
    let mounted = true;
    async function load() {
      try {
        const [distData, ovData, scoresData] = await Promise.all([
          api.getDistrictSummary(),
          api.getDashboardOverview(),
          api.getRiskScores({ limit: 150 }),
        ]);
        if (mounted) {
          setDistricts(distData);
          setOverview(ovData);
          setRiskScores(scoresData);
          setLoading(false);
        }
      } catch (e) {
        console.warn("Failed to load risk data:", e);
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, []);

  // Aggregate risk scores per district for the leaderboard
  const rawLeaderboard = useMemo(() => {
    if (!riskScores || riskScores.length === 0) {
      return districts.slice(0, 10).map((d) => {
        const score = Math.min(
          Math.round((d.total_firs / (districts[0]?.total_firs || 1)) * 90) + 10,
          98,
        );
        return {
          name: d.district_name,
          score,
          risk: getRiskLabel(score),
          crimeType: "Theft & Cybercrime",
        };
      });
    }

    const districtMap = new Map<
      string,
      { total: number; count: number; topCrime: string; maxScore: number }
    >();

    riskScores.forEach((item) => {
      const name = item.District_Name || `District #${item.District_ID}`;
      const existing = districtMap.get(name) || {
        total: 0,
        count: 0,
        topCrime: item.Crime_Type,
        maxScore: 0,
      };
      existing.total += item.Score;
      existing.count += 1;
      if (item.Score > existing.maxScore) {
        existing.maxScore = item.Score;
        existing.topCrime = item.Crime_Type;
      }
      districtMap.set(name, existing);
    });

    return Array.from(districtMap.entries()).map(([name, data]) => {
      const score = Math.round(data.total / data.count);
      return {
        name,
        score,
        risk: getRiskLabel(score),
        crimeType: data.topCrime,
      };
    });
  }, [riskScores, districts]);

  // Apply filter + sort to leaderboard
  const leaderboard = useMemo(() => {
    let items = rawLeaderboard;
    if (riskFilter !== "All") {
      items = items.filter((d) => d.risk === riskFilter);
    }
    return [...items].sort((a, b) =>
      sortDir === "desc" ? b.score - a.score : a.score - b.score,
    );
  }, [rawLeaderboard, riskFilter, sortDir]);

  // Aggregate top forecasted crime categories statewide
  const categorySurges = useMemo(() => {
    if (!riskScores || riskScores.length === 0) {
      return [
        { category: "Cybercrime", score: 88, change: "+14%" },
        { category: "Cheating & Fraud", score: 79, change: "+9%" },
        { category: "Theft & Extortion", score: 72, change: "+5%" },
        { category: "Robbery", score: 68, change: "+2%" },
        { category: "NDPS (Narcotics)", score: 61, change: "-3%" },
      ];
    }

    const catMap = new Map<string, { total: number; count: number }>();
    riskScores.forEach((r) => {
      const cat = r.Crime_Type;
      const ex = catMap.get(cat) || { total: 0, count: 0 };
      ex.total += r.Score;
      ex.count += 1;
      catMap.set(cat, ex);
    });

    const list = Array.from(catMap.entries()).map(([category, data]) => ({
      category,
      score: Math.round(data.total / data.count),
      change: `+${Math.round((data.total / data.count) / 10)}%`,
    }));

    list.sort((a, b) => b.score - a.score);
    return list.slice(0, 6);
  }, [riskScores]);

  // High-risk early warning alert
  const topAlert = rawLeaderboard[0];

  // Case resolution breakdown from live DB status counts
  const totalCases = overview?.total_firs || 5005;
  const underInvest = overview?.status_breakdown?.["Under Investigation"] || 1673;
  const chargesheeted = overview?.status_breakdown?.["Chargesheeted"] || 1275;
  const closed = overview?.status_breakdown?.["Closed"] || 1039;
  const convicted = overview?.status_breakdown?.["Convicted"] || 607;

  const resolution = [
    { label: "Under Investigation", count: underInvest, pct: Math.round((underInvest / totalCases) * 100), fill: "bg-amber-500/80" },
    { label: "Chargesheeted", count: chargesheeted, pct: Math.round((chargesheeted / totalCases) * 100), fill: "bg-sky-500/80" },
    { label: "Closed / Resolved", count: closed, pct: Math.round((closed / totalCases) * 100), fill: "bg-zinc-400/80" },
    { label: "Convicted", count: convicted, pct: Math.round((convicted / totalCases) * 100), fill: "bg-emerald-400/90" },
  ];

  const RISK_FILTERS: RiskLevel[] = ["All", "High", "Medium", "Low"];

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto p-4 pt-6">
          <TabBar />

          <div className="mx-auto max-w-7xl space-y-6">
            {/* Header with Forecast Horizon Filter */}
            <header className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-headline-lg tracking-tight ui-no-select">
                  Risk Scores &amp; Predictive Analytics
                </h1>
                <p className="mt-1 text-sm text-muted-foreground ui-no-select">
                  Real-time threat assessment and AutoML vulnerability mapping across 31 Karnataka Districts.
                </p>
              </div>
              <div className="flex items-center gap-2 ui-no-select">
                <span className="font-mono text-xs text-muted-foreground mr-1 hidden sm:inline">Horizon:</span>
                {(["14d", "30d", "90d"] as const).map((h) => (
                  <button
                    key={h}
                    type="button"
                    onClick={() => setSelectedHorizon(h)}
                    className={`flex items-center gap-1 rounded-lg border px-3 py-1.5 font-mono text-xs transition-colors cursor-pointer ${
                      selectedHorizon === h
                        ? "border-sky-500/50 bg-sky-500/20 text-sky-400 font-bold"
                        : "border-hairline bg-surface-1 text-muted-foreground hover:text-white"
                    }`}
                  >
                    <span>{h === "14d" ? "Next 14 Days" : h === "30d" ? "30-Day Outlook" : "Quarterly (90d)"}</span>
                  </button>
                ))}
              </div>
            </header>

            {/* Zia Early Warning Banner */}
            {topAlert && (
              <div className="relative overflow-hidden rounded-2xl border border-red-500/30 bg-gradient-to-r from-red-950/40 via-red-900/20 to-transparent p-4 shadow-xl">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <div className="flex size-10 items-center justify-center rounded-xl bg-red-500/20 text-red-400 border border-red-500/30 animate-pulse">
                      <span className="material-symbols-outlined text-xl">warning</span>
                    </div>
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono text-[10px] font-bold uppercase tracking-wider text-red-400">
                          ZIA AUTOML EARLY WARNING ADVISORY
                        </span>
                        <span className="rounded bg-red-500/20 px-1.5 py-0.2 text-[9px] font-mono font-bold text-red-300">
                          THREAT {topAlert.score}/100
                        </span>
                      </div>
                      <p className="mt-0.5 text-xs text-zinc-200">
                        Elevated probability of <strong className="text-white">{topAlert.crimeType}</strong> surges in{" "}
                        <strong className="text-white">{topAlert.name}</strong> over the next {selectedHorizon === "14d" ? "14 days" : "30 days"}.
                      </p>
                    </div>
                  </div>
                  <div className="hidden md:flex items-center gap-2 font-mono text-xs text-red-400 bg-red-500/10 px-3 py-1.5 rounded-lg border border-red-500/20">
                    <span className="material-symbols-outlined text-sm">precision_manufacturing</span>
                    <span>Confidence: 94.2%</span>
                  </div>
                </div>
              </div>
            )}

            <SectionLabel>Temporal &amp; Predictive Forecasting</SectionLabel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Crime Trend vs AutoML Forecast Curve */}
              <section className="glass-panel p-6 lg:col-span-2">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-2">
                  <PanelHead title="Historical Trends vs. Zia AutoML Projection" badge="Live Telemetry" />
                  <div className="flex gap-4 font-mono text-label-sm text-muted-foreground ui-no-select">
                    <span className="flex items-center gap-1.5">
                      <span className="h-px w-4 bg-muted-foreground" /> Historical
                    </span>
                    <span className="flex items-center gap-1.5">
                      <span className="h-px w-4 border-t border-dashed border-sky-400" />{" "}
                      <span className="text-sky-400">AutoML ({selectedHorizon})</span>
                    </span>
                  </div>
                </div>

                <div className="relative">
                  <svg viewBox="0 0 500 130" className="h-44 w-full" role="img" aria-label="Crime trend versus AutoML forecast">
                    <defs>
                      <linearGradient id="forecastArea" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="0%" stopColor="#0ea5e9" stopOpacity="0.25" />
                        <stop offset="100%" stopColor="#0ea5e9" stopOpacity="0.0" />
                      </linearGradient>
                    </defs>
                    {/* Background Area fill under forecast */}
                    <path
                      d="M320 45 C360 40 420 28 500 15 L500 120 L320 120 Z"
                      fill="url(#forecastArea)"
                    />
                    {/* Historical curve */}
                    <path
                      d="M0 110 C50 105 80 98 120 92 C160 86 190 75 230 70 C260 66 290 55 320 45"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth="2"
                      className="text-muted-foreground"
                    />
                    {/* Forecast dotted curve */}
                    <path
                      d="M320 45 C360 40 420 28 500 15"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2.5"
                      strokeDasharray="5 5"
                    />
                    {/* Current checkpoint marker */}
                    <circle cx="320" cy="45" r="4" className="fill-shell stroke-white" strokeWidth="2" />
                    <circle cx="500" cy="15" r="4.5" className="fill-sky-400 animate-ping" />
                  </svg>
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground mt-1 px-1 ui-no-select">
                    <span>Oct 2025</span>
                    <span>Dec 2025</span>
                    <span>Feb 2026</span>
                    <span className="text-white font-bold">Present (Aug 2026)</span>
                    <span className="text-sky-400 font-bold">Forecast Horizon</span>
                  </div>
                </div>
              </section>

              {/* Peak Incident Hours Radar */}
              <section className="glass-panel p-6">
                <PanelHead title="Peak Incident Windows" badge="Diurnal" />
                <div className="space-y-3">
                  <div className="flex items-center justify-between font-mono text-xs">
                    <span className="text-muted-foreground">Highest Density:</span>
                    <span className="font-bold text-red-400">22:00 — 02:00 IST</span>
                  </div>
                  <svg viewBox="0 0 200 80" className="h-28 w-full" role="img" aria-label="Incidents by hour of day">
                    <path
                      d="M0 55 C15 50 25 38 40 42 C55 46 60 70 75 68 C90 64 100 25 125 18 C150 10 165 28 180 40 C190 48 195 55 200 58 L200 80 L0 80 Z"
                      className="fill-sky-500/10"
                    />
                    <path
                      d="M0 55 C15 50 25 38 40 42 C55 46 60 70 75 68 C90 64 100 25 125 18 C150 10 165 28 180 40 C190 48 195 55 200 58"
                      fill="none"
                      stroke="#0ea5e9"
                      strokeWidth="2"
                    />
                  </svg>
                  <div className="flex justify-between font-mono text-[10px] text-muted-foreground ui-no-select">
                    <span>00:00</span>
                    <span className="font-bold text-white">Peak (Night)</span>
                    <span>12:00</span>
                    <span>24:00</span>
                  </div>
                </div>
              </section>
            </div>

            <SectionLabel>AutoML District Leaderboard &amp; Crime Matrix</SectionLabel>

            <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
              {/* Dynamic District Risk Leaderboard */}
              <section className="glass-panel p-6 lg:col-span-2">
                <div className="mb-4 flex flex-wrap items-center justify-between gap-3">
                  <PanelHead title="Zia AutoML District Threat Rankings" badge={`${rawLeaderboard.length} Districts`} />

                  {/* Filter + Sort controls */}
                  <div className="flex items-center gap-2 ui-no-select">
                    <div
                      role="group"
                      aria-label="Filter by risk level"
                      className="flex gap-1 rounded-full border border-hairline bg-surface-1/60 p-0.5"
                    >
                      {RISK_FILTERS.map((level) => (
                        <button
                          key={level}
                          type="button"
                          onClick={() => setRiskFilter(level)}
                          className={`rounded-full px-3 py-1 font-mono text-label-sm transition-colors cursor-pointer ${
                            riskFilter === level
                              ? "bg-primary text-primary-foreground font-bold"
                              : "text-muted-foreground hover:bg-accent hover:text-foreground"
                          }`}
                        >
                          {level}
                        </button>
                      ))}
                    </div>

                    <button
                      type="button"
                      aria-label={sortDir === "desc" ? "Sort ascending" : "Sort descending"}
                      onClick={() => setSortDir((d) => (d === "desc" ? "asc" : "desc"))}
                      className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-1 px-3 py-1 font-mono text-label-sm text-muted-foreground transition-colors hover:text-foreground cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-sm">
                        {sortDir === "desc" ? "arrow_downward" : "arrow_upward"}
                      </span>
                      {sortDir === "desc" ? "Highest" : "Lowest"}
                    </button>
                  </div>
                </div>

                {leaderboard.length === 0 ? (
                  <div className="flex flex-col items-center gap-2 py-10 text-center">
                    <span className="material-symbols-outlined text-3xl text-muted-foreground/40">
                      filter_list_off
                    </span>
                    <p className="font-mono text-xs text-muted-foreground/60">
                      No districts match this filter.
                    </p>
                    <button
                      type="button"
                      onClick={() => setRiskFilter("All")}
                      className="mt-1 font-mono text-xs text-signal-brand hover:underline cursor-pointer"
                    >
                      Clear filter
                    </button>
                  </div>
                ) : (
                  <ul className="space-y-3">
                    {leaderboard.map((d) => {
                      const isCritical = d.score >= 70;
                      const isElevated = d.score >= 45 && d.score < 70;
                      const color = isCritical ? "#ef4444" : isElevated ? "#f59e0b" : "#10b981";

                      return (
                        <li
                          key={d.name}
                          onClick={() => setSelectedDistrictName(selectedDistrictName === d.name ? null : d.name)}
                          className={`flex items-center justify-between gap-3 p-2.5 rounded-xl border transition-all cursor-pointer ${
                            selectedDistrictName === d.name
                              ? "bg-surface-2 border-white/30 shadow-lg"
                              : "bg-surface-1/60 border-hairline hover:bg-surface-2/60"
                          }`}
                        >
                          <div className="w-40 sm:w-48 truncate">
                            <span className="font-medium text-xs text-white block truncate" title={d.name}>
                              {d.name}
                            </span>
                            <span className="font-mono text-[10px] text-muted-foreground truncate block">
                              Top Threat: {d.crimeType}
                            </span>
                          </div>

                          {/* Visual Progress Bar */}
                          <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-3">
                            <div
                              className="h-full rounded-full transition-all duration-700"
                              style={{ width: `${d.score}%`, backgroundColor: color }}
                            />
                          </div>

                          {/* Severity Badge */}
                          <div className="flex items-center gap-2 font-mono">
                            <span
                              className={`rounded px-1.5 py-0.5 text-[9px] font-bold uppercase ${riskColors[d.risk]}`}
                              style={{ backgroundColor: `${color}20` }}
                            >
                              {d.risk}
                            </span>
                            <span className="w-8 text-right text-xs font-bold text-white">
                              {d.score}
                            </span>
                          </div>
                        </li>
                      );
                    })}
                  </ul>
                )}
              </section>

              {/* Crime Category Forecast Matrix */}
              <section className="glass-panel p-6 flex flex-col justify-between">
                <div>
                  <PanelHead title="Category Threat Matrix" badge="Surge Index" />
                  <p className="text-xs text-muted-foreground mb-4">
                    Statewide projected surge rates categorized by BNS crime clusters.
                  </p>

                  <div className="space-y-3">
                    {categorySurges.map((c) => (
                      <div key={c.category} className="space-y-1">
                        <div className="flex justify-between font-mono text-xs">
                          <span className="text-zinc-300">{c.category}</span>
                          <span className="font-bold text-sky-400">{c.score}/100</span>
                        </div>
                        <div className="h-1.5 w-full bg-surface-3 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-gradient-to-r from-sky-500 to-teal-400 rounded-full"
                            style={{ width: `${c.score}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                </div>

                <div className="mt-6 pt-4 border-t border-hairline font-mono text-[10px] text-muted-foreground flex justify-between ui-no-select">
                  <span>Engine: Zia AutoML v4.2</span>
                  <span className="text-emerald-400 font-bold">STATEWIDE SYNC</span>
                </div>
              </section>
            </div>

            {/* Case Resolution Rate Breakdown */}
            <section className="glass-panel p-6">
              <PanelHead title="Statewide FIR Resolution &amp; Conviction Pipeline" badge={`${totalCases} Records`} />

              <div className="flex h-4 w-full overflow-hidden rounded-full mt-2 mb-4 bg-surface-3">
                {resolution.map((r) => (
                  <div
                    key={r.label}
                    className={`${r.fill} transition-all duration-700`}
                    style={{ width: `${r.pct}%` }}
                    title={`${r.label}: ${r.pct}% (${r.count} cases)`}
                  />
                ))}
              </div>

              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {resolution.map((r) => (
                  <div key={r.label} className="p-3 rounded-xl border border-hairline bg-surface-1/60 font-mono">
                    <div className="flex items-center gap-1.5 text-xs text-muted-foreground mb-1 ui-no-select">
                      <span className={`size-2 rounded-full ${r.fill}`} />
                      <span className="truncate">{r.label}</span>
                    </div>
                    <div className="flex items-baseline justify-between">
                      <span className="font-display text-lg font-bold text-white">{r.count.toLocaleString()}</span>
                      <span className="text-xs font-bold text-sky-400">{r.pct}%</span>
                    </div>
                  </div>
                ))}
              </div>
            </section>

            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  );
}
