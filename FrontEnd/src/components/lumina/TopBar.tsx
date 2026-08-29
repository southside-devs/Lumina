import { useState, useRef, useEffect } from "react";
import { Link } from "@tanstack/react-router";
import { toast } from "sonner";

// ── Static status indicators ─────────────────────────────────────────────────
const statuses = [
  { dot: "bg-signal-ok", label: "Nodes", value: "124" },
  { dot: "bg-signal-warning", label: "Alerts", value: "3" },
  { dot: "bg-muted-foreground", label: "System", value: "99.9%" },
];

// ── Notification data ─────────────────────────────────────────────────────────
interface Notification {
  id: string;
  title: string;
  body: string;
  time: string;
  read: boolean;
  icon: string;
  iconColor: string;
}

const INITIAL_NOTIFICATIONS: Notification[] = [
  {
    id: "n1",
    title: "High-Risk Alert",
    body: "Bengaluru Urban: 3 new critical-threat FIRs in the last hour.",
    time: "2 min ago",
    read: false,
    icon: "warning",
    iconColor: "text-signal-critical",
  },
  {
    id: "n2",
    title: "Network Topology Update",
    body: "Target Node #8921 (S. Kumar) added 2 new syndicate connections.",
    time: "14 min ago",
    read: false,
    icon: "hub",
    iconColor: "text-signal-agent",
  },
  {
    id: "n3",
    title: "AI Analysis Ready",
    body: "Zia AutoML: 14-day crime forecast for Karnataka districts is available.",
    time: "1 hr ago",
    read: false,
    icon: "auto_awesome",
    iconColor: "text-signal-brand",
  },
  {
    id: "n4",
    title: "FIR Registry Sync",
    body: "5,000 FIR records successfully synced with Neo4j graph database.",
    time: "3 hr ago",
    read: true,
    icon: "sync",
    iconColor: "text-signal-ok",
  },
  {
    id: "n5",
    title: "System Maintenance",
    body: "Scheduled maintenance window completed. All services operational.",
    time: "Yesterday",
    read: true,
    icon: "build",
    iconColor: "text-muted-foreground",
  },
];

// ── Role definitions ──────────────────────────────────────────────────────────
const ROLES = [
  { id: "cmd-center", label: "Cmd Center", desc: "Full system access" },
  { id: "analyst", label: "Analyst", desc: "Read-only, reports" },
  { id: "field-officer", label: "Field Officer", desc: "FIR filing only" },
  { id: "supervisor", label: "Supervisor", desc: "District-level access" },
];

// ── Notifications Panel ───────────────────────────────────────────────────────
function NotificationsPanel({
  notifications,
  onMarkAllRead,
  onMarkRead,
}: {
  notifications: Notification[];
  onMarkAllRead: () => void;
  onMarkRead: (id: string) => void;
}) {
  const unreadCount = notifications.filter((n) => !n.read).length;

  return (
    <div className="flex flex-col max-h-[420px]">
      {/* Header */}
      <div className="flex items-center justify-between border-b border-hairline px-4 py-3 ui-no-select">
        <div className="flex items-center gap-2">
          <span className="font-display text-sm font-semibold text-foreground">
            Notifications
          </span>
          {unreadCount > 0 && (
            <span className="inline-flex items-center rounded-full bg-signal-critical/20 px-2 py-0.5 font-mono text-[10px] font-bold text-signal-critical">
              {unreadCount}
            </span>
          )}
        </div>
        {unreadCount > 0 && (
          <button
            type="button"
            onClick={onMarkAllRead}
            className="font-mono text-[10px] text-muted-foreground transition-colors hover:text-foreground"
          >
            Mark all read
          </button>
        )}
      </div>

      {/* Notification list */}
      <div className="custom-scrollbar flex-1 overflow-y-auto">
        {notifications.length === 0 ? (
          <div className="flex flex-col items-center justify-center gap-2 py-10">
            <span className="material-symbols-outlined text-3xl text-muted-foreground/40">
              notifications_off
            </span>
            <p className="font-mono text-xs text-muted-foreground/60">
              No notifications
            </p>
          </div>
        ) : (
          notifications.map((n) => (
            <button
              type="button"
              key={n.id}
              onClick={() => onMarkRead(n.id)}
              className={`flex w-full items-start gap-3 px-4 py-3 text-left transition-colors hover:bg-accent/50 ${
                n.read ? "opacity-55" : ""
              }`}
            >
              <div className="mt-0.5 flex size-7 shrink-0 items-center justify-center rounded-lg border border-hairline bg-surface-2">
                <span
                  className={`material-symbols-outlined text-sm ${n.iconColor}`}
                >
                  {n.icon}
                </span>
              </div>
              <div className="min-w-0 flex-1">
                <div className="flex items-center justify-between gap-2">
                  <span
                    className={`text-xs font-semibold leading-none ${n.read ? "text-muted-foreground" : "text-foreground"}`}
                  >
                    {n.title}
                  </span>
                  {!n.read && (
                    <span className="size-1.5 shrink-0 rounded-full bg-signal-brand" />
                  )}
                </div>
                <p className="mt-1 text-[11px] leading-relaxed text-muted-foreground line-clamp-2">
                  {n.body}
                </p>
                <span className="mt-1 font-mono text-[10px] text-muted-foreground/60">
                  {n.time}
                </span>
              </div>
            </button>
          ))
        )}
      </div>
    </div>
  );
}

