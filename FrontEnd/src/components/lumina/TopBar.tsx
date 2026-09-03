import { useEffect, useRef, useState } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { NotificationsPopover } from "./NotificationsPopover";
import { ProfileMenu } from "./ProfileMenu";
import { ProfileDetailModal, type ProfileModalType } from "./ProfileDetailModal";
import { SearchIntelligenceModal } from "./SearchIntelligenceModal";
import { LuminaLogo } from "./LuminaLogo";
import { INITIAL_NOTICES, useNoticeCounts, buildDynamicNotices, saveNoticeStates, type IntelligenceNotice, type NotifTab } from "./notice-data";
import { useAuth } from "@/lib/auth";
import { api, type DashboardOverview } from "@/lib/api";
import { useFIREvents } from "@/lib/fir-events";

type OpenPanel = "none" | "notifications" | "profile";

export function TopBar() {
  const navigate = useNavigate();
  const { user, logout } = useAuth();
  const [panel, setPanel] = useState<OpenPanel>("none");
  const [isSearchOpen, setIsSearchOpen] = useState(false);
  const [profileModal, setProfileModal] = useState<ProfileModalType>(null);
  const [activeWorkspace, setActiveWorkspace] = useState("Karnataka State Command (Primary Node)");
  const [tab, setTab] = useState<NotifTab>("unread");
  const [notices, setNotices] = useState<IntelligenceNotice[]>(INITIAL_NOTICES);
  const [overview, setOverview] = useState<DashboardOverview | null>(null);
  const [latency, setLatency] = useState<number | null>(null);
  const [isOnline, setIsOnline] = useState<boolean>(true);
  const [isPrivate, setIsPrivate] = useState(false);
  const clusterRef = useRef<HTMLDivElement>(null);
  const counts = useNoticeCounts(notices);
  const { firCreatedCount } = useFIREvents();

  const officerName = user?.name || "Inspector Rajesh Kumar";
  const nameParts = officerName.split(" ").filter(Boolean);
  const officerInitials =
    nameParts.length >= 2
      ? `${nameParts[nameParts.length - 2][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : nameParts[0]?.slice(0, 2).toUpperCase() || "RK";
  const officerBadge = user?.badgeId || "KSP-4521";
  const officerUnit = user?.stationUnit ? user.stationUnit.split(",")[0] : "KSP-HQ";

  // Measure real-time round-trip HTTP ping to Catalyst backend
  useEffect(() => {
    let mounted = true;
    async function measurePing() {
      const t0 = performance.now();
      try {
        const res = await fetch("/api/health", { cache: "no-store" });
        const dt = Math.round(performance.now() - t0);
        if (mounted) {
          if (res.ok) {
            setLatency(Math.max(12, dt));
            setIsOnline(true);
          } else {
            setIsOnline(false);
          }
        }
      } catch {
        if (mounted) setIsOnline(false);
      }
    }

    measurePing();
    const interval = setInterval(measurePing, 20000);
    return () => {
      mounted = false;
      clearInterval(interval);
    };
  }, []);

  useEffect(() => {
    let mounted = true;
    async function loadStats() {
      try {
        const [ov, firsData] = await Promise.all([
          api.getDashboardOverview(),
          api.getFirs({ limit: 10 }),
        ]);
        if (mounted) {
          setOverview(ov);
          if (firsData && firsData.firs) {
            setNotices(buildDynamicNotices(firsData.firs, ov));
          }
        }
      } catch (e) {
        console.warn("Failed to load topbar telemetry:", e);
      }
    }
    loadStats();
    return () => {
      mounted = false;
    };
  }, [firCreatedCount]);

  const statuses = [
    {
      dot: "bg-signal-ok",
      label: "Nodes",
      value: String(overview?.total_stations || 209),
      desc: "209 Karnataka Police Station Divisions & Tactical GIS Sensor Nodes Connected Statewide",
      tooltipTitle: "Operational Police Station Nodes",
      tooltipDetail: "Live tactical telemetry connections across all 209 Karnataka police stations.",
    },
    {
      dot: "bg-signal-warning",
      label: "Alerts",
      value: String(overview?.repeat_offenders || 456),
      desc: "Active Repeat Offenders & High-Priority Hotspot Clusters flagged for supervisory sign-off",
      tooltipTitle: "Active Intelligence Alerts",
      tooltipDetail: "Habitual repeat offenders and active high-threat incident corridors requiring monitoring.",
    },
    {
      dot: !isOnline
        ? "bg-signal-critical shadow-[0_0_6px_#ef4444]"
        : latency && latency > 250
        ? "bg-signal-warning shadow-[0_0_6px_#f59e0b]"
        : "bg-signal-ok shadow-[0_0_6px_#22c55e]",
      label: "API",
      value: !isOnline ? "Offline" : latency ? `${latency}ms` : "Live",
      desc: isOnline
        ? `Catalyst Serverless API round-trip latency: ${latency ?? 24}ms (sub-second sync active)`
        : "Backend serverless API currently unreachable",
      tooltipTitle: "Live API Response Latency",
      tooltipDetail: isOnline
        ? `Measured HTTP round-trip latency to Catalyst backend (${latency ?? 24}ms). Sub-second live data sync active.`
        : "Backend server disconnected or offline.",
    },
  ];

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
    <header id="top-bar" className="fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar/90 px-5 backdrop-blur-xl ui-no-select">
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
          <div key={s.label} className="group relative">
            <button
              type="button"
              onClick={() => toast.info(s.tooltipTitle, { description: s.desc })}
              className="flex items-center gap-2 rounded-lg border border-transparent px-2.5 py-1 transition-all hover:border-white/10 hover:bg-surface-1 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] active:scale-95 cursor-pointer"
            >
              <span className={`size-2 rounded-full ${s.dot} shadow-[0_0_6px_currentColor]`} />
              <span className="uppercase tracking-wider text-muted-foreground">
                {s.label}:{" "}
                <span className="select-text text-foreground font-semibold">{s.value}</span>
              </span>
            </button>

            {/* Hover Tooltip Description */}
            <div className="pointer-events-none absolute top-full left-1/2 -translate-x-1/2 mt-2 w-64 rounded-xl border border-white/15 bg-[#0b0d14]/98 p-3 shadow-[0_16px_36px_rgba(0,0,0,0.85)] backdrop-blur-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-150 z-50 text-left">
              <div className="flex items-center gap-2">
                <span className={`size-1.5 rounded-full ${s.dot}`} />
                <span className="font-sans text-xs font-bold text-white block">
                  {s.tooltipTitle}
                </span>
              </div>
              <p className="mt-1 font-sans text-[11px] text-zinc-400 leading-snug">
                {s.tooltipDetail}
              </p>
            </div>
          </div>
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
                setNotices((prev) => {
                  const updated = prev.map((n) => ({ ...n, read: true }));
                  const readSet = new Set(updated.map((n) => n.id));
                  const archivedSet = new Set(updated.filter((n) => n.archived).map((n) => n.id));
                  saveNoticeStates(readSet, archivedSet);
                  return updated;
                });
                toast.success("All notifications marked as read");
              }}
              onOpenNotice={(id) => {
                setNotices((prev) => {
                  const updated = prev.map((n) => (n.id === id ? { ...n, read: true } : n));
                  const readSet = new Set(updated.filter((n) => n.read).map((n) => n.id));
                  const archivedSet = new Set(updated.filter((n) => n.archived).map((n) => n.id));
                  saveNoticeStates(readSet, archivedSet);
                  return updated;
                });
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
              {officerInitials}
              <span className="absolute -top-0.5 -right-0.5 size-2 rounded-full border border-topbar bg-signal-ok" />
            </div>
            <div className="hidden text-left font-mono text-[11px] xl:block">
              <div className="font-semibold leading-tight text-foreground truncate max-w-[140px]">{officerName}</div>
              <div className="text-[10px] text-muted-foreground truncate max-w-[140px]">{officerBadge} · On Duty</div>
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
              onOpenDetail={(type) => setProfileModal(type)}
              onResetPasskeys={() => setProfileModal("passkeys")}
              onLogout={() => {
                logout();
                navigate({ to: "/login" });
              }}
            />
          )}
        </div>
      </div>

      {/* Interactive Profile / Model / Quota Detail Modal */}
      <ProfileDetailModal
        type={profileModal}
        onClose={() => setProfileModal(null)}
        activeWorkspace={activeWorkspace}
        onWorkspaceChange={setActiveWorkspace}
      />

      {/* Spotlight Search Intelligence Command Palette Modal */}
      <SearchIntelligenceModal
        isOpen={isSearchOpen}
        onClose={() => setIsSearchOpen(false)}
      />
    </header>
  );
}
