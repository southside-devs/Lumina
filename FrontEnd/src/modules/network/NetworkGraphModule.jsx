import React, { useState } from "react";
import { Network, Info, X, Users, Car, Home, Banknote, GitMerge } from "lucide-react";

const NODES = [
  { id: "S001", label: "Ravi Kumar", type: "suspect",    risk: "critical", district: "Bengaluru Urban",   firs: 4, linked: ["S002","S003","V001","H001"] },
  { id: "S002", label: "Mohan Das",  type: "suspect",    risk: "high",     district: "Mysuru City",       firs: 2, linked: ["S001","V002","F001"] },
  { id: "S003", label: "Arjun Nair", type: "suspect",    risk: "high",     district: "Mangaluru City",    firs: 3, linked: ["S001","H001","V001"] },
  { id: "V001", label: "KA-19-AX-4412", type: "vehicle", risk: "high",     district: "Bengaluru Urban",   firs: 2, linked: ["S001","S003"] },
  { id: "V002", label: "KA-55-BK-7200", type: "vehicle", risk: "medium",   district: "Mysuru City",       firs: 1, linked: ["S002"] },
  { id: "H001", label: "Safehouse — Hebbal", type: "location", risk: "critical", district: "Bengaluru Urban", firs: 3, linked: ["S001","S003"] },
  { id: "F001", label: "Acct: XX-9921", type: "finance", risk: "high",     district: "Belagavi",          firs: 2, linked: ["S002"] },
  { id: "G001", label: "Syndicate-Alpha", type: "gang",  risk: "critical", district: "Bengaluru Urban",   firs: 6, linked: ["S001","S002","S003","H001"] },
];

const NODE_CONFIG = {
  suspect:  { icon: Users,    color: "#f43f5e", bg: "rgba(244,63,94,0.15)",   label: "Suspect" },
  vehicle:  { icon: Car,      color: "#f59e0b", bg: "rgba(245,158,11,0.15)",  label: "Vehicle" },
  location: { icon: Home,     color: "#8b5cf6", bg: "rgba(139,92,246,0.15)",  label: "Location" },
  finance:  { icon: Banknote, color: "#06b6d4", bg: "rgba(6,182,212,0.15)",   label: "Finance" },
  gang:     { icon: GitMerge, color: "#ff6b35", bg: "rgba(255,107,53,0.15)",  label: "Syndicate" },
};

