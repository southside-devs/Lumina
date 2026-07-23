import React, { useState } from "react";
import { useNavigate } from "react-router-dom";
import {
  Bell,
  CheckCircle2,
  ArrowRight,
  ShieldAlert,
  AlertTriangle,
  Activity,
  Sparkles,
  X
} from "lucide-react";

export default function NotificationsPopover({ onClose }) {
  const navigate = useNavigate();
  const [filterTab, setFilterTab] = useState("all"); // 'all' | 'high'

  const [notifications, setNotifications] = useState([
    {
      id: "notif-1",
      severity: "high",
      icon: <ShieldAlert size={16} className="text-red-400" />,
      title: "High Threat Spike Detected",
      description: "Bengaluru Urban risk score elevated to 8.9 following cyber fraud surge.",
      tags: ["Bengaluru Urban", "Risk Score: 8.9"],
      time: "2m ago",
      isUnread: true,
      targetRoute: "/dashboard"
    },
    {
      id: "notif-2",
      severity: "amber",
      icon: <AlertTriangle size={16} className="text-amber-400" />,
      title: "New Network Link Identified",
      description: "Suspect #4902 linked to cross-district syndicate in FIR-2026-9901.",
      tags: ["Suspect #4902", "FIR-2026-9901"],
      time: "15m ago",
      isUnread: true,
      targetRoute: "/network"
    },
    {
      id: "notif-3",
      severity: "high",
      icon: <ShieldAlert size={16} className="text-red-400" />,
      title: "Critical FIR Incident Escalation",
      description: "FIR-2026-9901 registered at Whitefield PS assigned to Insp. V. Raju.",
      tags: ["FIR-2026-9901", "Whitefield PS"],
      time: "42m ago",
      isUnread: true,
      targetRoute: "/firs"
    },
    {
      id: "notif-4",
      severity: "blue",
      icon: <Activity size={16} className="text-sky-400" />,
      title: "Statewide Threat Scan Complete",
      description: "AI Copilot spatiotemporal analysis completed across 31 police districts.",
      tags: ["AI Copilot", "KSP Hub"],
      time: "2h ago",
      isUnread: false,
      targetRoute: "/ai-query"
    }
  ]);

  const unreadCount = notifications.filter((n) => n.isUnread).length;
  const highAlertCount = notifications.filter((n) => n.severity === "high").length;

  const filteredNotifications = notifications.filter((item) => {
    if (filterTab === "high") return item.severity === "high";
    return true;
  });

  const handleMarkAllRead = () => {
    setNotifications((prev) => prev.map((n) => ({ ...n, isUnread: false })));
  };

  const handleCardClick = (item) => {
    // Mark as read
    setNotifications((prev) =>
      prev.map((n) => (n.id === item.id ? { ...n, isUnread: false } : n))
    );
    if (onClose) onClose();
    if (item.targetRoute) {
      navigate(item.targetRoute);
    }
  };

  return (
    <div className="notifications-popover glass-panel">
      {/* 1. STICKY HEADER */}
      <div className="notif-header">
        <div className="notif-header-top">
          <div className="notif-title-group">
            <h4 className="notif-heading">Notifications</h4>
            {unreadCount > 0 && (
              <span className="notif-unread-badge font-mono">{unreadCount} New</span>
            )}
          </div>
          <div className="notif-header-actions">
            <button
              type="button"
              className="notif-mark-read-btn"
              onClick={handleMarkAllRead}
            >
              Mark all as read
            </button>
            <button type="button" className="notif-close-btn" onClick={onClose}>
              <X size={14} />
            </button>
          </div>
        </div>

        {/* Filter Segment Controls */}
        <div className="notif-filter-tabs font-mono">
          <button
            type="button"
            className={`notif-tab ${filterTab === "all" ? "active" : ""}`}
            onClick={() => setFilterTab("all")}
          >
            All ({notifications.length})
          </button>
          <button
            type="button"
            className={`notif-tab ${filterTab === "high" ? "active" : ""}`}
            onClick={() => setFilterTab("high")}
          >
            High Alert <ShieldAlert size={12} className="inline ml-0.5 text-red-400" /> ({highAlertCount})
          </button>
        </div>
      </div>

      {/* 2. INNER SCROLLABLE LIST */}
      <div className="notif-body-list">
        {filteredNotifications.length === 0 ? (
          <div className="notif-empty-state font-mono">
            <span>No notifications in this filter.</span>
          </div>
        ) : (
          filteredNotifications.map((item) => (
            <div
              key={item.id}
              className={`notif-card severity-${item.severity} ${item.isUnread ? "unread" : "read"}`}
              onClick={() => handleCardClick(item)}
            >
              <div className="notif-card-main">
                {/* Left Severity Icon */}
                <div className="notif-icon-box">{item.icon}</div>

                {/* Main Body */}
                <div className="notif-card-content">
                  <div className="notif-card-header">
                    <span className="notif-card-title">{item.title}</span>
                    <div className="notif-card-meta">
                      <span className="notif-timestamp font-mono">{item.time}</span>
                      {item.isUnread && <span className="notif-glowing-dot"></span>}
                    </div>
                  </div>

                  <p className="notif-card-desc">{item.description}</p>

                  {/* Clickable Entity Badges */}
                  <div className="notif-card-tags">
                    {item.tags.map((tag, idx) => (
                      <span key={idx} className="notif-entity-tag font-mono">
                        {tag}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
            </div>
          ))
        )}
      </div>

      {/* 3. STICKY FOOTER */}
      <div className="notif-footer">
        <button
          type="button"
          className="notif-view-all-btn font-mono"
          onClick={() => {
            if (onClose) onClose();
            navigate("/analytics");
          }}
        >
          <span>View All Activity Logs</span>
          <ArrowRight size={13} />
        </button>
      </div>
    </div>
  );
}