// ── Role Management Panel ─────────────────────────────────────────────────────
function RolePanel({
  currentRole,
  onRoleChange,
  onClose,
}: {
  currentRole: string;
  onRoleChange: (roleId: string, label: string) => void;
  onClose: () => void;
}) {
  return (
    <div className="flex flex-col ui-no-select">
      {/* Header */}
      <div className="border-b border-hairline px-4 py-3">
        <p className="font-display text-sm font-semibold text-foreground">
          Insp. R. Kumar
        </p>
        <p className="mt-0.5 font-mono text-[10px] text-muted-foreground">
          Badge #4521 · Karnataka State Police
        </p>
      </div>

      {/* Role selection */}
      <div className="px-4 py-3">
        <p className="mb-2 font-mono text-[10px] uppercase tracking-widest text-muted-foreground/70">
          Access Role
        </p>
        <div className="space-y-1.5">
          {ROLES.map((role) => (
            <button
              key={role.id}
              type="button"
              onClick={() => {
                onRoleChange(role.id, role.label);
                onClose();
              }}
              className={`flex w-full items-center justify-between rounded-lg px-3 py-2.5 transition-colors hover:bg-accent ${
                currentRole === role.id
                  ? "border border-primary/30 bg-primary/10 text-foreground"
                  : "border border-transparent text-muted-foreground hover:text-foreground"
              }`}
            >
              <div className="flex flex-col items-start">
                <span className="text-xs font-semibold">{role.label}</span>
                <span className="mt-0.5 font-mono text-[10px] opacity-70">
                  {role.desc}
                </span>
              </div>
              {currentRole === role.id && (
                <span className="material-symbols-outlined text-sm text-primary">
                  check_circle
                </span>
              )}
            </button>
          ))}
        </div>
      </div>

      {/* Footer actions */}
      <div className="border-t border-hairline px-4 py-3">
        <button
          type="button"
          className="flex w-full items-center gap-2 rounded-lg px-3 py-2 text-sm text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="material-symbols-outlined text-base">logout</span>
          Sign out
        </button>
      </div>
    </div>
  );
}

