import { useState, useEffect } from "react";
import { useRouterState, useNavigate } from "@tanstack/react-router";

const tabs = [
  { label: "Overview", to: "/overview", icon: "leaderboard" },
  { label: "Risk Scores", to: "/risk-scores", icon: "query_stats" },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState(pathname);

  useEffect(() => {
    setActiveTab(pathname);
  }, [pathname]);

  const isRiskScores = activeTab === "/risk-scores";

  const handleTabClick = (e: React.MouseEvent, to: string) => {
    e.preventDefault();
    if (activeTab === to) return;
    setActiveTab(to);
    setTimeout(() => {
      navigate({ to });
    }, 180);
  };

  return (
    <div className="mb-8 flex justify-center ui-no-select">
      {/* Outer Capsule Track */}
      <div
        role="tablist"
        aria-label="Intelligence views"
        className="relative inline-flex w-[340px] p-[5px] rounded-full border border-white/[0.12] bg-white/[0.05] backdrop-blur-xl shadow-[0_12px_32px_rgba(0,0,0,0.4),inset_0_1px_1px_rgba(255,255,255,0.15)]"
      >
        {/* Sliding Frosted Glass Piece */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[5px] bottom-[5px] left-[5px] w-[calc(50%-5px)] rounded-full border border-white/[0.16] bg-white/[0.10] shadow-[inset_0_1px_0_rgba(255,255,255,0.25),0_4px_12px_rgba(0,0,0,0.25)] transition-transform duration-[280ms] ease-[cubic-bezier(0.2,0.9,0.3,1)]"
          style={{
            transform: isRiskScores ? "translateX(100%)" : "translateX(0%)",
          }}
        />

        {/* Tab Items */}
        {tabs.map((tab) => {
          const isSelected = activeTab === tab.to;
          return (
            <a
              key={tab.label}
              href={tab.to}
              role="tab"
              aria-selected={isSelected}
              onClick={(e) => handleTabClick(e, tab.to)}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2.5 py-2.5 font-mono text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                isSelected
                  ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  : "text-[#94A3B8] hover:text-white"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-sm border transition-all duration-200 ${
                  isSelected
                    ? "border-[#007AFF] bg-[#007AFF]/20 text-[#007AFF] shadow-[0_0_8px_rgba(0,122,255,0.4)]"
                    : "border-zinc-500/40 text-zinc-400"
                }`}
              >
                <span className="material-symbols-outlined text-[14px]">
                  {tab.icon}
                </span>
              </span>
              <span>{tab.label}</span>
            </a>
          );
        })}
      </div>
    </div>
  );
}
