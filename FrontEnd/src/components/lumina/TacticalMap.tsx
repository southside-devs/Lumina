import { useEffect, useRef } from "react";
import L from "leaflet";
import "leaflet/dist/leaflet.css";
import type { FIRItem } from "@/lib/api";

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
    activePatrol: "Patrol Alpha-4 (Indiranagar → MG Road)",
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
    activePatrol: "Patrol Delta-2 (Camp Area → Tilakwadi)",
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
    activePatrol: "Patrol Coastal-1 (Panambur → Hampankatta)",
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
    activePatrol: "Patrol Bravo-3 (Devaraja → Vijayanagar)",
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
    activePatrol: "Patrol Echo-7 (Station Bazaar → Sedam Rd)",
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
    activePatrol: "Patrol Transit-5 (Vidyanagar → Old Hubballi)",
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
    activePatrol: "Patrol Sector-9 (Cowl Bazaar → Cantonment)",
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
    activePatrol: "Patrol Western-3 (Bhadravathi → City Center)",
    eta: "~11m",
    distance: "6.9 km",
  },
];

interface TacticalMapProps {
  firs?: FIRItem[];
  showIncidents?: boolean;
  showHotspots: boolean;
  showPatrols?: boolean;
  activeSpot?: TacticalHotspot | null;
  selectedFIR?: FIRItem | null;
  onSelectSpot?: (spot: TacticalHotspot) => void;
  onSelectFIR?: (fir: FIRItem) => void;
  mapRef?: React.MutableRefObject<L.Map | null>;
}

