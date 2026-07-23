import React from "react";
import DashboardHeader from "./DashBoardHeader";
import KPIGrid from "./KPIGrid";
import CrimeTrend from "./CrimeTrend";
import DistrictHeatMap from "./DistrictHeatMap";
import AlertsPanel from "./AlertsPanel";
import ActivityFeed from "./ActivityFeed";
import RecentCases from "./RecentCases";
import "../../styles/global.css";
import "../../styles/dashboard.css";

import HotspotExplorerMap from "../../components/maps/HotspotExplorerMap";

export default function Dashboard() {
  return (
    <div>
      <DashboardHeader />
      <KPIGrid />

      {/* ST-DBSCAN Hotspot Explorer Module */}
      <div style={{ marginBottom: "20px" }}>
        <HotspotExplorerMap />
      </div>

      {/* Row 1: Crime Trend (2/3) + Alerts Panel (1/3) */}
      <div style={{ display: "grid", gridTemplateColumns: "2fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <CrimeTrend />
        <AlertsPanel />
      </div>

      {/* Row 2: District Heatmap (1/2) + Activity Feed (1/2) */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "20px", marginBottom: "20px" }}>
        <DistrictHeatMap />
        <ActivityFeed />
      </div>

      {/* Row 3: Full-width Recent Cases */}
      <RecentCases />
    </div>
  );
}