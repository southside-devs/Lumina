import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef } from "react";
import L from "leaflet";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TacticalMap, type TacticalHotspot } from "@/components/lumina/TacticalMap";
import { IncidentCard } from "@/components/lumina/IncidentCard";
import { MapToolbar } from "@/components/lumina/MapToolbar";
import { api, type FIRItem } from "@/lib/api";
import { useFIREvents } from "@/lib/fir-events";

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

export function IntelligenceHub() {
  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [activeFilter, setActiveFilter] = useState("All Incidents");
  const [showIncidents, setShowIncidents] = useState(false);
  const [showHotspots, setShowHotspots] = useState(true);
  const [cardOpen, setCardOpen] = useState(false);
  const [selectedSpot, setSelectedSpot] = useState<TacticalHotspot | null>(null);
  const [selectedFir, setSelectedFir] = useState<FIRItem | null>(null);
  const [clusterParams, setClusterParams] = useState({ epsSpatial: 12.0, epsTemporal: 45, minPts: 4 });

  const { firCreatedCount } = useFIREvents();
  const mapRef = useRef<L.Map | null>(null);


  // Fetch live FIR records and refresh when a new FIR is filed
  useEffect(() => {
    let mounted = true;
    async function loadLiveData() {
      try {
        const res = await api.getFirs({ limit: 200 });
        if (mounted && res && res.firs) {
          setFirs(res.firs);
        }
      } catch (err) {
        console.error("Failed to load map FIRs:", err);
      }
    }
    loadLiveData();
    return () => {
      mounted = false;
    };
  }, [firCreatedCount]);

  // Filter FIRs based on active tab
  const filteredFirs = (firs || []).filter((f) => {
    if (!f) return false;
    if (activeFilter === "Critical Threats") {
      const g = (f.Crime_Group || "").toLowerCase();
      return (
        g.includes("assault") ||
        g.includes("murder") ||
        g.includes("robbery") ||
        g.includes("arson") ||
        g.includes("extortion")
      );
    }
    if (activeFilter === "Recent (2026)") {
      return (
        String(f.Date || "").includes("2026") ||
        String(f.FIR_Number || "").includes("2026")
      );
    }
    return true;
  });

  const criticalCount = (firs || []).filter((f) => {
    if (!f) return false;
    const g = (f.Crime_Group || "").toLowerCase();
    return (
      g.includes("assault") ||
      g.includes("murder") ||
      g.includes("robbery") ||
      g.includes("arson") ||
      g.includes("extortion")
    );
  }).length;

  const recentCount = (firs || []).filter(
    (f) => String(f?.Date || "").includes("2026") || String(f?.FIR_Number || "").includes("2026")
  ).length;

  const filters = [
    { label: "All Incidents", count: firs.length || 5000 },
    { label: "Critical Threats", count: criticalCount || 746 },
    { label: "Recent (2026)", count: recentCount || 12 },
  ];

  const handleFilterChange = (filterName: string) => {
    setActiveFilter(filterName);
    if (filterName === "All Incidents") {
      setShowIncidents(true);
      setShowHotspots(true);
    } else if (filterName === "Critical Threats") {
      setShowIncidents(true);
      setShowHotspots(true);
    } else if (filterName === "Recent (2026)") {
      setShowIncidents(true);
      setShowHotspots(false);
    }
  };


  const handleSelectSpot = (spot: TacticalHotspot | null) => {
    setSelectedSpot(spot);
    setSelectedFir(null);
    if (spot) {
      setCardOpen(true);
      mapRef.current?.flyTo([spot.lat, spot.lng], 9, { duration: 0.5 });
    }
  };

  const handleSelectFir = (fir: FIRItem | null) => {
    setSelectedFir(fir);
    setSelectedSpot(null);
    if (fir) {
      setCardOpen(true);
      mapRef.current?.flyTo([Number(fir.Latitude), Number(fir.Longitude)], 11, {
        duration: 0.5,
      });
    }
  };

  const handleResetView = () => {
    mapRef.current?.flyTo([14.8, 76.0], 8, { duration: 0.8 });
    setSelectedSpot(null);
    setSelectedFir(null);
    setCardOpen(false);
  };

  const handleClustersLoaded = (newClusters: TacticalHotspot[]) => {
    if (selectedSpot) {
      const updated =
        newClusters.find((c) => c.id === selectedSpot.id) ||
        newClusters.find((c) => c.name.split(" ")[0] === selectedSpot.name.split(" ")[0]);
      if (updated) {
        setSelectedSpot(updated);
      }
    }
  };



  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="relative mt-14 flex-1 overflow-hidden">
          <TacticalMap
            firs={filteredFirs}
            showIncidents={showIncidents}
            showHotspots={showHotspots}
            activeSpot={selectedSpot}
            selectedFIR={selectedFir}
            onSelectSpot={handleSelectSpot}
            onSelectFIR={handleSelectFir}
            mapRef={mapRef}
            clusterParams={clusterParams}
            onClustersLoaded={handleClustersLoaded}
          />


          <div className="relative z-10 flex h-full flex-col p-6 pointer-events-none">
            {/* Top Bar Area: Header on Left, Filter Tabs on Right */}
            <div className="flex items-start justify-between gap-4">
              <header className="pointer-events-auto">
                <h1 className="font-display text-headline-lg tracking-tight">
                  Strategic Intelligence Hub
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Lumina Ops • Real-time Threat Assessment across 209 Karnataka Police Stations
                </p>
              </header>

              {/* Right Side Container: Filter Tabs on top, IncidentCard stacked cleanly right below */}
              <div className="pointer-events-auto flex flex-col items-end gap-3">
                <div
                  role="tablist"
                  aria-label="Incident filters"
                  className="glass-panel flex items-center gap-1 rounded-full bg-surface-1/80 p-1.5 shadow-2xl backdrop-blur-xl border border-hairline transition-all duration-200"
                >
                  {filters.map((f) => (
                    <button
                      key={f.label}
                      type="button"
                      role="tab"
                      aria-selected={activeFilter === f.label}
                      onClick={() => handleFilterChange(f.label)}
                      className={`flex items-center gap-2 rounded-full px-3.5 py-1.5 text-xs font-medium transition-all duration-200 cursor-pointer ${
                        activeFilter === f.label
                          ? "bg-slate-200 text-slate-950 shadow-md font-semibold"
                          : "text-muted-foreground hover:bg-surface-2/60 hover:text-foreground"
                      }`}
                    >
                      <span>{f.label}</span>
                      <span
                        className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors ${
                          activeFilter === f.label
                            ? "bg-slate-900/15 text-slate-950"
                            : "bg-surface-2/80 text-muted-foreground"
                        }`}
                      >
                        {f.count}
                      </span>
                    </button>
                  ))}
                </div>

                {/* Pop-up Incident Card cleanly positioned right below filter tabs */}
                {cardOpen && (selectedSpot || selectedFir) && (
                  <div className="animate-in fade-in slide-in-from-top-2 duration-200">
                    <IncidentCard
                      spot={selectedSpot || undefined}
                      fir={selectedFir || undefined}
                      onClose={() => setCardOpen(false)}
                    />
                  </div>
                )}
              </div>
            </div>

            {/* Always-on Tactical Map Zoom Controls in Right Corner */}
            <div className="pointer-events-auto absolute right-6 bottom-20 z-20 flex flex-col gap-1.5">
              <button
                type="button"
                onClick={() => mapRef.current?.zoomIn()}
                title="Zoom In (+)"
                aria-label="Zoom In"
                className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface-1/90 text-foreground shadow-lg backdrop-blur-xl transition-all hover:bg-surface-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">add</span>
              </button>
              <button
                type="button"
                onClick={() => mapRef.current?.zoomOut()}
                title="Zoom Out (-)"
                aria-label="Zoom Out"
                className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface-1/90 text-foreground shadow-lg backdrop-blur-xl transition-all hover:bg-surface-2 hover:scale-105 active:scale-95 cursor-pointer"
              >
                <span className="material-symbols-outlined text-[18px]">remove</span>
              </button>
            </div>

            <div className="mt-auto flex items-end justify-between gap-4 pointer-events-auto">
              <div className="hidden w-[88px] lg:block" />
              <MapToolbar
                showIncidents={showIncidents}
                onToggleIncidents={() => setShowIncidents((v) => !v)}
                showHotspots={showHotspots}
                onToggleHotspots={() => setShowHotspots((v) => !v)}
                onResetView={handleResetView}
                onClusterTuned={(p) => setClusterParams(p)}
              />
              <div className="hidden w-[88px] lg:block" />
            </div>



            <div className="mt-3 flex items-center justify-between font-mono text-label-sm text-muted-foreground/70 pointer-events-auto">
              <span>Click any incident pin or sector node to inspect telemetry • Coordinate System: WGS84</span>
              <span className="hidden md:inline">
                Live Telemetry: {firs.length.toLocaleString()} FIR Records Plotted • Zoho Catalyst Native
              </span>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}
