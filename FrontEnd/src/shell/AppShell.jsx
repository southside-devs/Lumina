import React, { useState } from "react";
import { useLocation } from "react-router-dom";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import ContextualDrawer from "./ContextualDrawer";

export default function AppShell() {
  const [selectedNode, setSelectedNode] = useState(null);
  const location = useLocation();

  return (
    <div className="app-shell-container">
      {/* Top Navigation Bar spanning full width */}
      <Topbar />

      {/* Main Layout Body below Top Bar */}
      <div className="app-body">
        {/* Left Collapsible Sidebar */}
        <Sidebar />

        {/* Right Content Area containing Main Canvas View & Contextual Control Panel */}
        <div className="main-content-wrapper">
          {/* Upper Section: MAIN CANVAS VIEW (Map / Graph / Charts / AI) */}
          <div className="main-canvas-view">
            <Workspace setSelectedNode={setSelectedNode} />
          </div>

          {/* Bottom Section: Contextual Control Panel / Drawer */}
          {/* Only render ContextualDrawer on relevant screens containing a Map or Network Graph */}
          {location.pathname.includes("/dashboard") || location.pathname.includes("/network") ? (
            <ContextualDrawer selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
          ) : null}
        </div>
      </div>
    </div>
  );
}