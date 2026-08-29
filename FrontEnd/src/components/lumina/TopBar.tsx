import { useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { NotificationsPopover } from "./NotificationsPopover";
import { ProfileMenu } from "./ProfileMenu";
import { INITIAL_NOTICES, useNoticeCounts, type IntelligenceNotice, type NotifTab } from "./notice-data";

const statuses = [
  { dot: "bg-signal-ok", label: "Nodes", value: "124", desc: "124 tactical sensor nodes operational across Karnataka" },
  { dot: "bg-signal-warning", label: "Alerts", value: "3", desc: "3 active critical alerts requiring supervisory sign-off" },
  { dot: "bg-muted-foreground", label: "System", value: "99.9%", desc: "Command backbone uptime: 99.94% over 30 days" },
];

type OpenPanel = "none" | "notifications" | "profile";

export function TopBar() {
  const [panel, setPanel] = useState<OpenPanel>("none");
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
      if (event.key === "Escape") setPanel("none");
      if ((event.metaKey || event.ctrlKey) && event.key === "k") {
        event.preventDefault();
        toast.info("Search Intelligence", {
          description: "Global FIR index, suspect database & tactical network search ready.",
        });
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

  const handleShare = () => {
    navigator.clipboard?.writeText?.(window.location.href);
    toast.success("Intelligence Link Copied", {
      description: "Secure tactical briefing link copied to clipboard.",
    });
  };

  return (
    <header className="fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar/90 px-5 backdrop-blur-xl ui-no-select">
      {/* Brand & Security Status */}
      <div className="flex items-center gap-3">
        <button
          type="button"
          onClick={() =>
            toast.info("Lumina Intelligence Grid", {
              description: "End-to-end encrypted tactical command node #KA-01-HQ.",
            })
          }
          className="group flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-4 py-1.5 shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.45)] transition-all hover:border-white/20 hover:bg-surface-2 active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-sm text-muted-foreground transition-colors group-hover:text-amber-400">
            lock
          </span>
          <span className="font-mono text-label-md tracking-[0.2em] text-foreground">LUMINA</span>
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
        {/* Search Trigger */}
        <button
          type="button"
          onClick={() =>
            toast.info("Search Intelligence", {
              description: "Search indexed across 5,000+ FIR records and tactical nodes.",
            })
          }
          className="group relative hidden items-center md:flex rounded-full border border-hairline bg-surface-1/90 py-1.5 pr-8 pl-8 text-xs text-muted-foreground transition-all hover:border-white/20 hover:bg-surface-2 hover:text-foreground hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_2px_rgba(0,0,0,0.45)] active:scale-[0.98] cursor-pointer"
        >
          <span className="material-symbols-outlined absolute left-2.5 text-[17px] text-muted-foreground transition-colors group-hover:text-white">
            search
          </span>
          <span>Search Intelligence...</span>
          <span className="material-symbols-outlined absolute right-2.5 text-xs text-muted-foreground/60 transition-colors group-hover:text-white">
            keyboard_command_key
          </span>
        </button>

        {/* Share Button */}
        <button
          type="button"
          aria-label="Share intelligence overview"
          onClick={handleShare}
          className="flex size-9 items-center justify-center rounded-xl border border-hairline bg-surface-1/80 text-muted-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-white/20 hover:bg-surface-2 hover:text-foreground active:scale-95 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[18px]">share</span>
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
                ? "border-blue-500/40 bg-surface-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_14px_rgba(0,122,255,0.3)]"
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
              onMarkAllRead={() =>
                setNotices((prev) => prev.map((item) => ({ ...item, read: true })))
              }
              onOpenNotice={(id) =>
                setNotices((prev) =>
                  prev.map((item) => (item.id === id ? { ...item, read: true } : item)),
                )
              }
            />
          )}
        </div>

        {/* Profile Menu Toggle */}
        <div className="relative">
          <button
            type="button"
            aria-label="User menu"
            aria-expanded={panel === "profile"}
            aria-haspopup="dialog"
            onClick={() => toggle("profile")}
            className={`flex items-center gap-2.5 rounded-xl border p-1 pl-2 pr-2.5 transition-all active:scale-[0.98] cursor-pointer ${
              panel === "profile"
                ? "border-indigo-500/40 bg-surface-2 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_0_14px_rgba(99,102,241,0.3)]"
                : "border-hairline bg-surface-1/80 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] hover:border-white/20 hover:bg-surface-2"
            }`}
          >
            <span className="relative flex size-7 items-center justify-center rounded-full bg-signal-agent text-[11px] font-bold text-foreground shadow-[inset_0_1px_0_rgba(255,255,255,0.3)]">
              RK
              <span className="absolute -bottom-0.5 -right-0.5 size-2 rounded-full border border-[#07070a] bg-[#34C759]" />
            </span>
            <span className="hidden flex-col items-start sm:flex">
              <span className="text-xs leading-none font-semibold text-zinc-100">Insp. R. Kumar</span>
              <span className="mt-0.5 text-[10px] leading-none text-muted-foreground">Cmd Center</span>
            </span>
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
              onLogout={() =>
                toast.success("Session closed", {
                  description: "Insp. R. Kumar signed out of Command Center.",
                })
              }
            />
          )}
        </div>
      </div>
    </header>
  );
}
