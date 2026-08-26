export function IncidentCard({ onClose }: { onClose: () => void }) {
  return (
    <aside className="glass-panel w-[21rem] bg-surface-1/85 p-4 shadow-[0_20px_60px_rgba(0,0,0,0.6)] backdrop-blur-xl">
      <div className="flex items-start gap-3">
        <span className="material-symbols-outlined mt-0.5 text-muted-foreground">
          directions_car
        </span>
        <div className="flex-1">
          <div className="flex items-center gap-2">
            <h2 className="font-display text-headline-md leading-none">CR-2026-8921</h2>
            <span className="rounded border border-signal-ok/50 bg-signal-ok/10 px-1.5 py-0.5 font-mono text-[9px] font-bold tracking-wider uppercase text-signal-ok">
              Active
            </span>
          </div>
          <p className="mt-1 text-xs text-muted-foreground">Patrol Unit Alpha-4</p>
        </div>
        <button
          type="button"
          aria-label="Dismiss incident"
          onClick={onClose}
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="material-symbols-outlined text-base">close</span>
        </button>
      </div>

      <div className="mt-4 rounded-md border border-hairline bg-surface-2/60 p-3">
        <div className="flex items-baseline justify-between">
          <span className="text-sm font-medium text-foreground">MG Road → Indiranagar</span>
          <span className="font-mono text-label-md text-muted-foreground">4.2 km</span>
        </div>
        <div className="mt-2 h-1.5 overflow-hidden rounded-full bg-surface-3">
          <div className="h-full w-[72%] rounded-full bg-signal-warning" />
        </div>
        <div className="mt-2 flex items-center justify-between font-mono text-label-sm text-muted-foreground">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-[12px]">schedule</span>~8m
          </span>
          <span>1.2 km left</span>
        </div>
      </div>

      <div className="mt-3 grid grid-cols-2 gap-3">
        <div className="rounded-md border border-hairline bg-surface-2/60 p-3">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-sm uppercase text-muted-foreground">Risk</span>
            <span className="rounded bg-signal-critical/15 px-1.5 py-0.5 font-mono text-[9px] font-bold uppercase text-signal-critical">
              High
            </span>
          </div>
          <div className="mt-2 flex flex-col items-center">
            <div
              className="relative flex size-[76px] items-center justify-center rounded-full"
              style={{
                background:
                  "conic-gradient(from 200deg, var(--signal-ok) 0% 18%, var(--signal-warning) 18% 34%, var(--signal-critical) 34% 44%, transparent 44% 100%)",
              }}
            >
              <div className="absolute inset-2 rounded-full bg-surface-1" />
              <span className="relative font-display text-lg font-bold">75%</span>
            </div>
          </div>
        </div>

        <div className="rounded-md border border-hairline bg-surface-2/60 p-3">
          <div className="flex items-start justify-between">
            <span className="font-mono text-label-sm uppercase text-muted-foreground">Threat</span>
            <span className="rounded bg-signal-warning/15 px-1.5 py-0.5 font-mono text-[9px] font-bold text-signal-warning">
              7.8
            </span>
          </div>
          <div className="mt-2 flex justify-center">
            <div className="flex size-[76px] items-center justify-center rounded-full border-[3px] border-signal-warning">
              <span className="font-display text-lg font-bold text-foreground">7.8</span>
            </div>
          </div>
        </div>
      </div>
    </aside>
  );
}
