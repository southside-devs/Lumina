import React, { useState } from "react";
import { ShieldAlert, X, CheckCircle2, Radio, AlertTriangle, Lock } from "lucide-react";

const ALERTS = [
  {
    id: 1, severity: "critical", badge: "CRITICAL",
    title: "Gang Activity Spike — Bengaluru North",
    desc: "ST-DBSCAN detected 3 new cluster nodes near Hebbal. Coordinated theft pattern confirmed.",
    time: "4 min ago", icon: <ShieldAlert size={16} color="#fb7185" />,
  },
  {
    id: 2, severity: "high", badge: "HIGH",
    title: "Narcotics Seizure Alert — Mysuru",
    desc: "NDPS case FIR-2026-7741 elevated: 4.2 kg contraband, 2 accused linked to Colombo network.",
    time: "18 min ago", icon: <AlertTriangle size={16} color="#fbbf24" />,
  },
  {
    id: 3, severity: "high", badge: "HIGH",
    title: "Cyber-Fraud Network Identified",
    desc: "BNS 318 / IT Act 66D: Rs 1.4Cr siphoned via spoofed banking portals. 6 victims, Bengaluru & Mangaluru.",
    time: "42 min ago", icon: <Lock size={16} color="#fbbf24" />,
  },
  {
    id: 4, severity: "medium", badge: "MEDIUM",
    title: "Missing Person — Red Flag",
    desc: "Case escalated to district level. Last tracked near Tumkur Road CCTV node at 02:14 AM.",
    time: "1 hr ago", icon: <Radio size={16} color="#60a5fa" />,
  },
];

const severityStyles = {
  critical: { color: "#fb7185", bg: "rgba(244,63,94,0.08)", border: "rgba(244,63,94,0.25)", badgeBg: "rgba(244,63,94,0.15)" },
  high:     { color: "#fbbf24", bg: "rgba(245,158,11,0.08)", border: "rgba(245,158,11,0.25)", badgeBg: "rgba(245,158,11,0.15)" },
  medium:   { color: "#60a5fa", bg: "rgba(59,130,246,0.08)", border: "rgba(59,130,246,0.25)", badgeBg: "rgba(59,130,246,0.15)" },
};

export default function AlertsPanel() {
  const [dismissed, setDismissed] = useState([]);

  const dismiss = (id) => setDismissed((prev) => [...prev, id]);
  const visible = ALERTS.filter((a) => !dismissed.includes(a.id));

  return (
    <div className="panel-card" style={{ gridRow: "span 2" }}>
      <div className="panel-header">
        <div className="panel-title">
          <ShieldAlert size={18} style={{ color: "#f43f5e" }} />
          <h3>Threat Alerts</h3>
          {visible.length > 0 && (
            <span style={{
              background: "rgba(244,63,94,0.2)", color: "#fb7185",
              borderRadius: "9999px", fontSize: "11px", fontWeight: 700, padding: "2px 8px",
            }}>{visible.length} Active</span>
          )}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: "6px", fontSize: "11px", color: "#34d399" }}>
          <span className="pulse-indicator-rose" style={{ width: "7px", height: "7px", background: "#34d399", borderRadius: "50%", display: "inline-block" }}></span>
          <Radio size={12} />
          <span>Live Feed</span>
        </div>
      </div>

      <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "10px", overflowY: "auto" }}>
        {visible.length === 0 && (
          <div style={{ textAlign: "center", padding: "30px", color: "#64748b" }}>
            <CheckCircle2 size={32} style={{ margin: "0 auto 8px", color: "#10b981" }} />
            <p style={{ fontSize: "13px", color: "#10b981", fontWeight: 600 }}>All alerts resolved</p>
          </div>
        )}

        {visible.map((alert) => {
          const style = severityStyles[alert.severity];
          return (
            <div
              key={alert.id}
              style={{
                background: style.bg, border: `1px solid ${style.border}`,
                borderRadius: "10px", padding: "14px",
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
                <div style={{ display: "flex", gap: "10px", flex: 1 }}>
                  <div style={{ fontSize: "18px", flexShrink: 0, marginTop: "1px" }}>{alert.icon}</div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "4px" }}>
                      <span style={{
                        background: style.badgeBg, color: style.color,
                        fontSize: "9px", fontWeight: 800, padding: "2px 7px", borderRadius: "4px", letterSpacing: "0.08em"
                      }}>{alert.badge}</span>
                      <span style={{ fontSize: "11px", color: "#64748b" }}>{alert.time}</span>
                    </div>
                    <div style={{ fontWeight: 700, fontSize: "13px", color: "#f1f5f9", marginBottom: "4px" }}>{alert.title}</div>
                    <div style={{ fontSize: "12px", color: "#94a3b8", lineHeight: "1.5" }}>{alert.desc}</div>
                    <div style={{ display: "flex", gap: "8px", marginTop: "10px" }}>
                      <button style={{
                        background: style.badgeBg, color: style.color,
                        border: `1px solid ${style.border}`, borderRadius: "6px",
                        padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      }}>Dispatch Unit</button>
                      <button style={{
                        background: "transparent", color: "#64748b",
                        border: "1px solid rgba(255,255,255,0.08)", borderRadius: "6px",
                        padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                      }}>View FIR</button>
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => dismiss(alert.id)}
                  style={{ background: "none", border: "none", color: "#475569", cursor: "pointer", padding: "2px", flexShrink: 0 }}
                >
                  <X size={15} />
                </button>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}