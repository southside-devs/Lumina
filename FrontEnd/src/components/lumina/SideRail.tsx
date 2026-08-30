import { useState, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
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

const idleClass =
  "flex h-12 w-full items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-surface-2 hover:text-foreground active:scale-95 cursor-pointer";
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
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const isItemActive = (to: string) => {
    if (to === "/overview") {
      return pathname === "/overview" || pathname === "/risk-scores";
    }
    return pathname === to;
  };

  const handleLogout = () => {
    toast.info("Session Closed", {
      description: "Signed out of Karnataka State Police Command Center.",
    });
    navigate({ to: "/login" });
  };

  const handleConfig = () => {
    toast.info("System Configuration", {
      description: "Lumina Core Engine v3.4.2 · Node KA-01-HQ · AES-256 Enabled.",
    });
  };

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
            className="mb-2 flex size-10 items-center justify-center rounded-xl border border-amber-500/30 bg-[#f59e0b] text-black shadow-[inset_0_1px_0_rgba(255,255,255,0.35),inset_0_-2px_4px_rgba(0,0,0,0.25)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
          >
            <span className="material-symbols-outlined text-2xl font-bold leading-none select-none">add</span>
          </button>
        </RailItem>

        <div className="flex w-full flex-1 flex-col gap-3 px-2">
          {primaryNav.map((item) => (
            <RailItem key={item.label} label={item.label}>
              <Link
                to={item.to}
                aria-label={item.label}
                className={isItemActive(item.to) ? activeClass : idleClass}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </Link>
            </RailItem>
          ))}
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

          <RailItem label="System Config">
            <button
              type="button"
              onClick={handleConfig}
              aria-label="System Config"
              className={idleClass}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </RailItem>

          <RailItem label="Logout">
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className={`${idleClass} text-rose-400 hover:text-rose-300 hover:bg-rose-500/10`}
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </RailItem>
        </div>
      </nav>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </>
  );
}
