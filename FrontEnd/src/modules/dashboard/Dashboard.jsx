import DashboardHeader from "./DashBoardHeader";
import KPIGrid from "./KPIGrid";

import CrimeTrend from "./CrimeTrend";
import DistrictHeatMap from "./DistrictHeatMap";
import AlertsPanel from "./AlertsPanel";
import ActivityFeed from "./ActivityFeed";
import RecentCases from "./RecentCases";

import "../../styles/dashboard.css";

export default function Dashboard() {

    return (

        <div className="dashboard-page">

            <DashboardHeader />

            <KPIGrid />

            <div className="dashboard-grid">

                <CrimeTrend />

                <AlertsPanel />

                <DistrictHeatMap />

                <ActivityFeed />

            </div>

            <RecentCases />

        </div>

    );

}