const RISK_BADGE = {
  critical: { color: "#fb7185", bg: "rgba(244,63,94,0.12)", border: "rgba(244,63,94,0.3)" },
  high:     { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  medium:   { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
};

export default function NetworkGraphModule() {
  const [selected, setSelected] = useState(null);
  const [filterType, setFilterType] = useState("all");

  const filtered = NODES.filter((n) => filterType === "all" || n.type === filterType);

  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>Criminal Network Graph</h1>
        <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "4px" }}>Suspect · Vehicle · Location · Finance · Syndicate Relationship Explorer</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 360px", gap: "20px" }}>
        {/* Graph Canvas */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Network size={18} style={{ color: "#8b5cf6" }} />
              <h3>Relationship Network</h3>
            </div>
            <div style={{ display: "flex", gap: "6px" }}>
              {["all", "suspect", "vehicle", "location", "finance", "gang"].map((t) => (
                <button
                  key={t}
                  onClick={() => setFilterType(t)}
                  style={{
                    background: filterType === t ? "rgba(59,130,246,0.2)" : "transparent",
                    border: filterType === t ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
                    borderRadius: "6px", padding: "4px 10px", cursor: "pointer",
                    color: filterType === t ? "#60a5fa" : "#64748b", fontSize: "11px", fontWeight: 600, textTransform: "capitalize"
                  }}
                >{t}</button>
              ))}
            </div>
          </div>
          <div className="panel-body">
            {/* Visual Node Grid (pseudo-graph) */}
            <div style={{ display: "grid", gridTemplateColumns: "repeat(4, 1fr)", gap: "14px", padding: "10px" }}>
              {filtered.map((node) => {
                const cfg = NODE_CONFIG[node.type];
                const Icon = cfg.icon;
                const risk = RISK_BADGE[node.risk] || RISK_BADGE.medium;
                return (
                  <div
                    key={node.id}
                    onClick={() => setSelected(node)}
                    style={{
                      background: selected?.id === node.id ? cfg.bg : "rgba(30,41,59,0.4)",
                      border: `1px solid ${selected?.id === node.id ? cfg.color + "60" : "rgba(255,255,255,0.07)"}`,
                      borderRadius: "12px", padding: "16px", cursor: "pointer",
                      transition: "all 0.2s ease",
                      boxShadow: selected?.id === node.id ? `0 0 18px ${cfg.color}30` : "none",
                    }}
                    onMouseEnter={(e) => { if (selected?.id !== node.id) e.currentTarget.style.background = "rgba(30,41,59,0.7)"; }}
                    onMouseLeave={(e) => { if (selected?.id !== node.id) e.currentTarget.style.background = "rgba(30,41,59,0.4)"; }}
                  >
                    <div style={{ width: "40px", height: "40px", borderRadius: "10px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", marginBottom: "10px", color: cfg.color }}>
                      <Icon size={20} />
                    </div>
                    <div style={{ fontSize: "12px", fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>{node.label}</div>
                    <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>{node.district}</div>
                    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                      <span style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, borderRadius: "4px", fontSize: "9px", fontWeight: 800, padding: "2px 6px", textTransform: "uppercase" }}>{node.risk}</span>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "11px", color: "#64748b" }}>{node.firs} FIRs</span>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* Legend */}
            <div style={{ display: "flex", gap: "16px", flexWrap: "wrap", marginTop: "16px", padding: "12px 10px", borderTop: "1px solid rgba(255,255,255,0.06)" }}>
              {Object.entries(NODE_CONFIG).map(([type, cfg]) => {
                const Icon = cfg.icon;
                return (
                  <div key={type} style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#94a3b8" }}>
                    <Icon size={13} style={{ color: cfg.color }} />
                    <span>{cfg.label}</span>
                  </div>
                );
              })}
            </div>
          </div>
        </div>

        {/* Inspector Drawer */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Info size={18} style={{ color: "#06b6d4" }} />
              <h3>Node Inspector</h3>
            </div>
          </div>
          <div className="panel-body">
            {!selected ? (
              <div style={{ textAlign: "center", padding: "40px 20px", color: "#475569" }}>
                <Network size={40} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
                <p style={{ fontSize: "13px" }}>Click any node to inspect its connections and case details</p>
              </div>
            ) : (() => {
              const cfg = NODE_CONFIG[selected.type];
              const Icon = cfg.icon;
              const risk = RISK_BADGE[selected.risk] || RISK_BADGE.medium;
              return (
                <div>
                  <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "16px" }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
                      <div style={{ width: "44px", height: "44px", borderRadius: "12px", background: cfg.bg, display: "flex", alignItems: "center", justifyContent: "center", color: cfg.color }}>
                        <Icon size={22} />
                      </div>
                      <div>
                        <div style={{ fontWeight: 800, fontSize: "15px", color: "#f1f5f9" }}>{selected.label}</div>
                        <div style={{ fontSize: "11px", color: "#64748b", textTransform: "capitalize" }}>{cfg.label} Entity</div>
                      </div>
                    </div>
                    <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}><X size={16} /></button>
                  </div>

                  {[["Node ID", selected.id], ["Type", cfg.label], ["District", selected.district], ["FIRs Involved", selected.firs]].map(([k, v]) => (
                    <div key={k} style={{ display: "flex", justifyContent: "space-between", padding: "9px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
                      <span style={{ fontSize: "12px", color: "#64748b" }}>{k}</span>
                      <span style={{ fontSize: "12px", fontWeight: 600, color: "#f1f5f9", fontFamily: typeof v === "number" ? "JetBrains Mono, monospace" : "inherit" }}>{v}</span>
                    </div>
                  ))}

                  <div style={{ margin: "14px 0 10px" }}>
                    <span style={{ background: risk.bg, color: risk.color, border: `1px solid ${risk.border}`, borderRadius: "6px", fontSize: "11px", fontWeight: 700, padding: "4px 12px" }}>
                      ● {selected.risk.toUpperCase()} RISK
                    </span>
                  </div>

                  <div style={{ marginTop: "14px" }}>
                    <div style={{ fontSize: "12px", color: "#64748b", marginBottom: "8px", fontWeight: 600 }}>Linked Nodes ({selected.linked.length})</div>
                    <div style={{ display: "flex", flexWrap: "wrap", gap: "6px" }}>
                      {selected.linked.map((lid) => {
                        const lnode = NODES.find((n) => n.id === lid);
                        if (!lnode) return null;
                        const lcfg = NODE_CONFIG[lnode.type];
                        return (
                          <span key={lid} onClick={() => setSelected(lnode)} style={{
                            background: lcfg.bg, color: lcfg.color,
                            border: `1px solid ${lcfg.color}40`, borderRadius: "6px",
                            fontSize: "11px", fontWeight: 600, padding: "4px 10px", cursor: "pointer",
                          }}>{lnode.label}</span>
                        );
                      })}
                    </div>
                  </div>
                </div>
              );
            })()}
          </div>
        </div>
      </div>
    </div>
  );
}
