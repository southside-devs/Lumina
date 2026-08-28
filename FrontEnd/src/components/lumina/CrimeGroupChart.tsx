const bars = [
  { label: "Theft", value: 80, width: "80%", fill: "bg-primary" },
  { label: "Assault", value: 60, width: "60%", fill: "bg-primary/70" },
  { label: "Burglary", value: 45, width: "45%", fill: "bg-primary/50" },
  { label: "Fraud", value: 30, width: "30%", fill: "bg-primary/30" },
  { label: "Cybercrime", value: 15, width: "15%", fill: "bg-primary/20" },
];

export function CrimeGroupChart() {
  return (
    <section className="glass-panel p-6 lg:col-span-2">
      <div className="mb-6 flex items-center justify-between">
        <h2 className="rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 font-display text-headline-md">
          FIRs by Crime Group
        </h2>
        <button
          type="button"
          aria-label="Chart options"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <ul className="mt-8 space-y-5 px-1 sm:px-4">
        {bars.map((bar) => (
          <li key={bar.label} className="flex items-center">
            <span className="w-24 pr-4 text-right font-mono text-label-md text-muted-foreground sm:w-32">
              {bar.label}
            </span>
            <div className="h-2 flex-1 overflow-hidden rounded-full bg-surface-1">
              <div className={`h-full rounded-full ${bar.fill}`} style={{ width: bar.width }} />
            </div>
            <span className="w-12 text-right font-mono text-label-md font-bold text-foreground">
              {bar.value}
            </span>
          </li>
        ))}
      </ul>
    </section>
  );
}
