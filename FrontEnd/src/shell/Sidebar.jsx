import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import { routes } from "../router/routes";
import {
  ShieldAlert,
  BarChart3,
  Radio,
  FileText,
  Users,
  Shield,
  FileCode,
  Settings,
  UserCheck,
  CheckCircle2,
  Clock,
  LogOut,
  ChevronUp,
  X
} from "lucide-react";

export default function Sidebar() {
  const [showAccountModal, setShowAccountModal] = useState(false);

  const getIcon = (path) => {
    switch (path) {
      case "/dashboard": return <Radio size={16} />;
      case "/analytics": return <BarChart3 size={16} />;
      case "/intelligence": return <ShieldAlert size={16} />;
      case "/reports": return <FileText size={16} />;
      case "/users": return <Users size={16} />;
      case "/roles": return <Shield size={16} />;
      case "/audit": return <FileCode size={16} />;
      case "/settings": return <Settings size={16} />;
      default: return <BarChart3 size={16} />;
    }
  };

  return (
    <aside className="app-sidebar">
      {/* Brand Header */}
      <div className="sidebar-header">
        <div className="brand-icon">
          <ShieldAlert size={22} />
        </div>
        <div className="brand-text">
          <h2>LUMINA</h2>
          <span>SCRB COMMAND</span>
        </div>
      </div>

      {/* Nav Items */}
      <nav className="sidebar-nav">
        <div className="nav-section-title">INTELLIGENCE MODULES</div>
        {routes.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `nav-item ${isActive ? "active" : ""}`}
          >
            {getIcon(item.path)}
            <span>{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom-Left 3D Skeuomorphic Account User Card */}
      <div className="sidebar-footer">
        <button
          type="button"
          className="skeuo-account-tab"
          onClick={() => setShowAccountModal(true)}
        >
          <div className="skeuo-avatar-bevel">
            <div className="avatar-inner-glow">RK</div>
          </div>
          <div className="skeuo-user-meta">
            <span className="skeuo-user-name">Insp. Rajesh Kumar</span>
            <span className="skeuo-user-role">
              <span className="skeuo-online-dot"></span> SCRB Analyst
            </span>
          </div>
          <ChevronUp size={14} className="skeuo-arrow-indicator" />
        </button>
      </div>

      {/* Skeuomorphic Account Details Modal */}
      {showAccountModal && (
        <div
          style={{
            position: "fixed",
            top: 0,
            left: 0,
            right: 0,
            bottom: 0,
            backgroundColor: "rgba(0,0,0,0.75)",
            backdropFilter: "blur(8px)",
            zIndex: 99999,
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}
          onClick={() => setShowAccountModal(false)}
        >
          <div
            className="skeuo-account-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="skeuo-modal-header">
              <div className="skeuo-badge-header">
                <CheckCircle2 size={13} /> 2FA BIOMETRIC CLEARANCE ACTIVE
              </div>
              <button
                type="button"
                style={{ background: "transparent", border: "none", color: "var(--text-dim)", cursor: "pointer" }}
                onClick={() => setShowAccountModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="skeuo-profile-hero">
              <div className="skeuo-big-avatar-bevel">
                <div className="big-avatar-text">RK</div>
              </div>
              <div className="skeuo-profile-text">
                <h3>Inspector Rajesh Kumar</h3>
                <div className="skeuo-title-tag font-mono">Senior Intelligence Analyst</div>
                <span className="ksp-dept-pill">Karnataka State Police — SCRB HQ, Bengaluru</span>
              </div>
            </div>

            <div className="skeuo-details-grid">
              <div className="skeuo-detail-item">
                <div className="detail-icon"><UserCheck size={16} /></div>
                <div>
                  <span className="detail-label">OFFICER BADGE ID</span>
                  <span className="detail-value font-mono">KSP-SCRB-88421</span>
                </div>
              </div>
              <div className="skeuo-detail-item">
                <div className="detail-icon"><Clock size={16} /></div>
                <div>
                  <span className="detail-label">SESSION TIMER</span>
                  <span className="detail-value font-mono">03h 42m Active</span>
                </div>
              </div>
            </div>

            <div className="skeuo-modal-footer">
              <button
                type="button"
                className="skeuo-btn-action secondary"
                onClick={() => setShowAccountModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="skeuo-btn-action danger"
                onClick={() => {
                  setShowAccountModal(false);
                  alert("Logged out of Lumina Security Command.");
                }}
              >
                <LogOut size={14} /> Log Out
              </button>
            </div>
          </div>
        </div>
      )}
    </aside>
  );
}