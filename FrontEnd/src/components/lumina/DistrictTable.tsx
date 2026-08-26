type Risk = "High" | "Medium" | "Low";

const riskStyles: Record<Risk, string> = {
  High: "border-signal-critical/50 bg-signal-critical/10 text-signal-critical",
  Medium: "border-signal-warning/50 bg-signal-warning/10 text-signal-warning",
  Low: "border-signal-ok/50 bg-signal-ok/10 text-signal-ok",
};

const districts: { name: string; population: string; firs: string; risk: Risk }[] = [
  { name: "Bengaluru Urban", population: "9,621,551", firs: "1,245", risk: "High" },
  { name: "Mysuru", population: "3,001,127", firs: "412", risk: "Medium" },
  { name: "Dakshina Kannada", population: "2,089,649", firs: "298", risk: "Medium" },
  { name: "Udupi", population: "1,177,361", firs: "85", risk: "Low" },
];

export function DistrictTable() {
  return (
    <section className="glass-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline bg-surface-1/40 p-4">
        <h2 className="rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 font-display text-headline-md">
          District Crime Summary
        </h2>
        <div className="flex gap-2">
          {["search", "filter_list"].map((icon) => (
            <button
              key={icon}
              type="button"
              aria-label={icon === "search" ? "Search districts" : "Filter districts"}
              className="flex size-8 items-center justify-center rounded-full border border-hairline bg-surface-1 text-muted-foreground transition-colors hover:text-foreground"
            >
              <span className="material-symbols-outlined text-sm">{icon}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="w-full overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            <tr className="border-b border-hairline bg-shell font-mono text-label-sm text-muted-foreground/70">
              <th className="px-6 py-3 font-medium uppercase tracking-[0.1em]">District</th>
              <th className="px-6 py-3 text-right font-medium uppercase tracking-[0.1em]">
                Population
              </th>
              <th className="px-6 py-3 text-right font-medium uppercase tracking-[0.1em]">
                Total FIRs
              </th>
              <th className="px-6 py-3 text-center font-medium uppercase tracking-[0.1em]">
                Risk Level
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-border font-mono text-label-md">
            {districts.map((d) => (
              <tr key={d.name} className="h-12 transition-colors hover:bg-accent/40">
                <td className="px-6 py-2 font-semibold text-foreground">{d.name}</td>
                <td className="px-6 py-2 text-right text-muted-foreground">{d.population}</td>
                <td className="px-6 py-2 text-right font-bold text-foreground">{d.firs}</td>
                <td className="px-6 py-2 text-center">
                  <span
                    className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${riskStyles[d.risk]}`}
                  >
                    {d.risk}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </section>
  );
}
