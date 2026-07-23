import React from "react";
import { Activity, FileText, Share2, MapPin, Cpu, FileCheck, Shield } from "lucide-react";

const FEED = [
  {
    id: 1, icon: <FileText size={15} color="#3b82f6" />, color: "#3b82f6",
    title: "FIR-2026-9901 Filed",
    desc: "Cybercrime: Banking fraud — ₹3.2L. PS: Whitefield, Bengaluru Urban.",
    time: "2 min ago",
  },
  {
    id: 2, icon: <Share2 size={15} color="#8b5cf6" />, color: "#8b5cf6",
    title: "Suspect Network Updated",
    desc: "Accused #4902 linked to 3 additional FIRs via financial transaction trace.",
    time: "11 min ago",
  },
  {
    id: 3, icon: <MapPin size={15} color="#f43f5e" />, color: "#f43f5e",
    title: "Hotspot Cluster Upgraded",
    desc: "Hebbal–Nagavara corridor upgraded to Risk Level RED by ST-DBSCAN.",
    time: "29 min ago",
  },
  {
    id: 4, icon: <Cpu size={15} color="#10b981" />, color: "#10b981",
    title: "AI Prediction Updated",
    desc: "Zia AutoML: Weekend theft likelihood +22% in Koramangala–BTM zone.",
    time: "45 min ago",
  },
  {
    id: 5, icon: <FileCheck size={15} color="#f59e0b" />, color: "#f59e0b",
    title: "Charge Sheet Filed",
    desc: "FIR-2026-8812 — Narcotics NDPS case charge-sheeted. Court date: Aug 4.",
    time: "1 hr ago",
  },
  {
    id: 6, icon: <Shield size={15} color="#06b6d4" />, color: "#06b6d4",
    title: "Unit Deployed",
    desc: "QRT dispatched to Belagavi Central based on predictive patrol schedule.",
    time: "1.5 hr ago",
  },
];

export default function ActivityFeed() {
  return (
    <div className="panel-card">
      <div className="panel-header">
        <div className="panel-title">
          <Activity size={18} style={{ color: "#10b981" }} />
          <h3>Live System Activity</h3>
        </div>
        <span style={{ fontSize: "11px", color: "#64748b" }}>Auto-refreshes every 30s</span>
      </div>

      <div className="panel-body">
        <div className="timeline-list">
          {FEED.map((item, idx) => (
            <div key={item.id} className="timeline-item">
              <div
                className="timeline-icon"
                style={{ background: `${item.color}18`, borderColor: `${item.color}40`, fontSize: "15px" }}
              >
                {item.icon}
              </div>
              <div className="timeline-content">
                <div className="timeline-header">
                  <span className="timeline-title">{item.title}</span>
                  <span className="timeline-time">{item.time}</span>
                </div>
                <p className="timeline-desc">{item.desc}</p>
              </div>
              {idx < FEED.length - 1 && (
                <div style={{
                  position: "absolute", left: "15px", top: "32px", bottom: "-16px",
                  width: "2px", background: "rgba(255,255,255,0.06)",
                }} />
              )}
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}