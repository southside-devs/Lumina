import { useState, useEffect, useCallback, useRef } from 'react'
import { firApi, dashboardApi } from '../utils/api.js'
import { CRIME_GROUPS, FIR_STATUSES, CRIME_COLOR_MAP, KARNATAKA_CENTER } from '../constants/index.js'
import { Select, Badge, Spinner, Card } from '../components/shared/UI.jsx'
import { formatDate } from '../utils/helpers.js'
import { Layers, Filter, X, MapPin, ZoomIn, ZoomOut } from 'lucide-react'

// Hex to rgb array helper
function hexToRgb(hex) {
  const r = parseInt(hex.slice(1, 3), 16)
  const g = parseInt(hex.slice(3, 5), 16)
  const b = parseInt(hex.slice(5, 7), 16)
  return [r, g, b]
}

// Pure JS map renderer (no external map dependency needed)
// Uses SVG overlay on a styled div for Karnataka
export default function CrimeMap() {
  const [firs, setFirs] = useState([])
  const [loading, setLoading] = useState(true)
  const [selected, setSelected] = useState(null)
  const [filters, setFilters] = useState({ crime_group: '', status: '' })
  const [showFilters, setShowFilters] = useState(false)
  const [districtData, setDistrictData] = useState([])
  const [zoom, setZoom] = useState(1)
  const [pan, setPan] = useState({ x: 0, y: 0 })
  const [dragging, setDragging] = useState(false)
  const [dragStart, setDragStart] = useState(null)
  const svgRef = useRef(null)

  useEffect(() => {
    Promise.all([
      firApi.search({ limit: 500, ...filters }),
      dashboardApi.districtSummary(),
    ]).then(([fr, dr]) => {
      setFirs(fr.data || [])
      setDistrictData(dr.data || [])
    }).catch(() => {}).finally(() => setLoading(false))
  }, [filters])

  // Karnataka approximate bounding box: lat 11.5-18.5, lon 74.0-78.5
  // Map these to SVG coordinates (800x700)
  const SVG_W = 800, SVG_H = 700
  const LAT_MIN = 11.5, LAT_MAX = 18.5
  const LON_MIN = 74.0, LON_MAX = 78.5

  const toSVG = useCallback((lat, lon) => {
    const x = ((lon - LON_MIN) / (LON_MAX - LON_MIN)) * SVG_W
    const y = SVG_H - ((lat - LAT_MIN) / (LAT_MAX - LAT_MIN)) * SVG_H
    return { x, y }
  }, [])

  // Approximate Karnataka district centroids
  const DISTRICT_CENTROIDS = [
    { name: 'Bengaluru Urban', lat: 12.97, lon: 77.59 },
    { name: 'Mysuru', lat: 12.30, lon: 76.65 },
    { name: 'Tumakuru', lat: 13.34, lon: 77.10 },
    { name: 'Belagavi', lat: 15.85, lon: 74.50 },
    { name: 'Dakshina Kannada', lat: 12.86, lon: 75.23 },
    { name: 'Shivamogga', lat: 13.93, lon: 75.56 },
    { name: 'Ballari', lat: 15.14, lon: 76.92 },
    { name: 'Kalaburagi', lat: 17.33, lon: 76.82 },
    { name: 'Hassan', lat: 13.00, lon: 76.10 },
    { name: 'Dharwad', lat: 15.45, lon: 75.00 },
    { name: 'Raichur', lat: 16.21, lon: 77.36 },
    { name: 'Bidar', lat: 17.91, lon: 77.52 },
    { name: 'Vijayapura', lat: 16.83, lon: 75.72 },
    { name: 'Davangere', lat: 14.46, lon: 75.92 },
    { name: 'Uttara Kannada', lat: 14.80, lon: 74.68 },
    { name: 'Udupi', lat: 13.34, lon: 74.75 },
    { name: 'Chikkamagaluru', lat: 13.32, lon: 75.78 },
    { name: 'Kodagu', lat: 12.42, lon: 75.74 },
    { name: 'Mandya', lat: 12.52, lon: 76.90 },
    { name: 'Chamarajanagar', lat: 11.92, lon: 76.94 },
    { name: 'Kolar', lat: 13.14, lon: 78.13 },
    { name: 'Chikkaballapur', lat: 13.44, lon: 77.73 },
    { name: 'Ramanagara', lat: 12.72, lon: 77.28 },
    { name: 'Bagalkote', lat: 16.18, lon: 75.70 },
    { name: 'Gadag', lat: 15.42, lon: 75.62 },
    { name: 'Haveri', lat: 14.79, lon: 75.40 },
    { name: 'Koppal', lat: 15.35, lon: 76.15 },
    { name: 'Yadgir', lat: 16.77, lon: 77.13 },
    { name: 'Vijayanagara', lat: 15.14, lon: 76.20 },
    { name: 'Chitradurga', lat: 14.23, lon: 76.40 },
    { name: 'Tumkur', lat: 13.34, lon: 77.10 },
  ]

  const maxFirs = Math.max(...districtData.map(d => d.total_firs || 0), 1)

  const validFirs = firs.filter(f => {
    const lat = parseFloat(f.Latitude), lon = parseFloat(f.Longitude)
    return lat >= LAT_MIN && lat <= LAT_MAX && lon >= LON_MIN && lon <= LON_MAX
  })

  // Handle pan
  const handleMouseDown = (e) => {
    if (e.target.closest('.fir-dot')) return
    setDragging(true)
    setDragStart({ x: e.clientX - pan.x, y: e.clientY - pan.y })
  }
  const handleMouseMove = (e) => {
    if (!dragging) return
    setPan({ x: e.clientX - dragStart.x, y: e.clientY - dragStart.y })
  }
  const handleMouseUp = () => setDragging(false)

  const crimeGroupCounts = {}
  validFirs.forEach(f => {
    crimeGroupCounts[f.Crime_Group] = (crimeGroupCounts[f.Crime_Group] || 0) + 1
  })
  const topCrimes = Object.entries(crimeGroupCounts).sort((a, b) => b[1] - a[1]).slice(0, 6)

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Map area */}
      <div style={{ flex: 1, position: 'relative', background: '#0a0f1a', overflow: 'hidden', cursor: dragging ? 'grabbing' : 'grab' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={handleMouseUp}
      >
        {/* Grid lines (lat/lon) */}
        <svg
          ref={svgRef}
          style={{
            position: 'absolute', inset: 0, width: '100%', height: '100%',
            transform: `translate(${pan.x}px, ${pan.y}px) scale(${zoom})`,
            transformOrigin: '50% 50%',
            transition: dragging ? 'none' : 'transform 0.1s',
          }}
          viewBox={`0 0 ${SVG_W} ${SVG_H}`}
          preserveAspectRatio="xMidYMid meet"
        >
          {/* Background */}
          <rect width={SVG_W} height={SVG_H} fill="#0d1520" />

          {/* Grid lines */}
          {[12, 13, 14, 15, 16, 17, 18].map(lat => {
            const { y } = toSVG(lat, 74)
            return <line key={lat} x1={0} y1={y} x2={SVG_W} y2={y} stroke="#1a2535" strokeWidth={0.5} />
          })}
          {[74, 75, 76, 77, 78].map(lon => {
            const { x } = toSVG(12, lon)
            return <line key={lon} x1={x} y1={0} x2={x} y2={SVG_H} stroke="#1a2535" strokeWidth={0.5} />
          })}

          {/* Karnataka state outline (approximate polygon) */}
          <polygon
            points={[
              [74.0, 15.0], [74.2, 16.0], [74.5, 16.5], [74.8, 17.5],
              [75.0, 18.0], [75.5, 18.4], [76.0, 18.5], [76.5, 18.2],
              [77.0, 18.0], [77.5, 17.5], [77.8, 17.0], [77.8, 16.0],
              [78.5, 15.5], [78.3, 14.5], [78.0, 14.0], [77.6, 13.5],
              [77.8, 12.5], [77.5, 12.0], [77.0, 11.8], [76.5, 11.5],
              [76.0, 11.6], [75.5, 11.9], [75.2, 12.0], [74.8, 12.5],
              [74.3, 13.0], [74.0, 13.5], [74.0, 15.0],
            ].map(([lon, lat]) => {
              const { x, y } = toSVG(lat, lon)
              return `${x},${y}`
            }).join(' ')}
            fill="#0f1d2e"
            stroke="#1f3a5c"
            strokeWidth={1.5}
          />

          {/* District labels */}
          {DISTRICT_CENTROIDS.map(dc => {
            const { x, y } = toSVG(dc.lat, dc.lon)
            const distInfo = districtData.find(d => d.district_name?.includes(dc.name.split(' ')[0]))
            const count = distInfo?.total_firs || 0
            const intensity = count / maxFirs
            return (
              <g key={dc.name}>
                <circle
                  cx={x} cy={y} r={6 + intensity * 20}
                  fill={`rgba(31, 111, 235, ${0.1 + intensity * 0.4})`}
                  stroke={`rgba(31, 111, 235, ${0.3 + intensity * 0.5})`}
                  strokeWidth={1}
                />
                {zoom > 0.8 && (
                  <text x={x} y={y + 22} textAnchor="middle" fontSize={8} fill="#4a7ab5" fontFamily="Inter, sans-serif">
                    {dc.name}
                  </text>
                )}
              </g>
            )
          })}

          {/* FIR dots */}
          {validFirs.map((fir, i) => {
            const lat = parseFloat(fir.Latitude), lon = parseFloat(fir.Longitude)
            const { x, y } = toSVG(lat, lon)
            const color = CRIME_COLOR_MAP[fir.Crime_Group] || '#1f6feb'
            const rgb = hexToRgb(color)
            const isSelected = selected?.ROWID === fir.ROWID
            return (
              <g key={fir.ROWID || i} className="fir-dot"
                onClick={(e) => { e.stopPropagation(); setSelected(isSelected ? null : fir) }}
                style={{ cursor: 'pointer' }}>
                {isSelected && (
                  <circle cx={x} cy={y} r={12} fill="none" stroke={color} strokeWidth={2} opacity={0.6}>
                    <animate attributeName="r" values="8;16;8" dur="1.5s" repeatCount="indefinite" />
                    <animate attributeName="opacity" values="0.6;0;0.6" dur="1.5s" repeatCount="indefinite" />
                  </circle>
                )}
                <circle
                  cx={x} cy={y} r={isSelected ? 6 : 4}
                  fill={color}
                  fillOpacity={0.85}
                  stroke={isSelected ? '#fff' : 'rgba(0,0,0,0.4)'}
                  strokeWidth={isSelected ? 1.5 : 0.5}
                />
              </g>
            )
          })}
        </svg>

        {/* Zoom controls */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          <button onClick={() => setZoom(z => Math.min(z + 0.3, 4))} style={{
            width: 32, height: 32, borderRadius: 6, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><ZoomIn size={14} /></button>
          <button onClick={() => setZoom(z => Math.max(z - 0.3, 0.5))} style={{
            width: 32, height: 32, borderRadius: 6, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', color: 'var(--text-primary)',
            display: 'flex', alignItems: 'center', justifyContent: 'center', cursor: 'pointer',
          }}><ZoomOut size={14} /></button>
          <button onClick={() => { setZoom(1); setPan({ x: 0, y: 0 }) }} style={{
            width: 32, height: 32, borderRadius: 6, background: 'var(--bg-surface)',
            border: '1px solid var(--border)', color: 'var(--text-secondary)',
            fontSize: 10, cursor: 'pointer',
          }}>1:1</button>
        </div>

        {/* Compass */}
        <div style={{ position: 'absolute', top: 16, left: 16, fontSize: 10, color: '#2a4a6b', fontFamily: 'monospace' }}>
          <div style={{ textAlign: 'center' }}>N</div>
          <div>W ✛ E</div>
          <div style={{ textAlign: 'center' }}>S</div>
        </div>

        {/* Scale indicator */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
          <div style={{ width: 60, height: 2, background: 'var(--text-muted)' }} />
          <span style={{ fontSize: 10, color: 'var(--text-muted)' }}>~50 km</span>
        </div>

        {/* Loading overlay */}
        {loading && (
          <div style={{ position: 'absolute', inset: 0, background: 'rgba(13,17,23,0.7)', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
            <Spinner />
          </div>
        )}

        {/* Selected FIR tooltip */}
        {selected && (
          <div style={{
            position: 'absolute', bottom: 24, left: '50%', transform: 'translateX(-50%)',
            background: 'var(--bg-surface)', border: '1px solid var(--border)',
            borderRadius: 8, padding: '12px 16px', minWidth: 280,
            boxShadow: '0 8px 32px rgba(0,0,0,0.4)',
            display: 'flex', alignItems: 'flex-start', gap: 10,
          }}>
            <MapPin size={16} color={CRIME_COLOR_MAP[selected.Crime_Group] || 'var(--accent)'} style={{ flexShrink: 0, marginTop: 2 }} />
            <div style={{ flex: 1 }}>
              <div style={{ fontWeight: 600, fontSize: 13, fontFamily: 'var(--font-mono)' }}>{selected.FIR_Number}</div>
              <div style={{ fontSize: 12, color: 'var(--text-secondary)', marginTop: 2 }}>{selected.Crime_Group}</div>
              <div style={{ fontSize: 11, color: 'var(--text-muted)', marginTop: 4 }}>
                {formatDate(selected.Date)} · {selected.Latitude}, {selected.Longitude}
              </div>
              <Badge color={CRIME_COLOR_MAP[selected.Crime_Group] || 'var(--accent)'} style={{ marginTop: 6 }}>
                {selected.Status}
              </Badge>
            </div>
            <button onClick={() => setSelected(null)} style={{ background: 'none', border: 'none', cursor: 'pointer', color: 'var(--text-muted)', padding: 0 }}>
              <X size={14} />
            </button>
          </div>
        )}
      </div>

      {/* Side panel */}
      <div style={{
        width: 280, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)',
        display: 'flex', flexDirection: 'column', overflow: 'hidden',
      }}>
        {/* Filters */}
        <div style={{ padding: 16, borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
            <Filter size={14} /> Filters
          </div>
          <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
            <Select value={filters.crime_group} onChange={e => setFilters(f => ({ ...f, crime_group: e.target.value }))}>
              <option value="">All Crime Groups</option>
              {CRIME_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
            </Select>
            <Select value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))}>
              <option value="">All Statuses</option>
              {FIR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
            </Select>
          </div>
        </div>

        {/* Stats */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 8 }}>VISIBLE INCIDENTS</div>
          <div style={{ fontSize: 28, fontWeight: 700, color: 'var(--accent)', lineHeight: 1 }}>{validFirs.length}</div>
          <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 4 }}>of {firs.length} total loaded</div>
        </div>

        {/* Crime breakdown */}
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>TOP CRIME TYPES</div>
          {topCrimes.map(([crime, count]) => (
            <div key={crime} style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
              <div style={{ width: 8, height: 8, borderRadius: '50%', background: CRIME_COLOR_MAP[crime] || 'var(--accent)', flexShrink: 0 }} />
              <div style={{ flex: 1, fontSize: 11, color: 'var(--text-secondary)', overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
                {crime}
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: 'var(--text-primary)', fontVariantNumeric: 'tabular-nums' }}>{count}</span>
            </div>
          ))}
        </div>

        {/* Legend */}
        <div style={{ padding: '12px 16px' }}>
          <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 10 }}>LEGEND</div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ width: 10, height: 10, borderRadius: '50%', background: 'var(--accent)', opacity: 0.2 }} />
            District density (choropleth)
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#da3633' }} />
            High-severity crime
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 11, color: 'var(--text-secondary)' }}>
            <div style={{ width: 8, height: 8, borderRadius: '50%', background: '#f5c518' }} />
            Property crime
          </div>

          <div style={{ marginTop: 16, padding: 10, background: 'var(--warning-bg)', border: '1px solid var(--warning)', borderRadius: 6 }}>
            <div style={{ fontSize: 10, color: 'var(--warning)', fontWeight: 600, marginBottom: 4 }}>🔥 Hotspot Analysis</div>
            <div style={{ fontSize: 10, color: 'var(--text-secondary)' }}>
              ST-DBSCAN clustering available when ML pipeline is connected.
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
