// Lumina - Team Member 3: Analytics & Intelligence Data Service
// API: GET /analytics

const delay = (ms = 250) => new Promise((resolve) => setTimeout(resolve, ms))

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
  { id: 14, name: 'Raichur', code: 'RCH', population: 1928000, lat: 16.2076, lng: 77.3463 },
  { id: 15, name: 'Bidar', code: 'BDR', population: 1703000, lat: 17.5199, lng: 77.5199 }
]

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
]

// Primary Member 3 Endpoint GET /analytics
export async function getAnalytics(_filters = {}) {
  await delay()
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
  }
}

// KPI Overview API mock (/api/dashboard/overview)
export async function getOverviewStats(filters = {}) {
  await delay()

  let multiplier = 1.0
  if (filters.districtId) multiplier *= 0.18
  if (filters.timeframe === '7d') multiplier *= 0.08
  if (filters.timeframe === '30d') multiplier *= 0.28
  if (filters.timeframe === '90d') multiplier *= 0.65

  const totalFirs = Math.round(14250 * multiplier)
  const solvedFirs = Math.round(9540 * multiplier)
  const clearanceRate = Number((solvedFirs / totalFirs).toFixed(2))

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
  }
}

// Monthly & Category Crime Trends API mock (/api/dashboard/crime-trends)
export async function getCrimeTrends(filters = {}) {
  await delay()

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec']
  const trendData = months.map((m, idx) => {
    const base = 950 + Math.sin(idx * 0.5) * 200 + idx * 25
    return {
      month: m,
      total: Math.round(base),
      cybercrime: Math.round(base * 0.24),
      theft: Math.round(base * 0.30),
      violent: Math.round(base * 0.18),
      narcotics: Math.round(base * 0.14),
      financial: Math.round(base * 0.14),
      solved: Math.round(base * 0.68)
    }
  })

  const categoryBreakdown = [
    { group: 'Theft', count: 4280, color: '#38bdf8', change: '+3.2%' },
    { group: 'Cybercrime', count: 3410, color: '#818cf8', change: '+14.8%' },
    { group: 'Assault', count: 2150, color: '#f87171', change: '-1.5%' },
    { group: 'Robbery & Burglary', count: 1890, color: '#fbbf24', change: '+2.1%' },
    { group: 'Narcotics (NDPS)', count: 1420, color: '#34d399', change: '+8.4%' },
    { group: 'Financial Fraud', count: 1100, color: '#c084fc', change: '+6.9%' }
  ]

  return {
    monthly: trendData,
    categories: categoryBreakdown
  }
}

// District Crime Summary API mock (/api/dashboard/district-summary)
export async function getDistrictSummary() {
  await delay()

  return KARNATAKA_DISTRICTS.map((d) => {
    const totalFirs = Math.round((d.population / 100000) * (45 + (d.id % 5) * 8))
    const crimeRatePer100k = Number(((totalFirs / d.population) * 100000).toFixed(1))
    const riskLevel = crimeRatePer100k > 70 ? 'Critical' : crimeRatePer100k > 55 ? 'High' : crimeRatePer100k > 40 ? 'Medium' : 'Low'

    return {
      district_id: d.id,
      district_name: d.name,
      code: d.code,
      population: d.population,
      total_firs: totalFirs,
      crime_rate_per_100k: crimeRatePer100k,
      risk_level: riskLevel,
      clearance_rate: Math.round(60 + (d.id * 3) % 25),
      active_hotspots: Math.max(1, Math.round(totalFirs / 250))
    }
  }).sort((a, b) => b.total_firs - a.total_firs)
}

// Predictive Risk Score Board API mock (/api/risk-scores) - Zia AutoML
export async function getRiskScores() {
  await delay()

  const riskMatrix = KARNATAKA_DISTRICTS.slice(0, 8).map((dist) => {
    const scores = {}
    CRIME_GROUPS.slice(0, 6).forEach((crime, cIdx) => {
      const baseScore = Math.min(98, Math.max(20, Math.round(40 + (dist.id * 7 + cIdx * 11) % 55)))
      scores[crime] = {
        score: baseScore,
        trend: baseScore > 75 ? 'up' : baseScore < 45 ? 'down' : 'stable',
        forecastDate: '2026-08-01'
      }
    })
    return {
      districtId: dist.id,
      districtName: dist.name,
      code: dist.code,
      scores
    }
  })

  return {
    forecastDate: '2026-08-01',
    modelConfidence: '94.2%',
    matrix: riskMatrix,
    topRiskDistricts: [
      { district: 'Bengaluru Urban', crimeType: 'Cybercrime', score: 92, status: 'Critical Risk' },
      { district: 'Belagavi', crimeType: 'Narcotics (NDPS Act)', score: 84, status: 'High Risk' },
      { district: 'Hubballi-Dharwad', crimeType: 'Robbery', score: 79, status: 'High Risk' },
      { district: 'Mangaluru', crimeType: 'Financial Fraud', score: 76, status: 'High Risk' }
    ]
  }
}

// Spatiotemporal Hourly & Weekly Pattern Analysis
export async function getSpatiotemporalPatterns() {
  await delay()

  const days = ['Mon', 'Tue', 'Wed', 'Thu', 'Fri', 'Sat', 'Sun']
  const hours = [0, 3, 6, 9, 12, 15, 18, 21]

  const matrix = days.map((day, dIdx) => {
    return {
      day,
      hourly: hours.map((hr) => {
        let weight = (hr >= 21 || hr <= 3) ? 1.8 : 0.8
        if (dIdx >= 4) weight *= 1.4
        const intensity = Math.min(100, Math.round((dIdx * 6 + hr * 3.5 + 15) * weight))
        return { hour: `${hr}:00`, intensity }
      })
    }
  })

  const insights = [
    {
      id: 'AI-PAT-01',
      title: 'Night-Time Cyber & Burglary Cluster',
      location: 'Bengaluru Urban (Whitefield & Indiranagar Sector)',
      timeWindow: '22:00 - 03:00 (Fri - Sun)',
      severity: 'Critical',
      description: 'Zia Pattern Detection identified a 38% spike in ATM tampering and commercial break-ins. Recommending intensified mobile patrol beat #4.',
      actionableAdvice: 'Deploy 2 additional patrolling vehicles along Outer Ring Road corridor between 22:00 and 03:00.'
    },
    {
      id: 'AI-PAT-02',
      title: 'NDPS Interception Anomaly',
      location: 'Belagavi Border Checkpoints',
      timeWindow: '18:00 - 22:00 (Wed - Thu)',
      severity: 'High',
      description: 'Cross-border transport of illegal narcotics detected through recurring FIR nexus matching repeat offender profiles.',
      actionableAdvice: 'Coordinate targeted ANPR check at Nipani Highway gate.'
    },
    {
      id: 'AI-PAT-03',
      title: 'Weekend Assault Spikes in Industrial Hubs',
      location: 'Hubballi-Dharwad (Gokul Road Precinct)',
      timeWindow: '19:00 - 01:00 (Sat)',
      severity: 'Medium',
      description: 'Alcohol-related public brawls and group assaults peaking during Saturday late evening hours.',
      actionableAdvice: 'Increase stationary foot patrols near commercial dining hubs.'
    }
  ]

  return { matrix, insights }
}
