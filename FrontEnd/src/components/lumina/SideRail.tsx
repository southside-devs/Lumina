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

const activeClass =
  "group relative flex h-11 w-11 items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_color-mix(in_oklab,white_20%,transparent)] transition-transform hover:scale-105";
const idleClass =
  "group relative flex h-11 w-11 items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground";

export function SideRail() {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-50 flex h-full w-16 flex-col items-center gap-5 border-r border-hairline bg-rail/70 py-4 backdrop-blur-2xl"
      >
        <button
          type="button"
          onClick={() => setIsReportOpen(true)}
          title="New Investigation / Create FIR"
          aria-label="New Investigation"
          className="group relative mb-2 flex size-10 cursor-pointer items-center justify-center rounded-xl bg-signal-brand font-display text-xl font-bold text-primary-foreground shadow-[0_0_18px_color-mix(in_oklab,var(--signal-brand)_40%,transparent)] transition-transform hover:scale-110"
        >
          +
          <span className="pointer-events-none absolute left-14 z-50 ml-2 hidden rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground shadow-xl transition-opacity group-hover:block whitespace-nowrap">
            + New Investigation
          </span>
        </button>

        <div className="flex w-full flex-1 flex-col items-center gap-3 px-2">
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
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="pointer-events-none absolute left-14 z-50 ml-2 hidden rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground shadow-xl transition-opacity group-hover:block whitespace-nowrap">
                {item.label}
              </span>
            </Link>
          ))}

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
            <span className="material-symbols-outlined text-[22px]">description</span>
            <span className="pointer-events-none absolute left-14 z-50 ml-2 hidden rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground shadow-xl transition-opacity group-hover:block whitespace-nowrap">
              Reports (Export PDF)
            </span>
          </button>
        </div>

        <div className="mt-auto flex w-full flex-col items-center gap-3 px-2">
          {secondaryNav.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              aria-label={item.label}
              className={idleClass}
            >
              <span className="material-symbols-outlined text-[22px]">{item.icon}</span>
              <span className="pointer-events-none absolute left-14 z-50 ml-2 hidden rounded-lg border border-hairline bg-surface-1 px-3 py-1.5 text-xs font-medium text-foreground shadow-xl transition-opacity group-hover:block whitespace-nowrap">
                {item.label}
              </span>
            </button>
          ))}
        </div>
      </nav>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </>
  );
}

