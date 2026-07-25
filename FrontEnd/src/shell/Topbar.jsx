import React, { useState, useEffect } from "react";
import NotificationsPopover from "./NotificationsPopover";
import UpdateNotificationModal from "../components/modals/UpdateNotificationModal";
import { Search, Bell, RefreshCw, ShieldCheck, UserCheck, CheckCircle2, ChevronDown, Sparkles } from "lucide-react";

export default function Topbar() {
  const [isRefreshing, setIsRefreshing] = useState(false);
  const [notificationsOpen, setNotificationsOpen] = useState(false);
  const [roleMenuOpen, setRoleMenuOpen] = useState(false);
  const [showUpdateModal, setShowUpdateModal] = useState(false);
  const [hasUpdate, setHasUpdate] = useState(false);
  const [userRole, setUserRole] = useState(localStorage.getItem("lumina_user_role") || "Inspector General (IG)");
  const [authToast, setAuthToast] = useState(null);
  const [logoError, setLogoError] = useState(false);

  useEffect(() => {
    if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable(() => {
        setHasUpdate(true);
        setShowUpdateModal(true);
      });
    }
  }, []);

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

  const handleSelectRole = (role) => {
    setUserRole(role);
    localStorage.setItem("lumina_user_role", role);
    setRoleMenuOpen(false);
    setAuthToast(`Authenticated via Catalyst OAuth 2.0: Switched to ${role} (Clearance Level 4 Active)`);
    setTimeout(() => setAuthToast(null), 4000);
  };

  return (
    <header className="topbar">
      {/* Auth Toast Notification */}
      {authToast && (
        <div style={{
          position: "fixed", top: "70px", right: "24px", zIndex: 99999,
          background: "rgba(16,185,129,0.95)", color: "#ffffff", padding: "10px 18px",
          borderRadius: "10px", fontSize: "12px", fontWeight: "700", fontFamily: "JetBrains Mono, monospace",
          boxShadow: "0 10px 30px rgba(0,0,0,0.5)", border: "1px solid rgba(255,255,255,0.2)",
          display: "flex", alignItems: "center", gap: "8px"
        }}>
          <UserCheck size={16} />
          {authToast}
        </div>
      )}

      {/* Top Left: KSP Logo + Branding */}
      <div className="topbar-left">
        <div className="topbar-brand">
          {!logoError ? (
            <img
              src="./KSP_logo.png"
              alt="Karnataka State Police Logo"
              className="topbar-ksp-logo"
              style={{ width: "36px", height: "36px", objectFit: "contain" }}
              onError={() => setLogoError(true)}
            />
          ) : (
            <div className="ksp-emblem-badge" style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "linear-gradient(135deg, #f59e0b, #d97706)",
              border: "1px solid rgba(245,158,11,0.5)",
              display: "flex", alignItems: "center", justifyContent: "center",
              boxShadow: "0 0 12px rgba(245,158,11,0.4)"
            }}>
              <svg width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="#0f172a" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                <path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>
                <path d="M12 8v4"/>
                <path d="M12 16h.01"/>
              </svg>
            </div>
          )}
          <div className="topbar-brand-titles">
            <div className="topbar-title-row">
              <span className="topbar-brand-text">LUMINA</span>
              <button
                onClick={() => setShowUpdateModal(true)}
                className="topbar-brand-tag font-mono"
                style={{
                  background: hasUpdate ? "rgba(232,80,2,0.25)" : "rgba(255,255,255,0.06)",
                  border: hasUpdate ? "1px solid rgba(232,80,2,0.5)" : "1px solid rgba(255,255,255,0.1)",
                  color: hasUpdate ? "#f97316" : "#94a3b8",
                  cursor: "pointer", display: "inline-flex", alignItems: "center", gap: "4px",
                  padding: "2px 8px", borderRadius: "6px"
                }}
                title="Click to check for update & view release notes"
              >
                {hasUpdate && <span className="inline-block w-2 h-2 rounded-full bg-orange-500 animate-pulse" />}
                KSP Prototype v0.2.2
              </button>
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
        <button
          className="status-badge"
          onClick={() => setShowUpdateModal(true)}
          style={{ cursor: "pointer", border: "none", background: "rgba(16,185,129,0.12)" }}
          title="Click to view version changelog and software updates"
        >
          <span className="pulse-indicator"></span>
          <span>Live API Sync Active</span>
        </button>

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
                <span>CATALYST RBAC AUTHENTICATION</span>
              </div>
              {roleOptions.map((role) => (
                <button
                  key={role}
                  className={`rbac-role-option ${userRole === role ? "active" : ""}`}
                  onClick={() => handleSelectRole(role)}
                >
                  <CheckCircle2 size={13} style={{ opacity: userRole === role ? 1 : 0 }} />
                  <span>{role}</span>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Software Update & Changelog Modal */}
      {showUpdateModal && (
        <UpdateNotificationModal onClose={() => setShowUpdateModal(false)} />
      )}
    </header>
  );
}