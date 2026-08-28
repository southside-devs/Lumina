import { Link } from "@tanstack/react-router";

const statuses = [
  { dot: "bg-signal-ok", label: "Nodes", value: "124" },
  { dot: "bg-signal-warning", label: "Alerts", value: "3" },
  { dot: "bg-muted-foreground", label: "System", value: "99.9%" },
];

export function TopBar() {
  return (
    <header className="fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar px-5">
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-1 text-muted-foreground">
          <button
            type="button"
            aria-label="Back"
            className="rounded transition-colors hover:text-foreground"
          >
            <span className="material-symbols-outlined text-base">chevron_left</span>
          </button>
          <button
            type="button"
            aria-label="Forward"
            className="rounded transition-colors hover:text-foreground"
          >
            <span className="material-symbols-outlined text-base">chevron_right</span>
          </button>
        </div>
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-4 py-1.5">
          <span className="material-symbols-outlined text-sm text-muted-foreground">lock</span>
          <span className="font-mono text-label-md tracking-[0.2em] text-foreground">LUMINA</span>
        </div>
      </div>

      <div className="hidden items-center gap-6 font-mono text-label-sm lg:flex">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${s.dot}`} />
            <span className="uppercase tracking-wider text-muted-foreground">
              {s.label}: <span className="text-foreground">{s.value}</span>
            </span>
          </div>
        ))}
      </div>

      <div className="flex items-center gap-4">
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
            className="w-64 rounded-full border border-input bg-surface-1 py-1.5 pr-9 pl-9 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-ring focus:outline-none"
          />
          <span className="material-symbols-outlined absolute right-3 text-xs text-muted-foreground opacity-50">
            keyboard_command_key
          </span>
        </div>

        <Link
          to="/network"
          title="Network Topology (Share)"
          aria-label="Network Topology"
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="material-symbols-outlined">share</span>
        </Link>

        <button
          type="button"
          aria-label="Notifications"
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="material-symbols-outlined">notifications</span>
          <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-topbar bg-signal-critical" />
        </button>

        <button
          type="button"
          className="flex items-center gap-2 rounded border-l border-hairline p-1 pl-3 transition-colors hover:bg-accent"
        >
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
        </button>
      </div>
    </header>
  );
}
