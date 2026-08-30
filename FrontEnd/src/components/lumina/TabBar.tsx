import { useState, useEffect } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { label: "Overview", to: "/overview", icon: "leaderboard" },
  { label: "Risk Scores", to: "/risk-scores", icon: "query_stats" },
] as const;

// Module-level memory preserves last tab position across TanStack route transitions
let previousTabPath = "/overview";

export function TabBar() {
  const currentPath = useRouterState({ select: (s) => s.location.pathname });
  
  // Initialize with the previous path so the slide animation physically plays on mount
  const [animatedTab, setAnimatedTab] = useState<string>(() => previousTabPath);

  useEffect(() => {
    // Trigger the slide animation towards the active route path
    const frame = requestAnimationFrame(() => {
      setAnimatedTab(currentPath);
      previousTabPath = currentPath;
    });
    return () => cancelAnimationFrame(frame);
  }, [currentPath]);

  const isRiskScores = animatedTab === "/risk-scores";

  const handleTabClick = (to: string) => {
    setAnimatedTab(to);
    previousTabPath = to;
  };

  return (
    <div className="mb-8 flex justify-center ui-no-select">
      {/* 1. Outer Glassmorphic Track Container */}
      <div
        role="tablist"
        aria-label="Intelligence views"
        className="relative inline-flex w-[350px] p-[5px] rounded-full border border-white/[0.12] bg-[#111215]/80 backdrop-blur-[24px] backdrop-saturate-[180%] shadow-[0_20px_40px_rgba(0,0,0,0.45),inset_0_1px_1px_rgba(255,255,255,0.18)]"
      >
        {/* 2. Absolute Sliding Highlight Pill (Frosted Glass Piece) */}
        <div
          aria-hidden="true"
          className="pointer-events-none absolute top-[5px] bottom-[5px] left-[5px] w-[calc(50%-5px)] rounded-full border border-white/[0.22] bg-gradient-to-b from-white/[0.18] via-white/[0.10] to-white/[0.04] backdrop-blur-md shadow-[inset_0_1px_1px_rgba(255,255,255,0.45),inset_0_-1px_2px_rgba(0,0,0,0.3),0_4px_16px_rgba(0,0,0,0.35)] transition-transform duration-[380ms] ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            transform: isRiskScores ? "translateX(100%)" : "translateX(0%)",
          }}
        >
          {/* Subtle Specular Top Reflection */}
          <div className="absolute inset-x-3 top-0 h-[1px] bg-gradient-to-r from-transparent via-white/50 to-transparent" />
        </div>

        {/* 3. Interactive Navigation Links */}
        {tabs.map((tab) => {
          const isSelected = currentPath === tab.to;
          return (
            <Link
              key={tab.label}
              to={tab.to}
              role="tab"
              aria-selected={isSelected}
              onClick={() => handleTabClick(tab.to)}
              className={`relative z-10 flex flex-1 items-center justify-center gap-2.5 py-2 font-mono text-sm font-semibold transition-colors duration-200 cursor-pointer ${
                isSelected
                  ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  : "text-zinc-400 hover:text-white"
              }`}
            >
              <span
                className={`flex size-5 items-center justify-center rounded-sm border transition-all duration-200 ${
                  isSelected
                    ? "border-[#007AFF] bg-[#007AFF]/20 text-[#007AFF] shadow-[0_0_10px_rgba(0,122,255,0.5)]"
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
