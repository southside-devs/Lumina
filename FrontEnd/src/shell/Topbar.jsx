import React, { useState } from "react";
import { Shield, Search, Bell, RefreshCw, Download, Activity, ChevronDown, CheckCircle2 } from "lucide-react";

export default function Topbar() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  return (
    <header className="topbar">
      <div className="topbar-left">
        <div className="topbar-brand">
          <div className="topbar-logo-icon">
            <Shield size={20} />
          </div>
          <span className="topbar-brand-text">LUMINA</span>
          <span className="topbar-brand-tag">KSP v2.6</span>
        </div>

        <div className="global-search">
          <Search size={15} className="global-search-icon" />
          <input
            type="text"
            placeholder="Search FIR, Suspect, Case ID, District..."
          />
        </div>
      </div>

      <div className="topbar-right">
        <div className="status-badge">
          <span className="pulse-indicator"></span>
          <span>Live API Sync Active</span>
        </div>

        <button
          className="topbar-action-btn"
          onClick={handleRefresh}
          title="Sync Realtime Data"
        >
          <RefreshCw size={16} className={isRefreshing ? "spin" : ""} />
        </button>

        <div style={{ position: "relative" }}>
          <button
            className="topbar-action-btn"
            onClick={() => setNotificationsOpen(!notificationsOpen)}
            title="Real-Time Alerts"
          >
            <Bell size={16} />
            <span className="notification-count">3</span>
          </button>

          {notificationsOpen && (
            <div
              style={{
                position: "absolute",
                top: "48px",
                right: "0",
                width: "320px",
                background: "#0f172a",
                border: "1px solid rgba(255,255,255,0.12)",
                borderRadius: "12px",
                padding: "16px",
                boxShadow: "0 20px 40px rgba(0,0,0,0.6)",
                zIndex: 100,
              }}
            >
              <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "12px" }}>
                <span style={{ fontWeight: 700, fontSize: "13px" }}>Critical Alerts</span>
                <span style={{ fontSize: "11px", color: "#38bdf8", cursor: "pointer" }}>Mark all read</span>
              </div>
              <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
                <div style={{ fontSize: "12px", background: "rgba(244,63,94,0.1)", border: "1px solid rgba(244,63,94,0.2)", padding: "10px", borderRadius: "8px" }}>
                  <div style={{ color: "#fb7185", fontWeight: 700 }}>🚨 High Threat Spike</div>
                  <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>Bengaluru Urban risk score elevated to 8.9</div>
                </div>
                <div style={{ fontSize: "12px", background: "rgba(245,158,11,0.1)", border: "1px solid rgba(245,158,11,0.2)", padding: "10px", borderRadius: "8px" }}>
                  <div style={{ color: "#fbbf24", fontWeight: 700 }}>⚠️ Network Link Detected</div>
                  <div style={{ color: "#94a3b8", fontSize: "11px", marginTop: "2px" }}>Suspect #4902 linked to FIR-2026-9901</div>
                </div>
              </div>
            </div>
          )}
        </div>

        <div className="officer-profile">
          <div className="officer-avatar">SP</div>
          <div className="officer-info">
            <span className="officer-name">Sup. S. Rao</span>
            <span className="officer-role">KSP Cyber Cell</span>
          </div>
        </div>
      </div>
    </header>
  );
}