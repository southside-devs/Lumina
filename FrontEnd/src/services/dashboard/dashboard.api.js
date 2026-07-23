/**
 * Lumina — Dashboard Service (legacy compatibility shim)
 * The dashboardStore.js imports getDashboardData/refreshDashboard from here.
 * We now proxy to the live Catalyst API instead of localhost mock.
 */
import { fetchOverview, fetchCrimeTrends, fetchDistrictSummary, fetchRecentFIRs } from "../../api/dashboard";

async function buildDashboardData() {
  const [overview, trends, districts, recentFIRs] = await Promise.all([
    fetchOverview(),
    fetchCrimeTrends(),
    fetchDistrictSummary(),
    fetchRecentFIRs(10),
  ]);

  return {
    kpis: overview,
    crimeTrend: Array.isArray(trends) ? trends : [],
    districts: Array.isArray(districts) ? districts : [],
    alerts: [],
    activities: [],
    recentCases: Array.isArray(recentFIRs) ? recentFIRs : [],
  };
}

export async function getDashboardData() {
  return buildDashboardData();
}

export async function refreshDashboard() {
  return buildDashboardData();
}