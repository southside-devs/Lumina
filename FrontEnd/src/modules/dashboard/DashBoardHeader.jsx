import React, { useState } from "react";
import { Calendar, Filter, Download, RefreshCw, FileSpreadsheet } from "lucide-react";

export default function DashboardHeader({ onDistrictChange, selectedDistrict }) {
  const [timeframe, setTimeframe] = useState("30d");
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      setIsExporting(false);
      alert("Intelligence Report PDF generated and downloaded successfully.");
    }, 1000);
  };

  return (
    <div className="dashboard-header">
      <div className="dashboard-title-group">
        <h1>Command Intelligence Dashboard</h1>
        <p>State-wide Real-Time Crime Analytics & AI Threat Assessment Hub</p>
      </div>

      <div className="header-controls">
        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="control-select">
          <Calendar size={14} style={{ color: "#38bdf8" }} />
          <select
            value={timeframe}
            onChange={(e) => setTimeframe(e.target.value)}
            style={{ background: "transparent", border: "none", color: "white", outline: "none", fontSize: "13px" }}
          >
            <option value="7d" style={{ background: "#0f172a" }}>Last 7 Days</option>
            <option value="30d" style={{ background: "#0f172a" }}>Last 30 Days</option>
            <option value="90d" style={{ background: "#0f172a" }}>Last 90 Days</option>
            <option value="ytd" style={{ background: "#0f172a" }}>Year to Date</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px" }} className="control-select">
          <Filter size={14} style={{ color: "#8b5cf6" }} />
          <select
            value={selectedDistrict || "all"}
            onChange={(e) => onDistrictChange && onDistrictChange(e.target.value)}
            style={{ background: "transparent", border: "none", color: "white", outline: "none", fontSize: "13px" }}
          >
            <option value="all" style={{ background: "#0f172a" }}>All Districts (31)</option>
            <option value="bengaluru_urban" style={{ background: "#0f172a" }}>Bengaluru Urban</option>
            <option value="mysuru" style={{ background: "#0f172a" }}>Mysuru City</option>
            <option value="mangalore" style={{ background: "#0f172a" }}>Mangaluru City</option>
            <option value="hubballi" style={{ background: "#0f172a" }}>Hubballi-Dharwad</option>
            <option value="belagavi" style={{ background: "#0f172a" }}>Belagavi</option>
          </select>
        </div>

        <button className="control-btn control-btn-primary" onClick={handleExport} disabled={isExporting}>
          <Download size={15} />
          <span>{isExporting ? "Generating..." : "Briefing Report"}</span>
        </button>
      </div>
    </div>
  );
}