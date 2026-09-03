import { useMemo } from "react";
import type { FIRItem, DashboardOverview } from "@/lib/api";

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
  targetRoute?: string;
}

const STORAGE_READ_KEY = "lumina_notices_read_ids";
const STORAGE_ARCHIVED_KEY = "lumina_notices_archived_ids";

export function getStoredNoticeStates(): { readIds: Set<string>; archivedIds: Set<string> } {
  if (typeof window === "undefined") {
    return { readIds: new Set(), archivedIds: new Set() };
  }
  try {
    const rawRead = localStorage.getItem(STORAGE_READ_KEY);
    const rawArchived = localStorage.getItem(STORAGE_ARCHIVED_KEY);
    return {
      readIds: new Set(rawRead ? JSON.parse(rawRead) : []),
      archivedIds: new Set(rawArchived ? JSON.parse(rawArchived) : []),
    };
  } catch {
    return { readIds: new Set(), archivedIds: new Set() };
  }
}

export function saveNoticeStates(readIds: Set<string>, archivedIds: Set<string>) {
  if (typeof window === "undefined") return;
  try {
    localStorage.setItem(STORAGE_READ_KEY, JSON.stringify(Array.from(readIds)));
    localStorage.setItem(STORAGE_ARCHIVED_KEY, JSON.stringify(Array.from(archivedIds)));
  } catch {
    // Ignore storage errors
  }
}

export const INITIAL_NOTICES: IntelligenceNotice[] = [
  {
    id: "n1",
    kind: "alert",
    title: "Bengaluru Urban Hotspot",
    body: "ST-DBSCAN detected 3 dense incident clusters in Indiranagar corridor",
    time: "2 min ago",
    day: "Today",
    value: "CRIT",
    valueTone: "warn",
    read: false,
    archived: false,
    initials: "BU",
    avatarClass: "bg-signal-critical/80",
    targetRoute: "/",
  },
  {
    id: "n2",
    kind: "network",
    title: "Syndicate Topology Alert",
    body: "Multi-accused syndicate hub flagged: 7,957 associations linked",
    time: "14 min ago",
    day: "Today",
    value: "+2",
    valueTone: "info",
    read: false,
    archived: false,
    initials: "NT",
    avatarClass: "bg-signal-agent",
    targetRoute: "/network",
  },
  {
    id: "n3",
    kind: "ai",
    title: "Zia AutoML Risk Forecast",
    body: "District vulnerability projections updated across 31 districts",
    time: "1 hr ago",
    day: "Today",
    value: "READY",
    valueTone: "ok",
    read: false,
    archived: false,
    initials: "AI",
    avatarClass: "bg-signal-brand",
    targetRoute: "/risk-scores",
  },
  {
    id: "n4",
    kind: "sync",
    title: "FIR Master Telemetry Synced",
    body: "5,005 state records mirrored into serverless query engine",
    time: "3 hr ago",
    day: "Today",
    value: "5.0k",
    valueTone: "ok",
    read: true,
    archived: false,
    initials: "DB",
    avatarClass: "bg-surface-3",
    targetRoute: "/fir-explorer",
  },
  {
    id: "n5",
    kind: "alert",
    title: "Kalaburagi Surveillance Alert",
    body: "Night incident frequency elevated in North Division sectors",
    time: "Yesterday · 21:40",
    day: "Yesterday",
    value: "WATCH",
    valueTone: "warn",
    read: true,
    archived: false,
    initials: "KG",
    avatarClass: "bg-signal-warning text-black",
    targetRoute: "/",
  },
  {
    id: "n6",
    kind: "ai",
    title: "Intelligence Briefing Ready",
    body: "Statewide SCRB Executive PDF Dossier ready for export",
    time: "Yesterday · 18:12",
    day: "Yesterday",
    value: "PDF",
    valueTone: "info",
    read: true,
    archived: true,
    initials: "AM",
    avatarClass: "bg-muted",
    targetRoute: "/overview",
  },
];

