/**
 * Lumina — Central API Client
 * All requests to the Catalyst backend go through this singleton.
 * Sends the demo API key header so the backend bypasses Catalyst Auth.
 */
import axios from "axios";

const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEMO_KEY = import.meta.env.VITE_DEMO_API_KEY || "lumina-demo-ksp-2026";

const apiClient = axios.create({
  baseURL: BASE_URL,
  timeout: 60000,
  headers: {
    "Content-Type": "application/json",
    "X-Lumina-Demo-Key": DEMO_KEY,
  },
});

// Response interceptor — unwrap Lumina's { status, data } envelope
apiClient.interceptors.response.use(
  (response) => {
    // Catalyst wraps responses in { status: "success", data: ... }
    if (response.data?.status === "success" || response.data?.data !== undefined) {
      return response.data.data !== undefined ? response.data : response;
    }
    return response;
  },
  (error) => {
    const msg =
      error.response?.data?.message ||
      error.response?.data?.error ||
      error.message ||
      "Unknown API error";
    console.error("[Lumina API Error]", msg, error.response?.status);
    return Promise.reject(new Error(msg));
  }
);

export default apiClient;
