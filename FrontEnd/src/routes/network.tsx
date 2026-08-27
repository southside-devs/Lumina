import { createFileRoute } from "@tanstack/react-router";
import { useState, useMemo } from "react";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";

const title = "LUMINA — Network Topology Intelligence";
const description =
  "Real-time criminal network topology, suspect link isolation, exposed entity mapping, and spatiotemporal network interaction analytics.";

export const Route = createFileRoute("/network")({
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
  name: string;
  type: NodeType;
  riskScore: number;
  x: number; // percentage in radar canvas
  y: number; // percentage in radar canvas
  radius: number; // size in px
  connections: string[]; // connected node ids
  isCenter?: boolean;
}

const INITIAL_NODES: NetworkNode[] = [
  { id: "center", name: "Target Node #8921 (S. Kumar)", type: "Suspects", riskScore: 94, x: 50, y: 50, radius: 14, connections: ["s1", "s2", "v1", "v2", "l1", "l2", "syn1"], isCenter: true },
  { id: "s1", name: "Suspect - A. Vardhan", type: "Suspects", riskScore: 88, x: 45, y: 35, radius: 12, connections: ["center", "v1"] },
  { id: "s2", name: "Suspect - M. Pasha", type: "Suspects", riskScore: 92, x: 38, y: 60, radius: 10, connections: ["center", "l1"] },
  { id: "s3", name: "Suspect - R. Hegde", type: "Suspects", riskScore: 78, x: 52, y: 30, radius: 7, connections: ["s1"] },
  { id: "v1", name: "Vehicle - KA-01-MJ-4920", type: "Vehicles", riskScore: 65, x: 40, y: 49, radius: 7, connections: ["center", "s1"] },
  { id: "v2", name: "Vehicle - KA-05-NB-1102", type: "Vehicles", riskScore: 72, x: 44, y: 61, radius: 6, connections: ["center"] },
  { id: "l1", name: "Location - Majestic Hub", type: "Locations", riskScore: 84, x: 54, y: 41, radius: 10, connections: ["center", "s2"] },
  { id: "l2", name: "Location - Electronic City", type: "Locations", riskScore: 79, x: 49, y: 63, radius: 7, connections: ["center"] },
  { id: "l3", name: "Location - MG Road Safehouse", type: "Locations", riskScore: 91, x: 57, y: 56, radius: 6, connections: ["syn1"] },
  { id: "syn1", name: "Syndicate - Red Line Network", type: "Syndicates", riskScore: 96, x: 56, y: 57, radius: 13, connections: ["center", "l3"] },
  { id: "syn2", name: "Syndicate - Cyber Cell Alpha", type: "Syndicates", riskScore: 82, x: 61, y: 37, radius: 8, connections: ["s1"] },
];

export function NetworkTopologyView() {
  const [selectedCategory, setSelectedCategory] = useState<NodeType | "ALL">("ALL");
  const [activeNode, setActiveNode] = useState<NetworkNode>(INITIAL_NODES[0]);
  const [hoveredNode, setHoveredNode] = useState<NetworkNode | null>(null);
  const [toastMessage, setToastMessage] = useState<string | null>(null);
  const [isolatedNodeId, setIsolatedNodeId] = useState<string | null>(null);

  const showToast = (msg: string) => {
    setToastMessage(msg);
    setTimeout(() => setToastMessage(null), 3500);
  };

  const handleIsolateAction = () => {
    setIsolatedNodeId("s1");
    showToast("⚡ Action Executed: Compromised suspect link isolated successfully.");
  };

  const handleExportPDF = () => {
    showToast("📄 SmartBrowz PDF Report generated and sent to download queue.");
  };

  const handleAskAI = () => {
    showToast("🤖 Querying QuickML AI Assistant for criminal network pattern analysis...");
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
    if (selectedCategory === "ALL") return INITIAL_NODES;
    return INITIAL_NODES.filter((n) => n.type === selectedCategory || n.isCenter);
  }, [selectedCategory]);

  return (
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

          <div className="relative z-10 flex h-full flex-col">
            {/* Top Bar Header inside Canvas */}
            <div className="flex flex-wrap items-center justify-between gap-4 px-2 py-1">
              <div>
                <h1 className="font-display text-2xl font-bold tracking-tight text-white flex items-center gap-3">
                  Network Topology
                  <span className="inline-flex items-center rounded-full border border-red-500/30 bg-red-500/10 px-2.5 py-0.5 font-mono text-[10px] font-semibold text-red-400">
                    LIVE STREAM
                  </span>
                </h1>
                <p className="text-xs text-zinc-400 mt-0.5">
                  Tactical Entity Relational Mapping & ST-DBSCAN Graph Engine
                </p>
              </div>

              {/* Legend Badges */}
              <div className="flex items-center gap-4 rounded-full border border-zinc-800/80 bg-zinc-950/70 px-4 py-1.5 backdrop-blur-md">
                {(["Suspects", "Vehicles", "Locations", "Syndicates"] as NodeType[]).map(
                  (type) => {
                    const color = getNodeColor(type);
                    const isSelected = selectedCategory === type;
                    return (
                      <button
                        key={type}
                        type="button"
                        onClick={() =>
                          setSelectedCategory(isSelected ? "ALL" : type)
                        }
                        className={`flex items-center gap-2 font-mono text-xs transition-all ${
                          isSelected || selectedCategory === "ALL"
                            ? "opacity-100 scale-105"
                            : "opacity-40 hover:opacity-75"
                        }`}
                      >
                        <span
                          className="h-2.5 w-2.5 rounded-full shadow-[0_0_8px_currentColor]"
                          style={{ backgroundColor: color, color }}
                        />
                        <span className="text-zinc-200 font-medium">{type}</span>
                      </button>
                    );
                  }
                )}
              </div>
            </div>

            {/* Grid Layout: Left Cards (240px) | Center Radar (Flex-1) | Right Action Panel (280px) */}
            <div className="mt-4 flex flex-1 flex-col gap-4 lg:flex-row min-h-0">
              
              {/* LEFT SIDEBAR: Stats & Connectors */}
              <div className="flex w-full lg:w-64 flex-col gap-3 overflow-y-auto pr-1">
                {/* Investigations / Nodes Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 tracking-wider">
                    <span>INVESTIGATIONS / NODES</span>
                    <span className="cursor-pointer text-zinc-500 hover:text-zinc-300">ⓘ</span>
                  </div>
                  <div className="mt-3 grid grid-cols-2 gap-2">
                    <div>
                      <div className="font-mono text-[10px] uppercase text-zinc-500">RECENT</div>
                      <div className="font-display text-2xl font-bold text-white">22</div>
                    </div>
                    <div>
                      <div className="font-mono text-[10px] uppercase text-zinc-500">TOTAL NODES</div>
                      <div className="font-display text-2xl font-bold text-white">55</div>
                    </div>
                  </div>
                  <div className="mt-4 flex items-center justify-between border-t border-zinc-900 pt-3 font-mono text-xs">
                    <div>
                      <span className="text-zinc-500">LOW </span>
                      <span className="font-semibold text-zinc-300">5</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">MEDIUM </span>
                      <span className="font-semibold text-amber-400">10</span>
                    </div>
                    <div>
                      <span className="text-zinc-500">HIGH </span>
                      <span className="font-semibold text-red-500">40</span>
                    </div>
                  </div>
                </div>

                {/* Exposed Entities Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg backdrop-blur-xl">
                  <div className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
                    EXPOSED ENTITIES
                  </div>
                  <div className="mt-2 flex items-baseline gap-3">
                    <span className="font-display text-3xl font-bold text-white">152</span>
                    <span className="inline-flex items-center text-xs font-medium text-red-400">
                      ↑ 15 flagged today
                    </span>
                  </div>
                </div>

                {/* Data Connectors Card */}
                <div className="rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg backdrop-blur-xl">
                  <div className="font-mono text-xs text-zinc-400 tracking-wider uppercase">
                    DATA CONNECTORS
                  </div>
                  <div className="mt-3 space-y-2.5">
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5">
                      <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-blue-500/20 text-blue-400 font-bold text-[10px]">
                          N4J
                        </div>
                        <span>Neo4j Graph DB</span>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </div>
                    <div className="flex items-center justify-between rounded-lg border border-zinc-800/50 bg-zinc-900/40 p-2.5">
                      <div className="flex items-center gap-2.5 text-xs font-medium text-zinc-200">
                        <div className="flex h-6 w-6 items-center justify-center rounded bg-teal-500/20 text-teal-400 font-bold text-[10px]">
                          ST
                        </div>
                        <span>ST-DBSCAN</span>
                      </div>
                      <span className="rounded bg-emerald-500/10 px-2 py-0.5 font-mono text-[9px] font-bold text-emerald-400 border border-emerald-500/20">
                        ACTIVE
                      </span>
                    </div>
                  </div>
                </div>

                {/* Overview Map Thumbnail Card */}
                <div className="relative flex-1 min-h-[140px] rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-3 shadow-lg backdrop-blur-xl flex flex-col">
                  <div className="flex items-center justify-between text-xs font-mono text-zinc-400 uppercase">
                    <span>OVERVIEW MAP</span>
                    <span className="material-symbols-outlined text-sm">fullscreen</span>
                  </div>
                  <div className="relative mt-2 flex-1 w-full rounded-lg bg-zinc-900/60 overflow-hidden flex items-center justify-center border border-zinc-800/40">
                    {/* Mini circular radar representation */}
                    <div className="relative h-24 w-24 rounded-full border border-zinc-700/40 flex items-center justify-center">
                      <div className="h-16 w-16 rounded-full border border-zinc-800" />
                      <div className="absolute h-full w-px bg-zinc-800/60" />
                      <div className="absolute w-full h-px bg-zinc-800/60" />
                      {/* Purple focus pill */}
                      <div className="absolute top-7 right-3 flex items-center gap-1 rounded bg-purple-600/40 px-1.5 py-0.5 font-mono text-[8px] font-bold text-purple-200 border border-purple-400/30 shadow-[0_0_10px_rgba(168,85,247,0.4)]">
                        Focus
                      </div>
                      <div className="h-2 w-2 rounded-full bg-red-500 shadow-[0_0_8px_#ef4444]" />
                    </div>
                  </div>
                </div>

              </div>

              {/* CENTER CANVAS: RADAR & TACTICAL GRAPH */}
              <div className="relative flex-1 rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-4 shadow-2xl backdrop-blur-2xl flex flex-col justify-between overflow-hidden">
                
                {/* Radar Grid Lines Background */}
                <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
                  {/* Radar Circles */}
                  <div className="h-[90%] aspect-square rounded-full border border-zinc-800/40 flex items-center justify-center">
                    <div className="h-[72%] aspect-square rounded-full border border-zinc-800/50 flex items-center justify-center">
                      <div className="h-[48%] aspect-square rounded-full border border-zinc-800/60 flex items-center justify-center">
                        <div className="h-[24%] aspect-square rounded-full border border-zinc-800/80" />
                      </div>
                    </div>
                  </div>

                  {/* Radar Crosshairs */}
                  <div className="absolute inset-x-8 top-1/2 h-px bg-zinc-800/40" />
                  <div className="absolute inset-y-8 left-1/2 w-px bg-zinc-800/40" />

                  {/* Diagonal Guidelines */}
                  <div className="absolute h-[85%] w-px rotate-45 bg-zinc-900/40" />
                  <div className="absolute h-[85%] w-px -rotate-45 bg-zinc-900/40" />
                </div>

                {/* Radar Compass Direction Markers */}
                <div className="absolute top-3 left-1/2 -translate-x-1/2 font-mono text-xs font-semibold text-zinc-500">
                  N
                </div>
                <div className="absolute bottom-3 left-1/2 -translate-x-1/2 font-mono text-xs font-semibold text-zinc-500">
                  S
                </div>
                <div className="absolute left-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-zinc-500">
                  W
                </div>
                <div className="absolute right-3 top-1/2 -translate-y-1/2 font-mono text-xs font-semibold text-zinc-500">
                  E
                </div>

                {/* SVG Connections & Dynamic Nodes Overlay */}
                <div className="relative w-full h-full flex-1 min-h-[360px]">
                  {/* SVG Edges */}
                  <svg className="absolute inset-0 h-full w-full pointer-events-none">
                    {filteredNodes.flatMap((node) =>
                      node.connections.map((targetId) => {
                        const targetNode = INITIAL_NODES.find((n) => n.id === targetId);
                        if (!targetNode) return null;
                        const color = getNodeColor(node.type);
                        const isIsolated =
                          isolatedNodeId === node.id || isolatedNodeId === targetId;

                        return (
                          <line
                            key={`${node.id}-${targetId}`}
                            x1={`${node.x}%`}
                            y1={`${node.y}%`}
                            x2={`${targetNode.x}%`}
                            y2={`${targetNode.y}%`}
                            stroke={isIsolated ? "#ef4444" : color}
                            strokeWidth={isIsolated ? 2.5 : 1.2}
                            strokeOpacity={isIsolated ? 0.9 : 0.35}
                            strokeDasharray={isIsolated ? "4 4" : undefined}
                          />
                        );
                      })
                    )}
                  </svg>

                  {/* Interactive Nodes */}
                  {filteredNodes.map((node) => {
                    const color = getNodeColor(node.type);
                    const isSelected = activeNode.id === node.id;
                    const isHovered = hoveredNode?.id === node.id;

                    return (
                      <div
                        key={node.id}
                        onClick={() => setActiveNode(node)}
                        onMouseEnter={() => setHoveredNode(node)}
                        onMouseLeave={() => setHoveredNode(null)}
                        style={{
                          left: `${node.x}%`,
                          top: `${node.y}%`,
                        }}
                        className={`absolute -translate-x-1/2 -translate-y-1/2 cursor-pointer transition-all duration-300 ${
                          isSelected ? "z-30 scale-125" : "z-20 hover:scale-110"
                        }`}
                      >
                        {/* Glowing Aura / Rings */}
                        {node.isCenter ? (
                          <div className="relative flex items-center justify-center">
                            <div className="absolute h-9 w-9 rounded-full border border-red-500/60 animate-ping opacity-75" />
                            <div className="absolute h-7 w-7 rounded-full border border-red-500/80" />
                            <div
                              className="h-4 w-4 rounded-full border-2 border-white shadow-[0_0_15px_#ef4444]"
                              style={{ backgroundColor: color }}
                            />
                          </div>
                        ) : (
                          <div
                            className="rounded-full shadow-lg transition-shadow"
                            style={{
                              width: `${node.radius * 1.6}px`,
                              height: `${node.radius * 1.6}px`,
                              backgroundColor: color,
                              boxShadow: `0 0 12px ${color}`,
                            }}
                          />
                        )}

                        {/* Node Hover Tooltip Card */}
                        {(isHovered || isSelected) && (
                          <div className="absolute left-1/2 bottom-full mb-2 -translate-x-1/2 whitespace-nowrap rounded-lg border border-zinc-800 bg-zinc-950/95 px-3 py-1.5 shadow-2xl backdrop-blur-xl">
                            <div className="font-mono text-[10px] font-bold uppercase text-zinc-400">
                              {node.type}
                            </div>
                            <div className="font-sans text-xs font-semibold text-white">
                              {node.name}
                            </div>
                            <div className="font-mono text-[10px] text-zinc-400">
                              Threat Level:{" "}
                              <span className="font-bold text-red-400">{node.riskScore} / 100</span>
                            </div>
                          </div>
                        )}
                      </div>
                    );
                  })}
                </div>
              </div>

              {/* RIGHT SIDEBAR: Action Items */}
              <div className="flex w-full lg:w-72 flex-col gap-3">
                <div className="flex flex-col h-full rounded-xl border border-zinc-800/80 bg-zinc-950/80 p-4 shadow-lg backdrop-blur-xl">
                  <div className="flex items-center justify-between">
                    <h3 className="font-sans text-sm font-bold text-white">
                      Action Items <span className="text-zinc-500 font-mono">(20)</span>
                    </h3>
                  </div>
                  <p className="text-[11px] text-zinc-400 mt-0.5">
                    Targeted node actions available
                  </p>

                  <div className="mt-4 flex-1 space-y-3">
                    {/* Action Card 1: PRIORITY ACTION */}
                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 transition-all hover:border-red-500/40">
                      <div className="font-mono text-[9px] font-bold tracking-wider uppercase text-red-500">
                        PRIORITY ACTION
                      </div>
                      <h4 className="mt-1 font-sans text-xs font-semibold text-white">
                        Isolate compromised suspect link
                      </h4>
                      <button
                        type="button"
                        onClick={handleIsolateAction}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/80 py-2 font-sans text-xs font-semibold text-zinc-200 transition-all hover:bg-red-500/20 hover:text-red-200 hover:border-red-500/40"
                      >
                        <span>Execute</span>
                        <span className="text-xs">✦</span>
                      </button>
                    </div>

                    {/* Action Card 2: REPORTING */}
                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 transition-all hover:border-zinc-700">
                      <div className="font-mono text-[9px] font-bold tracking-wider uppercase text-zinc-400">
                        REPORTING
                      </div>
                      <h4 className="mt-1 font-sans text-xs font-semibold text-white">
                        Export SmartBrowz PDF
                      </h4>
                      <button
                        type="button"
                        onClick={handleExportPDF}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/80 py-2 font-sans text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700/80 hover:text-white"
                      >
                        <span>Generate</span>
                        <span className="text-xs">⤓</span>
                      </button>
                    </div>

                    {/* Action Card 3: INTELLIGENCE */}
                    <div className="rounded-xl border border-zinc-800/90 bg-zinc-900/50 p-3.5 transition-all hover:border-zinc-700">
                      <div className="font-mono text-[9px] font-bold tracking-wider uppercase text-zinc-400">
                        INTELLIGENCE
                      </div>
                      <h4 className="mt-1 font-sans text-xs font-semibold text-white">
                        Query QuickML AI Assistant
                      </h4>
                      <button
                        type="button"
                        onClick={handleAskAI}
                        className="mt-3 flex w-full items-center justify-center gap-1.5 rounded-lg border border-zinc-700/60 bg-zinc-800/80 py-2 font-sans text-xs font-semibold text-zinc-200 transition-all hover:bg-zinc-700/80 hover:text-white"
                      >
                        <span>Ask AI</span>
                        <span className="text-xs">🖥</span>
                      </button>
                    </div>
                  </div>
                </div>
              </div>

            </div>

            {/* BOTTOM PANEL: Network Interaction Volume Bar Chart */}
            <div className="mt-4 rounded-xl border border-zinc-800/80 bg-zinc-950/90 p-4 shadow-xl backdrop-blur-xl">
              <div className="flex items-center justify-between">
                <div className="font-mono text-xs font-semibold tracking-wider text-zinc-300 uppercase">
                  Network Interaction Volume
                </div>
                <div className="flex items-center gap-2">
                  <span className="h-2 w-2 rounded-full bg-red-500 animate-pulse shadow-[0_0_8px_#ef4444]" />
                  <span className="font-mono text-xs font-semibold text-red-400">
                    Peak Activity detected
                  </span>
                </div>
              </div>

              {/* Bar Graph Visual */}
              <div className="mt-3 flex h-14 items-end gap-1 px-1">
                {Array.from({ length: 48 }).map((_, idx) => {
                  // Create peak spikes at index 12 (-24h), 28 (-12h), and 46 (Now)
                  const isPeak = idx === 12 || idx === 13 || idx === 28 || idx === 29 || idx === 45 || idx === 46;
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
                      title={`Volume interval #${idx + 1}`}
                    />
                  );
                })}
              </div>

              {/* Time Scale Labels */}
              <div className="mt-2 flex justify-between font-mono text-[10px] font-medium text-zinc-500">
                <span>-24h</span>
                <span>-18h</span>
                <span>-12h</span>
                <span>-6h</span>
                <span className="text-zinc-300 font-bold">Now</span>
              </div>
            </div>

          </div>
        </main>
      </div>
    </div>
  );
}
