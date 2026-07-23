/**
 * Lumina — FIR API Service
 * CRUD operations for /api/firs endpoints.
 */
import apiClient from "../api/client";

// ── GET /api/firs ────────────────────────────────────────────────────────
export async function listFIRs({ limit = 50, offset = 0, status, crime_group, station_id } = {}) {
  const params = { limit, offset };
  if (status) params.status = status;
  if (crime_group) params.crime_group = crime_group;
  if (station_id) params.station_id = station_id;

  const res = await apiClient.get("/api/firs", { params });
  const payload = res.data ?? res;
  if (Array.isArray(payload)) return { rows: payload, total: payload.length };
  return payload; // { rows, total, limit, offset }
}

// ── GET /api/firs/search ─────────────────────────────────────────────────
export async function searchFIRs(filters = {}) {
  const res = await apiClient.get("/api/firs/search", { params: filters });
  const payload = res.data ?? res;
  if (Array.isArray(payload)) return { rows: payload, total: payload.length };
  return payload;
}

// ── GET /api/firs/:id ────────────────────────────────────────────────────
export async function getFIR(id) {
  const res = await apiClient.get(`/api/firs/${id}`);
  return res.data ?? res;
}

// ── POST /api/firs ───────────────────────────────────────────────────────
export async function createFIR(data) {
  const res = await apiClient.post("/api/firs", data);
  return res.data ?? res;
}

// ── PUT /api/firs/:id ────────────────────────────────────────────────────
export async function updateFIR(id, data) {
  const res = await apiClient.put(`/api/firs/${id}`, data);
  return res.data ?? res;
}
