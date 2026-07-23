import React, { useState, useEffect } from "react";
import {
  ShieldAlert, TrendingUp, Map, Activity, Download,
  Sparkles, RefreshCw, ChevronRight, Home, BarChart2
} from "lucide-react";
import {
  ResponsiveContainer, RadarChart, PolarGrid, PolarAngleAxis,
  PolarRadiusAxis, Radar, Tooltip, BarChart, Bar, XAxis, YAxis,
  CartesianGrid, Cell, PieChart, Pie, Legend
} from "recharts";
import StateOverviewMap from "../../components/maps/StateOverviewMap";
import { fetchOverview, fetchCrimeTrends, fetchDistrictSummary, fetchRiskScores } from "../../api/dashboard";

// ── Karnataka Districts for risk radar ──────────────────────────────────
const DISTRICT_COLORS = [
  "#3b82f6", "#f43f5e", "#8b5cf6", "#f59e0b", "#10b981",
  "#06b6d4", "#ec4899", "#a3e635", "#fb923c", "#e879f9",
];

// ── Tooltip ──────────────────────────────────────────────────────────────
const DarkTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(9,13,22,0.95)", border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px", padding: "10px 14px", fontSize: "12px",
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)"
    }}>
      <div style={{ fontWeight: 700, marginBottom: "6px", color: "#38bdf8" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.dataKey} style={{ display: "flex", gap: "16px", justifyContent: "space-between" }}>
          <span style={{ color: "#94a3b8" }}>{p.name || p.dataKey}</span>
          <span style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: p.color }}>{p.value?.toLocaleString?.() ?? p.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function AnalyticsModule() {
  const [activeView, setActiveView] = useState("dashboard");
  const [overview, setOverview] = useState(null);
  const [crimeTrends, setCrimeTrends] = useState([]);
  const [districtSummary, setDistrictSummary] = useState([]);
  const [riskScores, setRiskScores] = useState([]);
  const [loading, setLoading] = useState(true);
  const [toast, setToast] = useState(null);

  const showToast = (msg) => { setToast(msg); setTimeout(() => setToast(null), 3500); };

  useEffect(() => {
    Promise.all([
      fetchOverview(),
      fetchCrimeTrends(),
      fetchDistrictSummary(),
      fetchRiskScores({ limit: 50 }),
    ]).then(([ov, trends, districts, risks]) => {
      setOverview(ov);
      setCrimeTrends(Array.isArray(trends) ? trends.slice(0, 8) : []);
      setDistrictSummary(Array.isArray(districts) ? districts.slice(0, 12) : []);
      setRiskScores(Array.isArray(risks) ? risks : []);
      setLoading(false);
    });
  }, []);

  // Build radar data from district summary for top 6 districts
  const radarData = districtSummary.slice(0, 6).map((d) => ({
    district: (d.district_name || "").replace(" Urban", "").replace("-Dharwad", ""),
    firs: d.total_firs || 0,
  }));

  // Status breakdown for pie chart from overview
  const pieData = overview?.status_breakdown
    ? Object.entries(overview.status_breakdown).map(([name, value]) => ({ name, value }))
    : [];

  const PIE_COLORS = ["#3b82f6", "#10b981", "#64748b", "#34d399", "#94a3b8"];

  // Top 5 highest risk districts from risk scores
  const topRiskDistricts = riskScores
    .sort((a, b) => (b.Score || 0) - (a.Score || 0))
    .slice(0, 5);

  return (
    <div className="cy-workspace-container">
      {toast && (
        <div className="toast-banner success">
          <Sparkles size={16} />
          <span>{toast}</span>
        </div>
      )}

      {/* Header */}
      <div className="cy-header-bar">
        <div>
          <div className="cy-breadcrumbs font-mono" style={{ display: "flex", alignItems: "center", gap: "4px" }}>
            <Home size={13} />
            <ChevronRight size={12} />
            <span style={{ color: "var(--accent-orange)" }}>Analytics & Intelligence</span>
          </div>
          <h1 className="cy-page-title">
            {activeView === "dashboard" && "Crime Analytics Dashboard"}
            {activeView === "map" && "Karnataka GIS Tactical Crime Map"}
            {activeView === "risk" && "Predictive Risk Score Board"}
          </h1>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
          <div className="cy-view-tabs">
            {[
              { id: "dashboard", label: "Overview" },
              { id: "map", label: "GIS Crime Map" },
              { id: "risk", label: "Risk Scores" },
            ].map((v) => (
              <button
                key={v.id}
                type="button"
                className={`cy-tab-pill ${activeView === v.id ? "active" : ""}`}
                onClick={() => setActiveView(v.id)}
              >
                {v.label}
              </button>
            ))}
          </div>
          <button
            type="button"
            className="btn-secondary"
            onClick={() => showToast("Generating KSP Intelligence PDF Report...")}
          >
            <Download size={14} /> Download Report
          </button>
        </div>
      </div>

      {/* ── VIEW 1: ANALYTICS DASHBOARD ─────────────────────────────── */}
      {activeView === "dashboard" && (
        <>
          {/* KPI Cards */}
          <div className="cy-metrics-row">
            {loading
              ? [1, 2, 3, 4].map((i) => (
                  <div key={i} className="cy-metric-card glass-panel" style={{ opacity: 0.4 }}>
                    <div style={{ height: "60px", background: "rgba(255,255,255,0.05)", borderRadius: "6px" }} />
                  </div>
                ))
              : [
                  { title: "Total FIRs", value: overview?.total_firs?.toLocaleString("en-IN") ?? "—", badge: "Statewide", color: "#3b82f6" },
                  { title: "Repeat Offenders", value: overview?.repeat_offenders?.toLocaleString("en-IN") ?? "—", badge: "Recidivist Risk", color: "#f43f5e" },
                  { title: "Districts Covered", value: overview?.total_districts ?? 31, badge: "Karnataka-wide", color: "#8b5cf6" },
                  { title: "Police Stations", value: overview?.total_stations?.toLocaleString("en-IN") ?? "—", badge: "Active Units", color: "#10b981" },
                ].map((m) => (
                  <div key={m.title} className="cy-metric-card glass-panel">
                    <div className="cy-metric-top">
                      <span className="cy-metric-title">{m.title}</span>
                      <span className="cy-metric-badge positive font-mono" style={{ color: m.color }}>{m.badge}</span>
                    </div>
                    <div className="cy-metric-val font-mono" style={{ color: m.color }}>{m.value}</div>
                  </div>
                ))}
          </div>

          {/* Main charts row */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginTop: "20px" }}>
            {/* Crime Group Bar Chart */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <BarChart2 size={16} style={{ color: "#3b82f6" }} />
                <h3 style={{ fontSize: "15px", color: "#f1f5f9", margin: 0 }}>FIRs by Crime Group</h3>
                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>Live database</span>
              </div>
              {loading ? (
                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>Loading…</div>
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={crimeTrends} layout="vertical" barSize={12} margin={{ left: 4, right: 20 }}>
                      <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                      <XAxis type="number" tick={{ fill: "#64748b", fontSize: 10, fontFamily: "JetBrains Mono" }} axisLine={false} tickLine={false} tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v} />
                      <YAxis type="category" dataKey="group" width={80} tick={{ fill: "#94a3b8", fontSize: 10 }} axisLine={false} tickLine={false}
                        tickFormatter={(n) => n.replace("Narcotics (NDPS Act)", "Narcotics").replace("Motor Vehicle Theft", "MV Theft").replace("Kidnapping & Abduction", "Kidnapping").replace("Cheating & Fraud", "Fraud")}
                      />
                      <Tooltip content={<DarkTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                      <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                        {crimeTrends.map((_, i) => <Cell key={i} fill={DISTRICT_COLORS[i % DISTRICT_COLORS.length]} />)}
                      </Bar>
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>

            {/* FIR Status Pie */}
            <div className="glass-panel" style={{ padding: "20px" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
                <Activity size={16} style={{ color: "#8b5cf6" }} />
                <h3 style={{ fontSize: "15px", color: "#f1f5f9", margin: 0 }}>FIR Status Distribution</h3>
                <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>Current snapshot</span>
              </div>
              {loading ? (
                <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>Loading…</div>
              ) : (
                <div style={{ height: 280 }}>
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={pieData} cx="50%" cy="50%" innerRadius={70} outerRadius={110}
                        dataKey="value" paddingAngle={3}
                        label={({ name, percent }) => `${name.replace("Under Investigation", "Active").replace("Chargesheeted", "Charged")}: ${(percent * 100).toFixed(0)}%`}
                        labelLine={false}
                        style={{ fontSize: "10px" }}
                      >
                        {pieData.map((_, i) => <Cell key={i} fill={PIE_COLORS[i % PIE_COLORS.length]} />)}
                      </Pie>
                      <Tooltip content={<DarkTooltip />} />
                      <Legend wrapperStyle={{ fontSize: "11px", color: "#94a3b8" }} />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              )}
            </div>
          </div>

          {/* District Crime Radar */}
          <div className="glass-panel" style={{ padding: "20px", marginTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <ShieldAlert size={16} style={{ color: "#f43f5e" }} />
              <h3 style={{ fontSize: "15px", color: "#f1f5f9", margin: 0 }}>District Crime Load Radar — Top 6 Districts</h3>
            </div>
            {loading ? (
              <div style={{ height: 280, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569" }}>Loading…</div>
            ) : (
              <div style={{ height: 280 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={radarData}>
                    <PolarGrid stroke="rgba(255,255,255,0.08)" />
                    <PolarAngleAxis dataKey="district" stroke="#94a3b8" fontSize={11} fontFamily="JetBrains Mono, monospace" />
                    <PolarRadiusAxis stroke="rgba(255,255,255,0.08)" fontSize={9} />
                    <Radar name="FIRs Registered" dataKey="firs" stroke="#f43f5e" fill="#f43f5e" fillOpacity={0.3} />
                    <Tooltip content={<DarkTooltip />} />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            )}
          </div>

          {/* District Table */}
          <div className="glass-panel" style={{ padding: "20px", marginTop: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <TrendingUp size={16} style={{ color: "#10b981" }} />
              <h3 style={{ fontSize: "15px", color: "#f1f5f9", margin: 0 }}>District Crime Summary</h3>
              {!loading && <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>{districtSummary.length} districts</span>}
            </div>
            <div style={{ overflowX: "auto" }}>
              <table className="custom-table">
                <thead>
                  <tr>
                    <th>District</th>
                    <th>Population</th>
                    <th>Total FIRs</th>
                    <th>Risk Level</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={4} style={{ textAlign: "center", padding: "30px", color: "#475569" }}>Loading district data…</td></tr>
                  ) : districtSummary.map((d, i) => {
                    const firs = d.total_firs || 0;
                    const pop = d.population || 1;
                    const rate = ((firs / pop) * 100000).toFixed(1);
                    const riskLevel = parseFloat(rate) > 70 ? "Critical" : parseFloat(rate) > 50 ? "High" : parseFloat(rate) > 30 ? "Medium" : "Low";
                    const riskColor = riskLevel === "Critical" ? "#f43f5e" : riskLevel === "High" ? "#f59e0b" : riskLevel === "Medium" ? "#3b82f6" : "#10b981";
                    return (
                      <tr key={i}>
                        <td style={{ color: "#f1f5f9", fontWeight: 600 }}>{d.district_name || "—"}</td>
                        <td style={{ color: "#64748b", fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>
                          {d.population ? (d.population / 1_000_000).toFixed(2) + "M" : "—"}
                        </td>
                        <td style={{ fontFamily: "JetBrains Mono, monospace", color: "#38bdf8", fontWeight: 600 }}>
                          {firs.toLocaleString("en-IN")}
                        </td>
                        <td>
                          <span style={{
                            background: `${riskColor}18`, color: riskColor,
                            border: `1px solid ${riskColor}40`, borderRadius: "6px",
                            fontSize: "11px", fontWeight: 700, padding: "3px 10px"
                          }}>{riskLevel}</span>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}

      {/* ── VIEW 2: GIS MAP ─────────────────────────────────────────── */}
      {activeView === "map" && (
        <StateOverviewMap
          onSelectHotspot={(spot) => showToast(`Selected: ${spot.districtName} — Threat Score: ${spot.threatScore}`)}
        />
      )}

      {/* ── VIEW 3: RISK SCORES ─────────────────────────────────────── */}
      {activeView === "risk" && (
        <div style={{ marginTop: "8px" }}>
          <div className="glass-panel" style={{ padding: "20px", marginBottom: "20px" }}>
            <div style={{ display: "flex", alignItems: "center", gap: "8px", marginBottom: "16px" }}>
              <ShieldAlert size={16} style={{ color: "#f43f5e" }} />
              <h3 style={{ fontSize: "15px", color: "#f1f5f9", margin: 0 }}>Predictive Risk Score Board</h3>
              <span style={{ fontSize: "11px", color: "#64748b", marginLeft: "auto" }}>
                {riskScores.length} risk entries — Zia AutoML predictions
              </span>
            </div>

            {loading ? (
              <div style={{ padding: "40px", textAlign: "center", color: "#475569" }}>Loading risk scores from database…</div>
            ) : riskScores.length === 0 ? (
              <div style={{ padding: "40px", textAlign: "center" }}>
                <ShieldAlert size={40} style={{ margin: "0 auto 12px", opacity: 0.3, color: "#f43f5e" }} />
                <p style={{ color: "#475569", fontSize: "13px" }}>No risk scores found in database.</p>
                <p style={{ color: "#64748b", fontSize: "12px", marginTop: "4px" }}>Run the risk score seed script to populate predictions.</p>
              </div>
            ) : (
              <div style={{ overflowX: "auto" }}>
                <table className="custom-table">
                  <thead>
                    <tr>
                      <th>District ID</th>
                      <th>Crime Type</th>
                      <th>Risk Score</th>
                      <th>Forecast Date</th>
                      <th>Risk Level</th>
                    </tr>
                  </thead>
                  <tbody>
                    {riskScores.map((r, i) => {
                      const score = parseFloat(r.Score || r.score || 0);
                      const riskLevel = score >= 75 ? "Critical" : score >= 55 ? "High" : score >= 35 ? "Medium" : "Low";
                      const riskColor = riskLevel === "Critical" ? "#f43f5e" : riskLevel === "High" ? "#f59e0b" : riskLevel === "Medium" ? "#3b82f6" : "#10b981";
                      return (
                        <tr key={i}>
                          <td style={{ fontFamily: "JetBrains Mono, monospace", color: "#38bdf8", fontWeight: 600 }}>
                            D-{r.District_ID || r.district_id || "—"}
                          </td>
                          <td style={{ color: "#cbd5e1" }}>{r.Crime_Type || r.crime_type || "—"}</td>
                          <td>
                            <div style={{ display: "flex", alignItems: "center", gap: "10px" }}>
                              <div style={{ flex: 1, height: "4px", background: "rgba(255,255,255,0.06)", borderRadius: "2px" }}>
                                <div style={{ width: `${score}%`, height: "100%", background: riskColor, borderRadius: "2px", transition: "width 0.4s ease" }} />
                              </div>
                              <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", fontWeight: 700, color: riskColor, minWidth: "36px" }}>
                                {score.toFixed(1)}
                              </span>
                            </div>
                          </td>
                          <td style={{ color: "#64748b", fontSize: "12px" }}>{r.Forecast_Date || r.forecast_date || "—"}</td>
                          <td>
                            <span style={{
                              background: `${riskColor}18`, color: riskColor,
                              border: `1px solid ${riskColor}40`, borderRadius: "6px",
                              fontSize: "11px", fontWeight: 700, padding: "3px 9px"
                            }}>{riskLevel}</span>
                          </td>
                        </tr>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  );
}
