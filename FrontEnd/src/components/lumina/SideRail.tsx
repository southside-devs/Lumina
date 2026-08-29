import { useState, type ReactNode } from "react";
import { Link } from "@tanstack/react-router";
import { generateIntelligenceBriefingPDF } from "@/lib/pdf-generator";
import { ReportModal } from "./ReportModal";

const primaryNav = [
  { icon: "grid_view", label: "Command Hub", to: "/" },
  { icon: "assessment", label: "Overview", to: "/overview" },
  { icon: "folder_open", label: "FIR Registry", to: "/fir-explorer" },
  { icon: "hub", label: "Network Topology", to: "/network" },
  { icon: "auto_awesome", label: "AI Chatbot", to: "/ai-chatbot" },
] as const;

const secondaryLinks = [
  { icon: "info", label: "About", to: "/about" as const },
  { icon: "help", label: "Help & Docs", to: "/help" as const },
] as const;

const secondaryButtons = [
  { icon: "settings", label: "System Config" },
  { icon: "logout", label: "Logout" },
];

const idleClass =
  "flex h-12 w-full items-center justify-center rounded-xl text-muted-foreground transition-colors hover:bg-surface-2 hover:text-foreground";
const activeClass =
  "flex h-12 w-full items-center justify-center rounded-xl border border-hairline bg-surface-2 text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-2px_8px_rgba(0,0,0,0.55)]";

function RailTip({ label }: { label: string }) {
  return (
    <span className="pointer-events-none absolute left-[calc(100%+12px)] top-1/2 z-[60] -translate-y-1/2 whitespace-nowrap rounded-md border border-hairline bg-surface-1 px-2.5 py-1 text-xs font-bold tracking-wide text-foreground opacity-0 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-opacity duration-150 group-hover:opacity-100">
      {label}
    </span>
  );
}

function RailItem({ label, children }: { label: string; children: ReactNode }) {
  return (
    <div className="group relative flex w-full items-center justify-center">
      {children}
      <RailTip label={label} />
    </div>
  );
}

export function SideRail() {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-50 flex h-full w-16 flex-col items-center gap-6 overflow-visible border-r border-hairline bg-rail/70 py-4 backdrop-blur-2xl ui-no-select"
      >
        <RailItem label="New FIR Report">
          <button
            type="button"
            onClick={() => setIsReportOpen(true)}
            aria-label="Create New FIR Incident Report"
            className="mb-2 flex size-10 items-center justify-center rounded-xl border border-amber-500/30 bg-[#f59e0b] font-display text-xl font-bold text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.25)]"
          >
            +
          </button>
        </RailItem>

        <div className="flex w-full flex-1 flex-col gap-3 px-2">
          {primaryNav.map((item) => (
            <RailItem key={item.label} label={item.label}>
              <Link
                to={item.to}
                aria-label={item.label}
                className={idleClass}
                activeProps={{ className: activeClass }}
                activeOptions={{ exact: true }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </Link>
            </RailItem>
          ))}

          <RailItem label="Export Briefing">
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
              aria-label="Export Briefing Report"
              className={idleClass}
            >
              <span className="material-symbols-outlined text-amber-400">assignment</span>
            </button>
          </RailItem>
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 px-2">
          {secondaryLinks.map((item) => (
            <RailItem key={item.label} label={item.label}>
              <Link
                to={item.to}
                aria-label={item.label}
                className={idleClass}
                activeProps={{ className: activeClass }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </Link>
            </RailItem>
          ))}
          {secondaryButtons.map((item) => (
            <RailItem key={item.label} label={item.label}>
              <button type="button" aria-label={item.label} className={idleClass}>
                <span className="material-symbols-outlined">{item.icon}</span>
              </button>
            </RailItem>
          ))}
        </div>
      </nav>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </>
  );
}
