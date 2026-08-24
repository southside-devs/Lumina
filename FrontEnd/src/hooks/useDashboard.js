import { useEffect } from "react";
import dashboardStore from "../store/dashboardStore";
export default function useDashboard() {
  const store = dashboardStore();
  useEffect(() => { store.loadDashboard(); }, []);
  return store;
}
