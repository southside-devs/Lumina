import type { CrimeTrend } from "@/lib/api";

interface CrimeGroupChartProps {
  data?: CrimeTrend[];
  loading?: boolean;
}

const DEFAULT_BARS: CrimeTrend[] = [
  { group: "Theft", count: 385 },
  { group: "Assault", count: 240 },
  { group: "Burglary", count: 195 },
  { group: "Fraud", count: 142 },
  { group: "Cybercrime", count: 110 },
];

export function CrimeGroupChart({ data = DEFAULT_BARS }: CrimeGroupChartProps) {
  const chartData = data.length > 0 ? data.slice(0, 5) : DEFAULT_BARS;
  const maxVal = Math.max(...chartData.map((d) => d.count), 1);

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
        {chartData.map((bar, idx) => {
          const widthPercent = Math.round((bar.count / maxVal) * 100);
          const opacity = Math.max(100 - idx * 18, 25);
          return (
            <li key={bar.group} className="flex items-center">
              <span className="w-28 pr-4 text-right font-mono text-label-md text-muted-foreground sm:w-36 truncate" title={bar.group}>
                {bar.group}
              </span>
              <div className="h-2.5 flex-1 overflow-hidden rounded-full bg-surface-1">
                <div
                  className="h-full rounded-full bg-primary transition-all duration-500"
                  style={{ width: `${widthPercent}%`, opacity: opacity / 100 }}
                />
              </div>
              <span className="w-14 text-right font-mono text-label-md font-bold text-foreground">
                {bar.count}
              </span>
            </li>
          );
        })}
      </ul>
    </section>
  );
}
