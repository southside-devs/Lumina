import React, { useState } from "react";
import { NavLink, useNavigate } from "react-router-dom";
import {
  LayoutDashboard,
  Flame,
  Share2,
  ShieldAlert,
  Sparkles,
  Download,
  Plus,
  HelpCircle,
  Shield,
  ChevronLeft,
  ChevronRight,
  FilePlus
} from "lucide-react";

export default function Sidebar({ onTriggerExport }) {
  const [isCollapsed, setIsCollapsed] = useState(false);
  const navigate = useNavigate();

  // Clean navigation modules
  const sidebarNavItems = [
    { path: "/analytics", label: "State Overview", icon: <LayoutDashboard size={18} /> },
    { path: "/dashboard", label: "Hotspot Explorer", icon: <Flame size={18} /> },
    { path: "/network", label: "Network Graph", icon: <Share2 size={18} /> },
    { path: "/firs", label: "Risk Board", icon: <ShieldAlert size={18} /> },
    { path: "/ai-query", label: "AI Copilot", icon: <Sparkles size={18} /> },
  ];

  return (
    <aside className={`cy-sidebar ${isCollapsed ? "collapsed" : ""}`}>
      {/* Top Sidebar Navigation Header */}
      <div className="cy-sidebar-brand">
        {!isCollapsed ? (
          <span className="sidebar-section-title font-mono">NAVIGATION</span>
        ) : (
          <Shield size={16} className="text-muted" />
        )}
        <button
          type="button"
          className="sidebar-collapse-btn"
          onClick={() => setIsCollapsed(!isCollapsed)}
          title={isCollapsed ? "Expand Navigation" : "Collapse Navigation"}
        >
          {isCollapsed ? <ChevronRight size={14} /> : <ChevronLeft size={14} />}
        </button>
      </div>

      {/* Domain Specific CTA: + New Investigation */}
      <div className="cy-sidebar-cta">
        <button
          type="button"
          className="cy-btn-new-task"
          onClick={() => navigate("/firs?action=new")}
          title="New Investigation"
        >
          <div className="plus-icon-box"><FilePlus size={15} /></div>
          {!isCollapsed && <span className="cta-label">+ New Investigation</span>}
        </button>
      </div>

      {/* Sidebar Navigation Items with Prominent Active Indicator */}
      <nav className="cy-sidebar-nav">
        {sidebarNavItems.map((item) => (
          <NavLink
            key={item.path}
            to={item.path}
            className={({ isActive }) => `cy-nav-item ${isActive ? "active" : ""}`}
            title={item.label}
          >
            <span className="cy-nav-icon">{item.icon}</span>
            {!isCollapsed && <span className="cy-nav-label">{item.label}</span>}
          </NavLink>
        ))}

        {/* Wireframe Export Navigation Item */}
        <button
          type="button"
          className="cy-nav-item nav-export-btn"
          onClick={() => {
            if (onTriggerExport) onTriggerExport();
            else navigate("/analytics");
          }}
          title="Export"
        >
          <span className="cy-nav-icon"><Download size={18} /></span>
          {!isCollapsed && <span className="cy-nav-label">Export</span>}
        </button>
      </nav>

      {/* Bottom Sidebar Utility Footer */}
      <div className="cy-sidebar-footer">
        <button
          type="button"
          className="cy-footer-link"
          onClick={() => navigate("/ai-query")}
          title="Help & Docs"
        >
          <HelpCircle size={16} />
          {!isCollapsed && <span>Help & Docs</span>}
        </button>
        {!isCollapsed && (
          <div className="system-status-indicator font-mono">
            <span className="dot-green"></span> SYSTEM READY (KSP BETA)
          </div>
        )}
      </div>
    </aside>
  );
}