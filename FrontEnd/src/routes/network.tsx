import { createFileRoute, useNavigate } from "@tanstack/react-router";
import { useState, useMemo, useEffect } from "react";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { generateIntelligenceBriefingPDF } from "@/lib/pdf-generator";
import { api, type TopSuspectItem, type SuspectNetworkResponse, type NetworkGraphNode } from "@/lib/api";
import { AuthGuard } from "@/lib/auth";

const title = "LUMINA — Network Topology Intelligence";
const description =
  "Real-time criminal network topology, suspect link isolation, exposed entity mapping, and spatiotemporal network interaction analytics.";

interface NetworkSearchParams {
  fir_id?: number;
  suspect_id?: number;
}

export const Route = createFileRoute("/network")({
  validateSearch: (search: Record<string, unknown>): NetworkSearchParams => {
    return {
      fir_id: search.fir_id ? Number(search.fir_id) : undefined,
      suspect_id: search.suspect_id ? Number(search.suspect_id) : undefined,
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
  component: NetworkTopologyView,
});

// Node types and color mappings
type NodeType = "Suspects" | "Vehicles" | "Locations" | "Syndicates";

interface NetworkNode {
  id: string;
  rawId?: number;
  name: string;
  type: NodeType;
  riskScore: number;
  arrestCount?: number;
  age?: number;
  gender?: string;
  involvement?: string;
  x: number; // percentage in radar canvas
  y: number; // percentage in radar canvas
  radius: number; // size in px
  connections: string[]; // connected node ids
  isCenter?: boolean;
}

const FALLBACK_NODES: NetworkNode[] = [
  { id: "suspect_43", name: "Target #43 (Jatin Kar)", type: "Suspects", riskScore: 98, x: 50, y: 50, radius: 14, connections: ["co_569", "co_2583", "loc_1", "syn_1"], isCenter: true, arrestCount: 12 },
  { id: "co_569", name: "Accomplice — Lohit Rai", type: "Suspects", riskScore: 92, x: 44, y: 34, radius: 11, connections: ["suspect_43"], arrestCount: 8 },
  { id: "co_2583", name: "Accomplice — Rajata Contractor", type: "Suspects", riskScore: 68, x: 62, y: 40, radius: 9, connections: ["suspect_43"], arrestCount: 2 },
  { id: "co_981", name: "Accomplice — Umang Shankar", type: "Suspects", riskScore: 74, x: 38, y: 60, radius: 9, connections: ["suspect_43"], arrestCount: 3 },
  { id: "loc_1", name: "Division — Commercial Street PS", type: "Locations", riskScore: 84, x: 54, y: 22, radius: 8, connections: ["suspect_43"] },
  { id: "loc_2", name: "Division — Mudhol PS", type: "Locations", riskScore: 79, x: 42, y: 76, radius: 8, connections: ["suspect_43"] },
  { id: "syn_1", name: "Syndicate — Theft & Extortion Cell", type: "Syndicates", riskScore: 96, x: 74, y: 56, radius: 12, connections: ["suspect_43"] },
];

export function NetworkTopologyView() {
  const navigate = useNavigate();
  const search = Route.useSearch();
  const [topSuspects, setTopSuspects] = useState<TopSuspectItem[]>([]);
  const [selectedSuspectId, setSelectedSuspectId] = useState<number | null>(null);
  const [currentNetwork, setCurrentNetwork] = useState<SuspectNetworkResponse | null>(null);
  const [nodes, setNodes] = useState<NetworkNode[]>(FALLBACK_NODES);
  const [selectedCategory, setSelectedCategory] = useState<NodeType | "ALL">("ALL");
  const [activeNode, setActiveNode] = useState<NetworkNode>(FALLBACK_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  // 1. Fetch top repeat offenders list on mount
  useEffect(() => {
    let mounted = true;
    async function loadTopSuspects() {
      try {
        const list = await api.getTopSuspects();
        if (mounted && list.length > 0) {
          setTopSuspects(list);
        }
      } catch (e) {
        console.warn("Failed to load top suspects:", e);
      }
    }
    loadTopSuspects();
    return () => {
      mounted = false;
    };
  }, []);

  // 2. React to search.fir_id or search.suspect_id URL changes
  useEffect(() => {
    let mounted = true;
    async function resolveTarget() {
      if (search.suspect_id) {
        setSelectedSuspectId(Number(search.suspect_id));
      } else if (search.fir_id) {
        setLoading(true);
        try {
          const inc = await api.getIncidentNetwork(Number(search.fir_id));
          if (mounted && inc && inc.incident) {
            if (inc.suspects && inc.suspects.length > 0) {
              const primary = inc.suspects[0];
              setSelectedSuspectId(primary.ROWID);
              showToast(`🎯 Linked FIR #${inc.incident.FIR_Number} — Targeting ${primary.Name}`);
            } else {
              // Custom incident graph for cases with 0 booked suspects
              const fir = inc.incident;
              const firId = `fir_${fir.ROWID || fir.ID}`;
              const firNode: NetworkNode = {
                id: firId,
                name: `Case #${fir.FIR_Number} (${fir.Crime_Group})`,
                type: "Suspects",
                riskScore: 78,
                x: 50,
                y: 50,
                radius: 15,
                connections: ["loc_station", "syn_crime"],
                isCenter: true,
              };
              const locNode: NetworkNode = {
                id: "loc_station",
                name: `Station — ${fir.Station_Name || "Division #" + fir.Station_ID}`,
                type: "Locations",
                riskScore: 65,
                x: 75,
                y: 40,
                radius: 9,
                connections: [firId],
              };
              const synNode: NetworkNode = {
                id: "syn_crime",
                name: `Category — ${fir.Crime_Group} Cell`,
                type: "Syndicates",
                riskScore: 82,
                x: 30,
                y: 65,
                radius: 11,
                connections: [firId],
              };
              setNodes([firNode, locNode, synNode]);
              setActiveNode(firNode);
              setCurrentNetwork({
                target: {
                  id: fir.ROWID ?? fir.ID ?? 0,
                  name: `FIR #${fir.FIR_Number}`,
                  arrestCount: 0,
                  riskScore: 78,
                  linkedCasesCount: 1,
                  linkedCases: [{
                    FIR_ID: fir.ROWID ?? fir.ID ?? 0,
                    FIR_Number: fir.FIR_Number,
                    Crime_Group: fir.Crime_Group,
                    Date: fir.Date,
                    Station_Name: fir.Station_Name,
                    District_Name: fir.District_Name,
                  }],
                },
                nodes: [firNode, locNode, synNode],
                coAccusedCount: 0,
              });
              showToast(`🎯 Incident Dossier — FIR #${fir.FIR_Number}`);
            }
          }
        } catch (e) {
          console.warn("Failed to load incident network:", e);
        } finally {
          if (mounted) setLoading(false);
        }
      } else {
        // Default target if none in URL
        setSelectedSuspectId(43);
      }
    }
    resolveTarget();
    return () => {
      mounted = false;
    };
  }, [search.fir_id, search.suspect_id]);

  // 3. Fetch specific network graph when target suspect changes
  useEffect(() => {
    let mounted = true;
    async function loadNetwork() {
      if (!selectedSuspectId) return;
      setLoading(true);
      try {
        const net = await api.getSuspectNetwork(selectedSuspectId);
        if (mounted && net && net.nodes.length > 0) {
          setCurrentNetwork(net);
          setNodes(net.nodes as NetworkNode[]);
          const center = net.nodes.find((n) => n.isCenter) || net.nodes[0];
          setActiveNode(center as NetworkNode);
        }
      } catch (e) {
        console.warn("Using fallback network nodes:", e);
      } finally {
        if (mounted) setLoading(false);
      }
    }
    loadNetwork();
    return () => {
      mounted = false;
    };
  }, [selectedSuspectId]);

  const handleIsolateAction = () => {
    const targetId = activeNode.isCenter ? "co_569" : activeNode.id;
    setIsolatedNodeId((prev) => (prev ? null : targetId));
    showToast(
      isolatedNodeId
        ? "⚡ Node link isolation cleared."
        : `⚡ Action Executed: Link to ${activeNode.name} isolated successfully.`
    );
  };

  const handleExportPDF = () => {
    const targetName = currentNetwork?.target?.name || activeNode.name;
    showToast(`📄 Generating Intelligence Dossier PDF for ${targetName}...`);
    setTimeout(() => {
      generateIntelligenceBriefingPDF({
        title: `KSP INTELLIGENCE DOSSIER — SYNDICATE TOPOLOGY (${targetName.toUpperCase()})`,
        totalFirs: currentNetwork?.target?.linkedCasesCount || 12,
        repeatOffenders: currentNetwork?.coAccusedCount || 7,
        criticalHotspots: 3,
        topDistrict: "Bengaluru Urban Command Sector",
      });
    }, 400);
  };

  const handleAskAI = () => {
    const targetName = currentNetwork?.target?.name || activeNode.name;
    const prompt = `Give me a comprehensive intelligence dossier and syndicate briefing on repeat offender ${targetName}, their co-accused network, and linked criminal cases.`;
    sessionStorage.setItem("lumina_pending_prompt", prompt);
    showToast("🤖 Navigating to Lumina AI Copilot for network analysis...");
    setTimeout(() => {
      navigate({ to: "/ai-chatbot" });
    }, 500);
  };

  // Node color helper
  const getNodeColor = (type: NodeType) => {
    switch (type) {
      case "Suspects":
        return "#ef4444"; // Red
      case "Vehicles":
        return "#eab308"; // Yellow
      case "Locations":
        return "#a855f7"; // Purple
      case "Syndicates":
        return "#f97316"; // Orange
    }
  };

  // Node filter
  const filteredNodes = useMemo(() => {
    if (selectedCategory === "ALL") return nodes;
    return nodes.filter((n) => n.type === selectedCategory || n.isCenter);
  }, [nodes, selectedCategory]);

  return (
    <AuthGuard>
      <div className="flex h-screen overflow-hidden bg-[#07080c] text-foreground font-sans selection:bg-red-500/30">
        <SideRail />

      <div className="ml-16 flex h-full flex-1 flex-col">
        <TopBar />

        {/* Main Command Workspace */}
        <main className="relative mt-14 flex-1 overflow-hidden bg-[#07080c] p-4 lg:p-6">
          {/* Toast Notification */}
          {toastMessage && (
            <div className="absolute top-4 left-1/2 z-50 -translate-x-1/2 rounded-full border border-red-500/40 bg-zinc-950/90 px-5 py-2.5 shadow-[0_0_25px_rgba(239,68,68,0.3)] backdrop-blur-xl transition-all">
              <p className="font-mono text-xs font-semibold tracking-wide text-red-200">
                {toastMessage}
              </p>
            </div>
          )}

          {/* HUD L-Shaped Outer Corners */}
          <div className="pointer-events-none absolute inset-4 border border-zinc-800/40 rounded-xl">
            <div className="absolute top-0 left-0 h-4 w-4 border-t-2 border-l-2 border-zinc-700/60 rounded-tl-xl" />
            <div className="absolute top-0 right-0 h-4 w-4 border-t-2 border-r-2 border-zinc-700/60 rounded-tr-xl" />
            <div className="absolute bottom-0 left-0 h-4 w-4 border-b-2 border-l-2 border-zinc-700/60 rounded-bl-xl" />
            <div className="absolute bottom-0 right-0 h-4 w-4 border-b-2 border-r-2 border-zinc-700/60 rounded-br-xl" />
          </div>

          <div className="relative flex h-full flex-col overflow-y-auto lg:overflow-hidden pb-4 lg:pb-0">
            {/* Header: Title & Repeat Offenders Quick-Selector */}
            <div className="flex flex-wrap items-center justify-between gap-3 border-b border-zinc-800/60 pb-3">
              <div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                  <h1 className="font-sans text-lg font-bold tracking-tight text-white">
                    Criminal Network &amp; Syndicate Topology
                  </h1>
                  <span className="rounded bg-red-500/10 px-2 py-0.5 font-mono text-[10px] font-bold text-red-400 border border-red-500/20">
                    LIVE CO-ACCUSED ENGINE
                  </span>
                </div>
                <p className="font-mono text-xs text-zinc-400">
                  Target:{" "}
                  <strong className="text-white">
                    {currentNetwork?.target?.name || activeNode.name}
                  </strong>{" "}
                  ({currentNetwork?.target?.arrestCount || 0} Arrests,{" "}
                  {currentNetwork?.coAccusedCount || 0} Co-Accused links)
                </p>
              </div>

              {/* Target Suspect Selector Pills */}
              <div className="flex items-center gap-1.5 overflow-x-auto pb-1 w-full max-w-xl custom-scrollbar">
                <span className="font-mono text-[10px] uppercase text-zinc-500 shrink-0 mr-1">
                  Target:
                </span>
                {(topSuspects.length > 0 ? topSuspects.slice(0, 5) : [
                  { id: "43", name: "Jatin Kar", arrestCount: 12 },
                  { id: "53", name: "Omkaar Chopra", arrestCount: 12 },
                  { id: "66", name: "Banjeet Grewal", arrestCount: 12 },
                  { id: "240", name: "Pranit Garde", arrestCount: 12 },
                  { id: "322", name: "Hitesh Devan", arrestCount: 12 },
                ]).map((s) => {
                  const sId = parseInt(s.id, 10);
                  const isSelected = selectedSuspectId === sId;
                  return (
                    <button
                      key={s.id}
                      type="button"
                      onClick={() => setSelectedSuspectId(sId)}
                      className={`flex items-center gap-1.5 rounded-lg border px-2.5 py-1 font-mono text-xs transition-all cursor-pointer shrink-0 ${
                        isSelected
                          ? "border-red-500/60 bg-red-500/20 text-white font-bold shadow-[0_0_12px_rgba(239,68,68,0.3)]"
                          : "border-zinc-800 bg-zinc-900/60 text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800/80"
                      }`}
                    >
                      <span>{s.name}</span>
                      <span className="rounded bg-red-500/30 px-1 py-0.2 text-[9px] font-bold text-red-300">
                        {s.arrestCount}x
                      </span>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Category Filter Pills */}
            <div className="mt-3 flex items-center justify-between">
              <div className="flex flex-wrap items-center gap-2">
                <button
                  type="button"
                  onClick={() => setSelectedCategory("ALL")}
                  className={`rounded-lg border px-3 py-1 font-mono text-xs transition-colors cursor-pointer ${
                    selectedCategory === "ALL"
                      ? "border-zinc-500 bg-zinc-800 text-white font-semibold"
                      : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white"
                  }`}
                >
                  ALL NODES ({nodes.length})
                </button>

                {(["Suspects", "Locations", "Syndicates", "Vehicles"] as NodeType[]).map(
                  (type) => {
                    const color = getNodeColor(type);
                    const isSelected = selectedCategory === type;
                    const count = nodes.filter((n) => n.type === type).length;

                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() => setSelectedCategory(type)}
                        className={`flex items-center gap-2 rounded-lg border px-3 py-1 font-mono text-xs transition-colors cursor-pointer ${
                          isSelected
                            ? "border-zinc-500 bg-zinc-800 text-white"
                            : "border-zinc-800 bg-zinc-900/50 text-zinc-400 hover:text-white"
                        }`}
                      >
                        <span
                          className="h-2 w-2 rounded-full"
                          style={{ backgroundColor: color }}
                        />
                        <span>
                          {type} ({count})
                        </span>
                      </button>
                    );
                  }
                )}
              </div>

              {loading && (
                <span className="font-mono text-xs text-red-400 animate-pulse">
                  ⚡ Recalculating topology graph...
                </span>
              )}
            </div>

            {/* Main Grid: Left Stats (240px) | Center Radar (Flex-1) | Right Target Dossier (290px) */}
            <div className="mt-3 flex flex-col lg:flex-row gap-3 min-h-0 shrink-0 lg:flex-1">
              {/* LEFT SIDEBAR: Stats & Connectors */}
              <div className="flex w-full lg:w-60 flex-col gap-3 overflow-y-auto pr-1">
                {/* Investigations / Nodes Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 tracking-wider">
                    <span>SYNDICATE TELEMETRY</span>
                  </div>
                  <div className="mt-2.5 grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-mono text-[9px] uppercase text-zinc-500">REPEAT OFFENDERS</div>
                      <div className="font-display text-xl font-bold text-white">456</div>
                    </div>
                    <div>
                      <div className="font-mono text-[9px] uppercase text-zinc-500">DATABASE NODES</div>
                      <div className="font-display text-xl font-bold text-white">3,000</div>
                    </div>
                  </div>
                  <div className="mt-3 flex items-center justify-between border-t border-zinc-900 pt-2.5 font-mono text-[11px]">
                    <div>
                      <span className="text-zinc-500">CO-ACCUSED: </span>
                      <span className="font-semibold text-red-400">
                        {currentNetwork?.coAccusedCount ?? 7}
                      </span>
                    </div>
                    <div>
                      <span className="text-zinc-500">CASES: </span>
                      <span className="font-semibold text-sky-400">
                        {currentNetwork?.target?.linkedCasesCount ?? 12}
                      </span>
                    </div>
                  </div>
                </div>

                {/* Data Connectors Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3.5 shadow-lg backdrop-blur-xl">
                  <div className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
                    DATA CONNECTORS
                  </div>
                  <div className="mt-2.5 space-y-2">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-blue-500/20 text-blue-400 font-bold text-[9px]">
                          SQL
                        </div>
                        <span>Relational Graph</span>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[8px] font-bold text-emerald-400 border border-emerald-500/20">
                        LIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2">
                      <div className="flex items-center gap-2 text-xs font-medium text-zinc-200">
                        <div className="flex h-5 w-5 items-center justify-center rounded bg-purple-500/20 text-purple-400 font-bold text-[9px]">
                          ZIA
                        </div>
                        <span>AutoML Risk Scoring</span>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-1.5 py-0.2 font-mono text-[8px] font-bold text-emerald-400 border border-emerald-500/20">
                        SYNC
                      </span>
                    </div>
                  </div>
                </div>

                {/* Return to Tactical Map */}
                <div
                  onClick={() => navigate({ to: "/" })}
                  className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-lg backdrop-blur-xl flex items-center justify-between cursor-pointer hover:border-zinc-700 transition-all"
                >
                  <div className="flex items-center gap-2 text-xs font-mono text-zinc-300">
                    <span className="material-symbols-outlined text-base text-red-400">map</span>
                    <span>Strategic GIS Map</span>
                  </div>
                  <span className="material-symbols-outlined text-sm text-zinc-500">arrow_forward</span>
                </div>
              </div>

              {/* CENTER: Radar / Criminal Topology Canvas */}
              <div className="relative flex lg:flex-1 items-center justify-center rounded-xl border border-zinc-800/80 bg-gradient-to-b from-zinc-950/90 via-[#07080c] to-zinc-950/90 p-4 shadow-2xl backdrop-blur-xl overflow-hidden min-h-[320px] lg:min-h-[380px] w-full">
                {/* 1:1 Aspect-Square Radar Container Centered */}
                <div className="relative aspect-square w-full max-w-[540px] lg:w-auto lg:h-[94%] flex items-center justify-center select-none mx-auto">
                  {/* Concentric Radar Rings */}
                  <div className="pointer-events-none absolute inset-0 rounded-full border border-zinc-800/40" />
                  <div className="pointer-events-none absolute inset-[16%] rounded-full border border-zinc-800/40" />
                  <div className="pointer-events-none absolute inset-[34%] rounded-full border border-zinc-800/50" />
                  <div className="pointer-events-none absolute inset-[52%] rounded-full border border-red-500/20 animate-pulse" />
                  <div className="pointer-events-none absolute h-full w-px bg-zinc-800/30" />
                  <div className="pointer-events-none absolute h-px w-full bg-zinc-800/30" />

                  {/* Perfectly Centered Rotating Radar Sweep Line */}
                  <div className="pointer-events-none absolute inset-0 rounded-full bg-[conic-gradient(from_0deg,transparent_0deg,transparent_310deg,rgba(239,68,68,0.15)_360deg)] animate-[spin_7s_linear_infinite]" />

                  {/* SVG Connecting Lines */}
                  <svg className="pointer-events-none absolute inset-0 h-full w-full">
                    {filteredNodes.map((node) => {
                      return node.connections.map((targetId) => {
                        const target = nodes.find((n) => n.id === targetId);
                        if (!target) return null;

                        const isIsolated =
                          isolatedNodeId === node.id || isolatedNodeId === target.id;

                        return (
                          <line
                            key={`${node.id}-${targetId}`}
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2={`${target.x}%`}
                            y2={`${target.y}%`}
                            stroke={isIsolated ? "#3f3f46" : "#ef4444"}
                            strokeWidth={node.isCenter || target.isCenter ? 1.8 : 1}
                            strokeOpacity={isIsolated ? 0.2 : 0.45}
                            strokeDasharray={isIsolated ? "4 4" : undefined}
                          />
                        );
                      });
                    })}
                  </svg>

                  {/* Interactive Radar Nodes */}
                  <div className="relative h-full w-full">
                    {filteredNodes.map((node) => {
                      const color = getNodeColor(node.type);
                      const isActive = activeNode.id === node.id;
                      const isHovered = hoveredNode?.id === node.id;
                      const isIsolated = isolatedNodeId === node.id;

                      return (
                        <div
                          key={node.id}
                          onClick={() => setActiveNode(node)}
                          onMouseEnter={() => setHoveredNode(node)}
                          onMouseLeave={() => setHoveredNode(null)}
                          style={{
                            left: `${node.x}%`,
                            top: `${node.y}%`,
                            width: `${node.radius * 2}px`,
                            height: `${node.radius * 2}px`,
                          }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                            isIsolated ? "opacity-30 grayscale" : "opacity-100"
                          }`}
                        >
                          {/* Glow ring on active or center */}
                          {(isActive || node.isCenter) && (
                            <div
                              className="absolute -inset-2 rounded-full animate-ping opacity-60"
                              style={{ backgroundColor: `${color}40` }}
                            />
                          )}

                          {/* Outer pulse for center target */}
                          {node.isCenter && (
                            <div className="absolute -inset-3 rounded-full border border-red-500/60 animate-pulse" />
                          )}

                          {/* Node Body */}
                          <div
                            className={`flex h-full w-full items-center justify-center rounded-full border-2 transition-transform hover:scale-125 shadow-lg ${
                              isActive ? "border-white scale-125" : "border-zinc-900"
                            }`}
                            style={{
                              backgroundColor: color,
                              boxShadow: `0 0 16px ${color}80`,
                            }}
                          >
                            {node.isCenter ? (
                              <span className="text-[10px] font-bold text-white">★</span>
                            ) : (
                              <span className="text-[8px] font-bold text-black/80">
                                {node.arrestCount ? `${node.arrestCount}` : ""}
                              </span>
                            )}
                          </div>

                          {/* Permanent Node Label */}
                          <div className="pointer-events-none absolute top-full mt-1 left-1/2 -translate-x-1/2 whitespace-nowrap text-center">
                            <span
                              className={`rounded px-1.5 py-0.2 font-mono text-[9px] font-bold tracking-tight shadow-md backdrop-blur-md ${
                                node.isCenter
                                  ? "bg-red-500/80 text-white font-extrabold"
                                  : isActive
                                  ? "bg-zinc-900/90 text-white border border-zinc-700"
                                  : "bg-black/70 text-zinc-300"
                              }`}
                            >
                              {node.name.split("—")[1] || node.name}
                            </span>
                          </div>

                          {/* Hover Tooltip */}
                          {isHovered && (
                            <div className="pointer-events-none absolute bottom-full left-1/2 z-50 mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-700 bg-zinc-950/95 p-2 shadow-2xl backdrop-blur-xl">
                              <div className="font-mono text-[9px] font-bold uppercase text-zinc-400">
                                {node.type}
                              </div>
                              <div className="font-sans text-xs font-semibold text-white">
                                {node.name}
                              </div>
                              <div className="font-mono text-[10px] text-zinc-400">
                                Threat Index:{" "}
                                <span className="font-bold text-red-400">
                                  {node.riskScore} / 100
                                </span>
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                </div>
              </div>

              {/* RIGHT SIDEBAR: Target Suspect Dossier & Action Console */}
              <div className="flex w-full lg:w-72 flex-col gap-3">
                <div className="flex flex-col h-full rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans text-sm font-bold text-white">
                      Target Dossier
                    </h3>
                    <span className="font-mono text-[10px] font-bold text-red-400 bg-red-500/10 px-2 py-0.5 rounded border border-red-500/20">
                      THREAT {activeNode.riskScore}/100
                    </span>
                  </div>

                  {/* Active Node Telemetry */}
                  <div className="mt-3 rounded-lg border border-zinc-800 bg-zinc-900/60 p-3 font-mono text-xs">
                    <div className="font-sans font-bold text-sm text-white truncate">
                      {activeNode.name}
                    </div>
                    <div className="mt-1 flex items-center gap-2 text-zinc-400 text-[11px]">
                      <span>Type: <strong className="text-zinc-200">{activeNode.type}</strong></span>
                      {activeNode.gender && (
                        <span>• {activeNode.gender}, Age {activeNode.age || "N/A"}</span>
                      )}
                    </div>
                    {typeof activeNode.arrestCount === "number" && (
                      <div className="mt-1.5 text-zinc-300">
                        Prior Arrests: <strong className="text-red-400 font-bold">{activeNode.arrestCount} cases</strong>
                      </div>
                    )}
                  </div>

                  {/* Linked FIRs list for active target */}
                  {currentNetwork?.target?.linkedCases && currentNetwork.target.linkedCases.length > 0 && (
                    <div className="mt-3">
                      <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-400 mb-1.5">
                        <span>Linked Cases ({currentNetwork.target.linkedCases.length})</span>
                        <span className="text-zinc-500">BNS Legal</span>
                      </div>
                      <div className="space-y-1.5 max-h-36 overflow-y-auto custom-scrollbar pr-1">
                        {currentNetwork.target.linkedCases.slice(0, 4).map((c, idx) => (
                          <div
                            key={idx}
                            className="p-2 rounded border border-zinc-800/80 bg-zinc-900/40 text-[11px] font-mono"
                          >
                            <div className="flex justify-between text-white font-bold">
                              <span>FIR #{c.FIR_Number}</span>
                              <span className="text-red-400 text-[10px]">{c.Involvement_Type || "Primary"}</span>
                            </div>
                            <div className="text-zinc-400 truncate text-[10px] mt-0.5">
                              {c.Crime_Group} • {c.Station_Name || "KSP Central"}
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Action Cards */}
                  <div className="mt-4 flex-1 space-y-2.5 pt-2 border-t border-zinc-900">
                    {/* Action 1: Link Isolation */}
                    <button
                      type="button"
                      onClick={handleIsolateAction}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-red-500/30 bg-red-500/10 py-2 font-sans text-xs font-semibold text-red-200 transition-all hover:bg-red-500/20 hover:border-red-500/60 cursor-pointer"
                    >
                      <span>{isolatedNodeId ? "Restore Link Isolation" : "Isolate Suspect Link"}</span>
                      <span className="text-xs">⚡</span>
                    </button>

                    {/* Action 2: PDF Dossier Export */}
                    <button
                      type="button"
                      onClick={handleExportPDF}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/80 py-2 font-sans text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700/80 hover:text-white cursor-pointer"
                    >
                      <span>Export Dossier (PDF)</span>
                      <span className="text-xs">⤓</span>
                    </button>

                    {/* Action 3: AI Copilot */}
                    <button
                      type="button"
                      onClick={handleAskAI}
                      className="flex w-full items-center justify-center gap-1.5 rounded-lg border border-sky-500/30 bg-sky-500/10 py-2 font-sans text-xs font-semibold text-sky-200 transition-all hover:bg-sky-500/20 hover:text-white cursor-pointer"
                    >
                      <span>Ask AI Copilot Briefing</span>
                      <span className="text-xs">✦</span>
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* BOTTOM PANEL: Network Interaction Volume Bar Chart */}
            <div className="mt-3 rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-3 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                  Network Interaction Volume
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                  <span className="font-mono text-xs font-semibold text-red-400">
                    Syndicate Activity across 3,000 suspects &amp; 7,957 associations
                  </span>
                </div>
              </div>

              {/* Bar Graph Visual */}
              <div className="mt-2.5 flex h-10 items-end gap-1 px-1">
                {Array.from({ length: 48 }).map((_, idx) => {
                  const isPeak =
                    idx === 12 || idx === 13 || idx === 28 || idx === 29 || idx === 45 || idx === 46;
                  const heightPercent = isPeak
                    ? Math.floor(Math.random() * 25) + 75
                    : Math.floor(Math.random() * 35) + 15;

                  return (
                    <div
                      key={idx}
                      className={`flex-1 rounded-t transition-all ${
                        isPeak
                          ? "bg-red-500 shadow-[0_0_10px_#ef4444]"
                          : "bg-purple-900/60 hover:bg-purple-600/80"
                      }`}
                      style={{ height: `${heightPercent}%` }}
                      title={`Activity interval #${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Time Scale Labels */}
              <div className="mt-1 flex justify-between font-mono text-[9px] font-medium text-zinc-500">
                <span>-24h</span>
                <span>-18h</span>
                <span>-12h</span>
                <span>-6h</span>
                <span className="text-zinc-300 font-bold">Live Stream</span>
              </div>
            </div>
          </div>
        </main>
      </div>
    </div>
    </AuthGuard>
  );
}
