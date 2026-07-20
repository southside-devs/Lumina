import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { firApi, stationApi, districtApi } from '../utils/api.js'
import { Card, Table, Pagination, Button, Select, Input, Badge, Spinner, EmptyState } from '../components/shared/UI.jsx'
import { formatDate } from '../utils/helpers.js'
import { STATUS_COLORS, CRIME_GROUPS, FIR_STATUSES } from '../constants/index.js'
import { PlusCircle, Search, RefreshCw } from 'lucide-react'

const LIMIT = 50

export default function FIRList() {
  const navigate = useNavigate()
  const [firs, setFirs] = useState([])
  const [total, setTotal] = useState(0)
  const [offset, setOffset] = useState(0)
  const [loading, setLoading] = useState(true)
  const [stations, setStations] = useState([])
  const [filters, setFilters] = useState({ station_id: '', crime_group: '', status: '', date_from: '', date_to: '' })

  useEffect(() => { stationApi.list().then(r => setStations(r.data || [])).catch(() => {}) }, [])

  const load = useCallback((off = 0) => {
    setLoading(true)
    const params = { limit: LIMIT, offset: off }
    Object.entries(filters).forEach(([k, v]) => { if (v) params[k] = v })
    firApi.list(params)
      .then(r => { setFirs(r.data || []); setTotal(r.meta?.total || 0) })
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [filters])

  useEffect(() => { load(0); setOffset(0) }, [filters])

  const columns = [
    { key: 'FIR_Number', label: 'FIR No.', render: v => <span style={{ fontFamily: 'var(--font-mono)', fontSize: 12 }}>{v}</span> },
    { key: 'Date', label: 'Date', render: v => formatDate(v) },
    { key: 'Crime_Group', label: 'Crime Group', render: v => (
      <Badge color={STATUS_COLORS[v] || 'var(--accent)'}>{v}</Badge>
    )},
    { key: 'Crime_Subgroup', label: 'Subgroup' },
    { key: 'Status', label: 'Status', render: v => (
      <Badge color={STATUS_COLORS[v] || 'var(--text-secondary)'}>{v}</Badge>
    )},
    { key: 'Station_ID', label: 'Station', render: v => {
      const s = stations.find(st => st.ROWID === v)
      return s?.Name || `Station #${v}`
    }},
  ]

  return (
    <div className="fade-in" style={{ padding: 24, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      {/* Filters */}
      <Card style={{ padding: 16 }}>
        <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap', alignItems: 'flex-end' }}>
          <Select label="Station" value={filters.station_id} onChange={e => setFilters(f => ({ ...f, station_id: e.target.value }))} style={{ minWidth: 160 }}>
            <option value="">All Stations</option>
            {stations.map(s => <option key={s.ROWID} value={s.ROWID}>{s.Name}</option>)}
          </Select>
          <Select label="Crime Group" value={filters.crime_group} onChange={e => setFilters(f => ({ ...f, crime_group: e.target.value }))} style={{ minWidth: 180 }}>
            <option value="">All Crimes</option>
            {CRIME_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
          </Select>
          <Select label="Status" value={filters.status} onChange={e => setFilters(f => ({ ...f, status: e.target.value }))} style={{ minWidth: 150 }}>
            <option value="">All Statuses</option>
            {FIR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
          </Select>
          <Input label="From Date" type="date" value={filters.date_from} onChange={e => setFilters(f => ({ ...f, date_from: e.target.value }))} />
          <Input label="To Date" type="date" value={filters.date_to} onChange={e => setFilters(f => ({ ...f, date_to: e.target.value }))} />
          <Button variant="ghost" onClick={() => setFilters({ station_id: '', crime_group: '', status: '', date_from: '', date_to: '' })}>
            <RefreshCw size={13} /> Clear
          </Button>
          <div style={{ flex: 1 }} />
          <Button onClick={() => navigate('/firs/new')}>
            <PlusCircle size={14} /> File New FIR
          </Button>
        </div>
      </Card>

      {/* Table */}
      <Card style={{ flex: 1, overflow: 'hidden', display: 'flex', flexDirection: 'column' }}>
        <div style={{ padding: '12px 16px', borderBottom: '1px solid var(--border)', fontSize: 12, color: 'var(--text-secondary)' }}>
          {total > 0 ? `${total} cases found` : 'No cases found'}
        </div>
        {loading ? <Spinner /> : firs.length === 0 ? (
          <EmptyState message="No cases match the current filters. Try widening your search." icon="📋" />
        ) : (
          <>
            <div style={{ flex: 1, overflowY: 'auto' }}>
              <Table columns={columns} rows={firs} onRowClick={row => navigate(`/firs/${row.ROWID}`)} />
            </div>
            <Pagination total={total} limit={LIMIT} offset={offset} onChange={off => { setOffset(off); load(off) }} />
          </>
        )}
      </Card>
    </div>
  )
}
