// Lumina - Team Member 3: Analytics & Intelligence Data Service
// API: GET /analytics

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms));

// Master list of Karnataka Districts
export const KARNATAKA_DISTRICTS = [
  { id: 1, name: 'Bengaluru Urban', code: 'BLR-U', population: 12500000, lat: 12.9716, lng: 77.5946 },
  { id: 2, name: 'Mysuru', code: 'MYS', population: 3100000, lat: 12.2958, lng: 76.6394 },
  { id: 3, name: 'Belagavi', code: 'BEL', population: 4779000, lat: 15.8497, lng: 74.4977 },
  { id: 4, name: 'Hubballi-Dharwad', code: 'HBL-DHD', population: 1850000, lat: 15.3647, lng: 75.1240 },
  { id: 5, name: 'Mangaluru (Dakshina Kannada)', code: 'DKN', population: 2089000, lat: 12.9141, lng: 74.8560 },
  { id: 6, name: 'Kalaburagi', code: 'KLB', population: 2566000, lat: 17.3297, lng: 76.8343 },
  { id: 7, name: 'Ballari', code: 'BAL', population: 1400000, lat: 15.1394, lng: 76.9214 },
  { id: 8, name: 'Tumakuru', code: 'TUM', population: 2678000, lat: 13.3379, lng: 77.1173 },
  { id: 9, name: 'Shivamogga', code: 'SHM', population: 1752000, lat: 13.9299, lng: 75.5681 },
  { id: 10, name: 'Udupi', code: 'UDP', population: 1177000, lat: 13.3409, lng: 74.7421 },
  { id: 11, name: 'Hassan', code: 'HAS', population: 1776000, lat: 13.0033, lng: 76.1004 },
  { id: 12, name: 'Davangere', code: 'DVG', population: 1945000, lat: 14.4644, lng: 75.9218 },
  { id: 13, name: 'Vijayapura', code: 'VJP', population: 2177000, lat: 16.8302, lng: 75.7100 },
  { id: 14, name: 'Raichur', code: 'RCH', population: 16.2076, lng: 77.3463 },
  { id: 15, name: 'Bidar', code: 'BDR', population: 1703000, lat: 17.5199, lng: 77.5199 }
];

export const CRIME_GROUPS = [
  'Theft',
  'Assault',
  'Cybercrime',
  'Robbery',
  'Burglary',
  'Narcotics (NDPS Act)',
  'Financial Fraud',
  'Kidnapping & Abduction',
  'Motor Vehicle Theft',
  'Arms Act Violations'
];

// Primary Member 3 Endpoint GET /analytics
export async function getAnalytics(_filters = {}) {
  await delay();
  return {
    totalCrimes: 14250,
    clearanceRate: 0.67,
    repeatOffenders: 980,
    trend: [
      { month: 'Jan', count: 980, solved: 660 },
      { month: 'Feb', count: 1020, solved: 690 },
      { month: 'Mar', count: 1105, solved: 750 },
      { month: 'Apr', count: 1140, solved: 770 },
      { month: 'May', count: 1210, solved: 810 },
      { month: 'Jun', count: 1280, solved: 860 }
    ],
    topDistricts: [
      { name: 'Bengaluru Urban', count: 3420, rate: 82.5 },
      { name: 'Mysuru', count: 1890, rate: 61.0 },
      { name: 'Belagavi', count: 1640, rate: 52.8 },
      { name: 'Hubballi-Dharwad', count: 1410, rate: 76.2 }
    ]
  };
}

// KPI Overview API mock (/api/dashboard/overview)
export async function getOverviewStats(filters = {}) {
  await delay();

  let multiplier = 1.0;
  if (filters.districtId) multiplier *= 0.18;
  if (filters.timeframe === '7d') multiplier *= 0.08;
  if (filters.timeframe === '30d') multiplier *= 0.28;
  if (filters.timeframe === '90d') multiplier *= 0.65;

  const totalFirs = Math.round(14250 * multiplier);
  const solvedFirs = Math.round(9540 * multiplier);
  const clearanceRate = Number((solvedFirs / totalFirs).toFixed(2));

  return {
    total_firs: totalFirs,
    total_accused: Math.round(6840 * multiplier),
    total_victims: Math.round(11200 * multiplier),
    total_stations: filters.districtId ? 18 : 240,
    total_districts: filters.districtId ? 1 : 31,
    repeat_offenders: Math.round(980 * multiplier),
    clearance_rate: clearanceRate,
    monthly_change_pct: +4.8,
    status_breakdown: {
      'Under Investigation': Math.round(totalFirs * 0.38),
      'Chargesheeted': Math.round(totalFirs * 0.42),
      'Closed': Math.round(totalFirs * 0.12),
      'Convicted': Math.round(totalFirs * 0.06),
      'Acquitted': Math.round(totalFirs * 0.02)
    }
  };
}

// Monthly & Category Crime Trends API mock (/api/dashboard/crime-trends)
export async function getCrimeTrends(filters = {}) {
  await delay();
  return {
    monthly: [
      { month: 'Jan', count: 980 },
      { month: 'Feb', count: 1020 },
      { month: 'Mar', count: 1105 },
    ],
    topDistricts: [
      { name: 'Bengaluru Urban', count: 3420 },
      { name: 'Mysuru', count: 1890 },
    ],
  };
}

export async function getIntelligence() {
  await delay();
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
  };
}

export const analyticsService = {
  getAnalytics,
  getOverviewStats,
  getCrimeTrends,
  getIntelligence
};
