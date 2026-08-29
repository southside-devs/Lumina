import { useEffect, useRef, useState } from "react";
import { Link, useRouterState } from "@tanstack/react-router";

const tabs = [
  { label: "Overview", to: "/overview", icon: "assessment" },
  { label: "Risk Scores", to: "/risk-scores", icon: "analytics" },
] as const;

export function TabBar() {
  const pathname = useRouterState({ select: (s) => s.location.pathname });
  const containerRef = useRef<HTMLDivElement>(null);
  const [indicatorStyle, setIndicatorStyle] = useState<{
    left: number;
    width: number;
    opacity: number;
  }>({
    left: 0,
    width: 0,
    opacity: 0,
  });

  const activeIndex = tabs.findIndex((t) => t.to === pathname);

  useEffect(() => {
    if (!containerRef.current) return;
    const buttons = containerRef.current.querySelectorAll<HTMLAnchorElement>("a[role='tab']");
    const targetIdx = activeIndex >= 0 ? activeIndex : 0;
    const activeEl = buttons[targetIdx];

    if (activeEl) {
      setIndicatorStyle({
        left: activeEl.offsetLeft,
        width: activeEl.offsetWidth,
        opacity: activeIndex >= 0 ? 1 : 0,
      });
    }
  }, [pathname, activeIndex]);

  return (
    <div className="mb-8 flex justify-center ui-no-select">
      <div
        ref={containerRef}
        role="tablist"
        aria-label="Intelligence views"
        className="relative flex items-center gap-1.5 rounded-full border border-white/[0.12] bg-[#07090e]/85 p-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),0_12px_36px_rgba(0,0,0,0.7)] backdrop-blur-2xl"
      >
        {/* Animated Sliding Glass Indicator */}
        <span
          aria-hidden="true"
          className="pointer-events-none absolute top-1.5 bottom-1.5 rounded-full border border-white/25 bg-gradient-to-b from-white/[0.18] to-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.4),inset_0_-1px_3px_rgba(0,0,0,0.6),0_4px_16px_rgba(0,0,0,0.45),0_0_18px_rgba(0,122,255,0.22)] backdrop-blur-xl transition-all duration-300 ease-[cubic-bezier(0.16,1,0.3,1)]"
          style={{
            left: `${indicatorStyle.left}px`,
            width: `${indicatorStyle.width}px`,
            opacity: indicatorStyle.opacity,
          }}
        />

        {tabs.map((tab) => {
          const isActive = pathname === tab.to;
          return (
            <Link
              key={tab.label}
              to={tab.to}
              role="tab"
              aria-selected={isActive}
              className={`relative z-10 flex items-center gap-2 rounded-full px-6 py-2 font-mono text-sm font-semibold transition-all duration-200 cursor-pointer ${
                isActive
                  ? "text-white drop-shadow-[0_1px_2px_rgba(0,0,0,0.8)]"
                  : "text-zinc-400 hover:text-zinc-200 hover:bg-white/[0.04]"
              }`}
            >
              <span
                className={`material-symbols-outlined text-[18px] transition-colors ${
                  isActive ? "text-[#007AFF]" : "text-zinc-500"
                }`}
              >
                {tab.icon}
              </span>
              <span>{tab.label}</span>
            </Link>
          );
        })}
      </div>
    </div>
  );
}
