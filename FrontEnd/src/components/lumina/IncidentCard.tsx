import type { TacticalHotspot } from "./TacticalMap";

interface IncidentCardProps {
  onClose: () => void;
  spot?: TacticalHotspot;
}

export function IncidentCard({ onClose, spot }: IncidentCardProps) {
  const name = spot?.name || "Bengaluru Urban";
  const code = spot?.code || "BLR-U";
  const firCount = spot?.firCount || 523;
  const threatScore = spot?.threatScore || 94;
  const activePatrol = spot?.activePatrol || "Patrol Unit Alpha-4 (Indiranagar → MG Road)";
  const distance = spot?.distance || "3.8 km";
  const eta = spot?.eta || "~6m";
  const category = spot?.category || "Theft & Cybercrime";

  const isCritical = threatScore >= 85;
  const threatPercent = Math.min(threatScore, 100);

  return (
    <aside className="glass-panel w-[22rem] bg-surface-1/90 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.7)] backdrop-blur-2xl border border-zinc-800/80 rounded-2xl transition-all">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-muted-foreground">
          local_police
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-headline-md leading-none text-white">{name}</h2>
            <span
              className={`rounded border px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase ${
                isCritical
                  ? "border-red-500/50 bg-red-500/10 text-red-400"
                  : "border-amber-500/50 bg-amber-500/10 text-amber-400"
              }`}
            >
              {isCritical ? "Critical" : "Monitored"}
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground font-mono">Division: {code} • {category}</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss incident"
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground p-1"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      {/* Active Patrol Telemetry */}
      <div className="mt-4 rounded-xl border border-hairline bg-surface-2/60 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-xs font-medium text-foreground truncate max-w-[200px]" title={activePatrol}>
            {activePatrol}
          </span>
          <span className="font-mono text-label-md text-muted-foreground">{distance}</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div
            className={`h-full rounded-full transition-all duration-500 ${
              isCritical ? "bg-red-500" : "bg-amber-400"
            }`}
            style={{ width: `${Math.min(threatPercent, 90)}%` }}
          />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-label-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">schedule</span>
            ETA: {eta}
          </span>
          <span className="text-sky-400 font-bold">1.2 km to checkpoint</span>
        </div>
      </div>

      {/* Threat Index & Active FIRs */}
      <div className="mt-3 grid grid-cols-2 gap-3">
        {/* Threat Index Gauge */}
        <div className="rounded-xl border border-hairline bg-surface-2/60 p-3">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-sm uppercase text-muted-foreground">Threat</span>
            <span
              className={`rounded px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase ${
                isCritical ? "bg-red-500/20 text-red-400" : "bg-amber-500/20 text-amber-400"
              }`}
            >
              {threatScore}/100
            </span>
          </div>
          <div className="mt-2 flex flex-col items-center">
            <div
              className="relative flex size-[76px] items-center justify-center rounded-full"
              style={{
                background: `conic-gradient(from 200deg, var(--signal-ok) 0% 20%, var(--signal-warning) 20% 50%, var(--signal-critical) 50% ${Math.round(
                  (threatPercent / 100) * 80
                )}%, transparent ${Math.round((threatPercent / 100) * 80)}% 100%)`,
              }}
            >
              <div className="absolute inset-2 rounded-full bg-surface-1" />
              <span className="relative font-display text-lg font-bold text-white">
                {threatScore}%
              </span>
            </div>
          </div>
        </div>

        {/* Active Database FIRs */}
        <div className="rounded-xl border border-hairline bg-surface-2/60 p-3">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-sm uppercase text-muted-foreground">Active FIRs</span>
            <span className="rounded bg-sky-500/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-sky-400">
              Live
            </span>
          </div>
          <div className="mt-2 flex flex-col items-center justify-center h-[76px]">
            <span className="font-display text-2xl font-bold text-sky-400">{firCount}</span>
            <span className="font-mono text-[10px] text-muted-foreground uppercase">Incidents</span>
          </div>
        </div>
      </div>
    </aside>
  );
}
