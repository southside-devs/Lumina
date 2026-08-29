import { useRouterState } from "@tanstack/react-router";

const tabs = [
  { label: "Overview", to: "/overview" },
  { label: "GIS Crime Map", to: "/" },
  { label: "Risk Scores", to: "/risk-scores" },
] as const;

const active =
  "rounded-full border border-hairline bg-surface-2 px-6 py-1.5 font-mono text-label-md text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-2px_6px_rgba(0,0,0,0.55)]";
const idle =
  "rounded-full px-6 py-1.5 font-mono text-label-md text-muted-foreground";

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  return (
    <div className="pointer-events-none mb-8 flex justify-center">
      <div
        role="tablist"
        aria-label="Intelligence views"
        className="flex gap-1 rounded-full border border-hairline bg-surface-1/60 p-1"
      >
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          return (
            <span
              key={tab.label}
              role="tab"
              aria-selected={isActive}
              className={isActive ? active : idle}
            >
              {tab.label}
            </span>
          );
        })}
      </div>
    </div>
  );
}
