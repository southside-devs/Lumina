import React, { useState } from "react";
import Topbar from "./Topbar";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";
import ContextualDrawer from "./ContextualDrawer";

export default function AppShell() {
  const [selectedNode, setSelectedNode] = useState(null);

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
          <ContextualDrawer selectedNode={selectedNode} setSelectedNode={setSelectedNode} />
        </div>
      </div>
    </div>
  );
}