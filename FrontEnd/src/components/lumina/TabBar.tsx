import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { label: "Overview", to: "/overview", icon: "leaderboard" },
  { label: "Risk Scores", to: "/risk-scores", icon: "query_stats" },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const isRiskScores = pathname === "/risk-scores";

  return (
    <div className="mb-8 flex justify-center ui-no-select">
      {/* 1. Outer Glassmorphic Track Container */}
      <div
        role="tablist"
        aria-label="Intelligence views"
        className="relative inline-flex w-[340px] p-[6px] rounded-full border border-white/[0.15] bg-white/[0.06] backdrop-blur-[20px] backdrop-saturate-[180%] shadow-[0_20px_40px_rgba(0,0,0,0.35),inset_0_1px_1px_rgba(255,255,255,0.25)]"
      >
        {/* 2. Absolute Sliding Highlight Pill (Active State) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[6px] bottom-[6px] left-[6px] w-[calc(50%-6px)] rounded-full border border-white/[0.18] bg-white/[0.12] shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_4px_16px_rgba(0,0,0,0.25)] transition-transform duration-[350ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: isRiskScores ? "translateX(100%)" : "translateX(0%)",
          }}
        />

        {/* 3. Transparent Navigation Links */}
        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          return (
            <Link
              key={tab.label}
              to={tab.to}
              role="tab"
              aria-selected={isActive}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2.5 py-2.5 font-mono text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                isActive
                  ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-sm border transition-all duration-200 ${
                  isActive
                    ? "border-[#007AFF] bg-[#007AFF]/20 text-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)]"
                    : "border-zinc-500/40 text-zinc-400"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {tab.icon}
                </span>
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
