import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { NotificationsPopover } from "./NotificationsPopover";
import { ProfileMenu } from "./ProfileMenu";
import { SearchIntelligenceModal } from "./SearchIntelligenceModal";
import { LuminaLogo } from "./LuminaLogo";
import { INITIAL_NOTICES, useNoticeCounts, type IntelligenceNotice, type NotifTab } from "./notice-data";

const statuses = [
  { dot: "bg-signal-ok", label: "Nodes", value: "124", desc: "124 tactical sensor nodes operational across Karnataka" },
  { dot: "bg-signal-warning", label: "Alerts", value: "3", desc: "3 active critical alerts requiring supervisory sign-off" },
  { dot: "bg-muted-foreground", label: "System", value: "99.9%", desc: "Command backbone uptime: 99.94% over 30 days" },
];

type OpenPanel = "none" | "notifications" | "profile";

export function TopBar() {
  const navigate = useNavigate();
  const [panel, setPanel] = useState<OpenPanel>("none");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [tab, setTab] = useState<NotifTab>("unread");
  const [notices, setNotices] = useState<IntelligenceNotice[]>(INITIAL_NOTICES);
  const [isPrivate, setIsPrivate] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);
  const counts = useNoticeCounts(notices);

  useEffect(() => {
    function onPointerDown(event: MouseEvent) {
      if (clusterRef.current && !clusterRef.current.contains(event.target as Node)) {
        setPanel("none");
      }
    }
    function onKey(event: KeyboardEvent) {
      if (event.key === "Escape") {
        setPanel("none");
        setIsSearchOpen(false);
      }
      if ((event.metaKey || event.ctrlKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();
        setIsSearchOpen((prev) => !prev);
      }
    }
    document.addEventListener("mousedown", onPointerDown);
    document.addEventListener("keydown", onKey);
    return () => {
      document.removeEventListener("mousedown", onPointerDown);
      document.removeEventListener("keydown", onKey);
    };
  }, []);


  const toggle = (next: OpenPanel) => {
    setPanel((current) => (current === next ? "none" : next));
  };

  return (
    <header className="fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar/90 px-5 backdrop-blur-xl ui-no-select">
      {/* Brand & Security Status */}
      <div className="flex items-center">
        <button
          type="button"
          onClick={() =>
            toast.info("Lumina Intelligence Grid", {
              description: "End-to-end encrypted tactical command node #KA-01-HQ.",
            })
          }
          className="group flex items-center px-1 py-1 transition-opacity hover:opacity-80 active:scale-95 cursor-pointer"
          aria-label="Lumina Intelligence Grid"
        >
          <LuminaLogo className="h-4.5 w-auto object-contain brightness-100" />
        </button>
      </div>

      {/* Center Status Indicators */}
      <div className="hidden items-center gap-4 font-mono text-label-sm lg:flex">
        {statuses.map((s) => (
          <button
            key={s.label}
            type="button"
            onClick={() => toast.info(`${s.label} Status`, { description: s.desc })}
            className="flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-1 transition-all hover:border-white/10 hover:bg-surface-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-95 cursor-pointer"
          >
            <span className={`size-2 rounded-full ${s.dot} shadow-[0_0_6px_currentColor]`} />
            <span className="uppercase tracking-wider text-muted-foreground">
              {s.label}:{" "}
              <span className="select-text text-foreground font-semibold">{s.value}</span>
            </span>
          </button>
        ))}
      </div>

      {/* Right Interactive Controls */}
      <div ref={clusterRef} className="flex items-center gap-2.5">
        {/* Search Trigger with clear Ctrl+K shortcut badge */}
        <button
          type="button"
          onClick={() => setIsSearchOpen(true)}
          aria-label="Open Search Intelligence (Ctrl+K)"
          title="Search Intelligence across 5,000+ FIRs, Suspects, Districts & Hotspots (Ctrl+K)"
          className="group relative flex items-center gap-2.5 rounded-full border border-hairline bg-surface-1/90 py-1.5 px-3 text-xs text-muted-foreground transition-all hover:border-white/20 hover:bg-surface-2 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.45)] active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined text-[17px] text-emerald-400 transition-transform group-hover:scale-110">
            search
          </span>
          <span className="hidden sm:inline font-sans">Search Intelligence...</span>
          <kbd className="flex items-center gap-0.5 rounded-md bg-zinc-900 border border-zinc-700/80 px-1.5 py-0.5 font-mono text-[10px] text-zinc-300 shadow-sm group-hover:border-zinc-500 group-hover:text-white transition-colors">
            <span className="font-semibold">Ctrl</span>
            <span>+</span>
            <span className="font-bold text-white">K</span>
          </kbd>
        </button>


        {/* Notifications Popover Toggle */}
        <div className="relative">
          <button
            type="button"
            aria-label="Notifications"
            aria-expanded={panel === "notifications"}
            aria-haspopup="dialog"
            onClick={() => toggle("notifications")}
            className={`relative flex size-9 items-center justify-center rounded-xl border text-muted-foreground transition-all active:scale-95 cursor-pointer ${
              panel === "notifications"
                ? "border-white/20 bg-surface-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.12),inset_0_-2px_6px_rgba(0,0,0,0.55)]"
                : "border-hairline bg-surface-1/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 hover:bg-surface-2 hover:text-foreground"
            }`}

          >
            <span className="material-symbols-outlined text-[18px]">notifications</span>
            {counts.unread > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-topbar bg-signal-critical shadow-[0_0_6px_#ff453a]" />
            )}
          </button>

          {panel === "notifications" && (
            <NotificationsPopover
              notices={notices}
              tab={tab}
              onTabChange={setTab}
              onClose={() => setPanel("none")}
              onMarkAllRead={() => {
                setNotices((prev) => prev.map((n) => ({ ...n, read: true })));
                toast.success("All intelligence briefs marked read");
              }}
              onOpenNotice={(id) => {
                const found = notices.find((n) => n.id === id);
                if (found) {
                  toast.info(found.title, { description: found.body });
                }
                setPanel("none");
              }}
            />
          )}
        </div>

        {/* Tactical User Profile Menu Toggle */}
        <div className="relative">
          <button
            type="button"
            aria-label="Inspector Profile"
            aria-expanded={panel === "profile"}
            aria-haspopup="menu"
            onClick={() => toggle("profile")}
            className={`flex items-center gap-2 rounded-xl border py-1 pr-2.5 pl-1.5 transition-all active:scale-95 cursor-pointer ${
              panel === "profile"
                ? "border-amber-500/40 bg-surface-2 shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_14px_rgba(245,158,11,0.25)]"
                : "border-hairline bg-surface-1/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 hover:bg-surface-2"
            }`}
          >
            <div className="relative flex size-7 items-center justify-center rounded-lg bg-surface-2 border border-hairline font-mono text-[11px] font-bold text-foreground">
              RK
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border border-topbar bg-signal-ok" />
            </div>
            <div className="hidden text-left font-mono text-[11px] xl:block">
              <div className="font-semibold leading-tight text-foreground">Insp. R. Kumar</div>
              <div className="text-[10px] text-muted-foreground">KSP-HQ · On Duty</div>
            </div>
            <span className="material-symbols-outlined text-sm text-muted-foreground transition-transform">
              {panel === "profile" ? "arrow_drop_up" : "arrow_drop_down"}
            </span>
          </button>

          {panel === "profile" && (
            <ProfileMenu
              isPrivate={isPrivate}
              onPrivateChange={setIsPrivate}
              onClose={() => setPanel("none")}
              onResetPasskeys={() =>
                toast.message("Passkeys reset queued", {
                  description: "Biometric credentials will be cleared on next station login.",
                })
              }
              onLogout={() => {
                toast.success("Session closed", {
                  description: "Insp. R. Kumar signed out of Command Center.",
                });
                navigate({ to: "/login" });
              }}
            />
          )}
        </div>
      </div>

      {/* Spotlight Search Intelligence Command Palette Modal */}
      <SearchIntelligenceModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
