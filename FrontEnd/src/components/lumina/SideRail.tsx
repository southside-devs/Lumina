import { useState } from "react";
import { Link } from "@tanstack/react-router";
import { ReportModal } from "./ReportModal";

const primaryNav = [
  { icon: "grid_view", label: "Command Hub", to: "/" },
  { icon: "description", label: "Overview", to: "/overview" },
  { icon: "share", label: "Network Topology", to: "/network" },
  { icon: "auto_fix_high", label: "AI Chatbot", to: "/ai-chatbot" },
] as const;

const staticNav = [
  { icon: "shield", label: "Security & Access" },
  { icon: "assignment", label: "Briefing Reports" },
];

const secondaryNav = [
  { icon: "help", label: "Help" },
  { icon: "settings", label: "Settings" },
  { icon: "logout", label: "Logout" },
];

const activeClass =
  "flex h-12 w-full items-center justify-center rounded-xl bg-primary text-primary-foreground shadow-[0_0_15px_color-mix(in_oklab,white_20%,transparent)] transition-transform hover:scale-105";
const idleClass =
  "flex h-12 w-full items-center justify-center rounded-xl text-muted-foreground transition-all hover:bg-accent hover:text-foreground";

export function SideRail() {
  const [isReportOpen, setIsReportOpen] = useState(false);

  return (
    <>
      <nav
        aria-label="Primary"
        className="fixed left-0 top-0 z-50 flex h-full w-16 flex-col items-center gap-6 border-r border-hairline bg-rail/70 py-4 backdrop-blur-2xl"
      >
        <div
          onClick={() => setIsReportOpen(true)}
          className="mb-2 flex size-10 cursor-pointer items-center justify-center rounded-xl bg-signal-brand font-display text-xl font-bold text-primary-foreground shadow-[0_0_18px_color-mix(in_oklab,var(--signal-brand)_40%,transparent)] transition-transform hover:scale-110"
        >
          +
        </div>

        <div className="flex w-full flex-1 flex-col gap-3 px-2">
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
              <span className="material-symbols-outlined">{item.icon}</span>
            </Link>
          ))}
          {staticNav.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              aria-label={item.label}
              className={idleClass}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ))}
        </div>

        <div className="mt-auto flex w-full flex-col gap-3 px-2">
          {secondaryNav.map((item) => (
            <button
              key={item.label}
              type="button"
              title={item.label}
              aria-label={item.label}
              className={idleClass}
            >
              <span className="material-symbols-outlined">{item.icon}</span>
            </button>
          ))}
        </div>
      </nav>

      <ReportModal isOpen={isReportOpen} onClose={() => setIsReportOpen(false)} />
    </>
  );
}

