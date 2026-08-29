import { useState } from "react";

function Toggle({
  label,
  on,
  onToggle,
}: {
  label: string;
  on: boolean;
  onToggle: () => void;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={on}
      onClick={onToggle}
      className="flex items-center gap-2 text-xs text-foreground cursor-pointer"
    >
      <span>{label}</span>
      <span
        className={`relative h-4 w-8 rounded-full transition-colors ${on ? "bg-slate-400" : "bg-surface-3"}`}
      >
        <span
          className={`absolute top-0.5 size-3 rounded-full transition-all ${on ? "left-4 bg-slate-900" : "left-0.5 bg-foreground"}`}
        />
      </span>
    </button>
  );
}

export type MapToolbarProps = {
  showIncidents?: boolean;
  onToggleIncidents?: () => void;
  showHotspots: boolean;
  onToggleHotspots: () => void;
  showPatrols: boolean;
  onTogglePatrols: () => void;
  onResetView?: () => void;
  onClusterTuned?: (params: { epsSpatial: number; epsTemporal: number; minPts: number }) => void;
};

export function MapToolbar({
  showIncidents = true,
  onToggleIncidents,
  showHotspots,
  onToggleHotspots,
  showPatrols,
  onTogglePatrols,
  onResetView,
  onClusterTuned,
}: MapToolbarProps) {
  const [showConfig, setShowConfig] = useState(false);
  const [epsSpatial, setEpsSpatial] = useState(12.0);
  const [epsTemporal, setEpsTemporal] = useState(45);
  const [minPts, setMinPts] = useState(4);

  const handleUpdate = (s: number, t: number, m: number) => {
    setEpsSpatial(s);
    setEpsTemporal(t);
    setMinPts(m);
    onClusterTuned?.({ epsSpatial: s, epsTemporal: t, minPts: m });
  };

  return (
    <div className="relative">
      {/* Parameter Tuning Popup */}
      {showConfig && (
        <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 w-84 rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-2xl z-50 space-y-3.5 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-teal-400">tune</span>
              <span className="font-mono text-xs font-bold uppercase text-white">ST-DBSCAN Tuning</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="text-zinc-400 hover:text-white p-0.5 cursor-pointer"
            >
              ✕
            </button>
          </div>

          {/* Spatial Epsilon */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-zinc-400">
              <span>Spatial Radius (εs)</span>
              <span className="font-bold text-sky-400">{epsSpatial} km</span>
            </div>
            <input
              type="range"
              min="2.0"
              max="35.0"
              step="1.0"
              value={epsSpatial}
              onChange={(e) => handleUpdate(Number(e.target.value), epsTemporal, minPts)}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-slate-400"
            />
          </div>

          {/* Temporal Epsilon */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-zinc-400">
              <span>Temporal Window (εt)</span>
              <span className="font-bold text-amber-400">{epsTemporal} Days</span>
            </div>
            <input
              type="range"
              min="7"
              max="120"
              step="1"
              value={epsTemporal}
              onChange={(e) => handleUpdate(epsSpatial, Number(e.target.value), minPts)}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-slate-400"
            />
          </div>

          {/* Min Samples */}
          <div className="space-y-1">
            <div className="flex justify-between font-mono text-[10px] text-zinc-400">
              <span>Min Cluster Incidents (MinPts)</span>
              <span className="font-bold text-red-400">{minPts} points</span>
            </div>
            <input
              type="range"
              min="2"
              max="20"
              step="1"
              value={minPts}
              onChange={(e) => handleUpdate(epsSpatial, epsTemporal, Number(e.target.value))}
              className="w-full h-1 bg-zinc-800 rounded appearance-none cursor-pointer accent-slate-400"
            />
          </div>


          <div className="font-mono text-[9px] text-zinc-500 pt-1 border-t border-zinc-900 flex justify-between">
            <span>AppSail Python Runtime</span>
            <span className="text-emerald-400 font-bold">LIVE RE-CLUSTER</span>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="glass-panel flex flex-wrap items-center gap-4 bg-surface-1/80 px-4 py-2 backdrop-blur-xl rounded-full border border-hairline shadow-2xl">
        {onToggleIncidents && (
          <Toggle label="Live Incidents" on={showIncidents} onToggle={onToggleIncidents} />
        )}
        <Toggle label="Hotspot Zones" on={showHotspots} onToggle={onToggleHotspots} />
        <Toggle label="Patrol Units" on={showPatrols} onToggle={onTogglePatrols} />
        <span className="h-5 w-px bg-hairline" />

        {/* ST-DBSCAN Parameters CTA */}
        <button
          type="button"
          onClick={() => setShowConfig(!showConfig)}
          title="Tune ST-DBSCAN Parameters"
          className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg font-mono text-xs transition-colors cursor-pointer ${
            showConfig
              ? "bg-slate-400/15 text-slate-200 border border-slate-400/30"
              : "text-muted-foreground hover:bg-accent hover:text-foreground"
          }`}
        >
          <span className="material-symbols-outlined text-sm">tune</span>
          <span>ST-DBSCAN</span>
        </button>

        {/* Reset View Button */}
        {onResetView && (
          <button
            type="button"
            onClick={onResetView}
            title="Reset Map View to Karnataka State"
            className="flex items-center gap-1 px-2 py-1 rounded-lg font-mono text-xs text-muted-foreground hover:bg-accent hover:text-foreground transition-colors cursor-pointer"
          >
            <span className="material-symbols-outlined text-sm">center_focus_strong</span>
            <span>Reset</span>
          </button>
        )}
      </div>
    </div>
  );
}



