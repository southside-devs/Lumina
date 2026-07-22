import React from "react";
import { Server, Wifi, ShieldCheck, Database } from "lucide-react";

export default function StatusBar() {
  return (
    <footer
      style={{
        height: "28px",
        background: "#080c14",
        borderTop: "1px solid rgba(255,255,255,0.06)",
        display: "flex",
        alignItems: "center",
        justifyContent: "space-between",
        padding: "0 16px",
        fontSize: "11px",
        color: "#64748b",
        zIndex: 50,
        flexShrink: 0,
      }}
    >
      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", color: "#34d399" }}>
          <Wifi size={12} />
          <span>Catalyst WebSocket: 18ms latency</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }}>
          <Database size={12} />
          <span>Neo4j AppSail: Online</span>
        </div>
      </div>

      <div style={{ display: "flex", alignItems: "center", gap: "16px" }}>
        <span>Active Zone: Bengaluru HQ</span>
        <div style={{ display: "flex", alignItems: "center", gap: "4px", color: "#38bdf8" }}>
          <ShieldCheck size={12} />
          <span>CONFIDENTIAL — POLICE USE ONLY</span>
        </div>
      </div>
    </footer>
  );
}