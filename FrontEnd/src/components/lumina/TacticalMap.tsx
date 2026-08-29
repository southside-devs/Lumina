import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api, type FIRItem, type SpatiotemporalCluster } from "@/lib/api";

export interface TacticalHotspot {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  threatScore: number;
  firCount: number;
  category: string;
  activePatrol: string;
  eta: string;
  distance: string;
  radius_km?: number;
  crime_types?: Record<string, number>;
  date_start?: string;
  date_end?: string;
}

export const KARNATAKA_HOTSPOTS: TacticalHotspot[] = [
  {
    id: "blr-u",
    name: "Bengaluru Urban",
    code: "BLR-U",
    lat: 12.9716,
    lng: 77.5946,
    threatScore: 94,
    firCount: 523,
    category: "Theft & Cybercrime",
    activePatrol: "Patrol Alpha-4 (Indiranagar -> MG Road)",
    eta: "~6m",
    distance: "3.8 km",
  },
  {
    id: "bgm",
    name: "Belagavi Division",
    code: "BGM",
    lat: 15.8497,
    lng: 74.4977,
    threatScore: 88,
    firCount: 260,
    category: "Interstate Smuggling & Fraud",
    activePatrol: "Patrol Delta-2 (Camp Area -> Tilakwadi)",
    eta: "~12m",
    distance: "7.4 km",
  },
  {
    id: "mng",
    name: "Mangaluru (Dakshina Kannada)",
    code: "DK",
    lat: 12.9141,
    lng: 74.856,
    threatScore: 82,
    firCount: 206,
    category: "Coastal Cargo & Cyber Fraud",
    activePatrol: "Patrol Coastal-1 (Panambur -> Hampankatta)",
    eta: "~9m",
    distance: "5.1 km",
  },
  {
    id: "mys",
    name: "Mysuru Central",
    code: "MYS",
    lat: 12.2958,
    lng: 76.6394,
    threatScore: 78,
    firCount: 204,
    category: "Robbery & Commercial Cheating",
    activePatrol: "Patrol Bravo-3 (Devaraja -> Vijayanagar)",
    eta: "~14m",
    distance: "8.2 km",
  },
  {
    id: "gul",
    name: "Kalaburagi Zone",
    code: "GUL",
    lat: 17.3297,
    lng: 76.8343,
    threatScore: 85,
    firCount: 168,
    category: "Arms Act & SC/ST Atrocities",
    activePatrol: "Patrol Echo-7 (Station Bazaar -> Sedam Rd)",
    eta: "~18m",
    distance: "11.0 km",
  },
  {
    id: "dhw",
    name: "Hubballi-Dharwad",
    code: "DHW",
    lat: 15.3647,
    lng: 75.124,
    threatScore: 76,
    firCount: 185,
    category: "Motor Vehicle Theft",
    activePatrol: "Patrol Transit-5 (Vidyanagar -> Old Hubballi)",
    eta: "~10m",
    distance: "6.3 km",
  },
  {
    id: "bly",
    name: "Ballari Corridor",
    code: "BLY",
    lat: 15.1394,
    lng: 76.9214,
    threatScore: 80,
    firCount: 152,
    category: "Extortion & Illegal Transport",
    activePatrol: "Patrol Sector-9 (Cowl Bazaar -> Cantonment)",
    eta: "~15m",
    distance: "9.5 km",
  },
  {
    id: "smg",
    name: "Shivamogga Division",
    code: "SMG",
    lat: 13.9299,
    lng: 75.5681,
    threatScore: 70,
    firCount: 134,
    category: "Burglary & Forest Encroachment",
    activePatrol: "Patrol Western-2 (Durgigudi -> Bypass)",
    eta: "~12m",
    distance: "7.0 km",
  },
];

interface TacticalMapProps {
  onSelectSpot?: (spot: TacticalHotspot | null) => void;
  onSelectFIR?: (fir: FIRItem | null) => void;
  activeSpot?: TacticalHotspot | null;
  selectedFIR?: FIRItem | null;
  showIncidents?: boolean;
  showHotspots?: boolean;
  showPatrols?: boolean;
  firs?: FIRItem[];
  mapRef?: React.MutableRefObject<L.Map | null>;
  clusterParams?: { epsSpatial: number; epsTemporal: number; minPts: number };
}

