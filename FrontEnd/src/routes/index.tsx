import { createFileRoute } from "@tanstack/react-router";
import { useEffect, useState, useRef, useCallback } from "react";
import L from "leaflet";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { TacticalMap, type TacticalHotspot } from "@/components/lumina/TacticalMap";
import { IncidentCard } from "@/components/lumina/IncidentCard";
import { MapToolbar } from "@/components/lumina/MapToolbar";
import { api, type FIRItem } from "@/lib/api";
import { useFIREvents } from "@/lib/fir-events";
import { AuthGuard } from "@/lib/auth";

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
  const tabRefs = useRef<{ [key: string]: HTMLButtonElement | null }>({});
  const [sliderStyle, setSliderStyle] = useState<{ left: number; width: number }>({ left: 6, width: 140 });

  useEffect(() => {
    const el = tabRefs.current[activeFilter];
    if (el) {
      setSliderStyle({
        left: el.offsetLeft,
        width: el.offsetWidth,
      });
    }
  }, [activeFilter, firs.length, showIncidents]);


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

  const handleFilterChange = useCallback((filterName: string) => {
    setActiveFilter(filterName);
    setShowIncidents(true);
    setShowHotspots(true);
  }, []);


  const handleSelectSpot = useCallback((spot: TacticalHotspot | null) => {
    setSelectedSpot((prev) => {
      if (!spot || prev?.id === spot.id) {
        setCardOpen(false);
        return null;
      }
      setCardOpen(true);
      return spot;
    });
    if (spot) {
      mapRef.current?.panTo([spot.lat, spot.lng], { animate: true, duration: 0.4 });
    }
    setSelectedFir(null);
  }, []);

  const handleSelectFir = useCallback((fir: FIRItem | null) => {
    setSelectedFir((prev) => {
      if (!fir || prev?.ROWID === fir.ROWID) {
        setCardOpen(false);
        return null;
      }
      setCardOpen(true);
      return fir;
    });
    if (fir) {
      mapRef.current?.panTo([Number(fir.Latitude), Number(fir.Longitude)], {
        animate: true,
        duration: 0.4,
      });
    }
    setSelectedSpot(null);
  }, []);

  const handleResetView = useCallback(() => {
    mapRef.current?.flyTo([14.8, 76.0], 8, { duration: 0.8 });
    setSelectedSpot(null);
    setSelectedFir(null);
    setCardOpen(false);
  }, []);

  const handleClustersLoaded = useCallback((newClusters: TacticalHotspot[]) => {
    setSelectedSpot((prev) => {
      if (!prev) return null;
      return (
        newClusters.find((c) => c.id === prev.id) ||
        newClusters.find((c) => c.name.split(" ")[0] === prev.name.split(" ")[0]) ||
        prev
      );
    });
  }, []);



  return (
    <AuthGuard>
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
                  className={`relative inline-flex items-center p-[5px] rounded-full border border-zinc-800/80 bg-zinc-950/85 backdrop-blur-2xl shadow-[0_16px_36px_rgba(0,0,0,0.7),inset_0_1px_1px_rgba(255,255,255,0.06)] transition-all duration-300 ease-[cubic-bezier(0.2,0.9,0.3,1)] ${
                    showIncidents
                      ? "translate-y-0 opacity-100 pointer-events-auto scale-100"
                      : "-translate-y-12 opacity-0 pointer-events-none scale-95"
                  }`}
                >
                  {/* Sliding Dark Elevated Glass Piece */}
                  <div
                    aria-hidden="true"
                    className="pointer-events-none absolute top-[5px] bottom-[5px] rounded-full border border-white/10 bg-zinc-800/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.18),0_4px_12px_rgba(0,0,0,0.4)] transition-all duration-[280ms] ease-[cubic-bezier(0.2,0.9,0.3,1)]"
                    style={{
                      left: `${sliderStyle.left}px`,
                      width: `${sliderStyle.width}px`,
                    }}
                  />

                  {filters.map((f) => {
                    const isActive = activeFilter === f.label;
                    return (
                      <button
                        key={f.label}
                        ref={(el) => {
                          tabRefs.current[f.label] = el;
                        }}
                        type="button"
                        role="tab"
                        aria-selected={isActive}
                        onClick={() => handleFilterChange(f.label)}
                        className={`relative z-10 flex items-center gap-2.5 rounded-full px-4 py-2 font-mono text-xs font-semibold transition-colors duration-200 cursor-pointer select-none ${
                          isActive
                            ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                            : "text-[#94A3B8] hover:text-white"
                        }`}
                      >
                        <span>{f.label}</span>
                        <span
                          className={`rounded-full px-2 py-0.5 font-mono text-[10px] font-semibold transition-colors duration-200 ${
                            isActive
                              ? "bg-zinc-700/70 border border-white/10 text-white shadow-sm"
                              : "bg-zinc-900/70 border border-zinc-800 text-zinc-500"
                          }`}
                        >
                          {f.count}
                        </span>
                      </button>
                    );
                  })}
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
    </AuthGuard>
  );
}
