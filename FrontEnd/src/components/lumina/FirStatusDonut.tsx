const segments = [
  { label: "Under Invest.", value: 52, color: "var(--primary)" },
  { label: "Chargesheeted", value: 34, color: "var(--signal-ok)" },
  { label: "Closed", value: 18, color: "var(--signal-warning)" },
];

const total = segments.reduce((sum, s) => sum + s.value, 0);

function buildGradient() {
  let acc = 0;
  const stops = segments.map((s) => {
    const start = (acc / total) * 100;
    acc += s.value;
    const end = (acc / total) * 100;
    return `${s.color} ${start}% ${end}%`;
  });
  return `conic-gradient(${stops.join(", ")})`;
}

export function FirStatusDonut() {
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
        <div className="absolute inset-0 rounded-full" style={{ background: buildGradient() }} />
        <div className="absolute inset-3 rounded-full bg-shell shadow-[inset_0_0_24px_rgba(0,0,0,0.85)]" />
        <div className="relative z-10 flex flex-col items-center">
          <span className="font-display text-display-lg text-foreground">104</span>
          <span className="mt-1 font-mono text-label-sm tracking-[0.2em] uppercase text-muted-foreground">
            Total
          </span>
        </div>
      </div>

      <ul className="mt-10 grid w-full grid-cols-2 gap-x-2 gap-y-4 pl-2 font-mono text-xs">
        {segments.map((s) => (
          <li key={s.label} className="flex items-center gap-2">
            <span className="size-2 rounded-full" style={{ backgroundColor: s.color }} />
            <span className="text-muted-foreground">{s.label}</span>
          </li>
        ))}
      </ul>
    </section>
  );
}
