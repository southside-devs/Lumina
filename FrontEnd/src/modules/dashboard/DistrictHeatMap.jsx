import React, { useState, useEffect } from "react";
import { MapPin, TrendingUp, TrendingDown, RefreshCw } from "lucide-react";
import { fetchDistrictSummary } from "../../api/dashboard";

function getRiskLabel(score) {
  if (score >= 75) return { label: "Critical", color: "#f43f5e", bg: "rgba(244,63,94,0.12)" };
  if (score >= 50) return { label: "High",     color: "#f59e0b", bg: "rgba(245,158,11,0.12)" };
  if (score >= 30) return { label: "Medium",   color: "#3b82f6", bg: "rgba(59,130,246,0.12)" };
  return             { label: "Low",      color: "#10b981", bg: "rgba(16,185,129,0.12)" };
}

function getRiskColor(score) {
  if (score >= 75) return "#f43f5e";
  if (score >= 50) return "#f59e0b";
  if (score >= 30) return "#3b82f6";
  return "#10b981";
}

export default function DistrictHeatMap() {
  const [districts, setDistricts] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchDistrictSummary().then((data) => {
      if (Array.isArray(data) && data.length > 0) {
        // Compute a risk score 0-100 from FIR count relative to the max
        const maxFIRs = Math.max(...data.map((d) => d.total_firs || 0), 1);
        const withRisk = data
          .slice(0, 8) // Top 8 by FIR count (already sorted desc from API)
          .map((d) => ({
            name: d.district_name || "Unknown",
            crimes: d.total_firs || 0,
            risk: Math.round((d.total_firs / maxFIRs) * 100),
          }));
        setDistricts(withRisk);
      }
      setLoading(false);
    });
  }, []);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <MapPin size={18} style={{ color: "#f43f5e" }} />
          <h3>District Risk Index</h3>
        </div>
        <span style={{ fontSize: "11px", color: "#64748b", fontWeight: 600 }}>
          {loading ? "Loading…" : `Top ${districts.length} by FIR Count — Live`}
        </span>
      </div>

      <div className="panel-body" style={{ overflowY: "auto", maxHeight: "320px" }}>
        {loading ? (
          <div style={{ padding: "30px", textAlign: "center", color: "#475569", fontSize: "13px" }}>
            <RefreshCw size={20} style={{ margin: "0 auto 8px", opacity: 0.4 }} />
            <p>Loading district data…</p>
          </div>
        ) : (
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {districts.map((d) => {
              const risk = getRiskLabel(d.risk);
              const color = getRiskColor(d.risk);
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
                      <span style={{ background: risk.bg, color: risk.color, fontSize: "10px", fontWeight: 700, padding: "2px 7px", borderRadius: "9999px" }}>
                        {risk.label}
                      </span>
                    </div>
                    <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "13px", fontWeight: 700, color }}>
                      {d.risk}/100
                    </span>
                  </div>

                  <div style={{ height: "6px", background: "rgba(255,255,255,0.07)", borderRadius: "9999px", overflow: "hidden" }}>
                    <div style={{
                      height: "100%", width: `${d.risk}%`,
                      background: `linear-gradient(90deg, ${color}99, ${color})`,
                      borderRadius: "9999px",
                      transition: "width 0.6s ease",
                    }} />
                  </div>

                  <div style={{ marginTop: "6px", fontSize: "11px", color: "#64748b" }}>
                    {d.crimes.toLocaleString("en-IN")} FIRs registered
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </div>
    </div>
  );
}