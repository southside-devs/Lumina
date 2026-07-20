import { useState, useEffect } from 'react'
import { BarChart, Bar, XAxis, YAxis, Tooltip, ResponsiveContainer, Cell, PieChart, Pie, Legend } from 'recharts'
import { dashboardApi } from '../utils/api.js'
import { Card, CardHeader, Spinner, ErrorState, Select } from '../components/shared/UI.jsx'
import { CRIME_GROUPS, CRIME_COLOR_MAP } from '../constants/index.js'
import { formatNumber } from '../utils/helpers.js'

const CUSTOM_TOOLTIP = ({ active, payload, label }) => {
  if (!active || !payload?.length) return null
  return (
    <div style={{ background: 'var(--bg-elevated)', border: '1px solid var(--border)', borderRadius: 6, padding: '10px 14px', fontSize: 12 }}>
      <div style={{ fontWeight: 600, marginBottom: 4 }}>{label || payload[0]?.name}</div>
      {payload.map((p, i) => (
        <div key={i} style={{ color: p.fill || p.stroke, display: 'flex', gap: 8, alignItems: 'center' }}>
          <span>{p.name || 'Count'}:</span>
          <span style={{ fontWeight: 700 }}>{formatNumber(p.value)}</span>
        </div>
      ))}
    </div>
  )
}

export default function CrimeTrends() {
  const [trends, setTrends] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [view, setView] = useState('bar')

  useEffect(() => {
    Promise.all([
      dashboardApi.trends(),
      dashboardApi.districtSummary(),
    ]).then(([tr, ds]) => {
      setTrends((tr.data || []).sort((a, b) => b.count - a.count))
      setDistricts(ds.data || [])
    }).catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} />

  const totalCrimes = trends.reduce((a, b) => a + (b.count || 0), 0)

  const pieData = trends.slice(0, 8).map(t => ({
    name: t.group,
    value: t.count,
    fill: CRIME_COLOR_MAP[t.group] || 'var(--accent)',
  }))

  const barData = trends.map(t => ({
    name: t.group,
    count: t.count,
    pct: totalCrimes ? ((t.count / totalCrimes) * 100).toFixed(1) : 0,
  }))

  return (
    <div className="fade-in" style={{ padding: 24, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Summary row */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(140px, 1fr))', gap: 10 }}>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Total Cases</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--accent)', lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
            {formatNumber(totalCrimes)}
          </div>
        </div>
        <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '14px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Crime Types</div>
          <div style={{ fontSize: 26, fontWeight: 700, color: 'var(--warning)', lineHeight: 1 }}>{trends.length}</div>
        </div>
        {trends[0] && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--danger)44', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Top Crime</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--danger)', lineHeight: 1.2 }}>{trends[0].group}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{formatNumber(trends[0].count)} cases</div>
          </div>
        )}
        {districts[0] && (
          <div style={{ background: 'var(--bg-surface)', border: '1px solid var(--warning)44', borderRadius: 8, padding: '14px 16px' }}>
            <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 6 }}>Most Active District</div>
            <div style={{ fontSize: 13, fontWeight: 700, color: 'var(--warning)', lineHeight: 1.2 }}>{districts[0].district_name}</div>
            <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>{formatNumber(districts[0].total_firs)} FIRs</div>
          </div>
        )}
      </div>

      {/* Main chart */}
      <Card style={{ flex: 1 }}>
        <CardHeader title="Crime Group Distribution" subtitle={`${formatNumber(totalCrimes)} total recorded incidents`}
          action={
            <div style={{ display: 'flex', gap: 4 }}>
              {['bar', 'pie'].map(v => (
                <button key={v} onClick={() => setView(v)} style={{
                  padding: '4px 12px', borderRadius: 4, fontSize: 11, fontWeight: 500, cursor: 'pointer',
                  background: view === v ? 'var(--accent-bg)' : 'var(--bg-elevated)',
                  border: `1px solid ${view === v ? 'var(--accent)' : 'var(--border)'}`,
                  color: view === v ? 'var(--accent)' : 'var(--text-secondary)',
                }}>
                  {v === 'bar' ? '⊟ Bar' : '⊙ Pie'}
                </button>
              ))}
            </div>
          }
        />
        <div style={{ padding: '16px 8px 8px' }}>
          {view === 'bar' ? (
            <ResponsiveContainer width="100%" height={380}>
              <BarChart data={barData} layout="vertical" margin={{ left: 8, right: 60 }}>
                <XAxis type="number" tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <YAxis type="category" dataKey="name" width={180} tick={{ fontSize: 11, fill: 'var(--text-secondary)' }} />
                <Tooltip content={<CUSTOM_TOOLTIP />} />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}
                  label={{ position: 'right', fontSize: 10, fill: 'var(--text-secondary)', formatter: (v) => formatNumber(v) }}>
                  {barData.map((entry, i) => (
                    <Cell key={i} fill={CRIME_COLOR_MAP[entry.name] || 'var(--accent)'} fillOpacity={0.85} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          ) : (
            <ResponsiveContainer width="100%" height={380}>
              <PieChart>
                <Pie data={pieData} cx="50%" cy="50%" outerRadius={140} dataKey="value"
                  label={({ name, percent }) => `${name.split(' ').slice(0, 2).join(' ')} ${(percent * 100).toFixed(0)}%`}
                  labelLine={{ stroke: 'var(--text-muted)', strokeWidth: 0.5 }}
                  fontSize={10} fill="var(--text-secondary)">
                  {pieData.map((entry, i) => <Cell key={i} fill={entry.fill} fillOpacity={0.85} />)}
                </Pie>
                <Tooltip content={<CUSTOM_TOOLTIP />} />
              </PieChart>
            </ResponsiveContainer>
          )}
        </div>
      </Card>

      {/* District table */}
      <Card>
        <CardHeader title="District-wise Summary" subtitle="FIR count per district" />
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))', gap: 0 }}>
          {districts.slice(0, 12).map((d, i) => {
            const maxCount = districts[0]?.total_firs || 1
            const pct = (d.total_firs / maxCount) * 100
            return (
              <div key={d.district_id} style={{ padding: '12px 16px', borderBottom: '1px solid var(--border-subtle)', borderRight: i % 2 === 0 ? '1px solid var(--border-subtle)' : 'none' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6, fontSize: 12 }}>
                  <span style={{ fontWeight: 500 }}>{d.district_name}</span>
                  <span style={{ fontWeight: 700, fontVariantNumeric: 'tabular-nums', color: i < 3 ? 'var(--danger)' : 'var(--text-primary)' }}>
                    {formatNumber(d.total_firs)}
                  </span>
                </div>
                <div style={{ height: 3, background: 'var(--bg-elevated)', borderRadius: 2 }}>
                  <div style={{ height: '100%', width: `${pct}%`, background: i < 3 ? 'var(--danger)' : 'var(--accent)', borderRadius: 2, transition: 'width 0.8s ease' }} />
                </div>
              </div>
            )
          })}
        </div>
      </Card>
    </div>
  )
}
