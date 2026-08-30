import { useEffect, useRef, useState } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import { api, type FIRItem, type SpatiotemporalCluster } from "@/lib/api";

import karnatakaGeoJson from "./karnataka-boundary.json";

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
  firs?: FIRItem[];
  mapRef?: React.MutableRefObject<L.Map | null>;
  clusterParams?: { epsSpatial: number; epsTemporal: number; minPts: number };
  onClustersLoaded?: (clusters: TacticalHotspot[]) => void;
}

export function TacticalMap({
  onSelectSpot,
  onSelectFIR,
  activeSpot,
  selectedFIR,
  showIncidents = false,
  showHotspots = true,
  firs = [],
  mapRef,
  clusterParams,
  onClustersLoaded,
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
          onClustersLoaded?.(clusters);
        }
      } catch (e) {
        console.warn("Using baseline tactical hotspots:", e);
      }
    }, 60);

    return () => {
      mounted = false;
      clearTimeout(timer);
    };
  }, [clusterParams?.epsSpatial, clusterParams?.epsTemporal, clusterParams?.minPts, onClustersLoaded]);




  // 2. Initialize Leaflet Map with Esri World Dark Gray Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Target center and zoom for Karnataka
    const targetCenter: [number, number] = [14.8, 76.0];
    const targetZoom = 8;

    // Pan-India overview center and zoom
    const indiaCenter: [number, number] = [20.5937, 78.9629];
    const indiaZoom = 5;
    
    const prefersReducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;

    const map = L.map(mapContainerRef.current, {
      center: prefersReducedMotion ? targetCenter : indiaCenter,
      zoom: prefersReducedMotion ? targetZoom : indiaZoom,
      minZoom: 4,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
      zoomAnimation: true,
      zoomAnimationThreshold: 8,
    });

    if (!prefersReducedMotion) {
      setTimeout(() => {
        if (mapInstanceRef.current === map) {
          map.flyTo(targetCenter, targetZoom, {
            duration: 1.8,
            easeLinearity: 0.25,
          });
        }
      }, 400);
    }

    // 1. Official Esri Dark Gray Base Map Layer (100% Native Dark Military GIS)
    L.tileLayer(
      "https://server.arcgisonline.com/ArcGIS/rest/services/Canvas/World_Dark_Gray_Base/MapServer/tile/{z}/{y}/{x}",
      {
        maxZoom: 16,
        className: "esri-dark-tiles",
      }
    ).addTo(map);

    // 2. Karnataka State Administrative Boundary GeoJSON Layer (Subtle, Thinner, Classy Dashed Outline)
    L.geoJSON(karnatakaGeoJson as any, {
      interactive: false,
      style: {
        color: "#cbd5e1",         // Soft muted silver-white (less bright)
        weight: 1.5,              // Sleek, thinner outline
        opacity: 0.55,            // Refined subtle opacity
        dashArray: "4, 6",        // Classy fine dashed tactical line
        fillColor: "transparent",
        fillOpacity: 0,
        lineCap: "round",
        lineJoin: "round",
        className: "karnataka-state-boundary",
      },
    }).addTo(map);

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
        
        // Threat Score to display on the pin (e.g. 94, 88, 85, 78)
        const score = spot.threatScore || (spot.firCount >= 10 ? 94 : spot.firCount >= 6 ? 88 : 82);
        const isDominant = score >= 90 || isSelected;

        // Sized cleanly for 2-digit threat score numbers (e.g. 94, 88)
        const coreSize = isDominant ? 24 : score >= 85 ? 22 : 20;
        const outerRingSize = coreSize + (isDominant ? 6 : 5);

        // High-contrast, refined military GIS styling
        const borderColor = isDominant ? "rgba(239, 68, 68, 0.85)" : score >= 85 ? "rgba(245, 158, 11, 0.8)" : "rgba(226, 232, 240, 0.75)";
        const ringBorderColor = isDominant ? "rgba(239, 68, 68, 0.35)" : score >= 85 ? "rgba(245, 158, 11, 0.25)" : "rgba(203, 213, 225, 0.2)";
        const textColor = isDominant ? "#fecaca" : score >= 85 ? "#fef3c7" : "#f1f5f9";

        const customIcon = L.divIcon({
          className: "custom-tactical-marker",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer select-none" style="width:${outerRingSize}px; height:${outerRingSize}px;">
              <!-- Outer concentric thin radar ring -->
              <div class="absolute rounded-full border pointer-events-none transition-transform"
                style="width:${outerRingSize}px; height:${outerRingSize}px; border-color: ${ringBorderColor}; border-width: 1px;"></div>
              
              <!-- Dark circular core showing Threat Score -->
              <div class="relative z-10 flex items-center justify-center rounded-full bg-zinc-950/95 shadow-md transition-transform hover:scale-110"
                style="width:${coreSize}px; height:${coreSize}px; border: 1.5px solid ${borderColor};">
                <span class="font-mono font-bold text-center leading-none select-none flex items-center justify-center tracking-tighter" 
                  style="color: ${textColor}; font-size: ${isDominant ? '10px' : '9px'};">
                  ${score}
                </span>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const tooltipHtml = `
          <div style="font-family: ui-monospace, SFMono-Regular, monospace; font-size: 11px; color: #f1f5f9; background: rgba(9, 9, 11, 0.96); padding: 5px 10px; border-radius: 8px; border: 1px solid rgba(255, 255, 255, 0.16); box-shadow: 0 12px 30px rgba(0, 0, 0, 0.9); display: flex; align-items: center; gap: 8px; white-space: nowrap;">
            <span style="display: inline-block; width: 7px; height: 7px; border-radius: 9999px; background: ${score >= 90 ? '#f87171' : '#fbbf24'};"></span>
            <span style="font-weight: 600; color: #ffffff;">${spot.name}</span>
            <span style="color: #52525b;">·</span>
            <span style="color: ${score >= 90 ? '#f87171' : '#fbbf24'}; font-weight: 700;">Threat: ${score}/100</span>
            <span style="color: #52525b;">·</span>
            <span style="color: #a1a1aa;">${spot.firCount || 10} FIRs</span>
          </div>
        `;

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(layerGroup);
        
        marker.bindTooltip(tooltipHtml, {
          direction: "bottom",
          offset: [0, Math.round(outerRingSize / 2) + 4],
          opacity: 1,
          className: "lumina-tactical-tooltip",
        });

        marker.on("mouseover", () => {
          marker.setZIndexOffset(10000);
        });
        marker.on("mouseout", () => {
          marker.setZIndexOffset(0);
        });

        marker.on("click", () => { onSelectSpot?.(spot); });
      });
    }


    // 3. Draw Live Incident Markers — Monochrome circles, clearly visible at all zoom levels
    if (showIncidents && firs && firs.length > 0) {
      firs.forEach((fir, idx) => {
        const lat = Number(fir.Latitude);
        const lng = Number(fir.Longitude);

        if (isNaN(lat) || isNaN(lng) || lat < 11 || lat > 19 || lng < 74 || lng > 79) return;

        const isSelected = selectedFIR?.ROWID === fir.ROWID;
        const group = fir.Crime_Group?.toLowerCase() || "";
        const isCritical = group.includes("assault") || group.includes("murder")
                         || group.includes("robbery") || group.includes("arson")
                         || group.includes("extortion");

        // Clearly visible radii — no colour, pure monochrome
        const radius      = isSelected ? 10 : isCritical ? 8 : 6;
        const fillColor   = isSelected ? "#ffffff" : isCritical ? "#e2e8f0" : "#94a3b8";
        const fillOpacity = isSelected ? 1.0 : isCritical ? 0.9 : 0.75;
        const strokeColor = "#1e293b";
        const weight      = isSelected ? 2.5 : 1.5;

        const circle = L.circleMarker([lat, lng], {
          radius,
          color: strokeColor,
          fillColor,
          fillOpacity,
          weight,
          opacity: 1,
        }).addTo(layerGroup);

        circle.on("click", () => { onSelectFIR?.(fir); });

        circle.bindTooltip(
          `<span style="font-family:monospace;font-size:10px;color:#e2e8f0;">FIR ${fir.FIR_Number || fir.ROWID} · ${fir.Crime_Group || "Incident"}</span>`,
          { direction: "top", opacity: 1, className: "lumina-fir-tooltip" }
        );
      });
    }
  }, [showIncidents, showHotspots, activeSpot, selectedFIR, firs, hotspotsList, onSelectSpot, onSelectFIR]);



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
