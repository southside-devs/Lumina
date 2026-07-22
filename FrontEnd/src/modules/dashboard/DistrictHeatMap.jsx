import React from "react";
import { MapPin, TrendingUp, TrendingDown } from "lucide-react";

const districts = [
  { name: "Bengaluru Urban", crimes: 3420, risk: 89, delta: "+5.2%", trend: "up", color: "#f43f5e" },
  { name: "Mysuru City",     crimes: 1210, risk: 62, delta: "+1.8%", trend: "up", color: "#f59e0b" },
  { name: "Mangaluru City",  crimes: 940,  risk: 55, delta: "-2.1%", trend: "down", color: "#f59e0b" },
  { name: "Hubballi-Dharwad",crimes: 870,  risk: 48, delta: "+0.9%", trend: "up", color: "#3b82f6" },
  { name: "Belagavi",        crimes: 760,  risk: 44, delta: "-1.4%", trend: "down", color: "#3b82f6" },
  { name: "Tumakuru",        crimes: 540,  risk: 36, delta: "+3.1%", trend: "up", color: "#10b981" },
  { name: "Kalaburagi",      crimes: 420,  risk: 29, delta: "-0.7%", trend: "down", color: "#10b981" },
  { name: "Shivamogga",      crimes: 380,  risk: 25, delta: "+1.2%", trend: "up", color: "#10b981" },
];

function getRiskLabel(score) {
  if (score >= 75) return { label: "Critical", color: "#f43f5e", bg: "rgba(244,63,94,0.12)" };
  if (score >= 50) return { label: "High",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  if (score >= 30) return { label: "Medium",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  return             { label: "Low",      color: "#10b981", bg: "rgba(16,185,129,0.12)" };
}

export default function DistrictHeatMap() {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <MapPin size={18} style={{ color: "#f43f5e" }} />
          <h3>District Risk Index</h3>
        </div>
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>Top 8 by Threat Score</span>
      </div>

      <div className="panel-body" style={{ overflowY: "auto", maxHeight: "320px" }}>
        <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
          {districts.map((d) => {
            const risk = getRiskLabel(d.risk);
            return (
              <div
                key={d.name}
                style={{
                  background: "rgba(30,41,59,0.35)",
                  border: "1px solid rgba(255,255,255,0.06)",
                  borderRadius: "10px",
                  padding: "12px 14px",
                  transition: "all 0.2s ease",
                  cursor: "pointer",
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.background = "rgba(30,41,59,0.7)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.15)";
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.background = "rgba(30,41,59,0.35)";
                  e.currentTarget.style.borderColor = "rgba(255,255,255,0.06)";
                }}
              >
                <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <span style={{ fontWeight: 700, fontSize: "13px", color: "#f1f5f9" }}>{d.name}</span>
                    <span style={{
                      background: risk.bg, color: risk.color,
                      fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "9999px"
                    }}>{risk.label}</span>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                    <div style={{
                      display: "flex", alignItems: "center", gap: "3px",
                      fontSize: "12px", fontWeight: 700,
                      color: d.trend === "up" ? "#fb7185" : "#34d399"
                    }}>
                      {d.trend === "up" ? <TrendingUp size={13} /> : <TrendingDown size={13} />}
                      {d.delta}
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "13px", fontWeight: 700, color: d.color }}>
                      {d.risk}/100
                    </span>
                  </div>
                </div>

                <div style={{ height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "9999px", overflow: "hidden" }}>
                  <div style={{
                    height: "100%", width: `${d.risk}%`,
                    background: `linear-gradient(90deg, ${d.color}99, ${d.color})`,
                    borderRadius: "9999px",
                    transition: "width 0.6s ease",
                  }} />
                </div>

                <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                  {d.crimes.toLocaleString()} FIRs registered
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
}