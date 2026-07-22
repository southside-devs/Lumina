import React, { useState } from 'react'
import {
  ShieldAlert,
  AlertTriangle,
  FileText,
  Activity,
  Clock,
  Download,
  Kanban,
  Table as TableIcon,
  Plus,
  ArrowUpRight,
  ChevronRight,
  Zap,
  RotateCcw
} from 'lucide-react'
import {
  ResponsiveContainer,
  RadarChart,
  PolarGrid,
  PolarAngleAxis,
  PolarRadiusAxis,
  Radar,
  Tooltip
} from 'recharts'

export default function AnalyticsModule() {
  const [activeView, setActiveView] = useState('dashboard') // 'dashboard', 'incident', 'kanban', 'table', 'globe'
  const [viewMode, setViewMode] = useState('kanban') // 'kanban' or 'table' inside Findings
  const [notification, setNotification] = useState(null)

  const showToast = (msg) => {
    setNotification(msg)
    setTimeout(() => setNotification(null), 3500)
  }

  // Sample Radar Threat Surface Map Data (Image 1)
  const threatRadarData = [
    { category: 'Authentication', observed: 85, expected: 40, residual: 20 },
    { category: 'Privilege Use', observed: 90, expected: 35, residual: 15 },
    { category: 'Asset Exposure', observed: 70, expected: 50, residual: 25 },
    { category: 'Data Exfiltration', observed: 95, expected: 30, residual: 10 },
    { category: 'Defense Evasion', observed: 65, expected: 45, residual: 30 },
    { category: 'Network Access', observed: 75, expected: 50, residual: 20 }
  ]

  // Sample Entities Table Data (Image 1)
  const entitiesData = [
    { id: '1', type: 'Device', cvss: '8.7', ipHex: '12.4.123.20' },
    { id: '2', type: 'IP Address', cvss: '1.4', ipHex: '10.0.23.1135' },
    { id: '3', type: 'Device', cvss: '4.7', ipHex: '02.32.34.11' },
    { id: '4', type: 'Database Node', cvss: '9.1', ipHex: '192.168.1.45' }
  ]

  // Sample Kanban Board Data (Image 2)
  const kanbanColumns = [
    {
      id: 'open',
      title: 'Open',
      count: 3,
      dotClass: 'open',
      cards: [
        { id: 'FND-1156', title: 'prod-db - 9.1', date: '2025-06-17', badge: 'KS', severity: 'High' },
        { id: 'FND-0943', title: 'cloud-storage-1 - 8.4', date: '2025-06-09', badge: 'LO', severity: 'High' },
        { id: 'FND-0777', title: 'vpn-node-2 - 9.3', date: '2025-05-08', badge: 'JD', severity: 'High' }
      ]
    },
    {
      id: 'triaged',
      title: 'Triaged',
      count: 5,
      dotClass: 'triaged',
      cards: [
        { id: 'FND-0946', title: 'api-gateway - 8.4', date: '2025-05-17', badge: 'SM', severity: 'Medium' },
        { id: 'FND-0990', title: 'finance-app - 7.8', date: '2025-05-09', badge: 'NA', severity: 'Medium' },
        { id: 'FND-1021', title: 'auth-service - 3.5', date: '2025-05-02', badge: 'SM', severity: 'Low' },
        { id: 'FND-0815', title: 'legacy-server - 2.1', date: '2025-04-31', badge: 'AR', severity: 'Low' }
      ]
    },
    {
      id: 'progress',
      title: 'In Progress',
      count: 4,
      dotClass: 'progress',
      cards: [
        { id: 'FND-1045', title: 'web-app-03 - 5.6', date: '2025-05-21', badge: 'JD', severity: 'Medium' },
        { id: 'FND-0860', title: 'marketing-site - 7.6', date: '2025-05-07', badge: 'LL', severity: 'Medium' },
        { id: 'FND-0977', title: 'cloud-db - 4.2', date: '2025-04-29', badge: 'MS', severity: 'Low' }
      ]
    },
    {
      id: 'resolved',
      title: 'Resolved',
      count: 1,
      dotClass: 'resolved',
      cards: [
        { id: 'FND-1012', title: 'email-server - 5.8', date: '2025-05-16', badge: 'MA', severity: 'Medium' }
      ]
    },
    {
      id: 'canceled',
      title: 'Canceled',
      count: 1,
      dotClass: 'canceled',
      cards: [
        { id: 'FND-0783', title: 'cloud-db - 4.2', date: '2025-05-02', badge: 'WF', severity: 'Low' }
      ]
    }
  ]

  // Findings Table Data (Image 2)
  const findingsTable = [
    { id: 'FND-1045', severity: 'High', asset: 'web-app-03', cvss: '8.7', status: 'In Progress', badge: 'JD', fixDate: '2025-05-21' },
    { id: 'FND-0946', severity: 'Medium', asset: 'api-gateway', cvss: '8.7', status: 'Triaged', badge: 'SM', fixDate: '2025-05-17' },
    { id: 'FND-1156', severity: 'Medium', asset: 'prod-db', cvss: '8.7', status: 'Open', badge: 'KS', fixDate: '2025-06-17' },
    { id: 'FND-1012', severity: 'High', asset: 'email-server', cvss: '8.7', status: 'Resolved', badge: 'MA', fixDate: '2025-05-16' }
  ]

  return (
    <div className="cy-workspace-container">
      {/* Toast Notification */}
      {notification && (
        <div className="toast-banner success">
          <Zap size={16} className="icon-ember" />
          <span>{notification}</span>
        </div>
      )}

      {/* Top Header & Breadcrumb Bar */}
      <div className="cy-header-bar">
        <div>
          <div className="cy-breadcrumbs font-mono">
            <span>🏠</span>
            <ChevronRight size={12} />
            <span>Incidents</span>
            <ChevronRight size={12} />
            <span style={{ color: 'var(--accent-orange)' }}>INC-2042</span>
          </div>
          <h1 className="cy-page-title">
            {activeView === 'dashboard' && 'Strategic Threat Dashboard'}
            {activeView === 'incident' && 'Incident Details — INC-2042'}
            {activeView === 'kanban' && 'Findings Command Hub'}
            {activeView === 'globe' && 'Spatiotemporal 3D Threat Scanner'}
          </h1>
        </div>

        {/* Action Controls & Navigation View Switcher */}
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <div className="cy-view-tabs">
            <button
              type="button"
              className={`cy-tab-pill ${activeView === 'dashboard' ? 'active' : ''}`}
              onClick={() => setActiveView('dashboard')}
            >
              Dashboard
            </button>
            <button
              type="button"
              className={`cy-tab-pill ${activeView === 'incident' ? 'active' : ''}`}
              onClick={() => setActiveView('incident')}
            >
              Incident INC-2042
            </button>
            <button
              type="button"
              className={`cy-tab-pill ${activeView === 'kanban' ? 'active' : ''}`}
              onClick={() => setActiveView('kanban')}
            >
              Findings
            </button>
            <button
              type="button"
              className={`cy-tab-pill ${activeView === 'globe' ? 'active' : ''}`}
              onClick={() => setActiveView('globe')}
            >
              3D Globe Scanner
            </button>
          </div>

          <button
            type="button"
            className="btn-secondary"
            onClick={() => showToast('Generating Intelligence PDF Report...')}
          >
            <Download size={14} /> Download report
          </button>
        </div>
      </div>

      {/* ======================================================== */}
      {/* VIEW 1: DASHBOARD THREAT OVERVIEW (Image 3) */}
      {/* ======================================================== */}
      {activeView === 'dashboard' && (
        <>
          {/* Top Metric Cards Row */}
          <div className="cy-metrics-row">
            <div className="cy-metric-card glass-panel">
              <div className="cy-metric-top">
                <span className="cy-metric-title">Open vulnerabilities</span>
                <span className="cy-metric-badge positive font-mono">↗ 12%</span>
              </div>
              <div className="cy-metric-val font-mono">235</div>
              <div className="cy-metric-sub font-mono">211 last week</div>
            </div>

            <div className="cy-metric-card glass-panel">
              <div className="cy-metric-top">
                <span className="cy-metric-title">Active incidents</span>
                <span className="cy-metric-badge warning font-mono">↘ 8%</span>
              </div>
              <div className="cy-metric-val font-mono">7</div>
              <div className="cy-metric-sub font-mono">11 last week (40% contained)</div>
            </div>

            <div className="cy-metric-card glass-panel">
              <div className="cy-metric-top">
                <span className="cy-metric-title">Compliance score</span>
                <span className="cy-metric-badge positive font-mono">↗ 6%</span>
              </div>
              <div className="cy-metric-val font-mono">51%</div>
              <div className="cy-metric-sub font-mono">47% last week</div>
            </div>

            <div className="cy-metric-card glass-panel">
              <div className="cy-metric-top">
                <span className="cy-metric-title">Time to remediate</span>
                <span className="cy-metric-badge warning font-mono">↘ 11%</span>
              </div>
              <div className="cy-metric-val font-mono">2d:6h</div>
              <div className="cy-metric-sub font-mono">2d:8h last week</div>
            </div>
          </div>

          {/* Threat World Map & Recent Activity Grid */}
          <div className="cy-threat-map-grid">
            <div className="cy-threat-map-card glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <div>
                  <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-orange)' }}>GEOGRAPHIC TELEMETRY</div>
                  <h3 style={{ fontSize: '16px', color: '#fff', marginTop: '2px' }}>Statewide & Global Threat Map</h3>
                </div>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Last Week ▾</span>
              </div>

              <div className="cy-map-container">
                <svg className="cy-map-svg" viewBox="0 0 1000 500" fill="none">
                  <path d="M150 150 Q 200 100, 350 160 T 600 200 T 850 180" stroke="rgba(255, 255, 255, 0.15)" strokeWidth="1.5" fill="none" />
                  <path d="M100 250 Q 300 220, 500 300 T 900 280" stroke="rgba(255, 61, 0, 0.25)" strokeWidth="1.5" strokeDasharray="4 4" fill="none" />
                  {/* Continental Dots */}
                  <circle cx="220" cy="180" r="3" fill="#6B7280" />
                  <circle cx="480" cy="160" r="3" fill="#6B7280" />
                  <circle cx="750" cy="220" r="3" fill="#6B7280" />
                  <circle cx="300" cy="320" r="3" fill="#6B7280" />
                </svg>

                {/* Hotspot Rings (Image 3) */}
                <div className="cy-hotspot-node" style={{ top: '35%', left: '72%' }}>
                  <div className="cy-node-core"></div>
                  <div className="cy-node-ring"></div>
                </div>
                <div className="cy-hotspot-node" style={{ top: '48%', left: '42%' }}>
                  <div className="cy-node-core"></div>
                  <div className="cy-node-ring" style={{ width: '45px', height: '45px' }}></div>
                </div>
                <div className="cy-hotspot-node" style={{ top: '65%', left: '32%' }}>
                  <div className="cy-node-core"></div>
                  <div className="cy-node-ring"></div>
                </div>
              </div>

              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '12px', color: 'var(--text-muted)' }} className="font-mono">
                <span>Bengaluru Urban Sector — 72 Alerts</span>
                <span>Mysuru Hub — 58 Alerts</span>
                <span>Mangaluru Port — 21 Alerts</span>
              </div>
            </div>

            {/* Recent Activity List */}
            <div className="cy-activity-card glass-panel">
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                <h3 style={{ fontSize: '15px', color: '#fff' }}>Recent Activity Stream</h3>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--text-dim)' }}>Sort by ▾</span>
              </div>

              <div className="cy-activity-list">
                {[
                  { title: 'Policy "CIS Benchmark" applied', sub: 'Applied to 3 assets • 8 mins ago', icon: <ShieldAlert size={15} /> },
                  { title: 'Critical vulnerability detected', sub: 'Found in nginx server • CVE-2025-1234', icon: <AlertTriangle size={15} /> },
                  { title: 'SLA breach on Incident #4453', sub: 'Response time exceeded by 2 hours', icon: <Clock size={15} /> },
                  { title: 'Compliance scan started', sub: 'Manual trigger by John.D', icon: <Activity size={15} /> },
                  { title: 'Report scheduled: Monthly Summary', sub: 'Set to run on May 2, 10:00 UTC', icon: <FileText size={15} /> }
                ].map((act, idx) => (
                  <div key={idx} className="cy-activity-item">
                    <div style={{ display: 'flex', gap: '10px' }}>
                      <span className="cy-activity-icon">{act.icon}</span>
                      <div>
                        <div className="cy-activity-title">{act.title}</div>
                        <div className="cy-activity-sub font-mono">{act.sub}</div>
                      </div>
                    </div>
                    <ArrowUpRight size={14} color="var(--text-dim)" />
                  </div>
                ))}
              </div>
            </div>
          </div>
        </>
      )}

      {/* ======================================================== */}
      {/* VIEW 2: INCIDENT DETAILS & RADAR SPIDER MAP (Image 1) */}
      {/* ======================================================== */}
      {activeView === 'incident' && (
        <div className="cy-incident-grid">
          {/* Information & Threat Surface Radar Chart (Image 1) */}
          <div className="cy-radar-card glass-panel">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div>
                <span className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-orange)' }}>INCIDENT OVERVIEW</span>
                <h3 style={{ fontSize: '18px', color: '#fff' }}>Incident - 2042</h3>
              </div>
              <div style={{ display: 'flex', gap: '8px' }}>
                <span className="font-mono" style={{ fontSize: '11px', background: 'rgba(16, 185, 129, 0.15)', color: '#10B981', padding: '3px 8px', borderRadius: '4px' }}>
                  Contained
                </span>
                <span className="font-mono" style={{ fontSize: '11px', background: 'rgba(239, 68, 68, 0.15)', color: '#EF4444', padding: '3px 8px', borderRadius: '4px' }}>
                  High Risk
                </span>
              </div>
            </div>

            <table className="cy-info-table font-mono" style={{ marginTop: '10px' }}>
              <tbody>
                <tr><td className="label">Incident type:</td><td className="val">Finding</td></tr>
                <tr><td className="label">Status:</td><td className="val" style={{ color: '#10B981' }}>Contained</td></tr>
                <tr><td className="label">Origin:</td><td className="val">Cloud DB Cluster</td></tr>
                <tr><td className="label">Detections:</td><td className="val">3 Active Vectors</td></tr>
              </tbody>
            </table>

            {/* Radar Spider Chart (Image 1 Right Widget) */}
            <div style={{ marginTop: '20px' }}>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-orange)', marginBottom: '8px' }}>
                Threat Surface Map (Multi-Axis Polygon)
              </div>
              <div style={{ width: '100%', height: 260 }}>
                <ResponsiveContainer width="100%" height="100%">
                  <RadarChart cx="50%" cy="50%" outerRadius="75%" data={threatRadarData}>
                    <PolarGrid stroke="rgba(255, 255, 255, 0.1)" />
                    <PolarAngleAxis dataKey="category" stroke="#9CA3AF" fontSize={10} fontFamily="JetBrains Mono" />
                    <PolarRadiusAxis stroke="rgba(255, 255, 255, 0.1)" fontSize={9} />
                    <Radar name="Observed Threat" dataKey="observed" stroke="#FF3D00" fill="#FF3D00" fillOpacity={0.4} />
                    <Radar name="Expected Baseline" dataKey="expected" stroke="#F59E0B" fill="#F59E0B" fillOpacity={0.2} />
                    <Tooltip />
                  </RadarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>

          {/* Entities Table & Polar Ring Chart (Image 1 Right Panel) */}
          <div className="cy-radar-card glass-panel">
            <div>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-orange)' }}>AFFECTED ASSETS & CVSS</div>
              <h3 style={{ fontSize: '18px', color: '#fff' }}>Target Entities & Telemetry</h3>
            </div>

            <div style={{ marginTop: '16px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="font-mono">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '11px' }}>
                    <th style={{ padding: '8px' }}>ID</th>
                    <th style={{ padding: '8px' }}>TYPE</th>
                    <th style={{ padding: '8px' }}>CVSS SCORE</th>
                    <th style={{ padding: '8px' }}>IP / HEX</th>
                  </tr>
                </thead>
                <tbody>
                  {entitiesData.map((ent) => (
                    <tr key={ent.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '12px' }}>
                      <td style={{ padding: '8px', color: 'var(--accent-orange)', fontWeight: 700 }}>{ent.id}</td>
                      <td style={{ padding: '8px', color: '#fff' }}>{ent.type}</td>
                      <td style={{ padding: '8px', color: parseFloat(ent.cvss) >= 7.0 ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                        {ent.cvss}
                      </td>
                      <td style={{ padding: '8px', color: 'var(--text-muted)' }}>{ent.ipHex}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Concentric Circle Radar Gauge (Image 1 Bottom Left) */}
            <div style={{ marginTop: '24px', display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
              <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-orange)', marginBottom: '12px' }}>
                Findings Sector Vector (Misconfiguration / Phishing / Malware)
              </div>
              <div style={{ position: 'relative', width: '180px', height: '180px', borderRadius: '50%', border: '2px solid rgba(255, 61, 0, 0.4)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                <div style={{ width: '130px', height: '130px', borderRadius: '50%', border: '2px dashed var(--accent-orange)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(255, 61, 0, 0.25)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                    <span className="font-mono" style={{ fontWeight: 800, color: '#fff', fontSize: '16px' }}>3</span>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 3: FINDINGS KANBAN BOARD & TABLE VIEW (Image 2) */}
      {/* ======================================================== */}
      {activeView === 'kanban' && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          {/* Sub View Toggle Bar (Kanban vs Table) */}
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ display: 'flex', gap: '8px' }}>
              <button
                type="button"
                className={`btn-secondary ${viewMode === 'kanban' ? 'active' : ''}`}
                onClick={() => setViewMode('kanban')}
              >
                <Kanban size={14} /> Kanban Board
              </button>
              <button
                type="button"
                className={`btn-secondary ${viewMode === 'table' ? 'active' : ''}`}
                onClick={() => setViewMode('table')}
              >
                <TableIcon size={14} /> Table View
              </button>
            </div>

            <button
              type="button"
              className="btn-primary"
              onClick={() => showToast('Creating new security finding...')}
            >
              <Plus size={14} /> New Finding
            </button>
          </div>

          {/* Mode 1: Kanban Columns (Image 2 Top) */}
          {viewMode === 'kanban' && (
            <div className="cy-kanban-board">
              {kanbanColumns.map((col) => (
                <div key={col.id} className="cy-kanban-col">
                  <div className="cy-kanban-col-header">
                    <span className={`cy-dot-indicator ${col.dotClass}`}></span>
                    <span>{col.title} ({col.count})</span>
                  </div>

                  {col.cards.map((card) => (
                    <div key={card.id} className="cy-kanban-card">
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                        <span className="cy-card-id font-mono">■ {card.id}</span>
                        <span className="cy-assignee-badge font-mono">{card.badge}</span>
                      </div>
                      <div className="cy-card-asset font-mono">{card.title}</div>
                      <div className="cy-card-meta font-mono">
                        <span>📅 {card.date}</span>
                        <span style={{ color: card.severity === 'High' ? '#EF4444' : '#F59E0B' }}>
                          {card.severity}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              ))}
            </div>
          )}

          {/* Mode 2: Table List (Image 2 Bottom) */}
          {viewMode === 'table' && (
            <div className="glass-panel" style={{ padding: '20px', overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }} className="font-mono">
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border-color)', color: 'var(--text-dim)', fontSize: '11px' }}>
                    <th style={{ padding: '10px' }}>ID</th>
                    <th style={{ padding: '10px' }}>SEVERITY</th>
                    <th style={{ padding: '10px' }}>ASSET</th>
                    <th style={{ padding: '10px' }}>CVSS SCORE</th>
                    <th style={{ padding: '10px' }}>STATUS</th>
                    <th style={{ padding: '10px' }}>ASSIGNEE</th>
                    <th style={{ padding: '10px' }}>FIX DATE</th>
                  </tr>
                </thead>
                <tbody>
                  {findingsTable.map((row) => (
                    <tr key={row.id} style={{ borderBottom: '1px solid rgba(255,255,255,0.05)', fontSize: '13px' }}>
                      <td style={{ padding: '10px', color: 'var(--accent-orange)', fontWeight: 700 }}>{row.id}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ color: row.severity === 'High' ? '#EF4444' : '#F59E0B', fontWeight: 700 }}>
                          ■ {row.severity}
                        </span>
                      </td>
                      <td style={{ padding: '10px', color: '#fff' }}>{row.asset}</td>
                      <td style={{ padding: '10px' }}>{row.cvss}</td>
                      <td style={{ padding: '10px' }}>
                        <span style={{ fontSize: '11px', padding: '3px 8px', borderRadius: '4px', background: 'rgba(255, 61, 0, 0.15)', color: 'var(--accent-orange)' }}>
                          {row.status}
                        </span>
                      </td>
                      <td style={{ padding: '10px' }}>
                        <span className="cy-assignee-badge">{row.badge}</span>
                      </td>
                      <td style={{ padding: '10px', color: 'var(--text-muted)' }}>{row.fixDate}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      )}

      {/* ======================================================== */}
      {/* VIEW 4: 3D INTELLIGENCE WIREFRAME GLOBE (Image 4) */}
      {/* ======================================================== */}
      {activeView === 'globe' && (
        <div className="glass-panel cy-globe-container">
          <div className="cy-wireframe-globe">
            <svg className="cy-globe-svg" viewBox="0 0 200 200" fill="none">
              <circle cx="100" cy="100" r="80" stroke="var(--accent-orange)" strokeWidth="1.5" strokeDasharray="3 3" />
              <ellipse cx="100" cy="100" rx="80" ry="30" stroke="var(--accent-orange)" strokeWidth="1" />
              <ellipse cx="100" cy="100" rx="30" ry="80" stroke="var(--accent-orange)" strokeWidth="1" />
              <line x1="20" y1="100" x2="180" y2="100" stroke="var(--accent-orange)" strokeWidth="1" />
              <line x1="100" y1="20" x2="100" y2="180" stroke="var(--accent-orange)" strokeWidth="1" />
            </svg>
          </div>

          <h2 style={{ fontSize: '20px', color: '#fff' }}>Nice, no active findings match these filters!</h2>
          <p style={{ fontSize: '13px', color: 'var(--text-muted)' }} className="font-mono">
            Statewide Karnataka threat scan completed across 31 districts.
          </p>

          <button
            type="button"
            className="btn-primary"
            style={{ padding: '10px 20px', marginTop: '8px' }}
            onClick={() => showToast('Triggered new deep spatiotemporal network scan...')}
          >
            <RotateCcw size={15} /> New scan +
          </button>
        </div>
      )}
    </div>
  )
}
