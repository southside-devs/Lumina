import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell } from 'recharts'
import { dashboardApi } from '../utils/api.js'
import { StatCard, Card, CardHeader, Spinner, ErrorState, Badge } from '../components/shared/UI.jsx'
import { formatNumber } from '../utils/helpers.js'
import { STATUS_COLORS, CRIME_COLOR_MAP } from '../constants/index.js'
import { TrendingUp, Users, FileText, AlertTriangle, Building2, MapPin } from 'lucide-react'

export default function Dashboard() {
  const [overview, setOverview] = useState(null)
  const [trends, setTrends] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    Promise.all([
      dashboardApi.overview(),
      dashboardApi.trends(),
      dashboardApi.districtSummary(),
    ]).then(([ov, tr, ds]) => {
      setOverview(ov.data)
      setTrends((tr.data || []).slice(0, 15).map(d => ({ name: d.group, count: d.count })))
      setDistricts((ds.data || []).slice(0, 10))
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} />

  const statusData = overview?.status_breakdown
    ? Object.entries(overview.status_breakdown).map(([name, value]) => ({ name, value }))
    : []

  return (
    <div className="fade-in" style={{ padding: 24, overflowY: 'auto', height: '100%', display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* KPI Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 12 }}>
        <StatCard label="Total FIRs" value={formatNumber(overview?.total_firs)} icon="📋" color="var(--accent)" />
        <StatCard label="Total Accused" value={formatNumber(overview?.total_accused)} icon="👤" color="var(--warning)" />
        <StatCard label="Total Victims" value={formatNumber(overview?.total_victims)} icon="🫂" color="#bc8cff" />
        <StatCard label="Repeat Offenders" value={formatNumber(overview?.repeat_offenders)} icon="⚠️" color="var(--danger)" />
        <StatCard label="Districts" value={formatNumber(overview?.total_districts)} icon="🗺️" color="var(--text-secondary)" />
        <StatCard label="Stations" value={formatNumber(overview?.total_stations)} icon="🏛️" color="var(--text-secondary)" />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 320px', gap: 16 }}>
        {/* Crime Trends */}
        <Card>
          <CardHeader title="Crime Distribution" subtitle="Cases by crime group" />
          <div style={{ padding: '16px 8px 8px' }}>
            <ResponsiveContainer width="100%" height={280}>
              <BarChart data={trends} layout="vertical" margin={{ left: 8, right: 16 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis type="category" dataKey="name" width={170} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip
                  contentStyle={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, fontSize: 12 }}
                  cursor={{ fill: 'var(--bg-hover)' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {trends.map((entry, i) => (
                    <Cell key={i} fill={CRIME_COLOR_MAP[entry.name] || 'var(--accent)'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Card>

        {/* Status Breakdown */}
        <Card>
          <CardHeader title="Case Status" subtitle="Current investigation states" />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 10 }}>
            {statusData.map(({ name, value }) => {
              const total = statusData.reduce((a, b) => a + b.value, 0)
              const pct = total ? ((value / total) * 100).toFixed(1) : 0
              const color = STATUS_COLORS[name] || 'var(--accent)'
              return (
                <div key={name}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 5, fontSize: 12 }}>
                    <span style={{ color: 'var(--text-secondary)' }}>{name}</span>
                    <span style={{ fontWeight: 600, fontVariantNumeric: 'tabular-nums' }}>
                      {formatNumber(value)} <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({pct}%)</span>
                    </span>
                  </div>
                  <div style={{ height: 4, background: 'var(--bg-elevated)', borderRadius: 2, overflow: 'hidden' }}>
                    <div style={{ height: '100%', width: `${pct}%`, background: color, borderRadius: 2, transition: 'width 0.6s ease' }} />
                  </div>
                </div>
              )
            })}
          </div>

          {/* District Summary */}
          <CardHeader title="Top Districts" style={{ borderTop: '1px solid var(--border)' }} />
          <div style={{ padding: '8px 0' }}>
            {districts.map((d, i) => (
              <div key={d.district_id} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '8px 16px',
              }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)', width: 16, textAlign: 'right', fontVariantNumeric: 'tabular-nums' }}>
                  {i + 1}
                </span>
                <span style={{ flex: 1, fontSize: 12, color: 'var(--text-secondary)' }}>{d.district_name}</span>
                <Badge color={i < 3 ? 'var(--danger)' : 'var(--accent)'}>{formatNumber(d.total_firs)}</Badge>
              </div>
            ))}
          </div>
        </Card>
      </div>
    </div>
  )
}
