import React, { useState } from "react";
import {
  SlidersHorizontal,
  Info,
  Clock,
  Download,
  ChevronUp,
  ChevronDown,
  X,
  Filter,
  FileSpreadsheet
} from "lucide-react";

export default function ContextualDrawer({ selectedNode, setSelectedNode }) {
  const [isOpen, setIsOpen] = useState(false);
  const [activeTab, setActiveTab] = useState("filters"); // 'filters' | 'details' | 'timeline' | 'export'

  // Filter States
  const [district, setDistrict] = useState("All Districts");
  const [timeframe, setTimeframe] = useState("Last 7 Days");
  const [crimeType, setCrimeType] = useState("Cybercrime");
  const [riskLevel, setRiskLevel] = useState("All Levels");
  const [filterToast, setFilterToast] = useState(null);
  const toastTimerRef = React.useRef(null);

  const handleApplyFilters = (e) => {
    if (e) e.preventDefault();
    if (toastTimerRef.current) clearTimeout(toastTimerRef.current);
    setFilterToast(null);
    setTimeout(() => {
      setFilterToast(`Filters Applied: ${district} | ${crimeType} | ${timeframe} | ${riskLevel}`);
      toastTimerRef.current = setTimeout(() => setFilterToast(null), 3500);
    }, 50);
  };

  const handleExportPDF = () => {
    const text = `===================================================================
KARNATAKA STATE POLICE — STRATEGIC CRIME DOSSIER
Generated: ${new Date().toLocaleString()} | Classification: RESTRICTED / KSP ONLY
===================================================================
1. SCOPE & JURISDICTION
   - Active Filter: ${district}
   - Crime Category: ${crimeType}
   - Timeframe Window: ${timeframe}
   - Risk Threshold: ${riskLevel}

2. RECORD SNAPSHOT
   - Total Tracked Incidents: 5,000 FIR Records
   - Primary Crime Vectors: Cyber Extortion (BNS 318), MV Theft (BNS 303), Assault (BNS 109)
===================================================================`;

    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KSP_Strategic_Crime_Dossier_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  const handleExportCSV = () => {
    const csvContent = `FIR_Number,District,Crime_Group,Sub_Group,Incident_Date,Status\nFIR/2026/BLR/9901,Bengaluru Urban,Cybercrime,BNS 318,2026-07-20,Under Investigation\nFIR/2026/MYS/8802,Mysuru City,Vehicle Theft,BNS 303,2026-07-18,Chargesheeted\nFIR/2026/MNG/7703,Mangaluru,Assault,BNS 109,2026-07-15,Closed`;
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `KSP_Incident_Data_${new Date().toISOString().slice(0, 10)}.csv`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // Sample timeline logs
  const timelineLogs = [
    { time: "10:24 AM", event: "FIR-2026-9901 registered at Whitefield PS (BNS 318)", type: "critical" },
    { time: "09:45 AM", event: "Suspect #4902 geolocation matched near Electronic City", type: "warning" },
    { time: "08:30 AM", event: "Automated AI Risk Score recalculation completed for Bengaluru Urban", type: "info" },
    { time: "07:15 AM", event: "Catalyst RBAC clearance verified for Inspector General Ramachandra Rao", type: "success" }
  ];

  const handleTabClick = (tabName) => {
    if (isOpen && activeTab === tabName) {
      setIsOpen(false);
    } else {
      setActiveTab(tabName);
      setIsOpen(true);
    }
  };

  return (
    <div className={`contextual-drawer floating-dock ${isOpen ? "open" : "collapsed"}`}>
      {filterToast && (
        <div style={{
          position: "fixed", bottom: "75px", left: "50%", transform: "translateX(-50%)", zIndex: 9999,
          background: "rgba(56,189,248,0.95)", color: "#090d16", padding: "8px 16px",
          borderRadius: "8px", fontSize: "12px", fontWeight: 700, fontFamily: "JetBrains Mono, monospace"
        }}>
          {filterToast}
        </div>
      )}

      {/* Sleek Floating Dock Header Bar */}
      <div className="drawer-header" onClick={() => setIsOpen(!isOpen)} style={{ gap: "12px", padding: "0 14px" }}>
        <div className="drawer-title-group" style={{ display: "flex", alignItems: "center", gap: "8px" }}>
          <div className="drawer-icon-badge" style={{ color: "#f97316" }}>
            <SlidersHorizontal size={14} />
          </div>
          <span className="drawer-title font-mono" style={{ fontSize: "11px", fontWeight: "700", letterSpacing: "0.05em", color: "#f1f5f9" }}>
            CONTEXTUAL CONTROL PANEL
          </span>
        </div>

        {/* Tab Buttons (visible when expanded) */}
        {isOpen && (
          <div className="drawer-tabs" onClick={(e) => e.stopPropagation()}>
            <button
              className={`drawer-tab-btn ${activeTab === "filters" ? "active" : ""}`}
              onClick={() => handleTabClick("filters")}
            >
              <Filter size={13} />
              <span>Contextual Filters</span>
            </button>

            <button
              className={`drawer-tab-btn ${activeTab === "details" ? "active" : ""}`}
              onClick={() => handleTabClick("details")}
            >
              <Info size={13} />
              <span>Node Inspector {selectedNode ? <span className="inline-block w-2 h-2 rounded-full bg-red-500 animate-pulse ml-1" /> : ""}</span>
            </button>

            <button
              className={`drawer-tab-btn ${activeTab === "timeline" ? "active" : ""}`}
              onClick={() => handleTabClick("timeline")}
            >
              <Clock size={13} />
              <span>Live Stream</span>
            </button>

            <button
              className={`drawer-tab-btn ${activeTab === "export" ? "active" : ""}`}
              onClick={() => handleTabClick("export")}
            >
              <Download size={13} />
              <span>Export & Reports</span>
            </button>
          </div>
        )}

        {/* Collapse / Expand Toggle */}
        <div className="drawer-toggle-box" style={{ color: "#94a3b8" }}>
          {isOpen ? <ChevronDown size={16} /> : <ChevronUp size={16} />}
        </div>
      </div>

      {/* Drawer Floating Overlay Content */}
      {isOpen && (
        <div className="drawer-content">
          {/* TAB 1: FILTERS */}
          {activeTab === "filters" && (
            <div className="drawer-grid-filters">
              <div className="filter-group">
                <label className="filter-label font-mono">DISTRICT JURISDICTION</label>
                <select
                  value={district}
                  onChange={(e) => setDistrict(e.target.value)}
                  className="drawer-select"
                >
                  <option>All Districts</option>
                  <option>Bengaluru Urban</option>
                  <option>Mysuru</option>
                  <option>Hubballi-Dharwad</option>
                  <option>Tumakuru</option>
                  <option>Mangaluru</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label font-mono">CRIME CATEGORY</label>
                <select
                  value={crimeType}
                  onChange={(e) => setCrimeType(e.target.value)}
                  className="drawer-select"
                >
                  <option>Cybercrime</option>
                  <option>Narcotics (NDPS)</option>
                  <option>Financial Fraud</option>
                  <option>Organized Crime</option>
                  <option>Violent Offences</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label font-mono">TIMEFRAME</label>
                <select
                  value={timeframe}
                  onChange={(e) => setTimeframe(e.target.value)}
                  className="drawer-select"
                >
                  <option>Last 24 Hours</option>
                  <option>Last 7 Days</option>
                  <option>Last 30 Days</option>
                  <option>Year to Date (2026)</option>
                </select>
              </div>

              <div className="filter-group">
                <label className="filter-label font-mono">RISK LEVEL THRESHOLD</label>
                <select
                  value={riskLevel}
                  onChange={(e) => setRiskLevel(e.target.value)}
                  className="drawer-select"
                >
                  <option>All Levels</option>
                  <option>Critical (8.0+ Score)</option>
                  <option>High (6.0 - 7.9 Score)</option>
                  <option>Medium (4.0 - 5.9 Score)</option>
                </select>
              </div>

              <div className="filter-actions">
                <button
                  type="button"
                  className="btn-apply-filters"
                  onClick={handleApplyFilters}
                >
                  Apply Filters
                </button>
              </div>
            </div>
          )}

          {/* TAB 2: NODE DETAILS INSPECTOR */}
          {activeTab === "details" && (
            <div className="drawer-node-inspector">
              {selectedNode ? (
                <div className="node-detail-card">
                  <div className="node-detail-header">
                    <div>
                      <span className="node-type-badge font-mono">{selectedNode.type || "SUSPECT NODE"}</span>
                      <h4>{selectedNode.name || "Target Node #4902"}</h4>
                    </div>
                    <button className="btn-close-node" onClick={() => setSelectedNode && setSelectedNode(null)}>
                      <X size={14} />
                    </button>
                  </div>
                  <div className="node-detail-body">
                    <p><strong>Alias / Handle:</strong> @cyber_ghost_blr</p>
                    <p><strong>Linked FIRs:</strong> FIR-2026-9901, FIR-2026-8812</p>
                    <p><strong>Primary District:</strong> Bengaluru Urban (Whitefield PS)</p>
                    <p><strong>Calculated Threat Index:</strong> <span className="threat-high">8.8 / 10 (Critical)</span></p>
                  </div>
                </div>
              ) : (
                <div className="no-node-placeholder">
                  <Info size={20} />
                  <span>Click any node, hotspot, or FIR record on the main canvas view to inspect real-time details.</span>
                </div>
              )}
            </div>
          )}

          {/* TAB 3: LIVE TIMELINE */}
          {activeTab === "timeline" && (
            <div className="drawer-timeline-list">
              {timelineLogs.map((log, i) => (
                <div key={i} className={`timeline-item ${log.type}`}>
                  <span className="timeline-time font-mono">{log.time}</span>
                  <span className="timeline-event">{log.event}</span>
                </div>
              ))}
            </div>
          )}

          {/* TAB 4: EXPORT & REPORTS */}
          {activeTab === "export" && (
            <div className="drawer-export-panel">
              <div className="export-info">
                <FileSpreadsheet size={20} className="icon-ember" />
                <div>
                  <h4 style={{ margin: 0, fontSize: "14px", color: "#f3f4f6" }}>Export Intelligence Dataset</h4>
                  <p style={{ margin: "2px 0 0", fontSize: "12px", color: "#9ca3af" }}>Download filtered FIR & Crime Hotspot datasets in CSV or PDF dossier format.</p>
                </div>
              </div>
              <div className="export-btn-group">
                <button
                  type="button"
                  className="btn-export-action primary"
                  onClick={handleExportPDF}
                >
                  <Download size={14} /> Export PDF Dossier
                </button>
                <button
                  type="button"
                  className="btn-export-action secondary"
                  onClick={handleExportCSV}
                >
                  <FileSpreadsheet size={14} /> Export CSV
                </button>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  );
}
