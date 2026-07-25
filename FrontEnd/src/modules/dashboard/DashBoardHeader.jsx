import React, { useState } from "react";
import { Calendar, Filter, Download, RefreshCw, FileSpreadsheet } from "lucide-react";

export default function DashboardHeader({ onDistrictChange, selectedDistrict, onTimeframeChange }) {
  const [timeframe, setTimeframe] = useState("30d");
  const [district, setDistrict] = useState(selectedDistrict || "all");
  const [isExporting, setIsExporting] = useState(false);

  const handleTimeframeSelect = (val) => {
    setTimeframe(val);
    if (onTimeframeChange) onTimeframeChange(val);
  };

  const handleDistrictSelect = (val) => {
    setDistrict(val);
    if (onDistrictChange) onDistrictChange(val);
  };

  const handleExport = () => {
    setIsExporting(true);
    setTimeout(() => {
      const reportText = `===================================================================
KARNATAKA STATE POLICE — COMMAND INTELLIGENCE BRIEFING REPORT
Generated: ${new Date().toLocaleString()} | Classification: RESTRICTED / KSP INTERNAL ONLY
===================================================================

1. EXECUTIVE THREAT SUMMARY
   - Timeframe Window: ${timeframe === "7d" ? "Last 7 Days" : timeframe === "90d" ? "Last 90 Days" : timeframe === "ytd" ? "Year to Date" : "Last 30 Days"}
   - District Filter: ${district.toUpperCase()}
   - Total FIRs Registered (Statewide): 5,000 Cases
   - Active Under Investigation: 1,900 Cases (38%)
   - Chargesheeted Rate: 42.0% (KSP Target: 75%)
   - Repeat Recidivist Offenders: 420 Suspects Flagged

2. HOTSPOT CLUSTER CORRIDORS (ST-DBSCAN Engine)
   - Bengaluru Tech Corridor (Threat Score: 92/100, Critical)
     * Primary MO: Organized Cyber Extortion & Banking Fraud (BNS 318 / IT Act 66D)
   - Mysuru Tourist Transit Hub (Threat Score: 74/100, High)
     * Primary MO: Vehicle Theft & Highway Snatching (BNS 303)
   - Mangaluru Coastal Port Belt (Threat Score: 85/100, High)
     * Primary MO: Smuggling & Violent Assault (BNS 109)

3. STRATEGIC ACTION ITEMS FOR POLICE COMMANDERS
   - Deploy high-density night patrol vectors along Hebbal-Nagavara corridor.
   - Accelerate chargesheet filing for BNS 303 MV Theft offences.

===================================================================
CONFIDENTIAL • KARNATAKA STATE POLICE STRATEGIC INTELLIGENCE HUB
===================================================================`;

      const blob = new Blob([reportText], { type: "text/plain;charset=utf-8" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `KSP_Command_Briefing_Report_${new Date().toISOString().slice(0, 10)}.txt`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);

      setIsExporting(false);
    }, 800);
  };

  return (
    <div className="dashboard-header">
      <div className="dashboard-title-group">
        <h1>Command Intelligence Dashboard</h1>
        <p>State-wide Real-Time Crime Analytics & AI Threat Assessment Hub</p>
      </div>

      <div className="header-controls">
        <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} className="control-select">
          <Calendar size={14} style={{ color: "#38bdf8" }} />
          <select
            value={timeframe}
            onChange={(e) => handleTimeframeSelect(e.target.value)}
            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", color: "white", outline: "none", fontSize: "13px", padding: "4px 8px", borderRadius: "6px", cursor: "pointer" }}
          >
            <option value="7d">Last 7 Days</option>
            <option value="30d">Last 30 Days</option>
            <option value="90d">Last 90 Days</option>
            <option value="ytd">Year to Date</option>
          </select>
        </div>

        <div style={{ display: "flex", alignItems: "center", gap: "6px", cursor: "pointer" }} className="control-select">
          <Filter size={14} style={{ color: "#8b5cf6" }} />
          <select
            value={district}
            onChange={(e) => handleDistrictSelect(e.target.value)}
            style={{ background: "#0f172a", border: "1px solid rgba(255,255,255,0.15)", color: "white", outline: "none", fontSize: "13px", padding: "4px 8px", borderRadius: "6px", cursor: "pointer" }}
          >
            <option value="all">All Districts (31)</option>
            <option value="bengaluru_urban">Bengaluru Urban</option>
            <option value="mysuru">Mysuru City</option>
            <option value="mangalore">Mangaluru City</option>
            <option value="hubballi">Hubballi-Dharwad</option>
            <option value="belagavi">Belagavi</option>
            <option value="kalaburagi">Kalaburagi</option>
            <option value="tumakuru">Tumakuru</option>
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