import { create } from "zustand";
import {
    getDashboardData,
    refreshDashboard
} from "../services/dashboard";

const useDashboardStore = create((set) => ({

    loading: false,

    error: null,

    kpis: [],

    crimeTrend: [],

    districts: [],

    alerts: [],

    activities: [],

    recentCases: [],

    loadDashboard: async () => {

        set({
            loading: true,
            error: null
        });

        try {

            const data = await getDashboardData();

            set({

                loading: false,

                kpis: data.kpis,

                crimeTrend: data.crimeTrend,

                districts: data.districts,

                alerts: data.alerts,

                activities: data.activities,

                recentCases: data.recentCases

            });

        }

        catch (error) {

            set({

                loading: false,

                error: error.message

            });

        }

    },

    refresh: async () => {

        set({

            loading: true

        });

        try {

            const data = await refreshDashboard();

            set({

                loading: false,

                kpis: data.kpis,

                crimeTrend: data.crimeTrend,

                districts: data.districts,

                alerts: data.alerts,

                activities: data.activities,

                recentCases: data.recentCases

            });

        }

        catch (error) {

            set({

                loading: false,

                error: error.message

            });

        }

    }

}));

export default useDashboardStore;