export function TacticalMap({
  onSelectSpot,
  onSelectFIR,
  activeSpot,
  selectedFIR,
  showIncidents = true,
  showHotspots = true,
  showPatrols = true,
  firs = [],
  mapRef,
  clusterParams,
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);
  const [hotspotsList, setHotspotsList] = useState<TacticalHotspot[]>(KARNATAKA_HOTSPOTS);

  // 1. Fetch live ST-DBSCAN ML clusters whenever parameters are tuned
  useEffect(() => {
    let mounted = true;
    const timer = setTimeout(async () => {
      try {
        const epsS = clusterParams?.epsSpatial ?? 12.0;
        const epsT = clusterParams?.epsTemporal ?? 45;
        const minP = clusterParams?.minPts ?? 4;
        const clusters = await api.getHotspotClusters(epsS, epsT, minP);
        if (mounted && clusters) {
          setHotspotsList(clusters);
        }
      } catch (e) {
        console.warn("Using baseline tactical hotspots:", e);
      }
    }, 60);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [clusterParams?.epsSpatial, clusterParams?.epsTemporal, clusterParams?.minPts]);



  // 2. Initialize Leaflet Map with Esri World Dark Gray Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Target center and zoom for Karnataka
    const targetCenter: [number, number] = [14.8, 76.0];
    const targetZoom = 8;
    
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const initialZoom = prefersReducedMotion ? targetZoom : targetZoom - 1;

    const map = L.map(mapContainerRef.current, {
      center: targetCenter,
      zoom: initialZoom,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

    if (!prefersReducedMotion) {
      setTimeout(() => {
        if (mapInstanceRef.current === map) {
          map.flyTo(targetCenter, targetZoom, {
            duration: 1.5,
            easeLinearity: 0.25,
          });
        }
      }, 250);
    }

    // 1. Official Esri Dark Gray Base Map Layer (100% Native Dark Military GIS)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        className: "esri-dark-tiles",
      }
    ).addTo(map);

    // 2. Official Esri Dark Reference Labels & Boundaries Overlay Layer
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Reference/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        className: "esri-dark-labels",
      }
    ).addTo(map);

    // Zoom control at bottom right
    L.control.zoom({ position: "bottomright" }).addTo(map);

    const layers = L.layerGroup().addTo(map);
    mapInstanceRef.current = map;
    layerGroupRef.current = layers;

    if (mapRef) {
      mapRef.current = map;
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      layerGroupRef.current = null;
      if (mapRef) mapRef.current = null;
    };
  }, [mapRef]);

  // 3. Update Layers (Live FIRs, Markers, Hotspot Circles, Patrol Routes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Patrol Routes — pure monochrome (light grey dashed lines)
    if (showPatrols) {
      const patrolRoutes = [
        { from: [15.3647, 75.124],  to: [15.8497, 74.4977] }, // Hubballi -> Belagavi
        { from: [12.9716, 77.5946], to: [12.2958, 76.6394] }, // Bengaluru -> Mysuru
        { from: [12.9716, 77.5946], to: [12.9141, 74.856]  }, // Bengaluru -> Mangaluru
        { from: [15.1394, 76.9214], to: [17.3297, 76.8343] }, // Ballari -> Kalaburagi
        { from: [13.9299, 75.5681], to: [15.3647, 75.124]  }, // Shivamogga -> Hubballi
      ];

      patrolRoutes.forEach((route) => {
        L.polyline([route.from as [number, number], route.to as [number, number]], {
          color: "#94a3b8",
          weight: 1.5,
          opacity: 0.45,
          dashArray: "4, 8",
        }).addTo(layerGroup);
      });
    }

    // 2. Draw ST-DBSCAN ML Hotspot Clusters — Concentric circular radar indicators with spatial radius
    if (showHotspots) {
      hotspotsList.forEach((spot) => {
        const isSelected = activeSpot?.id === spot.id;
        const isHigh     = spot.threatScore >= 85;
        const isMed      = spot.threatScore >= 75 && spot.threatScore < 85;

        // Dynamic spatial radius from ML model or fallback calculation
        const baseRadiusMeters = spot.radius_km 
          ? Math.max(spot.radius_km * 750, 15000) 
          : isSelected ? 28000 : isHigh ? 23000 : isMed ? 18000 : 14000;
        const innerRadius = baseRadiusMeters * 0.45;

        // Inner subtle concentric circular ring
        L.circle([spot.lat, spot.lng], {
          radius: innerRadius,
          color: isSelected ? "#e2e8f0" : isHigh ? "#94a3b8" : "#475569",
          fillColor: "#09090b",
          fillOpacity: isSelected ? 0.35 : isHigh ? 0.25 : 0.12,
          weight: isSelected ? 1.2 : 0.8,
        }).addTo(layerGroup);

        // Outer concentric circular boundary (spatial footprint)
        L.circle([spot.lat, spot.lng], {
          radius: baseRadiusMeters,
          color: isSelected ? "#ffffff" : isHigh ? "#cbd5e1" : isMed ? "#64748b" : "#334155",
          fillColor: "#09090b",
          fillOpacity: isSelected ? 0.15 : isHigh ? 0.08 : 0.03,
          weight: isSelected ? 1.4 : isHigh ? 1.1 : 0.7,
          dashArray: isSelected || isHigh ? undefined : "3 6",
        }).addTo(layerGroup);

        // Balanced circular node sizing
        const coreSize    = isSelected ? 29 : isHigh ? 25 : isMed ? 22 : 19;
        const borderColor = isSelected ? "#ffffff" : isHigh ? "#e2e8f0" : isMed ? "#94a3b8" : "#64748b";
        const ringColor   = isSelected ? "#cbd5e1" : isHigh ? "#94a3b8" : "#475569";
        
        // Threat Score badge on hotspot pin (e.g. 94, 85, 78, 62, 45)
        const displayScore = spot.threatScore || 75;

        // Perfect 1:1 circular beacon animation ONLY for hotspots
        const beaconOuter = coreSize + 14;
        const beaconInner = coreSize + 7;
        const beaconHtml = `
          <div class="absolute rounded-full border opacity-30 animate-ping pointer-events-none shrink-0" 
            style="width:${beaconOuter}px; height:${beaconOuter}px; min-width:${beaconOuter}px; min-height:${beaconOuter}px; border-color:${borderColor}; animation-duration: 2.8s;"></div>
          <div class="absolute rounded-full border opacity-20 pointer-events-none shrink-0" 
            style="width:${beaconInner}px; height:${beaconInner}px; min-width:${beaconInner}px; min-height:${beaconInner}px; border-color:${ringColor};"></div>
        `;

        const customIcon = L.divIcon({
          className: "custom-tactical-marker",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style="width:${coreSize}px; height:${coreSize}px;">
              ${beaconHtml}
              <!-- Outer concentric separation ring -->
              <div class="absolute rounded-full border pointer-events-none shrink-0"
                style="width:${coreSize + 5}px; height:${coreSize + 5}px; min-width:${coreSize + 5}px; min-height:${coreSize + 5}px; border-color:${ringColor}; opacity: 0.5;"></div>
              
              <!-- Perfect Dark circular core with centered clean white typography -->
              <div class="relative z-10 flex items-center justify-center rounded-full border bg-black shadow-lg shrink-0 transition-transform group-hover:scale-110"
                style="width:${coreSize}px; height:${coreSize}px; min-width:${coreSize}px; min-height:${coreSize}px; border-color:${borderColor}; ${isSelected ? "outline: 1.5px solid #ffffff; outline-offset: 2px;" : ""}">
                <span class="font-mono font-bold text-white text-center leading-none select-none flex items-center justify-center" style="font-size: ${coreSize >= 24 ? "10px" : "9px"}; width:${coreSize}px; height:${coreSize}px;">
                  ${displayScore}
                </span>
              </div>


              <!-- Minimal hover label -->
              <div class="absolute top-full left-1/2 mt-1 -translate-x-1/2 whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20">
                <span class="font-mono text-[9px] text-zinc-300 bg-black/90 px-1.5 py-0.5 rounded border border-zinc-800 shadow-md">
                  ${spot.name} (${spot.threatScore})
                </span>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(layerGroup);
        marker.on("click", () => { onSelectSpot?.(spot); });
      });
    }

    // 3. Draw Live Incident Markers — Refined, static monochrome circular pins
    if (showIncidents && firs && firs.length > 0) {
      firs.forEach((fir, idx) => {
        const lat = Number(fir.Latitude);
        const lng = Number(fir.Longitude);

        if (isNaN(lat) || isNaN(lng) || lat < 11 || lat > 19 || lng < 74 || lng > 79) return;

        const isSelected = selectedFIR?.ROWID === fir.ROWID;
        const group = fir.Crime_Group?.toLowerCase() || "";
        const isRecent = fir.Date?.includes("2026") || fir.FIR_Number?.includes("2026") || idx < 5;
        const isCritical = group.includes("assault") || group.includes("murder")
                         || group.includes("robbery") || group.includes("arson")
                         || group.includes("extortion");

        // Balanced 1:1 circle dimensions:
        const outerDiameter = isSelected ? 15 : isCritical ? 11 : isRecent ? 9 : 7;
        const coreDiameter  = isSelected ? 9 : isCritical ? 6 : isRecent ? 5 : 4;
        
        const outerBorderColor = isSelected ? "#ffffff" : isCritical ? "#cbd5e1" : isRecent ? "#64748b" : "#3f3f46";
        const whiteSeparation  = isSelected ? "1px solid #ffffff" : isCritical ? "0.75px solid rgba(255,255,255,0.7)" : "0.5px solid rgba(255,255,255,0.25)";
        const coreBgColor      = isSelected ? "#e2e8f0" : isCritical ? "#cbd5e1" : isRecent ? "#64748b" : "#3f3f46";
        const opacity          = isSelected ? 1.0 : isCritical ? 0.95 : isRecent ? 0.75 : 0.55;


        // Selected state adds second concentric circular ring
        const selectedConcentricHtml = isSelected
          ? `<div class="absolute rounded-full border pointer-events-none shrink-0" style="width:${outerDiameter + 5}px; height:${outerDiameter + 5}px; min-width:${outerDiameter + 5}px; min-height:${outerDiameter + 5}px; border-color: rgba(255,255,255,0.6); border-width: 0.75px;"></div>`
          : "";

        const incidentIcon = L.divIcon({
          className: "custom-fir-incident-pin",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group" style="width:${outerDiameter}px; height:${outerDiameter}px; opacity:${opacity};">
              ${selectedConcentricHtml}
              <!-- Outer circular border -->
              <div class="flex items-center justify-center rounded-full shrink-0 transition-transform group-hover:scale-125"
                style="width:${outerDiameter}px; height:${outerDiameter}px; min-width:${outerDiameter}px; min-height:${outerDiameter}px; background-color: #000000; border: 1px solid ${outerBorderColor}; box-shadow: 0 1px 2px rgba(0,0,0,0.8); ${isSelected ? "box-shadow: 0 0 5px rgba(255,255,255,0.4);" : ""}">
                
                <!-- Inner solid dark-grey/white core with thin circular separation ring -->
                <div class="flex items-center justify-center rounded-full shrink-0"
                  style="width:${coreDiameter}px; height:${coreDiameter}px; min-width:${coreDiameter}px; min-height:${coreDiameter}px; background-color:${coreBgColor}; border: ${whiteSeparation};">
                </div>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const incidentMarker = L.marker([lat, lng], { icon: incidentIcon }).addTo(layerGroup);
        incidentMarker.on("click", () => { onSelectFIR?.(fir); });
      });
    }
  }, [showIncidents, showHotspots, showPatrols, activeSpot, selectedFIR, firs, hotspotsList, onSelectSpot, onSelectFIR]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-black">
      {/* Real Geographic Map Tile Container */}
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full z-0" />

      {/* Subtle Tactical Monochrome Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-15 z-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.04) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.04) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
