interface FirStatusDonutProps {
  statusBreakdown?: Record<string, number>;
  totalFirs?: number;
}

const DEFAULT_SEGMENTS = [
  { label: "Under Invest.", key: "Under Investigation", value: 520, color: "var(--primary)" },
  { label: "Chargesheeted", key: "Chargesheeted", value: 340, color: "var(--signal-ok)" },
  { label: "Closed", key: "Closed", value: 180, color: "var(--signal-warning)" },
];

export function FirStatusDonut({ statusBreakdown, totalFirs }: FirStatusDonutProps) {
  const segments = statusBreakdown
    ? [
        {
          label: "Under Invest.",
          value: statusBreakdown["Under Investigation"] || statusBreakdown["under investigation"] || 0,
          color: "var(--primary)",
        },
        {
          label: "Chargesheeted",
          value: statusBreakdown["Chargesheeted"] || statusBreakdown["chargesheeted"] || 0,
          color: "var(--signal-ok)",
        },
        {
          label: "Closed",
          value: (statusBreakdown["Closed"] || 0) + (statusBreakdown["Convicted"] || 0) + (statusBreakdown["Acquitted"] || 0),
          color: "var(--signal-warning)",
        },
      ]
    : DEFAULT_SEGMENTS;

  const calculatedTotal = segments.reduce((sum, s) => sum + s.value, 0) || 1;
  const displayTotal = totalFirs !== undefined ? totalFirs : calculatedTotal;

  function buildGradient() {
    let acc = 0;
    const stops = segments.map((s) => {
      const start = (acc / calculatedTotal) * 100;
      acc += s.value;
      const end = (acc / calculatedTotal) * 100;
      return `${s.color} ${start}% ${end}%`;
    });
    return `conic-gradient(${stops.join(", ")})`;
  }

  return (
    <section className="glass-panel flex flex-col items-center p-6">
      <div className="mb-6 flex w-full items-center justify-between">
        <h2 className="rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 font-display text-headline-md">
          FIR Status
        </h2>
        <button
          type="button"
          aria-label="Chart options"
          className="text-muted-foreground transition-colors hover:text-foreground"
        >
          <span className="material-symbols-outlined">more_horiz</span>
        </button>
      </div>

      <div className="relative mt-4 flex size-48 items-center justify-center">
        <div className="absolute inset-0 rounded-full transition-all duration-700" style={{ background: buildGradient() }} />
        <div className="absolute inset-3 rounded-full bg-shell shadow-[inset_0_0_24px_rgba(0,0,0,0.85)]" />
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-display text-display-lg text-foreground">
            {displayTotal.toLocaleString()}
          </span>
          <span className="mt-1 font-mono text-label-sm tracking-[0.2em] uppercase text-muted-foreground">
            Total
          </span>
        </div>
      </div>

      <ul className="mt-10 grid w-full grid-cols-2 gap-x-2 gap-y-4 pl-2 font-mono text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}: </span>
            <span className="font-semibold text-foreground">{s.value}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
