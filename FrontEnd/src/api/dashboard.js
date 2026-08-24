import apiClient from "../api/client";

const FALLBACK = {
  overview: {
    total_firs: 5000, total_accused: 3000, total_victims: 6254,
    total_stations: 209, total_districts: 31, repeat_offenders: 420,
    status_breakdown: { "Under Investigation": 1900, Chargesheeted: 2100, Closed: 600, Convicted: 300, Acquitted: 100 },
  },
  trends: [
    { group: "Theft", count: 980 },{ group: "Cybercrime", count: 760 },
    { group: "Assault", count: 620 },{ group: "Narcotics (NDPS Act)", count: 540 },
    { group: "Cheating & Fraud", count: 430 },{ group: "Motor Vehicle Theft", count: 380 },
    { group: "Robbery", count: 290 },
  ],
  districtSummary: [
    { district_id: 1, district_name: "Bengaluru Urban", population: 12500000, total_firs: 3420 },
    { district_id: 2, district_name: "Mysuru City", population: 3100000, total_firs: 1840 },
    { district_id: 3, district_name: "Mangaluru (Dakshina Kannada)", population: 2100000, total_firs: 1420 },
    { district_id: 4, district_name: "Hubballi-Dharwad", population: 1850000, total_firs: 1180 },
    { district_id: 5, district_name: "Belagavi", population: 4800000, total_firs: 950 },
    { district_id: 6, district_name: "Kalaburagi", population: 2600000, total_firs: 820 },
    { district_id: 7, district_name: "Tumakuru", population: 2700000, total_firs: 640 },
    { district_id: 8, district_name: "Shivamogga", population: 1750000, total_firs: 510 },
  ],
};

export async function fetchOverview() {
  try { const res = await apiClient.get("/api/dashboard/overview"); return res.data ?? res; }
  catch (e) { console.warn("fetchOverview fallback:", e.message); return FALLBACK.overview; }
}
export async function fetchCrimeTrends(params = {}) {
  try { const res = await apiClient.get("/api/dashboard/crime-trends", { params }); return res.data ?? res; }
  catch (e) { console.warn("fetchCrimeTrends fallback:", e.message); return FALLBACK.trends; }
}
export async function fetchDistrictSummary() {
  try {
    const res = await apiClient.get("/api/dashboard/district-summary");
    const data = res.data ?? res;
    return Array.isArray(data) && data.length > 0 ? data : FALLBACK.districtSummary;
  } catch (e) { console.warn("fetchDistrictSummary fallback:", e.message); return FALLBACK.districtSummary; }
}
export async function fetchRecentFIRs(limit = 10) {
  try {
    const res = await apiClient.get("/api/firs", { params: { limit, offset: 0 } });
    const payload = res.data ?? res;
    return Array.isArray(payload) ? payload : payload.rows ?? [];
  } catch (e) { console.warn("fetchRecentFIRs fallback:", e.message); return []; }
}
export async function fetchRiskScores(params = {}) {
  try {
    const res = await apiClient.get("/api/risk-scores", { params });
    const payload = res.data ?? res;
    return Array.isArray(payload) ? payload : payload.rows ?? [];
  } catch (e) { console.warn("fetchRiskScores fallback:", e.message); return []; }
}
