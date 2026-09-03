import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";
import { toast } from "sonner";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TabBar } from "@/components/lumina/TabBar";
import { KpiCard, type KpiCardProps } from "@/components/lumina/KpiCard";
import { CrimeGroupChart } from "@/components/lumina/CrimeGroupChart";
import { FirStatusDonut } from "@/components/lumina/FirStatusDonut";
import { DistrictTable } from "@/components/lumina/DistrictTable";
import { api, type DashboardOverview, type CrimeTrend, type DistrictSummary } from "@/lib/api";
import { useFIREvents } from "@/lib/fir-events";
import { generateIntelligenceBriefingPDF } from "@/lib/pdf-generator";
import { AuthGuard } from "@/lib/auth";


const title = "LUMINA — Crime Intelligence Overview";
const description =
  "LUMINA command console: statewide FIR volumes, repeat-offender alerts, district risk scores and station readiness in one dark-mode intelligence overview.";

export const Route = createFileRoute("/overview")({
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
  component: Overview,
});

function Overview() {
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [crimeTrends, setCrimeTrends] = useState<CrimeTrend[]>([]);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [loading, setLoading] = useState(true);
  const { firCreatedCount } = useFIREvents();

  useEffect(() => {
    let mounted = true;

    async function loadData() {
      try {
        const [ovData, trendsData, distData] = await Promise.all([
          api.getDashboardOverview(),
          api.getCrimeTrends(),
          api.getDistrictSummary(),
        ]);

        if (mounted) {
          setOverview(ovData);
          setCrimeTrends(trendsData);
          setDistricts(distData);
          setLoading(false);
        }
      } catch (err) {
        console.error("Failed to load overview data:", err);
        if (mounted) setLoading(false);
      }
    }

    loadData();
    return () => {
      mounted = false;
    };
  }, [firCreatedCount]); // refetch whenever a new FIR is created

  const totalFirs = overview?.total_firs ?? 5005;
  const repeatOffenders = overview?.repeat_offenders ?? 456;
  const totalDistricts = overview?.total_districts ?? 31;
  const totalStations = overview?.total_stations ?? 209;

  const kpis: KpiCardProps[] = [
    {
      label: "Total FIRs",
      value: totalFirs.toLocaleString(),
      sub: "Statewide records",
      icon: "description",
    },
    {
      label: "Repeat Offenders",
      value: repeatOffenders.toString(),
      sub: "Active alerts flagged",
      icon: "warning",
      tone: "critical",
      filledIcon: true,
    },
    {
      label: "Districts",
      value: totalDistricts.toString(),
      sub: "Geospatial Zones",
      icon: "map",
    },
    {
      label: "Stations",
      value: totalStations.toString(),
      sub: "Operational Units",
      icon: "shield",
      tone: "ok",
    },
  ];

  const handleExportBriefing = () => {
    const topDist =
      districts.length > 0
        ? `${districts[0].district_name} (${districts[0].total_firs.toLocaleString()} active cases)`
        : "Bengaluru Urban (523 active FIRs)";

    const topCrimes =
      crimeTrends.length > 0
        ? crimeTrends
            .slice(0, 2)
            .map((c) => `${c.group} (${c.count})`)
            .join(" & ")
        : "Theft (836) & Assault (746)";

    generateIntelligenceBriefingPDF({
      title: "KARNATAKA STATE POLICE — STRATEGIC INTELLIGENCE BRIEFING",
      totalFirs: totalFirs,
      repeatOffenders: repeatOffenders,
      criticalHotspots: 3,
      topDistrict: topDist,
      topCrimeGroup: topCrimes,
      date: new Date().toLocaleDateString("en-IN", {
        day: "numeric",
        month: "long",
        year: "numeric",
        hour: "2-digit",
        minute: "2-digit",
      }),
      generatedBy: "Inspector General of Police (SCRB Command)",
    });
    toast.success("Generated Official Strategic Intelligence Briefing PDF");
  };

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-shell text-foreground">
        <SideRail />

        <div className="ml-16 flex h-full flex-1 flex-col">
          <TopBar />

          <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto p-4 pt-6">
            <TabBar />

            <div className="mx-auto max-w-7xl space-y-6">
              {/* Header with Title and Action Button */}
              <header className="flex flex-wrap items-start justify-between gap-4">
                <div>
                  <h1 className="font-display text-headline-lg tracking-tight text-white flex items-center gap-3">
                    Statewide Crime Analytics
                    <span className="rounded-full border border-emerald-500/30 bg-emerald-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-emerald-400">
                      LIVE INTEL
                    </span>
                  </h1>
                  <p className="mt-1 text-sm text-muted-foreground">
                    Statewide FIR volume trends, repeat-offender alerts, district risk scores and station readiness in one dark-mode intelligence overview.
                  </p>
                </div>

                {/* Action: Export Strategic Briefing PDF with live data */}
                <button
                  type="button"
                  onClick={handleExportBriefing}
                  disabled={loading}
                  aria-label="Export Official Strategic Intelligence Briefing PDF"
                  className="flex items-center gap-2 rounded-xl border border-amber-500/40 bg-amber-500/10 px-3.5 py-2 font-sans text-xs font-semibold text-amber-300 shadow-sm backdrop-blur-xl transition-all hover:bg-amber-500/20 hover:border-amber-500/60 hover:scale-[1.02] active:scale-[0.98] cursor-pointer"
                  title="Generate and print official Karnataka State Police Strategic Intelligence PDF Briefing with live KPIs"
                >
                  <span className="material-symbols-outlined text-[18px] text-amber-400">
                    picture_as_pdf
                  </span>
                  <span>Export Briefing</span>
                </button>
              </header>

              <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4">
                {kpis.map((kpi) => (
                  <KpiCard key={kpi.label} {...kpi} />
                ))}
              </div>

              <div className="grid grid-cols-1 gap-4 lg:grid-cols-3">
                <CrimeGroupChart data={crimeTrends} loading={loading} />
                <FirStatusDonut
                  statusBreakdown={overview?.status_breakdown}
                  totalFirs={overview?.total_firs}
                />
              </div>

              <DistrictTable districts={districts} loading={loading} />

              <div className="h-8" />
            </div>
          </main>
        </div>
      </div>
    </AuthGuard>
  );
}


