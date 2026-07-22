import React from "react";
import { NavLink } from "react-router-dom";
import { LayoutDashboard, FileText, BarChart3, Network, Bot, Settings, ShieldAlert } from "lucide-react";

export default function Sidebar() {
  const navItems = [
    { path: "/dashboard", label: "Dashboard", icon: LayoutDashboard, badge: null },
    { path: "/firs", label: "FIR Management", icon: FileText, badge: "14" },
    { path: "/analytics", label: "Analytics & Risk", icon: BarChart3, badge: null },
    { path: "/network", label: "Crime Network", icon: Network, badge: "LIVE" },
    { path: "/ai-query", label: "AI Assistant", icon: Bot, badge: "AI" },
    { path: "/settings", label: "System Settings", icon: Settings, badge: null },
  ];

  return (
    <aside className="sidebar">
      <div className="sidebar-group-title">Command Navigation</div>

      <div className="sidebar-nav-group">
        {navItems.map((item) => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.path}
              to={item.path}
              className={({ isActive }) => `nav-link ${isActive ? "active" : ""}`}
            >
              <div className="nav-link-content">
                <Icon size={18} />
                <span>{item.label}</span>
              </div>
              {item.badge && <span className="nav-badge">{item.badge}</span>}
            </NavLink>
          );
        })}
      </div>

      <div style={{ marginTop: "auto", paddingTop: "20px", borderTop: "1px solid rgba(255,255,255,0.08)" }}>
        <div style={{ background: "rgba(15, 23, 42, 0.6)", borderRadius: "10px", padding: "12px", border: "1px solid rgba(255,255,255,0.05)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: "8px", fontSize: "12px", color: "#34d399", fontWeight: 600 }}>
            <ShieldAlert size={15} />
            <span>KSP Command Node</span>
          </div>
          <p style={{ fontSize: "11px", color: "#64748b", marginTop: "4px" }}>
            State Grid: 31 Districts Connected
          </p>
        </div>
      </div>
    </aside>
  );
}