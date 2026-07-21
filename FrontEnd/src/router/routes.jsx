import React from "react";
import Dashboard from "../modules/dashboard/Dashboard";

// Placeholders for future modules as specified in Phase 11 & Phase 5
const FIRPlaceholder = () => (
  <div style={{ padding: "20px", color: "var(--text-primary)" }}>
    <h2>FIR Management</h2>
    <p style={{ color: "var(--text-secondary)" }}>FIR listing, details and investigation flow are loading...</p>
  </div>
);

const AnalyticsPlaceholder = () => (
  <div style={{ padding: "20px", color: "var(--text-primary)" }}>
    <h2>Analytics & Intelligence</h2>
    <p style={{ color: "var(--text-secondary)" }}>Crime trend analytics and predictive hotspot scoring...</p>
  </div>
);

const GraphPlaceholder = () => (
  <div style={{ padding: "20px", color: "var(--text-primary)" }}>
    <h2>Criminal Network Graph</h2>
    <p style={{ color: "var(--text-secondary)" }}>Suspect connection visualization via Cytoscape.js...</p>
  </div>
);

const AIPlaceholder = () => (
  <div style={{ padding: "20px", color: "var(--text-primary)" }}>
    <h2>AI Assistant</h2>
    <p style={{ color: "var(--text-secondary)" }}>Natural language QuickML query assistant...</p>
  </div>
);

const SettingsPlaceholder = () => (
  <div style={{ padding: "20px", color: "var(--text-primary)" }}>
    <h2>System Settings</h2>
    <p style={{ color: "var(--text-secondary)" }}>User roles and configuration preferences...</p>
  </div>
);

export const routes = [
  {
    path: "/dashboard",
    element: <Dashboard />,
    label: "Dashboard"
  },
  {
    path: "/firs",
    element: <FIRPlaceholder />,
    label: "FIR"
  },
  {
    path: "/analytics",
    element: <AnalyticsPlaceholder />,
    label: "Analytics"
  },
  {
    path: "/network",
    element: <GraphPlaceholder />,
    label: "Crime Graph"
  },
  {
    path: "/ai-query",
    element: <AIPlaceholder />,
    label: "AI Assistant"
  },
  {
    path: "/settings",
    element: <SettingsPlaceholder />,
    label: "Settings"
  }
];
