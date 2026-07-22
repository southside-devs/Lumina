import React from "react";
import Sidebar from "./Sidebar";
import Workspace from "./Workspace";

export default function AppShell() {
  return (
    <div className="app-shell">
      <Sidebar />
      <div className="app-main">
        <Workspace />
      </div>
    </div>
  );
}