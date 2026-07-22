import React, { useState } from "react";
import {
  AreaChart, Area, BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Legend
} from "recharts";
import { TrendingUp, BarChart2, Activity } from "lucide-react";

const trendData = [
  { month: "Jan", cybercrime: 420, theft: 980, narcotics: 310, violent: 540, financial: 260 },
  { month: "Feb", cybercrime: 510, theft: 860, narcotics: 290, violent: 480, financial: 310 },
  { month: "Mar", cybercrime: 590, theft: 920, narcotics: 340, violent: 510, financial: 280 },
  { month: "Apr", cybercrime: 640, theft: 1050, narcotics: 370, violent: 560, financial: 330 },
  { month: "May", cybercrime: 710, theft: 990, narcotics: 350, violent: 490, financial: 350 },
  { month: "Jun", cybercrime: 830, theft: 1120, narcotics: 410, violent: 620, financial: 390 },
  { month: "Jul", cybercrime: 920, theft: 1060, narcotics: 450, violent: 580, financial: 420 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(9,13,22,0.95)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px",
      padding: "12px 16px",
      fontSize: "12px",
      boxShadow: "0 15px 30px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: "8px", color: "#38bdf8" }}>{label}</div>
      {payload.map((entry) => (
        <div key={entry.dataKey} style={{ display: "flex", justifyContent: "space-between", gap: "24px", color: entry.color, marginBottom: "4px" }}>
          <span style={{ color: "#94a3b8", textTransform: "capitalize" }}>{entry.dataKey}</span>
          <span style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace" }}>{entry.value}</span>
        </div>
      ))}
    </div>
  );
};

export default function CrimeTrend() {
  const [chartMode, setChartMode] = useState("area");

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <TrendingUp size={18} style={{ color: "#3b82f6" }} />
          <h3>Crime Trend by Category</h3>
        </div>
        <div style={{ display: "flex", gap: "8px" }}>
          <button
            onClick={() => setChartMode("area")}
            style={{
              background: chartMode === "area" ? "rgba(59,130,246,0.2)" : "transparent",
              border: chartMode === "area" ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px", padding: "5px 10px", cursor: "pointer",
              color: chartMode === "area" ? "#60a5fa" : "#64748b",
              fontSize: "12px", fontWeight: 600, transition: "all 0.2s"
            }}
          >
            <Activity size={13} style={{ display: "inline", marginRight: "4px" }} />Area
          </button>
          <button
            onClick={() => setChartMode("bar")}
            style={{
              background: chartMode === "bar" ? "rgba(59,130,246,0.2)" : "transparent",
              border: chartMode === "bar" ? "1px solid rgba(59,130,246,0.4)" : "1px solid rgba(255,255,255,0.08)",
              borderRadius: "6px", padding: "5px 10px", cursor: "pointer",
              color: chartMode === "bar" ? "#60a5fa" : "#64748b",
              fontSize: "12px", fontWeight: 600, transition: "all 0.2s"
            }}
          >
            <BarChart2 size={13} style={{ display: "inline", marginRight: "4px" }} />Bar
          </button>
        </div>
      </div>

      <div className="panel-body">
        <div style={{ height: 300 }}>
          <ResponsiveContainer width="100%" height="100%">
            {chartMode === "area" ? (
              <AreaChart data={trendData}>
                <defs>
                  <linearGradient id="gradCyber" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#3b82f6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradTheft" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f43f5e" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f43f5e" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradNarco" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#8b5cf6" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0} />
                  </linearGradient>
                  <linearGradient id="gradViolent" x1="0" y1="0" x2="0" y2="1">
                    <stop offset="5%" stopColor="#f59e0b" stopOpacity={0.35} />
                    <stop offset="95%" stopColor="#f59e0b" stopOpacity={0} />
                  </linearGradient>
                </defs>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                <Area type="monotone" dataKey="cybercrime" stroke="#3b82f6" fill="url(#gradCyber)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="theft" stroke="#f43f5e" fill="url(#gradTheft)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="narcotics" stroke="#8b5cf6" fill="url(#gradNarco)" strokeWidth={2} dot={false} />
                <Area type="monotone" dataKey="violent" stroke="#f59e0b" fill="url(#gradViolent)" strokeWidth={2} dot={false} />
              </AreaChart>
            ) : (
              <BarChart data={trendData} barSize={10} barGap={4}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" />
                <XAxis dataKey="month" stroke="#475569" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 12 }} axisLine={false} tickLine={false} />
                <Tooltip content={<CustomTooltip />} />
                <Legend wrapperStyle={{ fontSize: "12px", color: "#94a3b8" }} />
                <Bar dataKey="cybercrime" fill="#3b82f6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="theft" fill="#f43f5e" radius={[3, 3, 0, 0]} />
                <Bar dataKey="narcotics" fill="#8b5cf6" radius={[3, 3, 0, 0]} />
                <Bar dataKey="violent" fill="#f59e0b" radius={[3, 3, 0, 0]} />
              </BarChart>
            )}
          </ResponsiveContainer>
        </div>
      </div>
    </div>
  );
}