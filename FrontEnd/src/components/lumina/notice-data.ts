import { useMemo } from "react";

export type NotifTab = "unread" | "read" | "archived";
export type NotifKind = "alert" | "network" | "ai" | "sync";

export interface IntelligenceNotice {
  id: string;
  kind: NotifKind;
  title: string;
  body: string;
  time: string;
  day: "Today" | "Yesterday";
  value: string;
  valueTone: "ok" | "warn" | "info";
  read: boolean;
  archived: boolean;
  initials: string;
  avatarClass: string;
}

export const INITIAL_NOTICES: IntelligenceNotice[] = [
  {
    id: "n1",
    kind: "alert",
    title: "Bengaluru Urban hotspot",
    body: "3 critical-threat FIRs in the last hour",
    time: "2 min ago",
    day: "Today",
    value: "CRIT",
    valueTone: "warn",
    read: false,
    archived: false,
    initials: "BU",
    avatarClass: "bg-signal-critical/80",
  },
  {
    id: "n2",
    kind: "network",
    title: "Node #8921 — S. Kumar",
    body: "2 new syndicate edges added to the graph",
    time: "14 min ago",
    day: "Today",
    value: "+2",
    valueTone: "info",
    read: false,
    archived: false,
    initials: "NT",
    avatarClass: "bg-signal-agent",
  },
  {
    id: "n3",
    kind: "ai",
    title: "Zia 14-day forecast",
    body: "District risk model ready for review",
    time: "1 hr ago",
    day: "Today",
    value: "READY",
    valueTone: "ok",
    read: false,
    archived: false,
    initials: "AI",
    avatarClass: "bg-signal-brand",
  },
  {
    id: "n4",
    kind: "sync",
    title: "FIR registry sync",
    body: "5,000 records mirrored to the graph store",
    time: "3 hr ago",
    day: "Today",
    value: "5k",
    valueTone: "ok",
    read: true,
    archived: false,
    initials: "DB",
    avatarClass: "bg-surface-3",
  },
  {
    id: "n5",
    kind: "alert",
    title: "Kalaburagi corridor",
    body: "Patrol density below threshold overnight",
    time: "Yesterday · 21:40",
    day: "Yesterday",
    value: "LOW",
    valueTone: "warn",
    read: true,
    archived: false,
    initials: "KG",
    avatarClass: "bg-signal-warning text-black",
  },
  {
    id: "n6",
    kind: "ai",
    title: "Agent memory snapshot",
    body: "Weekly RAG index archived after review",
    time: "Yesterday · 18:12",
    day: "Yesterday",
    value: "ARC",
    valueTone: "info",
    read: true,
    archived: true,
    initials: "AM",
    avatarClass: "bg-muted",
  },
];

export function filterNotices(items: IntelligenceNotice[], tab: NotifTab) {
  return items.filter((item) => {
    if (tab === "archived") return item.archived;
    if (tab === "unread") return !item.read && !item.archived;
    return item.read && !item.archived;
  });
}

export function groupByDay(items: IntelligenceNotice[]) {
  const order: Array<IntelligenceNotice["day"]> = ["Today", "Yesterday"];
  return order
    .map((day) => ({ day, items: items.filter((item) => item.day === day) }))
    .filter((group) => group.items.length > 0);
}

export function useNoticeCounts(items: IntelligenceNotice[]) {
  return useMemo(
    () => ({
      unread: items.filter((n) => !n.read && !n.archived).length,
      read: items.filter((n) => n.read && !n.archived).length,
      archived: items.filter((n) => n.archived).length,
    }),
    [items],
  );
}
