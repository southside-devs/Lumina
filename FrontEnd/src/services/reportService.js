const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms));

export async function getReports() {
  await delay();
  return {
    reports: [
      { id: 'RPT-001', title: 'Monthly Crime Summary', type: 'analytics', status: 'ready' },
      { id: 'RPT-002', title: 'District Hotspot Brief', type: 'intelligence', status: 'ready' },
      { id: 'RPT-003', title: 'Audit Activity Export', type: 'audit', status: 'pending' },
    ],
  };
}

export async function exportReport(reportId, format = 'pdf') {
  await delay();
  return {
    reportId,
    format,
    downloadUrl: `/api/reports/${reportId}/export?format=${format}`,
    status: 'queued',
  };
}

export async function exportReportsBulk(reportIds, format = 'csv') {
  await delay();
  return {
    reportIds,
    format,
    downloadUrl: `/api/reports/export/bulk?format=${format}`,
    status: 'queued',
  };
}

export const reportService = {
  getReports,
  exportReport,
  exportReportsBulk
};
