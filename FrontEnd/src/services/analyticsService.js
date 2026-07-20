const delay = (ms = 300) => new Promise((resolve) => setTimeout(resolve, ms))

export async function getAnalytics() {
  await delay()
  return {
    totalCrimes: 12480,
    clearanceRate: 0.67,
    trend: [
      { month: 'Jan', count: 980 },
      { month: 'Feb', count: 1020 },
      { month: 'Mar', count: 1105 },
    ],
    topDistricts: [
      { name: 'Bengaluru Urban', count: 3420 },
      { name: 'Mysuru', count: 1890 },
    ],
  }
}

export async function getIntelligence() {
  await delay()
  return {
    alerts: [
      { id: 'INT-001', severity: 'high', summary: 'Emerging hotspot cluster detected' },
      { id: 'INT-002', severity: 'medium', summary: 'Repeat offender network flagged' },
    ],
    riskScores: [
      { district: 'Bengaluru Urban', score: 82 },
      { district: 'Belagavi', score: 71 },
    ],
    lastUpdated: new Date().toISOString(),
  }
}