// ── TopBar ────────────────────────────────────────────────────────────────────
export function TopBar() {
  const [notifications, setNotifications] = useState<Notification[]>(
    INITIAL_NOTIFICATIONS,
  );
  const [notifOpen, setNotifOpen] = useState(false);
  const [roleOpen, setRoleOpen] = useState(false);
  const [currentRole, setCurrentRole] = useState("cmd-center");

  const notifRef = useRef<HTMLDivElement>(null);
  const roleRef = useRef<HTMLDivElement>(null);

  const unreadCount = notifications.filter((n) => !n.read).length;

  // Close dropdowns on outside click
  useEffect(() => {
    function handleClick(e: MouseEvent) {
      if (notifRef.current && !notifRef.current.contains(e.target as Node)) {
        setNotifOpen(false);
      }
      if (roleRef.current && !roleRef.current.contains(e.target as Node)) {
        setRoleOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  // Close on Escape
  useEffect(() => {
    function handleKey(e: KeyboardEvent) {
      if (e.key === "Escape") {
        setNotifOpen(false);
        setRoleOpen(false);
      }
    }
    document.addEventListener("keydown", handleKey);
    return () => document.removeEventListener("keydown", handleKey);
  }, []);

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, read: true })));
  };

  const handleMarkRead = (id: string) => {
    setNotifications((prev) =>
      prev.map((n) => (n.id === id ? { ...n, read: true } : n)),
    );
  };

  const handleRoleChange = (roleId: string, label: string) => {
    if (roleId === currentRole) return;
    setCurrentRole(roleId);
    toast.success(`Role updated to ${label}`, {
      description: "Access permissions updated. Changes take effect immediately.",
      duration: 3500,
    });
  };

  return (
    <header className="fixed top-0 left-16 z-40 flex h-14 w-[calc(100%-4rem)] items-center justify-between border-b border-hairline bg-topbar px-5 ui-no-select">
      {/* Left — logo */}
      <div className="flex items-center gap-3">
        <div className="flex items-center gap-2 rounded-full border border-hairline bg-surface-1 px-4 py-1.5">
          <span className="material-symbols-outlined text-sm text-muted-foreground">lock</span>
          <span className="font-mono text-label-md tracking-[0.2em] text-foreground">LUMINA</span>
        </div>
      </div>

      {/* Center — status indicators */}
      <div className="hidden items-center gap-6 font-mono text-label-sm lg:flex">
        {statuses.map((s) => (
          <div key={s.label} className="flex items-center gap-2">
            <span className={`size-2 rounded-full ${s.dot}`} />
            <span className="uppercase tracking-wider text-muted-foreground">
              {s.label}:{" "}
              <span className="select-text text-foreground">{s.value}</span>
            </span>
          </div>
        ))}
      </div>

      {/* Right — search + actions */}
      <div className="flex items-center gap-3">
        {/* Search */}
        <div className="relative hidden items-center md:flex">
          <span className="material-symbols-outlined absolute left-3 text-sm text-muted-foreground">
            search
          </span>
          <label className="sr-only" htmlFor="intel-search">
            Search intelligence
          </label>
          <input
            id="intel-search"
            type="text"
            placeholder="Search Intelligence..."
            className="w-56 rounded-full border border-input bg-surface-1 py-1.5 pr-9 pl-9 text-sm text-foreground transition-all placeholder:text-muted-foreground/60 focus:border-primary focus:ring-1 focus:ring-ring focus:outline-none ui-no-select-off"
            style={{ userSelect: "text" }}
          />
          <span className="material-symbols-outlined absolute right-3 text-xs text-muted-foreground opacity-50">
            keyboard_command_key
          </span>
        </div>

        {/* Network link */}
        <Link
          to="/network"
          title="Network Topology"
          aria-label="Network Topology"
          className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
        >
          <span className="material-symbols-outlined">share</span>
        </Link>

        {/* Notifications */}
        <div ref={notifRef} className="relative">
          <button
            type="button"
            id="notifications-btn"
            aria-label="Notifications"
            aria-expanded={notifOpen}
            aria-haspopup="true"
            onClick={() => {
              setNotifOpen((v) => !v);
              setRoleOpen(false);
            }}
            className="relative rounded-full p-2 text-muted-foreground transition-colors hover:bg-accent hover:text-foreground"
          >
            <span className="material-symbols-outlined">notifications</span>
            {unreadCount > 0 && (
              <span className="absolute top-1.5 right-1.5 size-2 rounded-full border border-topbar bg-signal-critical" />
            )}
          </button>

          {notifOpen && (
            <div
              role="dialog"
              aria-label="Notifications panel"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-80 rounded-2xl border border-hairline bg-topbar shadow-2xl backdrop-blur-2xl overflow-hidden"
            >
              <NotificationsPanel
                notifications={notifications}
                onMarkAllRead={handleMarkAllRead}
                onMarkRead={handleMarkRead}
              />
            </div>
          )}
        </div>

        {/* Role / User */}
        <div ref={roleRef} className="relative">
          <button
            type="button"
            id="role-btn"
            aria-label="User role and settings"
            aria-expanded={roleOpen}
            aria-haspopup="true"
            onClick={() => {
              setRoleOpen((v) => !v);
              setNotifOpen(false);
            }}
            className="flex items-center gap-2 rounded border-l border-hairline p-1 pl-3 transition-colors hover:bg-accent"
          >
            <span className="flex size-8 items-center justify-center rounded-full bg-signal-agent text-xs font-bold text-foreground">
              RK
            </span>
            <span className="hidden flex-col items-start sm:flex">
              <span className="text-xs leading-none font-semibold">Insp. R. Kumar</span>
              <span className="mt-1 text-[10px] leading-none text-muted-foreground">
                {ROLES.find((r) => r.id === currentRole)?.label ?? "Cmd Center"}
              </span>
            </span>
            <span className="material-symbols-outlined text-sm text-muted-foreground">
              arrow_drop_down
            </span>
          </button>

          {roleOpen && (
            <div
              role="dialog"
              aria-label="Role management panel"
              className="absolute right-0 top-[calc(100%+8px)] z-50 w-72 rounded-2xl border border-hairline bg-topbar shadow-2xl backdrop-blur-2xl overflow-hidden"
            >
              <RolePanel
                currentRole={currentRole}
                onRoleChange={handleRoleChange}
                onClose={() => setRoleOpen(false)}
              />
            </div>
          )}
        </div>
      </div>
    </header>
  );
}
