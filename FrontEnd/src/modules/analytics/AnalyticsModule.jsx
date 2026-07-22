import React, { useState, useEffect } from 'react'
import {
  ShieldAlert,
  Calendar,
  MapPin,
  RefreshCw,
  Download,
  TrendingUp,
  FileText,
  CheckCircle2,
  AlertTriangle,
  Users,
  Cpu,
  BarChart3,
  PieChart as PieIcon,
  ArrowUpRight,
  ArrowDownRight,
  Zap
} from 'lucide-react'
import {
  KARNATAKA_DISTRICTS,
  CRIME_GROUPS,
  getOverviewStats,
  getCrimeTrends,
  getRiskScores,
  getDistrictSummary
} from '../../services/analyticsService'
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  Cell
} from 'recharts'

// Custom dark mode tooltip for Stitch design system
const CustomChartTooltip = ({ active, payload, label }) => {
  if (active && payload && payload.length) {
    return (
      <div className="chart-custom-tooltip">
        <p className="tooltip-title">{label}</p>
        <div className="tooltip-items">
          {payload.map((entry, index) => (
            <div key={`item-${index}`} className="tooltip-item">
              <span className="tooltip-dot" style={{ backgroundColor: entry.color || entry.fill }}></span>
              <span className="tooltip-name">{entry.name}:</span>
              <span className="tooltip-val">{entry.value.toLocaleString()}</span>
            </div>
          ))}
        </div>
      </div>
    )
  }
  return null
}

