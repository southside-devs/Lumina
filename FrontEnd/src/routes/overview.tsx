import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TabBar } from "@/components/lumina/TabBar";
import { KpiCard, type KpiCardProps } from "@/components/lumina/KpiCard";
import { CrimeGroupChart } from "@/components/lumina/CrimeGroupChart";
import { FirStatusDonut } from "@/components/lumina/FirStatusDonut";
import { DistrictTable } from "@/components/lumina/DistrictTable";
import { api, type DashboardOverview, type CrimeTrend, type DistrictSummary } from "@/lib/api";

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
  }, []);

  const totalFirs = overview?.total_firs ?? 1245;
  const repeatOffenders = overview?.repeat_offenders ?? 4;
  const totalDistricts = overview?.total_districts ?? 31;
  const totalStations = overview?.total_stations ?? 120;

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

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto p-4 pt-6">
          <TabBar />

          <div className="mx-auto max-w-7xl space-y-4">
            <h1 className="sr-only">LUMINA crime intelligence overview</h1>

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
  );
}
