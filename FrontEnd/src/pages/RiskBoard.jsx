import { useState, useEffect } from 'react'
import { riskApi, districtApi } from '../utils/api.js'
import { Card, CardHeader, Spinner, EmptyState, Badge } from '../components/shared/UI.jsx'
import { getRiskColor, getRiskLabel, formatDate } from '../utils/helpers.js'
import { CRIME_GROUPS } from '../constants/index.js'
import { Target, TrendingUp, AlertTriangle } from 'lucide-react'

export default function RiskBoard() {
  const [scores, setScores] = useState([])
  const [districts, setDistricts] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredCell, setHoveredCell] = useState(null)
  const [selectedCell, setSelectedCell] = useState(null)

  useEffect(() => {
    Promise.all([
      riskApi.list({ limit: 1000 }),
      districtApi.list(),
    ]).then(([sr, dr]) => {
      setScores(sr.data || [])
      setDistricts(dr.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [])

  // Build heatmap grid
  const districtNames = [...new Set(scores.map(s => {
    const d = districts.find(d => d.ROWID === s.District_ID)
    return d?.Name || `District ${s.District_ID}`
  }))].slice(0, 12)

  const crimeTypes = [...new Set(scores.map(s => s.Crime_Type))].filter(Boolean).slice(0, 10)

  const getScore = (districtName, crimeType) => {
    const districtId = districts.find(d => d.Name === districtName)?.ROWID
    return scores.find(s => s.District_ID === districtId && s.Crime_Type === crimeType)
  }

  const topRisks = [...scores]
    .sort((a, b) => (b.Score || 0) - (a.Score || 0))
    .slice(0, 8)
    .map(s => ({
      ...s,
      districtName: districts.find(d => d.ROWID === s.District_ID)?.Name || `#${s.District_ID}`,
    }))

  if (loading) return <Spinner />

  return (
    <div className="fade-in" style={{ padding: 24, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {scores.length === 0 ? (
        <Card>
          <EmptyState
            message="Risk model scores not yet available. Data is updated nightly after the Zia AutoML pipeline runs."
            icon="🎯"
          />
        </Card>
      ) : (
        <>
          {/* Top Risks */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: 10 }}>
            {topRisks.slice(0, 4).map((r, i) => (
              <div key={i} style={{
                background: 'var(--bg-surface)', border: `1px solid ${getRiskColor(r.Score)}44`,
                borderRadius: 8, padding: '14px 16px',
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 8 }}>
                  <Target size={16} color={getRiskColor(r.Score)} />
                  <Badge color={getRiskColor(r.Score)}>{getRiskLabel(r.Score)}</Badge>
                </div>
                <div style={{ fontSize: 24, fontWeight: 700, color: getRiskColor(r.Score), lineHeight: 1, fontVariantNumeric: 'tabular-nums' }}>
                  {(r.Score || 0).toFixed(1)}
                </div>
                <div style={{ fontSize: 12, fontWeight: 600, marginTop: 6 }}>{r.districtName}</div>
                <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{r.Crime_Type}</div>
                <div style={{ fontSize: 10, color: 'var(--text-muted)', marginTop: 4 }}>
                  Forecast: {formatDate(r.Forecast_Date)}
                </div>
              </div>
            ))}
          </div>

          {/* Heatmap Grid */}
          {districtNames.length > 0 && crimeTypes.length > 0 && (
            <Card>
              <CardHeader title="District × Crime Type Risk Heatmap" subtitle="Scroll right to see all crime types" />
              <div style={{ padding: 16, overflowX: 'auto' }}>
                <table style={{ borderCollapse: 'separate', borderSpacing: 3, fontSize: 11 }}>
                  <thead>
                    <tr>
                      <th style={{ padding: '4px 8px', textAlign: 'left', color: 'var(--text-muted)', fontWeight: 500, minWidth: 140 }}>District</th>
                      {crimeTypes.map(ct => (
                        <th key={ct} style={{
                          padding: '4px 4px', textAlign: 'center', color: 'var(--text-secondary)',
                          fontWeight: 500, writingMode: 'vertical-rl', textOrientation: 'mixed',
                          height: 80, minWidth: 40,
                        }}>
                          {ct}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {districtNames.map(distName => (
                      <tr key={distName}>
                        <td style={{ padding: '3px 8px', color: 'var(--text-secondary)', fontWeight: 500, fontSize: 12, whiteSpace: 'nowrap' }}>
                          {distName}
                        </td>
                        {crimeTypes.map(ct => {
                          const scoreObj = getScore(distName, ct)
                          const score = scoreObj?.Score
                          const color = score != null ? getRiskColor(score) : null
                          const isHovered = hoveredCell?.district === distName && hoveredCell?.crime === ct
                          const isSelected = selectedCell?.district === distName && selectedCell?.crime === ct
                          return (
                            <td key={ct}
                              onMouseEnter={() => setHoveredCell({ district: distName, crime: ct, score, date: scoreObj?.Forecast_Date })}
                              onMouseLeave={() => setHoveredCell(null)}
                              onClick={() => setSelectedCell(isSelected ? null : { district: distName, crime: ct, score, date: scoreObj?.Forecast_Date })}
                              style={{ padding: 2 }}
                            >
                              <div style={{
                                width: 36, height: 36, borderRadius: 4,
                                background: score != null ? `${color}${Math.round((score / 100) * 200 + 55).toString(16).padStart(2, '0')}` : 'var(--bg-elevated)',
                                border: `1px solid ${isSelected ? '#fff' : isHovered ? color || 'var(--border)' : 'transparent'}`,
                                display: 'flex', alignItems: 'center', justifyContent: 'center',
                                cursor: score != null ? 'pointer' : 'default',
                                transition: 'all 0.15s',
                                fontSize: 9, fontWeight: 700, color: score != null ? '#fff' : 'var(--text-muted)',
                                transform: isHovered ? 'scale(1.1)' : undefined,
                              }}>
                                {score != null ? Math.round(score) : '—'}
                              </div>
                            </td>
                          )
                        })}
                      </tr>
                    ))}
                  </tbody>
                </table>

                {/* Tooltip */}
                {(hoveredCell || selectedCell) && (
                  <div style={{
                    marginTop: 12, padding: '10px 14px',
                    background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                    borderRadius: 6, display: 'inline-flex', gap: 16, alignItems: 'center',
                  }}>
                    {(hoveredCell || selectedCell).score != null ? (
                      <>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>District</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{(hoveredCell || selectedCell).district}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Crime Type</div>
                          <div style={{ fontSize: 12, fontWeight: 600 }}>{(hoveredCell || selectedCell).crime}</div>
                        </div>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Risk Score</div>
                          <div style={{ fontSize: 16, fontWeight: 700, color: getRiskColor((hoveredCell || selectedCell).score) }}>
                            {(hoveredCell || selectedCell).score?.toFixed(1)}
                          </div>
                        </div>
                        <Badge color={getRiskColor((hoveredCell || selectedCell).score)}>
                          {getRiskLabel((hoveredCell || selectedCell).score)}
                        </Badge>
                        <div>
                          <div style={{ fontSize: 10, color: 'var(--text-muted)' }}>Forecast Date</div>
                          <div style={{ fontSize: 11 }}>{formatDate((hoveredCell || selectedCell).date)}</div>
                        </div>
                      </>
                    ) : (
                      <span style={{ fontSize: 12, color: 'var(--text-muted)' }}>No risk score data for this combination</span>
                    )}
                  </div>
                )}
              </div>

              {/* Color scale */}
              <div style={{ padding: '0 16px 16px', display: 'flex', alignItems: 'center', gap: 10 }}>
                <span style={{ fontSize: 11, color: 'var(--text-muted)' }}>Risk:</span>
                {[
                  { label: 'Low (0–30)', color: '#2ea043' },
                  { label: 'Medium (30–60)', color: '#f5c518' },
                  { label: 'High (60–80)', color: '#f0883e' },
                  { label: 'Critical (80–100)', color: '#da3633' },
                ].map(r => (
                  <div key={r.label} style={{ display: 'flex', alignItems: 'center', gap: 4 }}>
                    <div style={{ width: 12, height: 12, borderRadius: 2, background: r.color }} />
                    <span style={{ fontSize: 10, color: 'var(--text-secondary)' }}>{r.label}</span>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* All scores list */}
          <Card>
            <CardHeader title="All Risk Scores" subtitle="Sorted by score descending" />
            <div style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 12 }}>
                <thead>
                  <tr style={{ borderBottom: '1px solid var(--border)' }}>
                    {['District', 'Crime Type', 'Score', 'Level', 'Forecast Date'].map(h => (
                      <th key={h} style={{ padding: '8px 16px', textAlign: 'left', fontSize: 11, color: 'var(--text-secondary)', fontWeight: 600, textTransform: 'uppercase' }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {topRisks.map((r, i) => (
                    <tr key={i} style={{ borderBottom: '1px solid var(--border-subtle)' }}>
                      <td style={{ padding: '10px 16px', fontWeight: 500 }}>{r.districtName}</td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{r.Crime_Type}</td>
                      <td style={{ padding: '10px 16px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                          <div style={{ flex: 1, height: 4, background: 'var(--bg-elevated)', borderRadius: 2, maxWidth: 80 }}>
                            <div style={{ height: '100%', width: `${r.Score}%`, background: getRiskColor(r.Score), borderRadius: 2 }} />
                          </div>
                          <span style={{ fontWeight: 700, color: getRiskColor(r.Score), fontVariantNumeric: 'tabular-nums' }}>
                            {(r.Score || 0).toFixed(1)}
                          </span>
                        </div>
                      </td>
                      <td style={{ padding: '10px 16px' }}>
                        <Badge color={getRiskColor(r.Score)}>{getRiskLabel(r.Score)}</Badge>
                      </td>
                      <td style={{ padding: '10px 16px', color: 'var(--text-secondary)' }}>{formatDate(r.Forecast_Date)}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Card>
        </>
      )}
    </div>
  )
}
