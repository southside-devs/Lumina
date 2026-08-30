import { useState, useRef, useEffect, useCallback } from "react";

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
      className="flex items-center gap-2.5 text-sm text-foreground cursor-pointer select-none"
    >
      <span className={`transition-colors duration-200 ${on ? "text-foreground" : "text-muted-foreground"}`}>
        {label}
      </span>
      <span
        className={`relative inline-flex h-[22px] w-[42px] shrink-0 rounded-full transition-colors duration-200 ease-in-out ${
          on ? "bg-blue-500" : "bg-zinc-700"
        }`}
      >
        <span
          className={`pointer-events-none inline-block size-[18px] rounded-full bg-white shadow-md ring-0 transition-transform duration-200 ease-in-out self-center ${
            on ? "translate-x-[22px]" : "translate-x-[2px]"
          }`}
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
  onResetView?: () => void;

  onClusterTuned?: (params: { epsSpatial: number; epsTemporal: number; minPts: number }) => void;
};

export function MapToolbar({
  showIncidents = false,
  onToggleIncidents,
  showHotspots,
  onToggleHotspots,
  onResetView,
  onClusterTuned,
}: MapToolbarProps) {

  const [showConfig, setShowConfig] = useState(false);
  const [epsSpatial, setEpsSpatial] = useState(12.0);
  const [epsTemporal, setEpsTemporal] = useState(45);
  const [minPts, setMinPts] = useState(4);
  const debounceTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  // Debounced parent notification for silky-smooth 60fps dragging
  const notifyParent = useCallback(
    (s: number, t: number, m: number, immediate = false) => {
      if (debounceTimerRef.current) {
        clearTimeout(debounceTimerRef.current);
      }
      if (immediate) {
        onClusterTuned?.({ epsSpatial: s, epsTemporal: t, minPts: m });
      } else {
        debounceTimerRef.current = setTimeout(() => {
          onClusterTuned?.({ epsSpatial: s, epsTemporal: t, minPts: m });
        }, 120);
      }
    },
    [onClusterTuned]
  );

  useEffect(() => {
    return () => {
      if (debounceTimerRef.current) clearTimeout(debounceTimerRef.current);
    };
  }, []);

  const handleSpatialChange = (val: number) => {
    setEpsSpatial(val);
    notifyParent(val, epsTemporal, minPts);
  };

  const handleTemporalChange = (val: number) => {
    setEpsTemporal(val);
    notifyParent(epsSpatial, val, minPts);
  };

  const handleMinPtsChange = (val: number) => {
    setMinPts(val);
    notifyParent(epsSpatial, epsTemporal, val);
  };

  const applyPreset = (s: number, t: number, m: number) => {
    setEpsSpatial(s);
    setEpsTemporal(t);
    setMinPts(m);
    notifyParent(s, t, m, true);
  };

  return (
    <div className="relative">
      {/* Parameter Tuning Popup */}
      {showConfig && (
        <div className="absolute bottom-full left-1/2 mb-3 -translate-x-1/2 w-88 rounded-2xl border border-zinc-700 bg-zinc-950/95 p-4 shadow-2xl backdrop-blur-2xl z-50 space-y-4 animate-in fade-in zoom-in-95">
          <div className="flex items-center justify-between border-b border-zinc-800 pb-2">
            <div className="flex items-center gap-2">
              <span className="material-symbols-outlined text-sm text-teal-400">tune</span>
              <span className="font-mono text-xs font-bold uppercase text-white">ST-DBSCAN Clustering Model</span>
            </div>
            <button
              type="button"
              onClick={() => setShowConfig(false)}
              className="text-zinc-400 hover:text-white p-0.5 cursor-pointer text-sm"
            >
              ✕
            </button>
          </div>

          {/* Quick Presets */}
          <div className="grid grid-cols-3 gap-1.5 pt-0.5">
            <button
              type="button"
              onClick={() => applyPreset(12.0, 45, 4)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                epsSpatial === 12.0 && epsTemporal === 45 && minPts === 4
                  ? "bg-slate-300 text-zinc-950 border-white font-bold"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
              }`}
            >
              Statewide (Default)
            </button>
            <button
              type="button"
              onClick={() => applyPreset(4.0, 14, 6)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                epsSpatial === 4.0 && epsTemporal === 14 && minPts === 6
                  ? "bg-slate-300 text-zinc-950 border-white font-bold"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
              }`}
            >
              Urban Waves
            </button>
            <button
              type="button"
              onClick={() => applyPreset(25.0, 90, 3)}
              className={`px-2 py-1 rounded text-[10px] font-mono transition-colors cursor-pointer border ${
                epsSpatial === 25.0 && epsTemporal === 90 && minPts === 3
                  ? "bg-slate-300 text-zinc-950 border-white font-bold"
                  : "bg-zinc-900 text-zinc-400 border-zinc-800 hover:text-white hover:bg-zinc-800"
              }`}
            >
              Broad Regional
            </button>
          </div>

          {/* Spatial Epsilon */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-zinc-300">
              <span className="flex items-center gap-1">
                <span className="text-sky-400 font-bold">εs</span> Spatial Radius
              </span>
              <span className="font-bold text-sky-400 bg-sky-950/60 px-1.5 py-0.5 rounded border border-sky-800/50">
                {epsSpatial.toFixed(1)} km
              </span>
            </div>
            <input
              type="range"
              min="2.0"
              max="35.0"
              step="0.5"
              value={epsSpatial}
              onChange={(e) => handleSpatialChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-sky-400"
            />
          </div>

          {/* Temporal Epsilon */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-zinc-300">
              <span className="flex items-center gap-1">
                <span className="text-amber-400 font-bold">εt</span> Temporal Window
              </span>
              <span className="font-bold text-amber-400 bg-amber-950/60 px-1.5 py-0.5 rounded border border-amber-800/50">
                {epsTemporal} Days
              </span>
            </div>
            <input
              type="range"
              min="7"
              max="120"
              step="1"
              value={epsTemporal}
              onChange={(e) => handleTemporalChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-amber-400"
            />
          </div>

          {/* Min Samples */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-mono text-[11px] text-zinc-300">
              <span className="flex items-center gap-1">
                <span className="text-red-400 font-bold">MinPts</span> Minimum Incidents
              </span>
              <span className="font-bold text-red-400 bg-red-950/60 px-1.5 py-0.5 rounded border border-red-800/50">
                {minPts} events
              </span>
            </div>
            <input
              type="range"
              min="2"
              max="16"
              step="1"
              value={minPts}
              onChange={(e) => handleMinPtsChange(Number(e.target.value))}
              className="w-full h-2 bg-zinc-800 rounded-lg appearance-none cursor-pointer accent-red-400"
            />
          </div>

          <div className="font-mono text-[10px] text-zinc-500 pt-2 border-t border-zinc-900 flex justify-between items-center">
            <span>AppSail NumPy Engine</span>
            <span className="text-emerald-400 font-bold flex items-center gap-1">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse"></span>
              REAL-TIME RE-CLUSTER
            </span>
          </div>
        </div>
      )}

      {/* Main Bar */}
      <div className="glass-panel flex flex-wrap items-center gap-4 bg-surface-1/80 px-4 py-2 backdrop-blur-xl rounded-full border border-hairline shadow-2xl">
        {onToggleIncidents && (
          <Toggle label="Live Incidents" on={showIncidents} onToggle={onToggleIncidents} />
        )}
        <Toggle label="Hotspot Zones" on={showHotspots} onToggle={onToggleHotspots} />
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
