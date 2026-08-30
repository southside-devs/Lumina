import type { DistrictSummary } from "@/lib/api";

type Risk = "High" | "Medium" | "Low";

const riskStyles: Record<Risk, string> = {
  High: "border-signal-critical/50 bg-signal-critical/10 text-signal-critical",
  Medium: "border-signal-warning/50 bg-signal-warning/10 text-signal-warning",
  Low: "border-signal-ok/50 bg-signal-ok/10 text-signal-ok",
};

interface DistrictTableProps {
  districts?: DistrictSummary[];
  loading?: boolean;
}

const DEFAULT_DISTRICTS: DistrictSummary[] = [
  { district_id: 1, district_name: "Bengaluru Urban", population: 9621551, total_firs: 1245, risk_level: "High" },
  { district_id: 2, district_name: "Mysuru", population: 3001127, total_firs: 412, risk_level: "Medium" },
  { district_id: 3, district_name: "Dakshina Kannada", population: 2089649, total_firs: 298, risk_level: "Medium" },
  { district_id: 4, district_name: "Belagavi", population: 4779661, total_firs: 265, risk_level: "Medium" },
  { district_id: 5, district_name: "Udupi", population: 1177361, total_firs: 85, risk_level: "Low" },
];

export function DistrictTable({ districts = DEFAULT_DISTRICTS, loading }: DistrictTableProps) {
  const displayDistricts = districts.length > 0 ? districts : DEFAULT_DISTRICTS;

  return (
    <section className="glass-panel flex flex-col overflow-hidden">
      <div className="flex items-center justify-between border-b border-hairline bg-surface-1/40 p-4">
        <div className="flex items-center gap-3">
          <h2 className="rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 font-display text-headline-md">
            District Crime Summary
          </h2>
          {loading && (
            <span className="flex items-center gap-1.5 font-mono text-xs text-muted-foreground">
              <span className="size-1.5 rounded-full bg-primary animate-ping" />
              Syncing Data Store...
            </span>
          )}
        </div>
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
            {displayDistricts.map((d) => {
              const risk: Risk = d.risk_level || (d.total_firs > 500 ? "High" : d.total_firs > 150 ? "Medium" : "Low");
              return (
                <tr key={String(d.district_id || d.district_name)} className="h-12 transition-colors hover:bg-accent/40">
                  <td className="px-6 py-2 font-semibold text-foreground">{d.district_name}</td>
                  <td className="px-6 py-2 text-right text-muted-foreground">
                    {Number(d.population).toLocaleString()}
                  </td>
                  <td className="px-6 py-2 text-right font-bold text-foreground">
                    {Number(d.total_firs).toLocaleString()}
                  </td>
                  <td className="px-6 py-2 text-center">
                    <span
                      className={`inline-block rounded-full border px-3 py-1 text-[10px] font-bold tracking-wider uppercase ${riskStyles[risk]}`}
                    >
                      {risk}
                    </span>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
    </section>
  );
}
