import { Link } from "@tanstack/react-router";

const statuses = [
  { dot: "bg-signal-ok", label: "Nodes", value: "124" },
  { dot: "bg-signal-warning", label: "Alerts", value: "3" },
  { dot: "bg-muted-foreground", label: "System", value: "99.9%" },
];

export function TopBar() {
  return (
    <header className="fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar px-5">
      {/* Left: Brand lockup */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-4 py-1.5">
          <span className="material-symbols-outlined text-sm text-muted-foreground">lock</span>
          <span className="font-mono text-label-md tracking-[0.2em] text-foreground">LUMINA</span>
        </div>
      </div>

      {/* Centre: read-only system status indicators */}
      <div className="hidden items-center gap-6 font-mono text-label-sm lg:flex" aria-label="System status">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-2 select-none">
            <span className={`size-1.5 rounded-full ${s.dot}`} />
            <span className="uppercase tracking-wider text-muted-foreground/70">
              {s.label}
            </span>
            <span className="font-semibold text-foreground">{s.value}</span>
          </div>
        ))}
      </div>

      {/* Right: actions */}
      <div className="flex items-center gap-3">
        <div className="relative hidden items-center md:flex">
          <span className="material-symbols-outlined absolute left-3 text-sm text-muted-foreground">
            search
          </span>
          <label className="sr-only" htmlFor="intel-search">
            Search intelligence
          </label>
          <input
            id="intel-search"
            type="text"
            placeholder="Search Intelligence..."
            className="w-56 rounded-full border border-input bg-surface-1 py-1.5 pr-9 pl-9 text-sm text-foreground transition-all placeholder:text-muted-foreground/50 focus:border-primary focus:ring-1 focus:ring-ring focus:outline-none"
          />
          <span className="material-symbols-outlined absolute right-3 text-xs text-muted-foreground opacity-40">
            keyboard_command_key
          </span>
        </div>

        <Link
          to="/network"
          title="Network Topology"
          aria-label="Network Topology"
          className="flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="material-symbols-outlined text-[20px]">share</span>
        </Link>

        <button
          type="button"
          aria-label="Notifications"
          className="relative flex size-8 items-center justify-center rounded-lg text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="material-symbols-outlined text-[20px]">notifications</span>
          <span className="absolute top-1 right-1 size-1.5 rounded-full bg-signal-critical" />
        </button>

        <div className="flex items-center gap-2 border-l border-hairline pl-3">
          <span className="flex size-7 items-center justify-center rounded-full bg-signal-agent text-[11px] font-bold text-foreground">
            RK
          </span>
          <span className="hidden flex-col items-start sm:flex">
            <span className="text-xs leading-none font-semibold">Insp. R. Kumar</span>
            <span className="mt-0.5 text-[10px] leading-none text-muted-foreground">Cmd Center</span>
          </span>
        </div>
      </div>
    </header>
  );
}
