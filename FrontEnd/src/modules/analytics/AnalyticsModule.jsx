import React, { useState } from "react";
import {
  BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, CartesianGrid,
  RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis,
  PieChart, Pie, Cell, Legend,
} from "recharts";
import { BarChart3, Crosshair, PieChart as PieIcon, Clock } from "lucide-react";

const CRIME_DIST = [
  { name: "Cybercrime",      value: 28, color: "#3b82f6" },
  { name: "Organised Theft", value: 22, color: "#f43f5e" },
  { name: "Narcotics",       value: 18, color: "#8b5cf6" },
  { name: "Violent Crime",   value: 15, color: "#f59e0b" },
  { name: "Financial Fraud", value: 11, color: "#06b6d4" },
  { name: "Other",           value: 6,  color: "#64748b" },
];

const RISK_DATA = [
  { district: "Bengaluru Urban", score: 89 },
  { district: "Mysuru City",     score: 62 },
  { district: "Mangaluru City",  score: 55 },
  { district: "Hubballi-Dharwad",score: 48 },
  { district: "Belagavi",        score: 44 },
  { district: "Tumakuru",        score: 36 },
  { district: "Kalaburagi",      score: 29 },
  { district: "Shivamogga",      score: 25 },
];

const RADAR_DATA = [
  { category: "Cybercrime",       value: 78 },
  { category: "Narcotics",        value: 55 },
  { category: "Violent Crime",    value: 62 },
  { category: "Financial Fraud",  value: 48 },
  { category: "Organised Theft",  value: 71 },
  { category: "Missing Persons",  value: 34 },
];

const HOURLY = [
  { hour: "00", value: 12 }, { hour: "02", value: 8  }, { hour: "04", value: 5  }, { hour: "06", value: 10 },
  { hour: "08", value: 32 }, { hour: "10", value: 55 }, { hour: "12", value: 70 }, { hour: "14", value: 68 },
  { hour: "16", value: 82 }, { hour: "18", value: 91 }, { hour: "20", value: 74 }, { hour: "22", value: 43 },
];

const CustomTooltip = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null;
  return (
    <div style={{ background: "rgba(9,13,22,0.95)", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px", padding: "10px 14px", fontSize: "12px" }}>
      <div style={{ color: "#38bdf8", fontWeight: 700, marginBottom: "6px" }}>{label}</div>
      {payload.map((p) => (
        <div key={p.name} style={{ color: p.color || "#94a3b8" }}>{p.name}: <strong>{p.value}</strong></div>
      ))}
    </div>
  );
};

export default function AnalyticsModule() {
  return (
    <div>
      <div style={{ marginBottom: "24px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>Analytics & Intelligence</h1>
        <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "4px" }}>Predictive Risk Scoring · Crime Distribution · Temporal Patterns · District Vulnerability</p>
      </div>

      {/* Row 1: Crime Distribution Pie + District Risk Bar */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 2fr", gap: "20px", marginBottom: "20px" }}>
        {/* Pie Chart */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <PieIcon size={18} style={{ color: "#06b6d4" }} />
              <h3>Crime Distribution</h3>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ height: 220 }}>
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie data={CRIME_DIST} cx="50%" cy="50%" innerRadius={55} outerRadius={85}
                    dataKey="value" paddingAngle={3}>
                    {CRIME_DIST.map((entry) => <Cell key={entry.name} fill={entry.color} />)}
                  </Pie>
                  <Tooltip formatter={(value) => `${value}%`} />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "6px", marginTop: "8px" }}>
              {CRIME_DIST.map((d) => (
                <div key={d.name} style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                    <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: d.color }} />
                    <span style={{ fontSize: "12px", color: "#94a3b8" }}>{d.name}</span>
                  </div>
                  <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", fontWeight: 700, color: d.color }}>{d.value}%</span>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* District Risk Scores Bar */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <BarChart3 size={18} style={{ color: "#f43f5e" }} />
              <h3>District Risk Score Ranking</h3>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ height: 280 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={RISK_DATA} layout="vertical" barSize={14}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" horizontal={false} />
                  <XAxis type="number" domain={[0, 100]} stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <YAxis type="category" dataKey="district" width={120} stroke="#475569" tick={{ fill: "#94a3b8", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="score" name="Risk Score" radius={[0, 6, 6, 0]}>
                    {RISK_DATA.map((d) => (
                      <Cell key={d.district} fill={d.score >= 75 ? "#f43f5e" : d.score >= 50 ? "#f59e0b" : d.score >= 30 ? "#3b82f6" : "#10b981"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>

      {/* Row 2: Hourly Crime Heatmap + Radar */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px" }}>
        {/* Hourly bar */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Clock size={18} style={{ color: "#f59e0b" }} />
              <h3>Hourly Crime Peak Pattern</h3>
            </div>
            <span style={{ fontSize: "11px", color: "#64748b" }}>Avg incidents per hour</span>
          </div>
          <div className="panel-body">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={HOURLY} barSize={22}>
                  <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.04)" vertical={false} />
                  <XAxis dataKey="hour" stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} tickFormatter={(v) => `${v}:00`} />
                  <YAxis stroke="#475569" tick={{ fill: "#64748b", fontSize: 11 }} axisLine={false} tickLine={false} />
                  <Tooltip content={<CustomTooltip />} />
                  <Bar dataKey="value" name="Incidents" radius={[4, 4, 0, 0]}>
                    {HOURLY.map((d) => (
                      <Cell key={d.hour} fill={d.value >= 80 ? "#f43f5e" : d.value >= 50 ? "#f59e0b" : "#3b82f6"} />
                    ))}
                  </Bar>
                </BarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>

        {/* Radar */}
        <div className="panel-card">
          <div className="panel-header">
            <div className="panel-title">
              <Crosshair size={18} style={{ color: "#8b5cf6" }} />
              <h3>Threat Category Radar</h3>
            </div>
          </div>
          <div className="panel-body">
            <div style={{ height: 240 }}>
              <ResponsiveContainer width="100%" height="100%">
                <RadarChart data={RADAR_DATA}>
                  <PolarGrid stroke="rgba(255,255,255,0.07)" />
                  <PolarAngleAxis dataKey="category" tick={{ fill: "#64748b", fontSize: 10 }} />
                  <PolarRadiusAxis tick={{ fill: "#64748b", fontSize: 9 }} angle={30} domain={[0, 100]} />
                  <Radar name="Risk Score" dataKey="value" stroke="#8b5cf6" fill="#8b5cf6" fillOpacity={0.2} strokeWidth={2} />
                  <Tooltip content={<CustomTooltip />} />
                </RadarChart>
              </ResponsiveContainer>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
