import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TacticalMap } from "@/components/lumina/TacticalMap";
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
  { label: "All", count: 24 },
  { label: "Critical", count: 3 },
  { label: "Monitoring", count: 8 },
];

function IntelligenceHub() {
  const [activeFilter, setActiveFilter] = useState("All");
  const [showHotspots, setShowHotspots] = useState(true);
  const [showPatrols, setShowPatrols] = useState(true);
  const [cardOpen, setCardOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="relative mt-14 flex-1 overflow-hidden">
          <TacticalMap showHotspots={showHotspots} />

          <div className="relative z-10 flex h-full flex-col p-6">
            <header>
              <h1 className="font-display text-headline-lg tracking-tight">
                Strategic Intelligence Hub
              </h1>
              <p className="mt-1 text-sm text-muted-foreground">
                Lumina Ops • Real-time Threat Assessment
              </p>
            </header>

            <div className="mt-5 flex items-center gap-3">
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
              <button
                type="button"
                aria-label="Advanced filters"
                className="glass-panel flex size-9 items-center justify-center rounded-full bg-surface-1/70 text-muted-foreground backdrop-blur-xl transition-colors hover:text-foreground"
              >
                <span className="material-symbols-outlined filled text-base">filter_alt</span>
              </button>
            </div>

            {cardOpen && (
              <div className="pointer-events-auto absolute top-6 right-6 z-20">
                <IncidentCard onClose={() => setCardOpen(false)} />
              </div>
            )}

            <div className="mt-auto flex items-end justify-between gap-4">
              <MapToolbar
                showHotspots={showHotspots}
                onToggleHotspots={() => setShowHotspots((v) => !v)}
                showPatrols={showPatrols}
                onTogglePatrols={() => setShowPatrols((v) => !v)}
              />
              <div className="hidden w-[88px] lg:block" />
            </div>

            <div className="mt-3 flex items-center justify-between font-mono text-label-sm text-muted-foreground/70">
              <span>Space + Drag to pan • Scroll to zoom</span>
              <span className="hidden md:inline">
                Map updates every 30 seconds • Coordinate System: WGS84
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
