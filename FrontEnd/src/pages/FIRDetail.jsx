import { useState, useEffect } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { firApi } from '../utils/api.js'
import { Card, CardHeader, Badge, Button, Select, Spinner, ErrorState } from '../components/shared/UI.jsx'
import { formatDate } from '../utils/helpers.js'
import { STATUS_COLORS, FIR_STATUSES } from '../constants/index.js'
import { ArrowLeft, MapPin, Calendar, Hash, Edit3, Check } from 'lucide-react'

export default function FIRDetail() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [fir, setFir] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [editingStatus, setEditingStatus] = useState(false)
  const [newStatus, setNewStatus] = useState('')
  const [saving, setSaving] = useState(false)

  useEffect(() => {
    firApi.get(id)
      .then(r => { setFir(r.data); setNewStatus(r.data.Status) })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  const saveStatus = async () => {
    setSaving(true)
    try {
      await firApi.update(id, { Status: newStatus })
      setFir(f => ({ ...f, Status: newStatus }))
      setEditingStatus(false)
    } catch (e) { alert(e.message) }
    finally { setSaving(false) }
  }

  if (loading) return <Spinner />
  if (error) return <ErrorState message={error} />
  if (!fir) return null

  return (
    <div className="fade-in" style={{ padding: 24, height: '100%', overflowY: 'auto', display: 'flex', flexDirection: 'column', gap: 16 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Button variant="ghost" size="sm" onClick={() => navigate('/firs')}>
          <ArrowLeft size={14} /> Back
        </Button>
        <h2 style={{ fontSize: 18, fontWeight: 700, fontFamily: 'var(--font-mono)' }}>{fir.FIR_Number}</h2>
        <Badge color={STATUS_COLORS[fir.Status] || 'var(--text-secondary)'}>{fir.Status}</Badge>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16 }}>
        {/* Core Details */}
        <Card>
          <CardHeader title="Incident Details" action={
            editingStatus ? (
              <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
                <Select value={newStatus} onChange={e => setNewStatus(e.target.value)} style={{ fontSize: 12 }}>
                  {FIR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
                <Button size="sm" onClick={saveStatus} disabled={saving}>
                  <Check size={12} /> Save
                </Button>
              </div>
            ) : (
              <Button variant="ghost" size="sm" onClick={() => setEditingStatus(true)}>
                <Edit3 size={12} /> Update Status
              </Button>
            )
          } />
          <div style={{ padding: 16, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <Field icon={<Hash size={14} />} label="FIR Number" value={fir.FIR_Number} mono />
            <Field icon={<Calendar size={14} />} label="Date" value={formatDate(fir.Date)} />
            <Field label="Crime Group" value={fir.Crime_Group} />
            {fir.Crime_Subgroup && <Field label="Subgroup" value={fir.Crime_Subgroup} />}
            <Field label="Station ID" value={`Station #${fir.Station_ID}`} />
            <Field icon={<MapPin size={14} />} label="Location" value={`${fir.Latitude}, ${fir.Longitude}`} mono />
          </div>
          {fir.Narrative && (
            <>
              <div style={{ height: 1, background: 'var(--border)' }} />
              <div style={{ padding: 16 }}>
                <div style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)', marginBottom: 8 }}>Narrative</div>
                <p style={{ fontSize: 13, lineHeight: 1.6, color: 'var(--text-primary)' }}>{fir.Narrative}</p>
              </div>
            </>
          )}
        </Card>

        <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
          {/* Accused */}
          <Card>
            <CardHeader title={`Accused (${fir.accused?.length || 0})`} />
            {(fir.accused || []).length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No accused linked</div>
            ) : (fir.accused || []).map((a, i) => (
              <div key={a.ROWID || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)', cursor: 'pointer',
              }} onClick={() => navigate(`/accused/${a.ROWID || a.Accused_ID}`)}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: 'var(--text-secondary)',
                }}>
                  {(a.Name || 'A')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{a.Name || `Accused #${a.Accused_ID}`}</div>
                  {a.Involvement_Type && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.Involvement_Type}</div>}
                </div>
                {a.Arrest_Count > 0 && (
                  <Badge color="var(--danger)">{a.Arrest_Count} arrests</Badge>
                )}
              </div>
            ))}
          </Card>

          {/* Victims */}
          <Card>
            <CardHeader title={`Victims (${fir.victims?.length || 0})`} />
            {(fir.victims || []).length === 0 ? (
              <div style={{ padding: 24, textAlign: 'center', color: 'var(--text-muted)', fontSize: 12 }}>No victims recorded</div>
            ) : (fir.victims || []).map((v, i) => (
              <div key={v.ROWID || i} style={{
                display: 'flex', alignItems: 'center', gap: 10,
                padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)',
              }}>
                <div style={{
                  width: 32, height: 32, borderRadius: '50%',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 13, fontWeight: 700, color: '#bc8cff',
                }}>
                  {(v.Name || 'V')[0]}
                </div>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 13, fontWeight: 500 }}>{v.Name}</div>
                  {v.Gender && <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.Gender}</div>}
                </div>
              </div>
            ))}
          </Card>
        </div>
      </div>
    </div>
  )
}

function Field({ label, value, icon, mono }) {
  return (
    <div style={{ display: 'flex', gap: 8, alignItems: 'flex-start' }}>
      {icon && <span style={{ color: 'var(--text-muted)', marginTop: 1, flexShrink: 0 }}>{icon}</span>}
      <div>
        <div style={{ fontSize: 11, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
        <div style={{ fontSize: 13, fontFamily: mono ? 'var(--font-mono)' : undefined }}>{value || '—'}</div>
      </div>
    </div>
  )
}
