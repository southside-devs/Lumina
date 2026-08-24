import apiClient from "../api/client";
export async function listFIRs({ limit = 50, offset = 0, status, crime_group, station_id } = {}) {
  const params = { limit, offset };
  if (status) params.status = status;
  if (crime_group) params.crime_group = crime_group;
  if (station_id) params.station_id = station_id;
  const res = await apiClient.get("/api/firs", { params });
  const payload = res.data ?? res;
  return Array.isArray(payload) ? { rows: payload, total: payload.length } : payload;
}
export async function searchFIRs(filters = {}) {
  const res = await apiClient.get("/api/firs/search", { params: filters });
  const payload = res.data ?? res;
  return Array.isArray(payload) ? { rows: payload, total: payload.length } : payload;
}
export async function getFIR(id) { const res = await apiClient.get(`/api/firs/${id}`); return res.data ?? res; }
export async function createFIR(data) { const res = await apiClient.post("/api/firs", data); return res.data ?? res; }
export async function updateFIR(id, data) { const res = await apiClient.put(`/api/firs/${id}`, data); return res.data ?? res; }
