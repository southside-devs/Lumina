import React, { useState, useEffect } from "react";
import {
  BarChart, Bar, XAxis, YAxis, CartesianGrid,
  Tooltip, ResponsiveContainer, Cell
} from "recharts";
import { TrendingUp, BarChart2 } from "lucide-react";
import { fetchCrimeTrends } from "../../api/dashboard";

const CRIME_COLORS = [
  "#3b82f6", "#f43f5e", "#8b5cf6", "#f59e0b",
  "#10b981", "#06b6d4", "#ec4899", "#a3e635",
  "#fb923c", "#e879f9",
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{
      background: "rgba(9,13,22,0.95)",
      border: "1px solid rgba(255,255,255,0.12)",
      borderRadius: "10px", padding: "12px 16px", fontSize: "12px",
      boxShadow: "0 15px 30px rgba(0,0,0,0.5)",
    }}>
      <div style={{ fontWeight: 700, marginBottom: "6px", color: "#38bdf8" }}>{label}</div>
      <div style={{ display: "flex", justifyContent: "space-between", gap: "24px" }}>
        <span style={{ color: "#94a3b8" }}>FIRs</span>
        <span style={{ fontWeight: 700, fontFamily: "JetBrains Mono, monospace", color: "#f1f5f9" }}>
          {payload[0]?.value?.toLocaleString("en-IN")}
        </span>
      </div>
    </div>
  );
};

const shortenLabel = (name = "") =>
  name.replace("Narcotics (NDPS Act)", "Narcotics")
    .replace("Kidnapping & Abduction", "Kidnapping")
    .replace("Motor Vehicle Theft", "MV Theft")
    .replace("Cheating & Fraud", "Fraud")
    .replace("Criminal Breach of Trust", "CBT")
    .replace("SC/ST Atrocities", "SC/ST")
    .replace("Arms Act Violations", "Arms Act")
    .replace("Sexual Offences", "Sexual");

export default function CrimeTrend() {
  const [data, setData] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchCrimeTrends().then((rows) => {
      const sorted = Array.isArray(rows)
        ? [...rows].sort((a, b) => b.count - a.count).slice(0, 10)
        : [];
      setData(sorted);
      setLoading(false);
    });
  }, []);

  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <TrendingUp size={18} style={{ color: "#3b82f6" }} />
          <h3>FIRs by Crime Group</h3>
          <span style={{ fontSize: "12px", color: "#64748b" }}>Live from database</span>
        </div>
        <BarChart2 size={14} style={{ color: "#3b82f6" }} />
      </div>

      <div className="panel-body">
        {loading ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "13px" }}>
            Loading crime trend data…
          </div>
        ) : data.length === 0 ? (
          <div style={{ height: 300, display: "flex", alignItems: "center", justifyContent: "center", color: "#475569", fontSize: "13px" }}>
            No data available
          </div>
        ) : (
          <div style={{ height: 300 }}>
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={data} layout="vertical" margin={{ left: 8, right: 24, top: 4, bottom: 4 }} barSize={14}>
                <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                <XAxis
                  type="number"
                  stroke="#475569"
                  tick={{ fill: "#64748b", fontSize: 11, fontFamily: "JetBrains Mono, monospace" }}
                  axisLine={false} tickLine={false}
                  tickFormatter={(v) => v >= 1000 ? `${(v / 1000).toFixed(1)}k` : v}
                />
                <YAxis
                  type="category" dataKey="group" width={90}
                  stroke="#475569"
                  tick={{ fill: "#94a3b8", fontSize: 11 }}
                  axisLine={false} tickLine={false}
                  tickFormatter={shortenLabel}
                />
                <Tooltip content={<CustomTooltip />} cursor={{ fill: "rgba(255,255,255,0.03)" }} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {data.map((_, index) => (
                    <Cell key={`cell-${index}`} fill={CRIME_COLORS[index % CRIME_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        )}
      </div>
    </div>
  );
}