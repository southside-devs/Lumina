import React, { useState } from "react";
import { NavLink } from "react-router-dom";
import {
  LayoutDashboard,
  Search,
  AlertOctagon,
  ShieldCheck,
  Lock,
  Boxes,
  HelpCircle,
  Plus,
  UserCheck,
  CheckCircle2,
  Clock,
  LogOut,
  X
} from "lucide-react";

export default function Sidebar() {
  const [showAccountModal, setShowAccountModal] = useState(false);

  const sidebarNavItems = [
    { path: "/analytics", label: "Dashboard", icon: <LayoutDashboard size={16} /> },
    { path: "/findings", label: "Findings", icon: <Search size={16} /> },
    { path: "/incidents", label: "Incidents", icon: <AlertOctagon size={16} /> },
    { path: "/compliance", label: "Compliance", icon: <ShieldCheck size={16} /> },
    { path: "/vault", label: "Vault", icon: <Lock size={16} /> },
    { path: "/integrations", label: "Integrations", icon: <Boxes size={16} /> }
  ];

  return (
    <aside className="cy-sidebar">
      {/* Top Brand Logo */}
      <div className="cy-sidebar-brand">
        <span className="cy-brand-text">CY • FOCUS</span>
        <span className="cy-sub-moniker font-mono">LUMINA KSP</span>
      </div>

      {/* Primary Orange Action CTA Button */}
      <div className="cy-sidebar-cta">
        <button
          type="button"
          className="cy-btn-new-task"
          onClick={() => alert("Creating new Intelligence Incident Task...")}
        >
          <span>New task</span>
          <div className="plus-icon-box"><Plus size={15} /></div>
        </button>
      </div>

      {/* Sidebar Navigation Items */}
      <nav className="cy-sidebar-nav">
        {sidebarNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `cy-nav-item ${isActive ? "active" : ""}`}
          >
            <span className="cy-nav-icon">{item.icon}</span>
            <span className="cy-nav-label">{item.label}</span>
          </NavLink>
        ))}
      </nav>

      {/* Bottom Footer Section */}
      <div className="cy-sidebar-footer">
        <button
          type="button"
          className="cy-footer-link"
          onClick={() => alert("Opening Lumina Intelligence Documentation & Help...")}
        >
          <HelpCircle size={15} />
          <span>Help & Docs</span>
        </button>

        {/* CY FOCUS User Profile Pill */}
        <button
          type="button"
          className="cy-user-profile-card"
          onClick={() => setShowAccountModal(true)}
        >
          <div className="cy-avatar-box">
            <img
              src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=120&q=80"
              alt="Anna Gunn"
              className="cy-avatar-img"
            />
          </div>
          <div className="cy-user-info">
            <span className="cy-user-name">Anna Gunn</span>
            <span className="cy-user-handle font-mono">@gunna25</span>
          </div>
        </button>
      </div>

      {/* Account Profile Modal */}
      {showAccountModal && (
        <div
          className="cy-modal-backdrop"
          onClick={() => setShowAccountModal(false)}
        >
          <div
            className="cy-account-modal glass-panel"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="cy-modal-header">
              <div className="cy-badge-active font-mono">
                <CheckCircle2 size={13} /> 2FA CLEARANCE VERIFIED
              </div>
              <button
                type="button"
                className="cy-modal-close"
                onClick={() => setShowAccountModal(false)}
              >
                <X size={18} />
              </button>
            </div>

            <div className="cy-profile-hero">
              <img
                src="https://images.unsplash.com/photo-1534528741775-53994a69daeb?auto=format&fit=crop&w=150&q=80"
                alt="Anna Gunn"
                className="cy-modal-avatar-img"
              />
              <div className="cy-profile-text">
                <h3>Anna Gunn</h3>
                <div className="cy-handle font-mono">@gunna25</div>
                <div className="cy-role-tag font-mono">Lead Intelligence Analyst</div>
                <span className="cy-sub-dept">Cyber Security Division — Lumina KSP</span>
              </div>
            </div>

            <div className="cy-details-grid">
              <div className="cy-detail-card">
                <UserCheck size={16} className="icon-ember" />
                <div>
                  <span className="cy-label font-mono">ANALYST ID</span>
                  <span className="cy-val font-mono">AN-2042-88</span>
                </div>
              </div>
              <div className="cy-detail-card">
                <Clock size={16} className="icon-ember" />
                <div>
                  <span className="cy-label font-mono">ACTIVE SESSION</span>
                  <span className="cy-val font-mono">04h 12m</span>
                </div>
              </div>
            </div>

            <div className="cy-modal-footer">
              <button
                type="button"
                className="cy-btn-action secondary"
                onClick={() => setShowAccountModal(false)}
              >
                Close
              </button>
              <button
                type="button"
                className="cy-btn-action danger"
                onClick={() => {
                  setShowAccountModal(false);
                  alert("Logged out of CY FOCUS Command System.");
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