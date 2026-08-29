import { filterNotices, groupByDay, type IntelligenceNotice, type NotifTab } from "./notice-data";
import { toast } from "sonner";

const TABS: { id: NotifTab; label: string }[] = [
  { id: "unread", label: "Unread" },
  { id: "read", label: "Read" },
  { id: "archived", label: "Archived" },
];

const toneClass: Record<IntelligenceNotice["valueTone"], string> = {
  ok: "text-[#34C759] border-[#34C759]/30 bg-[#34C759]/10",
  warn: "text-amber-400 border-amber-500/30 bg-amber-500/10",
  info: "text-[#007AFF] border-[#007AFF]/30 bg-[#007AFF]/10",
};

interface NotificationsPopoverProps {
  notices: IntelligenceNotice[];
  tab: NotifTab;
  onTabChange: (tab: NotifTab) => void;
  onClose: () => void;
  onMarkAllRead: () => void;
  onOpenNotice: (id: string) => void;
}

export function NotificationsPopover({
  notices,
  tab,
  onTabChange,
  onClose,
  onMarkAllRead,
  onOpenNotice,
}: NotificationsPopoverProps) {
  const visible = filterNotices(notices, tab);
  const groups = groupByDay(visible);
  const unreadCount = notices.filter((n) => !n.read && !n.archived).length;

  const handleAction = (notice: IntelligenceNotice, action: string) => {
    toast.success(`${action} confirmed`, {
      description: `Action applied to notice: ${notice.title}`,
    });
    onOpenNotice(notice.id);
  };

  return (
    <div
      role="dialog"
      aria-label="Notifications"
      className="absolute right-0 top-[calc(100%+10px)] z-50 flex w-[23.5rem] max-h-[min(34rem,calc(100vh-5.5rem))] flex-col overflow-hidden rounded-[1.35rem] border border-white/[0.12] bg-[#07070a]/95 p-2 shadow-[0_25px_80px_rgba(0,0,0,0.85),inset_0_1px_0_rgba(255,255,255,0.12)] backdrop-blur-3xl animate-in fade-in-0 slide-in-from-bottom-2 duration-200"
    >
      {/* Header */}
      <div className="flex items-center justify-between px-3 pt-2 pb-2">
        <h2 className="text-base font-bold text-white tracking-tight">Notifications</h2>
        <button
          type="button"
          aria-label="Close notifications"
          onClick={onClose}
          className="flex size-7 items-center justify-center rounded-full border border-white/10 bg-white/[0.04] text-zinc-400 shadow-[inset_0_1px_0_rgba(255,255,255,0.08)] transition-all hover:border-white/20 hover:bg-white/[0.08] hover:text-white active:scale-90 cursor-pointer"
        >
          <span className="material-symbols-outlined text-[16px]">close</span>
        </button>
      </div>

      {/* Segmented Tab Filter */}
      <div className="mx-2 mb-3 grid grid-cols-3 rounded-xl border border-white/[0.08] bg-black/60 p-1 shadow-[inset_0_1px_3px_rgba(0,0,0,0.7)]">
        {TABS.map((item) => (
          <button
            key={item.id}
            type="button"
            onClick={() => onTabChange(item.id)}
            className={`rounded-lg py-1.5 text-xs font-semibold transition-all duration-150 cursor-pointer ${
              tab === item.id
                ? "border border-white/15 bg-white/10 text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.15),0_2px_8px_rgba(0,0,0,0.5)]"
                : "text-zinc-400 hover:text-zinc-200"
            }`}
          >
            {item.label}
          </button>
        ))}
      </div>

      {/* List Content */}
      <div className="custom-scrollbar min-h-0 flex-1 space-y-4 overflow-y-auto px-2 pb-2">
        {groups.length === 0 ? (
          <div className="py-12 text-center">
            <span className="material-symbols-outlined text-3xl text-zinc-600 mb-1">
              notifications_off
            </span>
            <p className="font-mono text-xs text-zinc-500">No items in {tab} view</p>
          </div>
        ) : (
          groups.map((group) => (
            <section key={group.day} className="space-y-2">
              <div className="flex items-center gap-2 px-1">
                <span className="text-xs font-bold text-zinc-400">{group.day}</span>
                <span className="rounded-full border border-white/10 bg-white/[0.06] px-2 py-0.5 font-mono text-[10px] font-bold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)]">
                  {group.items.length}
                </span>
                <button
                  type="button"
                  onClick={() => {
                    toast.info(`${group.day} Intelligence Archive`, {
                      description: `Viewing all ${group.items.length} records for ${group.day}.`,
                    });
                  }}
                  className="ml-auto text-[11px] font-semibold text-zinc-400 transition-colors hover:text-[#007AFF] hover:underline cursor-pointer"
                >
                  View All
                </button>
              </div>

              <div className="flex flex-col gap-2">
                {group.items.map((notice) => (
                  <div
                    key={notice.id}
                    onClick={() => {
                      onOpenNotice(notice.id);
                      toast.info(notice.title, { description: notice.body });
                    }}
                    className="group relative flex flex-col gap-2 rounded-2xl border border-white/[0.08] bg-[#0c0e16]/80 p-3 shadow-[inset_0_1px_0_rgba(255,255,255,0.06),0_4px_14px_rgba(0,0,0,0.35)] backdrop-blur-md transition-all duration-150 hover:border-white/20 hover:bg-[#131622]/90 hover:shadow-[inset_0_1px_0_rgba(255,255,255,0.12),0_6px_20px_rgba(0,0,0,0.45)] cursor-pointer"
                  >
                    <div className="flex items-start gap-3">
                      {/* Avatar */}
                      <div
                        className={`relative flex size-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-xs font-bold text-white shadow-[inset_0_1px_0_rgba(255,255,255,0.3),0_2px_8px_rgba(0,0,0,0.4)] ${notice.avatarClass}`}
                      >
                        {notice.initials}
                        {!notice.read && !notice.archived && (
                          <span className="absolute -top-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#07070a] bg-[#007AFF] shadow-[0_0_8px_#007AFF]" />
                        )}
                      </div>

                      {/* Content Details */}
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <div className="flex items-center gap-1.5 min-w-0">
                            <span className="truncate text-[13px] font-bold text-zinc-100 group-hover:text-white">
                              {notice.title}
                            </span>
                            {!notice.read && !notice.archived && (
                              <span className="size-1.5 shrink-0 rounded-full bg-[#007AFF] shadow-[0_0_6px_#007AFF]" />
                            )}
                          </div>
                          {notice.value && (
                            <span
                              className={`shrink-0 rounded-full border px-2 py-0.5 font-mono text-[9px] font-bold tracking-wider ${toneClass[notice.valueTone]}`}
                            >
                              {notice.value}
                            </span>
                          )}
                        </div>

                        <p className="mt-0.5 text-[11px] font-medium leading-relaxed text-zinc-400 group-hover:text-zinc-300">
                          {notice.body}
                        </p>

                        <div className="mt-1.5 flex items-center gap-2">
                          <span className="font-mono text-[10px] text-zinc-400">
                            {notice.time}
                          </span>
                        </div>
                      </div>
                    </div>

                    {/* Action Buttons for specific alert kinds */}
                    {notice.kind === "alert" && !notice.read && (
                      <div className="mt-1 flex items-center justify-end gap-2 border-t border-white/[0.06] pt-2">
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notice, "Dispatched Quick Patrol");
                          }}
                          className="rounded-lg border border-amber-500/30 bg-amber-500/10 px-2.5 py-1 text-[10px] font-bold text-amber-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.1)] transition-all hover:bg-amber-500/20 active:scale-95 cursor-pointer"
                        >
                          Dispatch
                        </button>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.stopPropagation();
                            handleAction(notice, "Acknowledged Alert");
                          }}
                          className="rounded-lg border border-white/10 bg-white/[0.04] px-2.5 py-1 text-[10px] font-semibold text-zinc-300 shadow-[inset_0_1px_0_rgba(255,255,255,0.06)] transition-all hover:bg-white/10 active:scale-95 cursor-pointer"
                        >
                          Acknowledge
                        </button>
                      </div>
                    )}
                  </div>
                ))}
              </div>
            </section>
          ))
        )}
      </div>

      {/* Footer */}
      <div className="flex items-center justify-between gap-3 border-t border-white/[0.08] px-3 py-2.5 mt-1">
        <button
          type="button"
          onClick={() => {
            onMarkAllRead();
            toast.success("All notifications marked as read");
          }}
          disabled={unreadCount === 0}
          className="group inline-flex items-center gap-1.5 rounded-lg border border-transparent px-2 py-1 text-[11px] font-semibold text-zinc-400 transition-all hover:border-white/10 hover:bg-white/[0.04] hover:text-zinc-200 active:scale-95 disabled:opacity-40 disabled:pointer-events-none cursor-pointer"
        >
          <span className="material-symbols-outlined text-[15px] transition-transform group-hover:scale-110">
            done_all
          </span>
          Mark all as read
        </button>

        <button
          type="button"
          onClick={() => {
            onTabChange("read");
            toast.info("Showing full notification history");
          }}
          className="inline-flex items-center gap-1 rounded-full border border-blue-400/40 bg-[#007AFF] px-4 py-1.5 text-[11px] font-bold text-white shadow-[0_0_16px_rgba(0,122,255,0.45),inset_0_1px_0_rgba(255,255,255,0.35)] transition-all hover:bg-[#0066d6] hover:shadow-[0_0_22px_rgba(0,122,255,0.65)] active:scale-95 cursor-pointer"
        >
          View all
        </button>
      </div>
    </div>
  );
}
