import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { generateIntelligenceBriefingPDF } from "@/lib/pdf-generator";
import { ReportModal } from "./ReportModal";

const primaryNav = [
  { icon: "radar", label: "Intelligence", to: "/" },
  { icon: "grid_view", label: "Workspaces", to: "/overview" },
  { icon: "shield", label: "Investigations", to: "/risk-scores" },
  { icon: "hub", label: "Network Analysis", to: "/network" },
  { icon: "auto_awesome", label: "AI Assistant", to: "/ai-chatbot" },
] as const;

const secondaryNav = [
  { icon: "settings", label: "Settings" },
  { icon: "help", label: "Support" },
] as const;

/* Active: filled icon, slightly recessed/embossed — no glow */
const activeClass =
  "group relative flex h-10 w-10 items-center justify-center rounded-xl bg-surface-2 text-foreground shadow-[inset_0_1px_3px_rgba(0,0,0,0.6),inset_0_0_0_1px_rgba(255,255,255,0.06)] transition-all active:scale-95";

/* Idle: outlined icon, quiet */
const idleClass =
  "group relative flex h-10 w-10 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-surface-2 hover:text-foreground active:scale-95";

function NavTooltip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-50 -translate-y-1/2 hidden whitespace-nowrap rounded-md border border-hairline bg-surface-2 px-2.5 py-1 text-xs font-bold tracking-wide text-foreground shadow-lg group-hover:block">
      {label}
    </span>
  );
}

export function SideRail() {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-50 flex h-full w-14 flex-col items-center border-r border-hairline bg-rail/80 py-4 backdrop-blur-2xl"
      >
        {/* New Investigation button */}
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          title="New Investigation / Create FIR"
          aria-label="New Investigation"
          className="group relative mb-4 flex size-9 cursor-pointer items-center justify-center rounded-xl bg-signal-brand font-display text-lg font-bold text-white transition-all active:scale-95 active:shadow-[inset_0_2px_4px_rgba(0,0,0,0.4)]"
        >
          +
          <NavTooltip label="+ New Investigation" />
        </button>

        {/* Primary nav */}
        <div className="flex w-full flex-1 flex-col items-center gap-2 px-2">
          {primaryNav.map((item) => (
            <Link
              key={item.label}
              to={item.to}
              title={item.label}
              aria-label={item.label}
              className={idleClass}
              activeProps={{ className: activeClass }}
              activeOptions={{ exact: true }}
            >
              {({ isActive }: { isActive: boolean }) => (
                <>
                  <span
                    className="material-symbols-outlined text-[21px]"
                    style={{
                      fontVariationSettings: isActive
                        ? '"FILL" 1, "wght" 400, "GRAD" 0, "opsz" 24'
                        : '"FILL" 0, "wght" 300, "GRAD" 0, "opsz" 24',
                    }}
                  >
                    {item.icon}
                  </span>
                  <NavTooltip label={item.label} />
                </>
              )}
            </Link>
          ))}

          {/* Reports / PDF export */}
          <button
            type="button"
            onClick={() =>
              generateIntelligenceBriefingPDF({
                title: "KARNATAKA STATE POLICE — STRATEGIC INTELLIGENCE BRIEFING",
                totalFirs: 5000,
                repeatOffenders: 456,
                criticalHotspots: 3,
              })
            }
            title="Export Intelligence Briefing PDF"
            aria-label="Export Briefing PDF"
            className={idleClass}
          >
            <span className="material-symbols-outlined text-[21px]">description</span>
            <NavTooltip label="Reports (Export PDF)" />
          </button>
        </div>

        {/* Secondary nav (bottom) */}
        <div className="flex w-full flex-col items-center gap-2 px-2 pb-2">
          {secondaryNav.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              aria-label={item.label}
              className={idleClass}
            >
              <span className="material-symbols-outlined text-[21px]">{item.icon}</span>
              <NavTooltip label={item.label} />
            </button>
          ))}
        </div>
      </nav>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </>
  );
}
