import { useEffect } from "react";
import dashboardStore from "../store/dashboardStore";

export default function useDashboard() {

    const {

        loading,

        error,

        kpis,

        crimeTrend,

        districts,

        alerts,

        activities,

        recentCases,

        loadDashboard,

        refresh

    } = dashboardStore();

    useEffect(() => {

        loadDashboard();

    }, []);

    return {

        loading,

        error,

        kpis,

        crimeTrend,

        districts,

        alerts,

        activities,

        recentCases,

        refresh

    };

}