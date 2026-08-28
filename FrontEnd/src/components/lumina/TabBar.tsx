import { Link } from "@tanstack/react-router";

const tabs = [
  { label: "Overview", to: "/overview" },
  { label: "GIS Crime Map", to: "/" },
  { label: "FIR Registry", to: "/fir-explorer" },
  { label: "Risk Scores", to: "/risk-scores" },
] as const;

const active =
  "rounded-full bg-primary px-5 py-1.5 font-mono text-label-md text-primary-foreground shadow-sm";
const idle =
  "rounded-full px-5 py-1.5 font-mono text-label-md text-muted-foreground transition-colors hover:bg-accent hover:text-foreground";

export function TabBar() {
  return (
    <div className="mb-8 flex justify-center">
      <div
        role="tablist"
        aria-label="Intelligence views"
        className="flex gap-1 rounded-full border border-hairline bg-surface-1/60 p-1"
      >
        {tabs.map((tab) => (
          <Link
            key={tab.label}
            to={tab.to}
            role="tab"
            className={idle}
            activeProps={{ className: active }}
            activeOptions={{ exact: true }}
          >
            {tab.label}
          </Link>
        ))}
      </div>
    </div>
  );
}