export function TacticalMap({
  firs = [],
  showIncidents = true,
  showHotspots = true,
  showPatrols = true,
  activeSpot,
  selectedFIR,
  onSelectSpot,
  onSelectFIR,
  mapRef,
}: TacticalMapProps) {
  const mapContainerRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<L.Map | null>(null);
  const layerGroupRef = useRef<L.LayerGroup | null>(null);

  // Initialize Leaflet Map with Esri World Dark Gray Canvas
  useEffect(() => {
    if (!mapContainerRef.current) return;
    if (mapInstanceRef.current) return;

    // Center on Karnataka: [14.8, 76.0]
    const map = L.map(mapContainerRef.current, {
      center: [14.8, 76.0],
      zoom: 7,
      minZoom: 6,
      maxZoom: 16,
      zoomControl: false,
      attributionControl: false,
    });

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

  // Update Layers (Live FIRs, Markers, Hotspot Circles, Patrol Routes)
  useEffect(() => {
    const map = mapInstanceRef.current;
    const layerGroup = layerGroupRef.current;
    if (!map || !layerGroup) return;

    layerGroup.clearLayers();

    // 1. Draw Patrol Routes
    if (showPatrols) {
      const patrolRoutes = [
        { from: [15.3647, 75.124], to: [15.8497, 74.4977], color: "#0ea5e9" }, // Hubballi -> Belagavi
        { from: [12.9716, 77.5946], to: [12.2958, 76.6394], color: "#ef4444" }, // Bengaluru -> Mysuru
        { from: [12.9716, 77.5946], to: [12.9141, 74.856], color: "#eab308" }, // Bengaluru -> Mangaluru
        { from: [15.1394, 76.9214], to: [17.3297, 76.8343], color: "#a855f7" }, // Ballari -> Kalaburagi
        { from: [13.9299, 75.5681], to: [15.3647, 75.124], color: "#10b981" }, // Shivamogga -> Hubballi
      ];

      patrolRoutes.forEach((route) => {
        L.polyline([route.from as [number, number], route.to as [number, number]], {
          color: route.color,
          weight: 2,
          opacity: 0.75,
          dashArray: "6, 8",
        }).addTo(layerGroup);
      });
    }

    // 2. Draw Hotspot Heat Circles & Pulse Markers
    if (showHotspots) {
      KARNATAKA_HOTSPOTS.forEach((spot) => {
        const isSelected = activeSpot?.id === spot.id;
        const isCritical = spot.threatScore >= 85;
        const color = isCritical ? "#ef4444" : "#eab308";

        // Ambient Hotspot Heat Circle
        L.circle([spot.lat, spot.lng], {
          radius: isSelected ? 35000 : 25000,
          color: color,
          fillColor: color,
          fillOpacity: isSelected ? 0.28 : 0.14,
          weight: 1.5,
        }).addTo(layerGroup);

        // Custom Glowing Tactical Node Marker
        const customIcon = L.divIcon({
          className: "custom-tactical-marker",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
              <div class="absolute -inset-2 rounded-full border opacity-70 animate-ping" style="border-color: ${color}"></div>
              <div class="flex items-center justify-center rounded-full border bg-zinc-950/95 shadow-2xl transition-transform duration-300 ${
                isSelected ? "scale-125 ring-2 ring-white" : "hover:scale-110"
              }" style="width: ${isSelected ? "38px" : "30px"}; height: ${
            isSelected ? "38px" : "30px"
          }; border-color: ${color}; box-shadow: 0 0 16px ${color};">
                <span class="font-mono text-[10px] font-bold" style="color: ${color};">${spot.code}</span>
              </div>
              <div class="absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-800 bg-zinc-950/95 px-2 py-0.5 font-mono text-[9px] text-zinc-300 shadow-xl backdrop-blur-md">
                <span class="font-semibold text-white">${spot.name}</span>
                <span class="ml-1 font-bold" style="color: ${color};">${spot.threatScore}</span>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const marker = L.marker([spot.lat, spot.lng], { icon: customIcon }).addTo(layerGroup);
        marker.on("click", () => {
          onSelectSpot?.(spot);
        });
      });
    }

    // 3. Draw Live Database Incident Markers (Color-coded by Crime Group)
    if (showIncidents && firs && firs.length > 0) {
      firs.forEach((fir, idx) => {
        const lat = Number(fir.Latitude);
        const lng = Number(fir.Longitude);

        // Validate coordinates
        if (isNaN(lat) || isNaN(lng) || lat < 11 || lat > 19 || lng < 74 || lng > 79) {
          return;
        }

        const isSelected = selectedFIR?.ROWID === fir.ROWID;
        const isRecent2026 = fir.Date?.includes("2026") || fir.FIR_Number?.includes("2026") || idx < 5;
        const group = fir.Crime_Group?.toLowerCase() || "";

        let pinColor = "#0ea5e9"; // default sky blue
        let pinIcon = "priority_high";

        if (group.includes("theft") || group.includes("burglary")) {
          pinColor = "#f59e0b"; // amber
          pinIcon = "shield";
        } else if (group.includes("assault") || group.includes("murder") || group.includes("robbery") || group.includes("arson")) {
          pinColor = "#ef4444"; // red
          pinIcon = "warning";
        } else if (group.includes("cyber")) {
          pinColor = "#a855f7"; // purple
          pinIcon = "terminal";
        } else if (group.includes("cheating") || group.includes("fraud")) {
          pinColor = "#06b6d4"; // cyan
          pinIcon = "gavel";
        }

        const incidentIcon = L.divIcon({
          className: "custom-fir-incident-pin",
          html: `
            <div class="relative flex items-center justify-center -translate-x-1/2 -translate-y-1/2 cursor-pointer group">
              ${
                isRecent2026
                  ? `<div class="absolute -inset-1.5 rounded-full border opacity-75 animate-ping" style="border-color: ${pinColor}"></div>`
                  : ""
              }
              <div class="flex items-center justify-center rounded-full border bg-zinc-950/90 shadow-lg transition-transform duration-200 ${
                isSelected ? "scale-135 ring-2 ring-white" : "hover:scale-125"
              }" style="width: ${isSelected ? "22px" : "16px"}; height: ${
            isSelected ? "22px" : "16px"
          }; border-color: ${pinColor}; box-shadow: 0 0 10px ${pinColor};">
                <span class="size-1.5 rounded-full" style="background-color: ${pinColor};"></span>
              </div>
            </div>
          `,
          iconSize: [0, 0],
        });

        const incidentMarker = L.marker([lat, lng], { icon: incidentIcon }).addTo(layerGroup);
        incidentMarker.on("click", () => {
          onSelectFIR?.(fir);
        });
      });
    }
  }, [showIncidents, showHotspots, showPatrols, activeSpot, selectedFIR, firs, onSelectSpot, onSelectFIR]);

  return (
    <div className="absolute inset-0 overflow-hidden bg-[#07080c]">
      {/* Real Geographic Map Tile Container */}
      <div ref={mapContainerRef} className="absolute inset-0 h-full w-full z-0" />

      {/* Subtle Tactical HUD Grid Overlay */}
      <div
        aria-hidden="true"
        className="pointer-events-none absolute inset-0 opacity-20 z-10"
        style={{
          backgroundImage:
            "linear-gradient(to right, rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(to bottom, rgba(255,255,255,0.03) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />
    </div>
  );
}
