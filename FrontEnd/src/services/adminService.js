const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getUsers() {
  await delay();
  return {
    users: [
      { id: 'USR-001', name: 'Inspector Ramachandra Rao', role: 'investigator', status: 'active' },
      { id: 'USR-002', name: 'Analyst Menon', role: 'analyst', status: 'active' },
      { id: 'USR-003', name: 'Admin Kumar', role: 'admin', status: 'active' },
    ],
  };
}

export async function getRoles() {
  await delay();
  return {
    roles: [
      { id: 'ROLE-001', name: 'admin', permissions: ['users:write', 'roles:write', 'audit:read'] },
      { id: 'ROLE-002', name: 'analyst', permissions: ['analytics:read', 'reports:export'] },
      { id: 'ROLE-003', name: 'investigator', permissions: ['firs:write', 'analytics:read'] },
    ],
  };
}

export async function getAuditLogs() {
  await delay();
  return {
    logs: [
      { id: 'AUD-001', action: 'USER_LOGIN', actor: 'Analyst Menon', timestamp: '2026-07-20T10:15:00Z' },
      { id: 'AUD-002', action: 'REPORT_EXPORT', actor: 'Admin Kumar', timestamp: '2026-07-20T09:42:00Z' },
      { id: 'AUD-003', action: 'ROLE_UPDATED', actor: 'Admin Kumar', timestamp: '2026-07-19T18:30:00Z' },
    ],
  };
}

export async function getSystemConfig() {
  await delay();
  return {
    appName: 'Lumina',
    environment: 'development',
    features: {
      analytics: true,
      aiInsights: true,
      reportExport: true,
    },
    maintenanceMode: false,
  };
}

export const adminService = {
  getUsers,
  getRoles,
  getAuditLogs,
  getSystemConfig
};
