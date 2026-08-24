import axios from "axios";
const BASE_URL = import.meta.env.VITE_API_BASE_URL;
const DEMO_KEY = import.meta.env.VITE_DEMO_API_KEY || "lumina-demo-ksp-2026";
const apiClient = axios.create({
  baseURL: BASE_URL, timeout: 15000,
  headers: { "Content-Type": "application/json", "X-Lumina-Demo-Key": DEMO_KEY },
});
apiClient.interceptors.response.use(
  (response) => {
    if (response.data?.status === "success" || response.data?.data !== undefined) {
      return response.data.data !== undefined ? response.data : response;
    }
    return response;
  },
  (error) => {
    const msg = error.response?.data?.message || error.response?.data?.error || error.message || "Unknown API error";
    console.error("[Lumina API Error]", msg, error.response?.status);
    return Promise.reject(new Error(msg));
  }
);
export default apiClient;
