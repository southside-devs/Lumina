import { createFileRoute } from "@tanstack/react-router";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TabBar } from "@/components/lumina/TabBar";
import { KpiCard, type KpiCardProps } from "@/components/lumina/KpiCard";
import { CrimeGroupChart } from "@/components/lumina/CrimeGroupChart";
import { FirStatusDonut } from "@/components/lumina/FirStatusDonut";
import { DistrictTable } from "@/components/lumina/DistrictTable";

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

const kpis: KpiCardProps[] = [
  { label: "Total FIRs", value: "104", sub: "Statewide", icon: "description" },
  {
    label: "Repeat Offenders",
    value: "4",
    sub: "Active alerts",
    icon: "warning",
    tone: "critical",
    filledIcon: true,
  },
  { label: "Districts", value: "155", sub: "Mapped", icon: "map" },
  { label: "Stations", value: "120", sub: "Operational", icon: "shield", tone: "ok" },
];

function Overview() {
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
              <CrimeGroupChart />
              <FirStatusDonut />
            </div>
            <DistrictTable />


            <div className="h-8" />
          </div>
        </main>
      </div>
    </div>
  );
}
