import { useState } from "react";

export interface TacticalHotspot {
  id: string;
  name: string;
  code: string;
  lat: number;
  lng: number;
  top: string;
  left: string;
  size: number;
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
    top: "70%",
    left: "66%",
    size: 260,
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
    top: "28%",
    left: "28%",
    size: 210,
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
    top: "76%",
    left: "32%",
    size: 190,
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
    top: "84%",
    left: "58%",
    size: 180,
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
    top: "16%",
    left: "64%",
    size: 200,
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
    top: "40%",
    left: "40%",
    size: 170,
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
    top: "44%",
    left: "66%",
    size: 160,
    threatScore: 80,
    firCount: 152,
    category: "Extortion & Illegal Transport",
    activePatrol: "Patrol Sector-9 (Cowl Bazaar → Cantonment)",
    eta: "~15m",
    distance: "9.5 km",
  },
];

interface TacticalMapProps {
  showHotspots: boolean;
  showPatrols?: boolean;
  activeSpot?: TacticalHotspot;
  onSelectSpot?: (spot: TacticalHotspot) => void;
}

export function TacticalMap({
  showHotspots,
  showPatrols = true,
  activeSpot,
  onSelectSpot,
}: TacticalMapProps) {
  const [hoveredSpot, setHoveredSpot] = useState<TacticalHotspot | null>(null);

  return (
    <div className="absolute inset-0 overflow-hidden bg-shell select-none">
      {/* Background Tactical Coordinates Grid */}
      <div
        aria-hidden="true"
        className="absolute inset-0 opacity-40 pointer-events-none"
        style={{
          backgroundImage:
            "linear-gradient(to right, color-mix(in oklab, white 6%, transparent) 1px, transparent 1px), linear-gradient(to bottom, color-mix(in oklab, white 6%, transparent) 1px, transparent 1px)",
          backgroundSize: "64px 64px",
        }}
      />

      {/* Radar Center Crosshairs */}
      <div className="pointer-events-none absolute inset-0 flex items-center justify-center opacity-30">
        <div className="h-[75vw] w-[75vw] max-h-[850px] max-w-[850px] rounded-full border border-dashed border-zinc-700/60" />
        <div className="absolute h-[50vw] w-[50vw] max-h-[550px] max-w-[550px] rounded-full border border-zinc-700/40" />
        <div className="absolute h-full w-px bg-zinc-800/40" />
        <div className="absolute w-full h-px bg-zinc-800/40" />
      </div>

      {/* Patrol Vector Lines */}
      {showPatrols && (
        <svg className="absolute inset-0 h-full w-full pointer-events-none">
          {/* Hubballi -> Belagavi */}
          <line
            x1="40%"
            y1="40%"
            x2="28%"
            y2="28%"
            stroke="#0ea5e9"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="opacity-60 animate-pulse"
          />
          {/* Bengaluru -> Mysuru */}
          <line
            x1="66%"
            y1="70%"
            x2="58%"
            y2="84%"
            stroke="#ef4444"
            strokeWidth="2"
            strokeDasharray="4 4"
            className="opacity-70"
          />
          {/* Bengaluru -> Mangaluru */}
          <line
            x1="66%"
            y1="70%"
            x2="32%"
            y2="76%"
            stroke="#eab308"
            strokeWidth="1.5"
            strokeDasharray="8 4"
            className="opacity-50"
          />
          {/* Ballari -> Kalaburagi */}
          <line
            x1="66%"
            y1="44%"
            x2="64%"
            y2="16%"
            stroke="#a855f7"
            strokeWidth="1.5"
            strokeDasharray="6 6"
            className="opacity-50"
          />
        </svg>
      )}

      {/* Ambient Hotspot Glows */}
      {showHotspots &&
        KARNATAKA_HOTSPOTS.map((h) => {
          const isSelected = activeSpot?.id === h.id;
          const isCritical = h.threatScore >= 85;
          const glowColor = isCritical ? "rgba(239, 68, 68, 0.45)" : "rgba(234, 179, 8, 0.35)";

          return (
            <div
              key={`glow-${h.id}`}
              aria-hidden="true"
              className="absolute -translate-x-1/2 -translate-y-1/2 rounded-full blur-3xl pointer-events-none transition-all duration-700"
              style={{
                top: h.top,
                left: h.left,
                width: isSelected ? h.size * 1.3 : h.size,
                height: isSelected ? h.size * 1.3 : h.size,
                background: `radial-gradient(circle, ${glowColor} 0%, transparent 70%)`,
              }}
            />
          );
        })}

      {/* Interactive Hotspot Node Markers */}
      {KARNATAKA_HOTSPOTS.map((h) => {
        const isSelected = activeSpot?.id === h.id;
        const isHovered = hoveredSpot?.id === h.id;
        const isCritical = h.threatScore >= 85;
        const color = isCritical ? "#ef4444" : "#eab308";

        return (
          <div
            key={h.id}
            onClick={() => onSelectSpot?.(h)}
            onMouseEnter={() => setHoveredSpot(h)}
            onMouseLeave={() => setHoveredSpot(null)}
            style={{ top: h.top, left: h.left }}
            className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
              isSelected ? "z-30 scale-125" : "z-20 hover:scale-110"
            }`}
          >
            {/* Pulse Wave */}
            <div
              className="absolute -inset-2 rounded-full border opacity-75 animate-ping"
              style={{ borderColor: color }}
            />

            {/* Target Outer Ring */}
            <div
              className="flex items-center justify-center rounded-full border bg-zinc-950/80 shadow-2xl backdrop-blur-md"
              style={{
                width: isSelected ? "42px" : "34px",
                height: isSelected ? "42px" : "34px",
                borderColor: color,
                boxShadow: `0 0 16px ${color}`,
              }}
            >
              <span
                className="font-mono text-[10px] font-bold"
                style={{ color }}
              >
                {h.code}
              </span>
            </div>

            {/* Tactical Label Pill */}
            <div className="absolute top-full left-1/2 mt-1.5 -translate-x-1/2 whitespace-nowrap rounded-md border border-zinc-800 bg-zinc-950/90 px-2 py-0.5 font-mono text-[9px] text-zinc-300 shadow-lg backdrop-blur-md">
              <span className="font-semibold text-white">{h.name}</span>
              <span className="ml-1.5 font-bold" style={{ color }}>
                {h.threatScore}
              </span>
            </div>

            {/* Extended Tooltip on Hover */}
            {isHovered && !isSelected && (
              <div className="absolute bottom-full left-1/2 mb-2 -translate-x-1/2 whitespace-nowrap rounded-xl border border-zinc-700 bg-zinc-950/95 p-3 shadow-2xl backdrop-blur-2xl z-40">
                <div className="flex items-center justify-between gap-4 font-mono text-[10px] uppercase text-zinc-400">
                  <span>{h.name}</span>
                  <span className="font-bold" style={{ color }}>
                    Threat {h.threatScore}/100
                  </span>
                </div>
                <div className="mt-1 font-mono text-xs text-white">
                  Active FIRs: <span className="font-bold text-sky-400">{h.firCount}</span>
                </div>
                <div className="text-[10px] text-zinc-400 font-sans mt-0.5">
                  Category: <span className="text-zinc-200">{h.category}</span>
                </div>
                <div className="text-[9px] font-mono text-zinc-500 mt-1">
                  Coordinates: {h.lat.toFixed(2)}°N, {h.lng.toFixed(2)}°E
                </div>
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
