const statuses = [
  { dot: "bg-signal-ok", label: "Nodes", value: "124" },
  { dot: "bg-signal-warning", label: "Alerts", value: "3" },
  { dot: "bg-muted-foreground", label: "System", value: "99.9%" },
];

export function TopBar() {
  return (
    <header className="pointer-events-none fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar px-5 ui-no-select">
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.45)]">
          <span className="material-symbols-outlined text-sm text-muted-foreground">lock</span>
          <span className="font-mono text-label-md tracking-[0.2em] text-foreground">LUMINA</span>
        </div>
      </div>

      <div className="hidden items-center gap-6 font-mono text-label-sm lg:flex">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${s.dot}`} />
            <span className="uppercase tracking-wider text-muted-foreground">
              {s.label}:{" "}
              <span className="select-text text-foreground">{s.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-3">
        <div className="relative hidden items-center md:flex">
          <span className="material-symbols-outlined absolute left-3 text-sm text-muted-foreground">
            search
          </span>
          <div className="w-56 rounded-full border border-input bg-surface-1 py-1.5 pr-9 pl-9 text-sm text-muted-foreground/60">
            Search Intelligence...
          </div>
          <span className="material-symbols-outlined absolute right-3 text-xs text-muted-foreground opacity-50">
            keyboard_command_key
          </span>
        </div>

        <span className="relative rounded-full p-2 text-muted-foreground" aria-hidden>
          <span className="material-symbols-outlined">share</span>
        </span>

        <span className="relative rounded-full p-2 text-muted-foreground" aria-hidden>
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-topbar bg-signal-critical" />
        </span>

        <div className="flex items-center gap-2 rounded border-l border-hairline p-1 pl-3">
          <span className="flex size-8 items-center justify-center rounded-full bg-signal-agent text-xs font-bold text-foreground">
            RK
          </span>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-xs leading-none font-semibold">Insp. R. Kumar</span>
            <span className="mt-1 text-[10px] leading-none text-muted-foreground">Cmd Center</span>
          </span>
          <span className="material-symbols-outlined text-sm text-muted-foreground">
            arrow_drop_down
          </span>
        </div>
      </div>
    </header>
  );
}
