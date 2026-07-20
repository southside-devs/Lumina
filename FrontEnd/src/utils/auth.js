import { ROLES } from '../constants/index.js'

// Mock auth for dev - in production Catalyst handles this
export function getMockUser() {
  return {
    user_id: 'dev-1',
    email: 'analyst@ksp.gov.in',
    first_name: 'Demo',
    last_name: 'Analyst',
    role: ROLES.SCRB_ANALYST,
  }
}

export function canWrite(role) {
  return [ROLES.OFFICER, ROLES.SHO, ROLES.ADMIN].includes(role)
}

export function canViewAnalytics(role) {
  return [ROLES.SCRB_ANALYST, ROLES.SHO, ROLES.ADMIN].includes(role)
}

export function canViewSensitive(role) {
  return [ROLES.SCRB_ANALYST, ROLES.SHO, ROLES.ADMIN].includes(role)
}
