import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TacticalMap, KARNATAKA_HOTSPOTS, type TacticalHotspot } from "@/components/lumina/TacticalMap";
import { Compass } from "@/components/lumina/Compass";
import { IncidentCard } from "@/components/lumina/IncidentCard";
import { MapToolbar } from "@/components/lumina/MapToolbar";

const title = "LUMINA — Strategic Intelligence Hub";
const description =
  "Real-time threat assessment across the LUMINA network: live crime hotspots, patrol unit tracking, risk and threat scoring on a tactical GIS surface.";

export const Route = createFileRoute("/")({
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
  component: IntelligenceHub,
});

const filters: { label: string; count: number }[] = [
  { label: "All Sectors", count: 7 },
  { label: "Critical Threat", count: 3 },
  { label: "Active Patrols", count: 4 },
];

function IntelligenceHub() {
  const [activeFilter, setActiveFilter] = useState("All Sectors");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showPatrols, setShowPatrols] = useState(true);
  const [cardOpen, setCardOpen] = useState(true);
  const [selectedSpot, setSelectedSpot] = useState<TacticalHotspot>(KARNATAKA_HOTSPOTS[0]);

  const handleSelectSpot = (spot: TacticalHotspot) => {
    setSelectedSpot(spot);
    setCardOpen(true);
  };

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="relative mt-14 flex-1 overflow-hidden">
          <TacticalMap
            showHotspots={showHotspots}
            showPatrols={showPatrols}
            activeSpot={selectedSpot}
            onSelectSpot={handleSelectSpot}
          />

          <div className="relative z-10 flex h-full flex-col p-6 pointer-events-none">
            <header className="pointer-events-auto">
              <h1 className="font-display text-headline-lg tracking-tight">
                Strategic Intelligence Hub
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Lumina Ops • Real-time Threat Assessment across 209 Karnataka Police Stations
              </p>
            </header>

            <div className="mt-5 flex items-center gap-3 pointer-events-auto">
              <div
                role="tablist"
                aria-label="Incident filters"
                className="glass-panel flex gap-1 rounded-full bg-surface-1/70 p-1 backdrop-blur-xl"
              >
                {filters.map((f) => (
                  <button
                    key={f.label}
                    type="button"
                    role="tab"
                    aria-selected={activeFilter === f.label}
                    onClick={() => setActiveFilter(f.label)}
                    className={`flex items-center gap-2 rounded-full px-4 py-1.5 text-sm transition-colors ${
                      activeFilter === f.label
                        ? "bg-primary text-primary-foreground"
                        : "text-muted-foreground hover:bg-accent hover:text-foreground"
                    }`}
                  >
                    <span>{f.label}</span>
                    <span
                      className={`rounded px-1.5 font-mono text-label-sm ${
                        activeFilter === f.label
                          ? "bg-primary-foreground/10 text-primary-foreground"
                          : "bg-surface-2 text-muted-foreground"
                      }`}
                    >
                      {f.count}
                    </span>
                  </button>
                ))}
              </div>
            </div>

            {cardOpen && (
              <div className="pointer-events-auto absolute top-6 right-6 z-20">
                <IncidentCard
                  spot={selectedSpot}
                  onClose={() => setCardOpen(false)}
                />
              </div>
            )}

            <div className="mt-auto flex items-end justify-between gap-4 pointer-events-auto">
              <Compass />
              <MapToolbar
                showHotspots={showHotspots}
                onToggleHotspots={() => setShowHotspots((v) => !v)}
                showPatrols={showPatrols}
                onTogglePatrols={() => setShowPatrols((v) => !v)}
              />
              <div className="hidden w-[88px] lg:block" />
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-label-sm text-muted-foreground/70 pointer-events-auto">
              <span>Click any node on map to inspect sector telemetry • Coordinate System: WGS84</span>
              <span className="hidden md:inline">
                Live Telemetry: 5,000 FIR Records Indexed • Zoho Catalyst Native
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