export function buildDynamicNotices(
  firs: FIRItem[],
  overview: DashboardOverview | null
): IntelligenceNotice[] {
  const { readIds, archivedIds } = getStoredNoticeStates();

  if (!firs || firs.length === 0) {
    return INITIAL_NOTICES.map((n) => ({
      ...n,
      read: readIds.has(n.id) || n.read,
      archived: archivedIds.has(n.id) || n.archived,
    }));
  }

  const generated: IntelligenceNotice[] = [];

  // 1. Alert for the most recent critical FIR
  const criticalFir = firs.find(
    (f) =>
      f.Crime_Group.toLowerCase().includes("robbery") ||
      f.Crime_Group.toLowerCase().includes("assault") ||
      f.Crime_Group.toLowerCase().includes("extortion") ||
      f.Crime_Group.toLowerCase().includes("cyber")
  ) || firs[0];

  if (criticalFir) {
    const id = `fir_alert_${criticalFir.ROWID}`;
    generated.push({
      id,
      kind: "alert",
      title: `Critical Incident #${criticalFir.FIR_Number}`,
      body: `${criticalFir.Crime_Group} reported in Station #${criticalFir.Station_ID}. Status: ${criticalFir.Status}`,
      time: "Just now",
      day: "Today",
      value: "CRIT",
      valueTone: "warn",
      read: readIds.has(id),
      archived: archivedIds.has(id),
      initials: "FIR",
      avatarClass: "bg-signal-critical/90",
      targetRoute: `/fir-explorer?search=${encodeURIComponent(criticalFir.FIR_Number)}`,
    });
  }

  // 2. Network topology alert
  const netId = "notif_net_syndicate";
  generated.push({
    id: netId,
    kind: "network",
    title: "Syndicate Topology Flag",
    body: `${overview?.total_accused?.toLocaleString() || "3,000"} suspects mapped across Karnataka graph nodes`,
    time: "12 min ago",
    day: "Today",
    value: "+7.9k",
    valueTone: "info",
    read: readIds.has(netId),
    archived: archivedIds.has(netId),
    initials: "NET",
    avatarClass: "bg-signal-agent",
    targetRoute: "/network",
  });

  // 3. Hotspot ST-DBSCAN alert
  const hsId = "notif_hotspot_live";
  generated.push({
    id: hsId,
    kind: "alert",
    title: "ST-DBSCAN Spatial Hotspot",
    body: "Corridor cluster identified in Bengaluru Urban (Indiranagar / MG Road)",
    time: "28 min ago",
    day: "Today",
    value: "94/100",
    valueTone: "warn",
    read: readIds.has(hsId),
    archived: archivedIds.has(hsId),
    initials: "GIS",
    avatarClass: "bg-amber-500/90 text-black",
    targetRoute: "/",
  });

  // 4. Database sync notification with live FIR count
  const syncId = "notif_db_sync";
  const firCount = overview?.total_firs || firs.length;
  generated.push({
    id: syncId,
    kind: "sync",
    title: "Statewide FIR Registry Mirrored",
    body: `${firCount.toLocaleString()} total police records verified across 31 districts`,
    time: "1 hr ago",
    day: "Today",
    value: `${(firCount / 1000).toFixed(1)}k`,
    valueTone: "ok",
    read: readIds.has(syncId) || true,
    archived: archivedIds.has(syncId),
    initials: "KSP",
    avatarClass: "bg-surface-3",
    targetRoute: "/fir-explorer",
  });

  // 5. Repeat offender intelligence
  const repeatId = "notif_repeat_offenders";
  const repeatCount = overview?.repeat_offenders || 456;
  generated.push({
    id: repeatId,
    kind: "ai",
    title: "Automated Repeat Offender Flag",
    body: `${repeatCount} high-priority habitual offenders tracked by AutoML threat models`,
    time: "Yesterday · 22:15",
    day: "Yesterday",
    value: `${repeatCount}`,
    valueTone: "warn",
    read: readIds.has(repeatId) || true,
    archived: archivedIds.has(repeatId),
    initials: "ZIA",
    avatarClass: "bg-signal-brand",
    targetRoute: "/overview",
  });

  // 6. Strategic Intelligence PDF Briefing
  const docId = "notif_briefing_pdf";
  generated.push({
    id: docId,
    kind: "ai",
    title: "SCRB Intelligence Briefing Ready",
    body: "Statewide crime analytics executive report compiled and signed",
    time: "Yesterday · 16:30",
    day: "Yesterday",
    value: "PDF",
    valueTone: "info",
    read: readIds.has(docId) || true,
    archived: archivedIds.has(docId) || true,
    initials: "DOC",
    avatarClass: "bg-muted",
    targetRoute: "/overview",
  });

  return generated;
}

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
