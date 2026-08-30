import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useEffect, useState } from "react";

import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { api, type FIRItem } from "@/lib/api";
import { useFIREvents } from "@/lib/fir-events";
import { generateOfficialFIRPDF } from "@/lib/pdf-generator";


const title = "LUMINA — FIR Investigation & Case Explorer";
const description =
  "Searchable intelligence registry of Karnataka State Police FIR records with BNS legal classifications, suspect dossiers, and evidence tracking.";

export const Route = createFileRoute("/fir-explorer")({
  validateSearch: (search: Record<string, unknown>): { search?: string; fir?: string } => {
    return {
      search: typeof search.search === "string" ? search.search : undefined,
      fir: typeof search.fir === "string" ? search.fir : undefined,
    };
  },
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: FIRExplorerView,
});

const STATUS_FILTERS = [
  "All Statuses",
  "Under Investigation",
  "Chargesheeted",
  "Closed",
  "Convicted",
];

const CRIME_GROUPS = [
  "All Crime Types",
  "Theft",
  "Assault",
  "Burglary",
  "Cheating & Fraud",
  "Cybercrime",
  "Robbery",
  "Motor Vehicle Theft",
  "SC/ST Atrocities",
];

function FIRExplorerView() {
  const navigate = useNavigate();
  const searchParams = Route.useSearch();
  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [totalFirs, setTotalFirs] = useState<number>(0);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState(searchParams?.search || searchParams?.fir || "");
  const [selectedStatus, setSelectedStatus] = useState("All Statuses");
  const [selectedCrimeGroup, setSelectedCrimeGroup] = useState("All Crime Types");
  const [selectedFir, setSelectedFir] = useState<FIRItem | null>(null);
  const { firCreatedCount } = useFIREvents();

  useEffect(() => {
    let mounted = true;
    async function load() {
      setLoading(true);
      try {
        const targetSearch = searchParams?.fir || searchParams?.search;
        const res = await api.getFirs({
          limit: 500,
          search: targetSearch || undefined,
          status: selectedStatus !== "All Statuses" ? selectedStatus : undefined,
          crime_group: selectedCrimeGroup !== "All Crime Types" ? selectedCrimeGroup : undefined,
        });
        if (mounted) {
          setFirs(res.firs);
          if (res.total > 0) setTotalFirs(res.total);
          setLoading(false);
          if (searchParams?.fir && res.firs.length > 0) {
            const matched = res.firs.find(
              (f) => String(f.FIR_Number).toLowerCase() === String(searchParams.fir).toLowerCase()
            ) || res.firs[0];
            if (matched) setSelectedFir(matched);
          }
        }
      } catch (err) {
        console.error("Failed to load FIRs:", err);
        if (mounted) setLoading(false);
      }
    }
    load();
    return () => {
      mounted = false;
    };
  }, [selectedStatus, selectedCrimeGroup, firCreatedCount, searchParams?.fir, searchParams?.search]);


  // Client-side instant text search
  const filteredFirs = firs.filter((f) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.toLowerCase();
    return (
      f.FIR_Number.toLowerCase().includes(q) ||
      f.Crime_Group.toLowerCase().includes(q) ||
      (f.Crime_Subgroup && f.Crime_Subgroup.toLowerCase().includes(q)) ||
      f.Narrative.toLowerCase().includes(q) ||
      (f.District_Name && f.District_Name.toLowerCase().includes(q)) ||
      (f.Station_Name && f.Station_Name.toLowerCase().includes(q))
    );
  });

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "Under Investigation":
        return "border-amber-500/50 bg-amber-500/10 text-amber-400";
      case "Chargesheeted":
        return "border-sky-500/50 bg-sky-500/10 text-sky-400";
      case "Convicted":
        return "border-emerald-500/50 bg-emerald-500/10 text-emerald-400";
      case "Closed":
      default:
        return "border-zinc-700 bg-zinc-800 text-zinc-300";
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-shell text-foreground font-sans">
      <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        <main className="custom-scrollbar mt-14 flex-1 overflow-y-auto p-4 pt-6">
          <div className="mx-auto max-w-7xl space-y-5">
            {/* Header */}
            <div className="flex flex-wrap items-start justify-between gap-4">
              <div>
                <h1 className="font-display text-headline-lg tracking-tight text-white flex items-center gap-3">
                  FIR Case Explorer &amp; Registry
                  <span className="rounded-full border border-sky-500/30 bg-sky-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-sky-400">
                    {totalFirs > 0 ? `${totalFirs.toLocaleString()} INDEXED` : "LOADING..."}
                  </span>
                </h1>
                <p className="mt-1 text-sm text-muted-foreground">
                  Searchable criminal case intelligence registry with BNS legal classifications, suspect dossiers, and evidence tracking.
                </p>
              </div>

              {/* Quick Actions */}
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => navigate({ to: "/ai-chatbot" })}
                  className="flex items-center gap-1.5 rounded-lg border border-hairline bg-surface-1 px-3.5 py-2 font-sans text-xs font-semibold text-white transition-all hover:bg-surface-2 cursor-pointer"
                >
                  <span className="material-symbols-outlined text-sm text-amber-400">auto_fix_high</span>
                  <span>AI Cross-Examine</span>
                </button>
              </div>
            </div>

            {/* Filter Bar */}
            <div className="rounded-2xl border border-hairline bg-surface-1/70 p-4 backdrop-blur-xl flex flex-wrap items-center justify-between gap-3">
              {/* Search Box */}
              <div className="relative flex-1 min-w-[260px]">
                <span className="material-symbols-outlined absolute left-3 top-1/2 -translate-y-1/2 text-sm text-muted-foreground">
                  search
                </span>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search by FIR #, crime type, narrative keywords, or station..."
                  className="w-full rounded-xl border border-hairline bg-surface-2 py-2 pr-4 pl-9 text-xs text-white placeholder-zinc-500 focus:border-sky-500 focus:outline-none"
                />
              </div>

              {/* Dropdown Filters */}
              <div className="flex items-center gap-2.5">
                <select
                  value={selectedStatus}
                  onChange={(e) => setSelectedStatus(e.target.value)}
                  className="rounded-xl border border-hairline bg-surface-2 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {STATUS_FILTERS.map((s) => (
                    <option key={s} value={s} className="bg-zinc-900 text-white">
                      {s}
                    </option>
                  ))}
                </select>

                <select
                  value={selectedCrimeGroup}
                  onChange={(e) => setSelectedCrimeGroup(e.target.value)}
                  className="rounded-xl border border-hairline bg-surface-2 px-3 py-2 text-xs font-mono text-zinc-300 focus:outline-none cursor-pointer"
                >
                  {CRIME_GROUPS.map((g) => (
                    <option key={g} value={g} className="bg-zinc-900 text-white">
                      {g}
                    </option>
                  ))}
                </select>
              </div>
            </div>

            {/* FIR Table */}
            <div className="rounded-2xl border border-hairline bg-surface-1/70 overflow-hidden shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between border-b border-hairline bg-surface-2/40 px-5 py-3.5">
                <span className="font-mono text-xs text-zinc-400">
                  Showing <span className="font-bold text-white">{filteredFirs.length}</span> matching cases
                </span>
                {loading && (
                  <span className="flex items-center gap-1.5 font-mono text-xs text-sky-400">
                    <span className="size-1.5 rounded-full bg-sky-400 animate-ping" />
                    Querying Data Store...
                  </span>
                )}
              </div>

              <div className="w-full overflow-x-auto">
                <table className="w-full border-collapse text-left">
                  <thead>
                    <tr className="border-b border-hairline bg-shell/80 font-mono text-label-sm text-muted-foreground/80">
                      <th className="px-5 py-3 font-medium uppercase tracking-wider">FIR Number</th>
                      <th className="px-5 py-3 font-medium uppercase tracking-wider">Date</th>
                      <th className="px-5 py-3 font-medium uppercase tracking-wider">Crime Group &amp; Legal Section</th>
                      <th className="px-5 py-3 font-medium uppercase tracking-wider">District / PS</th>
                      <th className="px-5 py-3 text-center font-medium uppercase tracking-wider">Status</th>
                      <th className="px-5 py-3 text-right font-medium uppercase tracking-wider">Action</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-border/50 font-mono text-xs">
                    {filteredFirs.length === 0 && !loading ? (
                      <tr>
                        <td colSpan={6} className="py-12 text-center text-zinc-500 font-mono text-xs">
                          No FIR records found matching the current search parameters.
                        </td>
                      </tr>
                    ) : (
                      filteredFirs.map((fir) => (
                        <tr
                          key={String(fir.ROWID || fir.FIR_Number)}
                          className="h-13 transition-colors hover:bg-surface-2/60 cursor-pointer"
                          onClick={() => setSelectedFir(fir)}
                        >
                          <td className="px-5 py-2.5 font-bold text-sky-400">
                            #{fir.FIR_Number}
                          </td>
                          <td className="px-5 py-2.5 text-zinc-400">
                            {fir.Date || "2025-11-10"}
                          </td>
                          <td className="px-5 py-2.5">
                            <div className="font-semibold text-white">{fir.Crime_Group}</div>
                            <div className="text-[11px] text-zinc-400 font-sans mt-0.5">
                              {fir.Crime_Subgroup || "BNS Section 303"}
                            </div>
                          </td>
                          <td className="px-5 py-2.5 text-zinc-300 font-sans">
                            <div>{fir.District_Name || `Station #${fir.Station_ID}`}</div>
                            <div className="text-[11px] text-zinc-500 font-mono">
                              {(Number(fir.Latitude) || 12.97).toFixed(2)}°N, {(Number(fir.Longitude) || 77.59).toFixed(2)}°E
                            </div>
                          </td>
                          <td className="px-5 py-2.5 text-center">
                            <span
                              className={`inline-block rounded-full border px-2.5 py-0.5 text-[10px] font-bold uppercase ${getStatusBadge(
                                fir.Status
                              )}`}
                            >
                              {fir.Status}
                            </span>
                          </td>
                          <td className="px-5 py-2.5 text-right">
                            <button
                              type="button"
                              onClick={(e) => {
                                e.stopPropagation();
                                setSelectedFir(fir);
                              }}
                              className="rounded-lg border border-hairline bg-surface-2 px-3 py-1 text-xs font-sans text-white hover:bg-zinc-700 transition-colors cursor-pointer"
                            >
                              Inspect
                            </button>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>

            <div className="h-8" />
          </div>
        </main>
      </div>

      {/* Case Detail Modal / Drawer */}
      {selectedFir && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 p-4 backdrop-blur-md">
          <div className="w-full max-w-2xl rounded-2xl border border-zinc-700 bg-zinc-950 p-6 shadow-2xl space-y-5 animate-in fade-in zoom-in-95 duration-200">
            {/* Header */}
            <div className="flex items-start justify-between border-b border-zinc-800 pb-4">
              <div>
                <div className="flex items-center gap-2.5">
                  <h2 className="font-display text-xl font-bold text-white">
                    FIR #{selectedFir.FIR_Number}
                  </h2>
                  <span
                    className={`rounded-full border px-2.5 py-0.5 font-mono text-[10px] font-bold uppercase ${getStatusBadge(
                      selectedFir.Status
                    )}`}
                  >
                    {selectedFir.Status}
                  </span>
                </div>
                <p className="mt-1 text-xs text-zinc-400 font-mono">
                  Registered: {selectedFir.Date} • Station #{selectedFir.Station_ID}
                </p>
              </div>

              <button
                type="button"
                onClick={() => setSelectedFir(null)}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-lg">close</span>
              </button>
            </div>

            {/* Crime Classification */}
            <div className="grid grid-cols-2 gap-3">
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500 block">Crime Group</span>
                <span className="font-bold text-white text-sm">{selectedFir.Crime_Group}</span>
              </div>
              <div className="rounded-xl border border-zinc-800 bg-zinc-900/60 p-3.5">
                <span className="font-mono text-[10px] uppercase text-zinc-500 block">Legal Section (BNS / IPC)</span>
                <span className="font-bold text-amber-400 text-sm">{selectedFir.Crime_Subgroup || "BNS 303 (Theft)"}</span>
              </div>
            </div>

            {/* Official Narrative */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-4 space-y-1.5">
              <span className="font-mono text-[10px] uppercase text-zinc-500 block tracking-wider">
                Official Police Narrative
              </span>
              <p className="text-xs text-zinc-200 leading-relaxed font-sans">
                {selectedFir.Narrative}
              </p>
            </div>

            {/* Coordinates & Geo Location */}
            <div className="rounded-xl border border-zinc-800 bg-zinc-900/40 p-3.5 flex items-center justify-between font-mono text-xs">
              <div>
                <span className="text-zinc-500 text-[10px] uppercase block">Geo Coordinates (WGS84)</span>
                <span className="text-white font-bold">
                  {selectedFir.Latitude}°N, {selectedFir.Longitude}°E
                </span>
              </div>
              <button
                type="button"
                onClick={() => navigate({ to: "/" })}
                className="flex items-center gap-1.5 rounded-lg border border-zinc-700 bg-zinc-800 px-3 py-1.5 text-xs text-white hover:bg-zinc-700 font-sans cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">map</span>
                <span>View on GIS Map</span>
              </button>
            </div>

            {/* Actions */}
            <div className="flex flex-wrap items-center justify-end gap-2.5 border-t border-zinc-800 pt-4 font-sans text-xs">
              <button
                type="button"
                onClick={() => {
                  const targetFirId = selectedFir.ROWID;
                  setSelectedFir(null);
                  navigate({ to: "/network", search: { fir_id: targetFirId } as any });
                }}
                className="flex items-center gap-1.5 rounded-xl border border-zinc-700 bg-zinc-900 px-3.5 py-2 font-medium text-zinc-200 hover:bg-zinc-800 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">hub</span>
                <span>Inspect in Graph</span>
              </button>


              <button
                type="button"
                onClick={() => generateOfficialFIRPDF(selectedFir)}
                className="flex items-center gap-1.5 rounded-xl border border-sky-500/40 bg-sky-500/10 px-3.5 py-2 font-semibold text-sky-300 hover:bg-sky-500/20 hover:border-sky-500/60 shadow-md cursor-pointer transition-all"
              >
                <span className="material-symbols-outlined text-sm">description</span>
                <span>Export FIR (PDF)</span>
              </button>

              <button
                type="button"
                onClick={() => {
                  try {
                    sessionStorage.setItem(
                      "lumina_pending_prompt",
                      `Give full investigative intelligence briefing on FIR #${selectedFir.FIR_Number}`
                    );
                  } catch {}
                  setSelectedFir(null);
                  navigate({ to: "/ai-chatbot" });
                }}
                className="flex items-center gap-1.5 rounded-xl bg-white px-4 py-2 font-semibold text-black hover:bg-zinc-200 shadow-lg cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">auto_awesome</span>
                <span>Ask AI Copilot</span>
              </button>
            </div>

          </div>
        </div>
      )}
    </div>
  );
}
