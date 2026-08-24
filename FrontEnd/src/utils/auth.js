import { ROLES } from "../constants";
export function getMockUser() {
  const stored = localStorage.getItem("lumina_user");
  if (stored) { try { return JSON.parse(stored); } catch (e) {} }
  return { name: "Dr. Patil (Analyst)", role: ROLES.ANALYST, district: "Bengaluru", stationId: 1 };
}
export function setMockUser(user) { localStorage.setItem("lumina_user", JSON.stringify(user)); }
export function canWrite(role) { return [ROLES.OFFICER, ROLES.SHO, ROLES.ADMIN].includes(role); }
export function canViewAnalytics(role) { return [ROLES.ANALYST, ROLES.SHO, ROLES.ADMIN].includes(role); }
export function canViewSensitive(role) { return [ROLES.ANALYST, ROLES.SHO, ROLES.ADMIN].includes(role); }
