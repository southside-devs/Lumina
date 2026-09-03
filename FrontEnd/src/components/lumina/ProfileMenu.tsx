import { Switch } from "@/components/ui/switch";
import { toast } from "sonner";
import type { ProfileModalType } from "./ProfileDetailModal";

interface ProfileMenuProps {
  isPrivate: boolean;
  onPrivateChange: (value: boolean) => void;
  onClose: () => void;
  onLogout: () => void;
  onResetPasskeys: () => void;
  onOpenDetail?: (type: ProfileModalType) => void;
}

interface MenuRowProps {
  icon: string;
  label: string;
  hint?: string;
  badge?: string;
  badgeTone?: "blue" | "amber" | "green" | "neutral";
  showChevron?: boolean;
  hasDot?: boolean;
  onClick?: () => void;
}

function MenuRow({
  icon,
  label,
  hint,
  badge,
  badgeTone = "neutral",
  showChevron = true,
  hasDot = false,
  onClick,
}: MenuRowProps) {
  const badgeStyles = {
    blue: "bg-[#007AFF]/15 text-[#007AFF] border-[#007AFF]/30",
    amber: "bg-amber-500/15 text-amber-400 border-amber-500/30",
    green: "bg-[#34C759]/15 text-[#34C759] border-[#34C759]/30",
    neutral: "bg-white/8 text-zinc-300 border-white/10",
  }[badgeTone];

  return (
    <button
      type="button"
      onClick={onClick}
      className="group flex w-full items-center gap-3 rounded-xl border border-white/[0.04] bg-[#0d0e14]/40 px-3 py-2 text-left transition-all duration-150 hover:border-white/15 hover:bg-[#161824]/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)] active:scale-[0.985] cursor-pointer"
    >
      <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.5)] transition-colors group-hover:border-white/20 group-hover:bg-white/[0.08]">
        <span className="material-symbols-outlined text-[17px] text-zinc-400 transition-colors group-hover:text-white">
          {icon}
        </span>
      </span>

      <span className="min-w-0 flex-1">
        <span className="flex items-center gap-1.5">
          <span className="block text-[13px] font-semibold text-zinc-100 group-hover:text-white">
            {label}
          </span>
          {hasDot && (
            <span className="size-1.5 rounded-full bg-rose-500 shadow-[0_0_6px_rgba(244,63,94,0.7)]" />
          )}
        </span>
        {hint && (
          <span className="block text-[11px] font-medium text-zinc-400/80 group-hover:text-zinc-300">
            {hint}
          </span>
        )}
      </span>

      {badge && (
        <span
          className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[10px] font-semibold tracking-wide ${badgeStyles}`}
        >
          {badge}
        </span>
      )}

      {showChevron && (
        <span className="material-symbols-outlined shrink-0 text-sm text-zinc-500 transition-transform duration-150 group-hover:translate-x-0.5 group-hover:text-zinc-200">
          chevron_right
        </span>
      )}
    </button>
  );
}

import { useAuth } from "@/lib/auth";

export function ProfileMenu({
  isPrivate,
  onPrivateChange,
  onClose,
  onLogout,
  onResetPasskeys,
  onOpenDetail,
}: ProfileMenuProps) {
  const { user } = useAuth();
  const name = user?.name || "Insp. Rajesh Kumar";
  const nameParts = name.split(" ").filter(Boolean);
  const initials =
    nameParts.length >= 2
      ? `${nameParts[nameParts.length - 2][0]}${nameParts[nameParts.length - 1][0]}`.toUpperCase()
      : nameParts[0]?.slice(0, 2).toUpperCase() || "RK";
  const email = user?.email || "r.kumar@ksp.gov.in";
  const role = user?.role || "Admin";

  return (
    <div
      role="dialog"
      aria-label="User menu"
      className="absolute right-0 top-[calc(100%+10px)] z-50 w-[21.5rem] overflow-hidden rounded-[1.35rem] border border-white/[0.12] bg-[#07070a]/95 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-3xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      {/* Header Profile Card */}
      <div className="mb-2 p-1">
        <div 
          onClick={() => {
            onOpenDetail?.("profile");
            onClose();
          }}
          className="flex items-center gap-3 rounded-2xl border border-white/10 bg-[#0d0f17]/90 px-3.5 py-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_4px_16px_rgba(0,0,0,0.45)] hover:border-white/20 hover:bg-[#151824] transition-all cursor-pointer"
        >
          <div className="relative flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 bg-gradient-to-br from-indigo-500 to-blue-600 font-sans text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.35),0_2px_8px_rgba(0,0,0,0.4)]">
            {initials}
            <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#07070a] bg-[#34C759] shadow-[0_0_6px_#34C759]" />
          </div>
          <div className="min-w-0 flex-1">
            <span className="block text-[13px] font-bold text-white tracking-tight truncate">
              {name}
            </span>
            <span className="block truncate text-[11px] text-zinc-400 font-medium">
              {email}
            </span>
          </div>
          <span className="shrink-0 rounded-full border border-blue-500/30 bg-blue-500/10 px-2.5 py-1 font-mono text-[9px] font-bold tracking-widest text-[#007AFF] shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] uppercase">
            {role}
          </span>
        </div>
      </div>

      {/* Workspace & AI */}
      <div className="space-y-1 p-1">
        <p className="px-2 pb-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          WORKSPACE & AI
        </p>
        <MenuRow
          icon="hub"
          label="Active model context"
          hint="124 live nodes · Gemini Flash"
          badge="LIVE"
          badgeTone="green"
          onClick={() => {
            onOpenDetail?.("model");
            onClose();
          }}
        />
        <MenuRow
          icon="psychology"
          label="AI agent memory"
          hint="RAG index · 14-day window"
          badge="SYNCED"
          badgeTone="blue"
          onClick={() => {
            toast.info("AI Memory Index", {
              description: "Vector database holds 1,420 crime incident patterns and linkages.",
            });
            onClose();
          }}
        />
      </div>

      {/* Account & Security */}
      <div className="mt-1 space-y-1 border-t border-white/[0.08] p-1 pt-2">
        <p className="px-2 pb-0.5 font-mono text-[10px] font-bold uppercase tracking-widest text-zinc-400">
          ACCOUNT
        </p>
        <MenuRow
          icon="badge"
          label="User profile details"
          hint="Badge #4521 · Karnataka State Police"
          onClick={() => {
            onOpenDetail?.("profile");
            onClose();
          }}
        />
        <MenuRow
          icon="fingerprint"
          label="Security & biometrics"
          hint="Reset fingerprints / passkeys"
          onClick={() => {
            onOpenDetail?.("passkeys");
            onClose();
          }}
        />
        <div className="flex w-full items-center justify-between rounded-xl border border-white/[0.04] bg-[#0d0e14]/40 px-3 py-2 text-left transition-all hover:border-white/15 hover:bg-[#161824]/80 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(0,0,0,0.3)]">
          <div className="flex items-center gap-3 min-w-0">
            <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] shadow-[inset_0_1px_0_rgba(255,255,255,0.08),inset_0_-1px_3px_rgba(0,0,0,0.5)]">
              <span className="material-symbols-outlined text-[17px] text-zinc-400">
                {isPrivate ? "visibility_off" : "visibility"}
              </span>
            </span>
            <span className="min-w-0">
              <span className="block text-[13px] font-semibold text-zinc-100">Make private</span>
              <span className="block text-[11px] font-medium text-zinc-400/80">
                Hide presence from the rail
              </span>
            </span>
          </div>
          <Switch
            checked={isPrivate}
            onCheckedChange={(val) => {
              onPrivateChange(val);
              toast(val ? "Ghost mode enabled" : "Presence active", {
                description: val
                  ? "Officer status hidden from shared command consoles."
                  : "Officer status visible on live tactical network.",
              });
            }}
            aria-label="Make profile private"
            className="data-[state=checked]:bg-[#007AFF] shadow-[inset_0_1px_2px_rgba(0,0,0,0.6)] cursor-pointer"
          />
        </div>
      </div>

      {/* Workspace & Logout */}
      <div className="mt-1 space-y-1 border-t border-white/[0.08] p-1 pt-2">
        <MenuRow
          icon="swap_horiz"
          label="Switch workspace"
          hint="Karnataka Command · Org"
          onClick={() => {
            onOpenDetail?.("workspace");
            onClose();
          }}
        />
        <button
          type="button"
          onClick={() => {
            onLogout();
            onClose();
          }}
          className="group flex w-full items-center gap-3 rounded-xl border border-rose-500/20 bg-rose-500/[0.06] px-3 py-2 text-left text-[#FF453A] transition-all hover:border-rose-500/40 hover:bg-rose-500/15 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.08),0_2px_8px_rgba(255,69,58,0.2)] active:scale-[0.985] cursor-pointer"
        >
          <span className="flex size-8 shrink-0 items-center justify-center rounded-full border border-rose-500/30 bg-rose-500/10 shadow-[inset_0_1px_0_rgba(255,255,255,0.1),inset_0_-1px_3px_rgba(0,0,0,0.5)] transition-colors group-hover:border-rose-500/50 group-hover:bg-rose-500/20">
            <span className="material-symbols-outlined text-[17px] text-[#FF453A]">logout</span>
          </span>
          <span className="text-[13px] font-bold tracking-wide">Logout</span>
        </button>
      </div>
    </div>
  );
}