export default function AnalyticsModule() {
  const [timeframe, setTimeframe] = useState('30d')
  const [district, setDistrict] = useState('')
  const [crimeGroup, setCrimeGroup] = useState('')
  const [activeTab, setActiveTab] = useState('overview')

  const [loading, setLoading] = useState(true)
  const [isRefreshing, setIsRefreshing] = useState(false)
  const [notification, setNotification] = useState(null)

  const [summaryData, setSummaryData] = useState(null)
  const [trendData, setTrendData] = useState([])
  const [categoryData, setCategoryData] = useState([])
  const [riskData, setRiskData] = useState(null)
  const [districtData, setDistrictData] = useState([])

  const showToast = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  const loadData = async () => {
    setLoading(true)
    try {
      const filters = { timeframe, districtId: district, crimeGroup }
      const [sum, trRes, rsk, dist] = await Promise.all([
        getOverviewStats(filters),
        getCrimeTrends(filters),
        getRiskScores(),
        getDistrictSummary()
      ])
      setSummaryData(sum)
      setTrendData(trRes.monthly || [])
      setCategoryData(trRes.categories || [])
      setRiskData(rsk)
      setDistrictData(dist)
    } catch (err) {
      console.error('Failed to load analytics data:', err)
      showToast('Error loading analytics stream')
    } finally {
      setLoading(false)
      setIsRefreshing(false)
    }
  }

  useEffect(() => {
    loadData()
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [timeframe, district, crimeGroup])

  const handleRefresh = () => {
    setIsRefreshing(true)
    loadData()
    showToast('Analytics & Intelligence data synchronized with SCRB Karnataka')
  }

  const handleExportReport = () => {
    showToast('Generating Executive Intelligence PDF Report...')
  }

  const clearancePct = summaryData ? (summaryData.clearance_rate * 100).toFixed(0) : '74'
  const activeCrimeColumns = CRIME_GROUPS.slice(0, 6)

  return (
    <div className="crime-analytics-page">
      {/* Toast Notification */}
      {notification && (
        <div className="toast-banner success">
          <Zap size={16} />
          <span>{notification}</span>
        </div>
      )}

      {/* Page Header */}
      <div className="analytics-header">
        <div>
          <div className="badge-police-hub font-mono">
            <span className="live-pulse"></span> KSP SCRB INTELLIGENCE HUB v3.4
          </div>
          <h1 className="page-title">Statewide Crime Analytics & Predictive Intelligence</h1>
          <p className="page-subtitle">
            Real-time IPC telemetry, Zia AutoML predictive risk modeling & case disposition analytics across Karnataka.
          </p>
        </div>

        {/* Action Controls */}
        <div className="filter-group-right">
          <button
            type="button"
            className="btn-secondary"
            onClick={handleRefresh}
            disabled={isRefreshing}
          >
            <RefreshCw size={14} className={isRefreshing ? 'spin' : ''} />
            <span>{isRefreshing ? 'Syncing...' : 'Sync Live Telemetry'}</span>
          </button>
          <button
            type="button"
            className="btn-primary"
            onClick={handleExportReport}
          >
            <Download size={14} />
            <span>Export Briefing PDF</span>
          </button>
        </div>
      </div>

      {/* Navigation Sub-Tabs */}
      <div className="analytics-view-tabs">
        {[
          { id: 'overview', label: 'Command Overview' },
          { id: 'trends', label: 'Crime Trends' },
          { id: 'risk', label: 'Zia Risk Scoreboard' },
          { id: 'spatial', label: 'Spatiotemporal Hotspots' }
        ].map((tab) => (
          <button
            key={tab.id}
            type="button"
            className={`tab-btn ${activeTab === tab.id ? 'active' : ''}`}
            onClick={() => setActiveTab(tab.id)}
          >
            {tab.label}
          </button>
        ))}
      </div>

      {/* Filter Control Panel */}
      <div className="analytics-filter-bar glass-panel">
        <div className="filter-group-left">
          <div className="filter-item">
            <label className="filter-label">
              <Calendar size={13} /> Time Horizon
            </label>
            <div className="segmented-control">
              {[
                { id: '7d', label: '7D' },
                { id: '30d', label: '30D' },
                { id: '90d', label: '90D' },
                { id: '1y', label: '1Y' }
              ].map((tf) => (
                <button
                  key={tf.id}
                  type="button"
                  className={`segmented-btn ${timeframe === tf.id ? 'active' : ''}`}
                  onClick={() => setTimeframe(tf.id)}
                >
                  {tf.label}
                </button>
              ))}
            </div>
          </div>

          <div className="filter-item">
            <label className="filter-label">
              <MapPin size={13} /> District / Jurisdiction
            </label>
            <select
              className="filter-select"
              value={district}
              onChange={(e) => setDistrict(e.target.value)}
            >
              <option value="">All Karnataka Districts (31)</option>
              {KARNATAKA_DISTRICTS.map((d) => (
                <option key={d.id} value={d.id}>
                  {d.name} ({d.code})
                </option>
              ))}
            </select>
          </div>

          <div className="filter-item">
            <label className="filter-label">
              <ShieldAlert size={13} /> Crime Category
            </label>
            <select
              className="filter-select"
              value={crimeGroup}
              onChange={(e) => setCrimeGroup(e.target.value)}
            >
              <option value="">All IPC Offence Groups</option>
              {CRIME_GROUPS.map((cg) => (
                <option key={cg} value={cg}>
                  {cg}
                </option>
              ))}
            </select>
          </div>
        </div>
      </div>

      {/* Main View Switcher */}
      {loading ? (
        <div className="kpi-grid">
          {[1, 2, 3, 4].map((i) => (
            <div key={i} className="kpi-card skeleton-card"></div>
          ))}
        </div>
      ) : (
        <>
          {/* TAB 1: Command Overview & Trends */}
          {(activeTab === 'overview' || activeTab === 'trends') && (
            <>
              {/* KPI Cards Grid */}
              <div className="kpi-section">
                <div className="kpi-grid">
                  {/* Card 1: Total FIRs */}
                  <div className="kpi-card highlight-cyan">
                    <div className="kpi-header">
                      <div className="kpi-icon-wrapper cyan">
                        <FileText size={20} />
                      </div>
                      <span className="kpi-badge positive">
                        <TrendingUp size={11} /> {summaryData?.monthly_change_pct}% vs last mo
                      </span>
                    </div>
                    <div>
                      <div className="kpi-value">{summaryData?.total_firs.toLocaleString()}</div>
                      <div className="kpi-title">Total Registered FIRs</div>
                    </div>
                    <div className="kpi-footer font-mono">
                      Across {summaryData?.total_districts} Districts ({summaryData?.total_stations} Police Stations)
                    </div>
                  </div>

                  {/* Card 2: Clearance Rate */}
                  <div className="kpi-card highlight-emerald">
                    <div className="kpi-header">
                      <div className="kpi-icon-wrapper emerald">
                        <CheckCircle2 size={20} />
                      </div>
                      <span className="kpi-badge positive font-mono">High Efficiency</span>
                    </div>
                    <div>
                      <div className="kpi-value">{clearancePct}%</div>
                      <div className="kpi-title">Case Clearance Rate</div>
                    </div>
                    <div className="kpi-footer">
                      <div className="kpi-progress-bg">
                        <div
                          className="kpi-progress-bar emerald"
                          style={{ width: `${clearancePct}%`, height: '100%', background: '#10b981' }}
                        ></div>
                      </div>
                    </div>
                  </div>

                  {/* Card 3: Repeat Offenders */}
                  <div className="kpi-card highlight-amber">
                    <div className="kpi-header">
                      <div className="kpi-icon-wrapper amber">
                        <AlertTriangle size={20} />
                      </div>
                      <span className="kpi-badge warning font-mono">Flagged Recidivism</span>
                    </div>
                    <div>
                      <div className="kpi-value">{summaryData?.repeat_offenders.toLocaleString()}</div>
                      <div className="kpi-title">Flagged Repeat Offenders</div>
                    </div>
                    <div className="kpi-footer font-mono">
                      Linked to {summaryData?.total_accused.toLocaleString()} suspect profiles
                    </div>
                  </div>

                  {/* Card 4: Victims Protected */}
                  <div className="kpi-card highlight-purple">
                    <div className="kpi-header">
                      <div className="kpi-icon-wrapper purple">
                        <Users size={20} />
                      </div>
                      <span className="kpi-badge info font-mono">Protected</span>
                    </div>
                    <div>
                      <div className="kpi-value">{summaryData?.total_victims.toLocaleString()}</div>
                      <div className="kpi-title">Victims Logged & Assisted</div>
                    </div>
                    <div className="kpi-footer font-mono">
                      Karnataka Legal Aid & CCTNS System
                    </div>
                  </div>
                </div>

                {/* Status Lifecycle Card */}
                <div className="status-breakdown-card glass-panel" style={{ marginTop: '16px' }}>
                  <div className="status-breakdown-header">
                    <h3>Case Disposition & Investigation Lifecycle Status</h3>
                    <span className="status-total-pill font-mono">
                      {summaryData?.total_firs.toLocaleString()} Total Records
                    </span>
                  </div>
                  <div className="status-pills-row">
                    {Object.entries(summaryData?.status_breakdown || {}).map(([sName, count]) => {
                      const pct = Math.round((count / (summaryData?.total_firs || 1)) * 100)
                      let colorClass = 'cyan'
                      if (sName === 'Chargesheeted') colorClass = 'emerald'
                      if (sName === 'Closed') colorClass = 'blue'
                      if (sName === 'Convicted') colorClass = 'purple'
                      if (sName === 'Acquitted') colorClass = 'rose'

                      return (
                        <div key={sName} className={`status-item ${colorClass}`}>
                          <div className="status-item-meta">
                            <span className="status-dot"></span>
                            <span className="status-name">{sName}</span>
                            <span className="status-count font-mono">{count.toLocaleString()} ({pct}%)</span>
                          </div>
                          <div className="status-mini-bar">
                            <div className="status-fill" style={{ width: `${pct}%` }}></div>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </div>
              </div>

              {/* Charts Section */}
              <div className="charts-section" style={{ marginTop: '20px' }}>
                <div className="charts-grid-top">
                  {/* Temporal Trend Area Chart */}
                  <div className="chart-card glass-panel">
                    <div className="chart-card-header">
                      <div>
                        <div className="chart-card-subtitle font-mono">TEMPORAL TREND</div>
                        <h3 className="chart-card-title">
                          <TrendingUp size={16} className="icon-orange" /> Monthly Crime Volume & Resolution
                        </h3>
                      </div>
                    </div>
                    <div className="chart-body" style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <AreaChart data={trendData} margin={{ top: 10, right: 20, left: -10, bottom: 0 }}>
                          <defs>
                            <linearGradient id="colorTotal" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#ff5c00" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#ff5c00" stopOpacity={0} />
                            </linearGradient>
                            <linearGradient id="colorSolved" x1="0" y1="0" x2="0" y2="1">
                              <stop offset="5%" stopColor="#00f0ff" stopOpacity={0.4} />
                              <stop offset="95%" stopColor="#00f0ff" stopOpacity={0} />
                            </linearGradient>
                          </defs>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" />
                          <XAxis dataKey="month" stroke="#ab897d" fontSize={11} fontFamily="JetBrains Mono" />
                          <YAxis stroke="#ab897d" fontSize={11} fontFamily="JetBrains Mono" />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Legend wrapperStyle={{ paddingTop: 10, fontSize: 12, color: '#e3e2e5' }} />
                          <Area
                            type="monotone"
                            dataKey="total"
                            name="Total Incidents"
                            stroke="#ff5c00"
                            strokeWidth={2.5}
                            fillOpacity={1}
                            fill="url(#colorTotal)"
                          />
                          <Area
                            type="monotone"
                            dataKey="solved"
                            name="Cases Solved"
                            stroke="#00f0ff"
                            strokeWidth={2}
                            fillOpacity={1}
                            fill="url(#colorSolved)"
                          />
                        </AreaChart>
                      </ResponsiveContainer>
                    </div>
                  </div>

                  {/* Category Bar Chart */}
                  <div className="chart-card glass-panel">
                    <div className="chart-card-header">
                      <div>
                        <div className="chart-card-subtitle font-mono">IPC OFFENCE DISTRIBUTION</div>
                        <h3 className="chart-card-title">
                          <PieIcon size={16} className="icon-cyan" /> Crime Category Breakdown
                        </h3>
                      </div>
                    </div>
                    <div className="chart-body" style={{ width: '100%', height: 300 }}>
                      <ResponsiveContainer width="100%" height="100%">
                        <BarChart data={categoryData} layout="vertical" margin={{ top: 5, right: 30, left: 40, bottom: 5 }}>
                          <CartesianGrid strokeDasharray="3 3" stroke="rgba(255,255,255,0.06)" horizontal={false} />
                          <XAxis type="number" stroke="#ab897d" fontSize={11} fontFamily="JetBrains Mono" />
                          <YAxis dataKey="group" type="category" stroke="#e3e2e5" fontSize={11} width={110} />
                          <Tooltip content={<CustomChartTooltip />} />
                          <Bar dataKey="count" name="Incidents" radius={[0, 4, 4, 0]}>
                            {categoryData.map((entry, index) => (
                              <Cell key={`cell-${index}`} fill={index % 2 === 0 ? '#ff5c00' : '#00f0ff'} />
                            ))}
                          </Bar>
                        </BarChart>
                      </ResponsiveContainer>
                    </div>
                  </div>
                </div>
              </div>
            </>
          )}

          {/* TAB 2: Zia Risk Scoreboard */}
          {(activeTab === 'overview' || activeTab === 'risk') && (
            <div className="risk-scoreboard-section glass-panel" style={{ marginTop: '20px' }}>
              <div className="risk-scoreboard-header">
                <div>
                  <div className="risk-header-badge font-mono">
                    <Cpu size={13} className="spin-slow" /> Zia AutoML Threat Intelligence Engine
                  </div>
                  <h2>Predictive Crime Risk Scoreboard Matrix</h2>
                  <p className="risk-header-desc">
                    AI-generated threat index per district × IPC crime group for proactive patrol deployment.
                  </p>
                </div>
              </div>

              {/* Highlights */}
              <div className="risk-highlights-row" style={{ display: 'flex', gap: '12px', flexWrap: 'wrap', marginTop: '12px' }}>
                {riskData?.topRiskDistricts.map((item, idx) => (
                  <div key={idx} className="risk-highlight-card glass-panel" style={{ padding: '14px', flex: 1, minWidth: '220px' }}>
                    <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                      <span className="font-mono" style={{ fontSize: '12px', color: 'var(--accent-orange)', fontWeight: 700 }}>
                        {item.district}
                      </span>
                      <span className="status-pill critical font-mono" style={{ fontSize: '10px', background: 'rgba(255,46,0,0.2)', color: '#ffb4ab', padding: '2px 6px', borderRadius: '4px' }}>
                        {item.status}
                      </span>
                    </div>
                    <div style={{ fontSize: '28px', fontWeight: 800, color: '#fff' }} className="font-mono">
                      {item.score}<span style={{ fontSize: '14px', color: 'var(--text-dim)' }}>/100</span>
                    </div>
                    <div style={{ fontSize: '11px', color: 'var(--text-dim)', marginTop: '4px' }}>
                      {item.crimeType}
                    </div>
                  </div>
                ))}
              </div>

              {/* Heatmap Grid Table */}
              <div className="risk-matrix-wrapper" style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table className="risk-matrix-table" style={{ width: '100%', borderCollapse: 'collapse' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', textAlign: 'left' }}>
                      <th style={{ padding: '10px', fontSize: '11px', color: 'var(--text-dim)' }} className="font-mono">
                        District / Jurisdiction
                      </th>
                      {activeCrimeColumns.map((c) => (
                        <th key={c} style={{ padding: '10px', fontSize: '11px', color: 'var(--text-dim)' }} className="font-mono">
                          {c}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {riskData?.matrix.map((row) => (
                      <tr key={row.districtId} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontWeight: 700, color: '#fff', fontSize: '13px', display: 'block' }}>
                            {row.districtName}
                          </span>
                          <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent-orange)' }}>
                            {row.code}
                          </span>
                        </td>
                        {activeCrimeColumns.map((c) => {
                          const cellData = row.scores[c] || { score: 45, trend: 'stable' }
                          let rClass = 'low'
                          if (cellData.score >= 80) rClass = 'critical'
                          else if (cellData.score >= 65) rClass = 'high'
                          else if (cellData.score >= 50) rClass = 'medium'

                          return (
                            <td
                              key={c}
                              className={`risk-matrix-cell ${rClass}`}
                              style={{ padding: '10px', borderRadius: '4px' }}
                            >
                              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <span className="font-mono" style={{ fontWeight: 800 }}>{cellData.score}</span>
                                {cellData.trend === 'up' && <ArrowUpRight size={12} color="#ff2e00" />}
                                {cellData.trend === 'down' && <ArrowDownRight size={12} color="#10b981" />}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* TAB 3: District Leaderboard */}
          {(activeTab === 'overview' || activeTab === 'spatial') && (
            <div className="chart-card glass-panel" style={{ marginTop: '20px' }}>
              <div className="chart-card-header">
                <div>
                  <div className="chart-card-subtitle font-mono">JURISDICTION DENSITY RANKING</div>
                  <h3 className="chart-card-title">
                    <BarChart3 size={16} className="icon-orange" /> District Crime Density & Rate Per 100k
                  </h3>
                </div>
              </div>

              <div style={{ overflowX: 'auto', marginTop: '16px' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '11px' }} className="font-mono">
                      <th style={{ padding: '10px' }}>Rank</th>
                      <th style={{ padding: '10px' }}>District</th>
                      <th style={{ padding: '10px' }}>Population</th>
                      <th style={{ padding: '10px' }}>Total FIRs</th>
                      <th style={{ padding: '10px' }}>Rate / 100k</th>
                      <th style={{ padding: '10px' }}>Risk Level</th>
                      <th style={{ padding: '10px' }}>Clearance</th>
                    </tr>
                  </thead>
                  <tbody>
                    {districtData.map((d, idx) => (
                      <tr key={d.district_id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                        <td style={{ padding: '10px', color: 'var(--accent-orange)', fontWeight: 700 }} className="font-mono">
                          #{idx + 1}
                        </td>
                        <td style={{ padding: '10px', fontWeight: 700, color: '#fff' }}>
                          {d.district_name} <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>({d.code})</span>
                        </td>
                        <td style={{ padding: '10px' }} className="font-mono">{d.population.toLocaleString()}</td>
                        <td style={{ padding: '10px', fontWeight: 700 }} className="font-mono">{d.total_firs.toLocaleString()}</td>
                        <td style={{ padding: '10px', color: 'var(--accent-cyan)' }} className="font-mono">{d.crime_rate_per_100k}</td>
                        <td style={{ padding: '10px' }}>
                          <span style={{ fontSize: '11px', padding: '2px 8px', borderRadius: '4px', background: d.risk_level === 'Critical' ? 'rgba(255,46,0,0.2)' : 'rgba(255,92,0,0.2)', color: d.risk_level === 'Critical' ? '#ff2e00' : '#ff5c00' }} className="font-mono">
                            {d.risk_level}
                          </span>
                        </td>
                        <td style={{ padding: '10px' }} className="font-mono">{d.clearance_rate}%</td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </>
      )}
    </div>
  )
}
