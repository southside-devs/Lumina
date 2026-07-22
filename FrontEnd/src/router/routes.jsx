import React from "react";
import Dashboard from "../modules/dashboard/Dashboard";
import AnalyticsModule from "../modules/analytics";

// Placeholders for other member modules
const FIRPlaceholder = () => (
  <div style={{ padding: "24px", color: "var(--text-primary)" }}>
    <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>FIR Management</h2>
    <p style={{ color: "var(--text-secondary)" }}>FIR listing, case lifecycle tracking, and investigation flow (Member 2 Module)...</p>
  </div>
);

const GraphPlaceholder = () => (
  <div style={{ padding: "24px", color: "var(--text-primary)" }}>
    <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>Criminal Network Graph</h2>
    <p style={{ color: "var(--text-secondary)" }}>Suspect connection visualization via Cytoscape.js & ReactFlow...</p>
  </div>
);

const AIPlaceholder = () => (
  <div style={{ padding: "24px", color: "var(--text-primary)" }}>
    <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>AI QuickML Assistant</h2>
    <p style={{ color: "var(--text-secondary)" }}>Natural language intelligence query engine & pattern search...</p>
  </div>
);

const SettingsPlaceholder = () => (
  <div style={{ padding: "24px", color: "var(--text-primary)" }}>
    <h2 style={{ fontSize: "24px", fontWeight: "700", marginBottom: "8px" }}>System Settings</h2>
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
    path: "/analytics",
    element: <AnalyticsModule />,
    label: "Analytics & Intelligence"
  },
  {
    path: "/firs",
    element: <FIRPlaceholder />,
    label: "FIR Management"
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
