import React, { useState } from "react";
import NotificationsPopover from "./NotificationsPopover";
import { Search, Bell, RefreshCw, ShieldCheck, UserCheck, CheckCircle2, ChevronDown } from "lucide-react";

export default function Topbar() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [userRole, setUserRole] = useState("Inspector General"); // Catalyst RBAC tier
  const [logoError, setLogoError] = useState(false);

  const handleRefresh = () => {
    setIsRefreshing(true);
    setTimeout(() => setIsRefreshing(false), 800);
  };

  const roleOptions = [
    "Inspector General (IG)",
    "Superintendent of Police (SP)",
    "Station House Officer (SHO)",
    "Lead Intelligence Analyst"
  ];

  return (
    <header className="topbar">
      {/* Top Left: KSP Logo + Branding */}
      <div className="topbar-left">
        <div className="topbar-brand">
          {!logoError ? (
            <img
              src="/assets/ksp_logo.png"
              alt="Karnataka State Police Logo"
              className="topbar-ksp-logo"
              onError={() => setLogoError(true)}
            />
          ) : (
            <span className="ksp-fallback-badge font-mono">KSP</span>
          )}
          <div className="topbar-brand-titles">
            <div className="topbar-title-row">
              <span className="topbar-brand-text">LUMINA</span>
              <span className="topbar-brand-tag font-mono">KSP Prototype v0.1.0</span>
            </div>
            <span className="topbar-brand-hub-sub font-mono">KSP Strategic Intelligence Hub</span>
          </div>
        </div>

        {/* Global Fast Search Bar */}
        <div className="global-search">
          <Search size={15} className="global-search-icon" />
          <input
            type="text"
            placeholder="Search FIR, Suspect Name, Police Station, Vehicle Reg No..."
          />
        </div>
      </div>

      {/* Top Right: Status, Alerts, Role Badge & User Profile */}
      <div className="topbar-right">
        {/* Live API Sync Status Indicator */}
        <div className="status-badge">
          <span className="pulse-indicator"></span>
          <span>Live API Sync Active</span>
        </div>

        {/* Sync Button */}
        <button
          className="topbar-action-btn"
          onClick={handleRefresh}
          title="Sync Realtime Data"
        >
          <RefreshCw size={16} className={isRefreshing ? "spin" : ""} />
        </button>

        {/* Real-time Alerts Dropdown */}
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
            <NotificationsPopover onClose={() => setNotificationsOpen(false)} />
          )}
        </div>

        {/* Catalyst RBAC Role Badge & Profile */}
        <div className="rbac-profile-wrapper" style={{ position: "relative" }}>
          <button
            className="officer-profile-btn"
            onClick={() => setRoleMenuOpen(!roleMenuOpen)}
          >
            <div className="officer-avatar">RR</div>
            <div className="officer-info">
              <span className="officer-name">Ramachandra Rao</span>
              <span className="rbac-role-badge font-mono">
                <ShieldCheck size={11} /> {userRole}
              </span>
            </div>
            <ChevronDown size={14} style={{ opacity: 0.6, marginLeft: "4px" }} />
          </button>

          {/* Role Switcher (Catalyst RBAC Simulation) */}
          {roleMenuOpen && (
            <div className="rbac-role-menu glass-panel">
              <div className="rbac-menu-header font-mono">
                <span>CATALYST RBAC TIER</span>
              </div>
              {roleOptions.map((role) => (
                <button
                  key={role}
                  className={`rbac-role-option ${userRole === role ? "active" : ""}`}
                  onClick={() => {
                    setUserRole(role);
                    setRoleMenuOpen(false);
                  }}
                >
                  <CheckCircle2 size={13} style={{ opacity: userRole === role ? 1 : 0 }} />
                  <span>{role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>
    </header>
  );
}