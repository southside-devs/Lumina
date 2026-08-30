import { useState, useEffect, type ReactNode } from "react";
import { Link, useNavigate, useRouterState } from "@tanstack/react-router";
import { toast } from "sonner";
import { ReportModal } from "./ReportModal";
import { SystemConfigModal } from "./SystemConfigModal";


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

const idleSecondaryClass =
  "flex h-12 w-full items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-surface-2 hover:text-foreground active:scale-95 cursor-pointer";
const activeSecondaryClass =
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

function getActiveNavIndex(path: string): number {
  if (path === "/" || path === "") return 0;
  if (path === "/overview" || path === "/risk-scores") return 1;
  if (path === "/fir-explorer") return 2;
  if (path === "/network") return 3;
  if (path === "/ai-chatbot") return 4;
  return -1;
}

export function SideRail() {
  const [isReportOpen, setIsReportOpen] = useState(false);
  const [isConfigOpen, setIsConfigOpen] = useState(false);
  const navigate = useNavigate();
  const pathname = useRouterState({ select: (s) => s.location.pathname });

  const [activeIndex, setActiveIndex] = useState<number>(() => getActiveNavIndex(pathname));

  useEffect(() => {
    setActiveIndex(getActiveNavIndex(pathname));
  }, [pathname]);

  const handleNavClick = (e: React.MouseEvent, to: string, idx: number) => {
    e.preventDefault();
    if (activeIndex === idx) return;
    setActiveIndex(idx);
    setTimeout(() => {
      navigate({ to });
    }, 180);
  };

  const handleLogout = () => {
    toast.info("Session Closed", {
      description: "Signed out of Karnataka State Police Command Center.",
    });
    navigate({ to: "/login" });
  };

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-50 flex h-full w-16 flex-col items-center gap-6 overflow-visible border-r border-hairline bg-rail/70 py-4 backdrop-blur-2xl ui-no-select"
      >
        {/* Incident Reporting Action Trigger */}
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

        {/* Primary Nav List with Vertical Sliding Glass Indicator */}
        <div className="relative flex w-full flex-1 flex-col gap-3 px-2">
          {/* Absolute Sliding Glass Highlight Square */}
          <div
            aria-hidden="true"
            className="pointer-events-none absolute left-2 right-2 top-0 h-12 rounded-xl border border-hairline bg-surface-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-2px_8px_rgba(0,0,0,0.55)] transition-all duration-[280ms] ease-[cubic-bezier(0.2,0.9,0.3,1)]"
            style={{
              transform: `translateY(${activeIndex >= 0 ? activeIndex * 60 : 0}px)`,
              opacity: activeIndex >= 0 ? 1 : 0,
            }}
          />

          {primaryNav.map((item, idx) => {
            const active = activeIndex === idx;
            return (
              <RailItem key={item.label} label={item.label}>
                <a
                  href={item.to}
                  aria-label={item.label}
                  aria-current={active ? "page" : undefined}
                  onClick={(e) => handleNavClick(e, item.to, idx)}
                  className={`relative z-10 flex h-12 w-full items-center justify-center rounded-xl transition-colors duration-200 cursor-pointer ${
                    active ? "text-white" : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  <span className={`material-symbols-outlined text-[20px] transition-colors ${active ? "filled text-white" : ""}`}>
                    {item.icon}
                  </span>
                </a>
              </RailItem>
            );
          })}
        </div>

        {/* Secondary Links at Bottom */}
        <div className="mt-auto flex w-full flex-col gap-3 px-2">
          {secondaryLinks.map((item) => (
            <RailItem key={item.label} label={item.label}>
              <Link
                to={item.to}
                aria-label={item.label}
                className={idleSecondaryClass}
                activeProps={{ className: activeSecondaryClass }}
              >
                <span className="material-symbols-outlined">{item.icon}</span>
              </Link>
            </RailItem>
          ))}

          <RailItem label="System Config">
            <button
              type="button"
              onClick={() => setIsConfigOpen(true)}
              aria-label="System Config"
              className={idleSecondaryClass}
            >
              <span className="material-symbols-outlined">settings</span>
            </button>
          </RailItem>

          <RailItem label="Logout">
            <button
              type="button"
              onClick={handleLogout}
              aria-label="Logout"
              className={`${idleSecondaryClass} text-rose-400 hover:text-rose-300 hover:bg-rose-500/10`}
            >
              <span className="material-symbols-outlined">logout</span>
            </button>
          </RailItem>
        </div>
      </nav>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
      <SystemConfigModal isOpen={isConfigOpen} onClose={() => setIsConfigOpen(false)} />
    </>
  );
}

