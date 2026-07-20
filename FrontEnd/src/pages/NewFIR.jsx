import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { firApi, stationApi, districtApi, accusedApi, caseAccusedApi, victimApi } from '../utils/api.js'
import { Card, CardHeader, Button, Input, Select, Badge } from '../components/shared/UI.jsx'
import { CRIME_GROUPS, FIR_STATUSES, GENDERS, INVOLVEMENT_TYPES, SES_LEVELS } from '../constants/index.js'
import { Check, ChevronRight, Trash2, UserPlus, Heart } from 'lucide-react'

const STEPS = ['Incident Details', 'Accused', 'Victims', 'Review & Submit']

export default function NewFIR() {
  const navigate = useNavigate()
  const [step, setStep] = useState(0)
  const [districts, setDistricts] = useState([])
  const [stations, setStations] = useState([])
  const [firId, setFirId] = useState(null)
  const [submitting, setSubmitting] = useState(false)
  const [errors, setErrors] = useState({})

  // Step 1
  const [firData, setFirData] = useState({
    District_ID: '', Station_ID: '', FIR_Number: '', Date: '',
    Crime_Group: '', Crime_Subgroup: '', Latitude: '', Longitude: '',
    Narrative: '', Status: 'Under Investigation',
  })

  // Step 2
  const [accusedList, setAccusedList] = useState([])
  const [currentAccused, setCurrentAccused] = useState({ Name: '', DOB: '', Gender: '', Occupation: '', Involvement_Type: 'Primary' })

  // Step 3
  const [victimList, setVictimList] = useState([])
  const [currentVictim, setCurrentVictim] = useState({ Name: '', DOB: '', Gender: '', Socioeconomic_Status: '' })

  useEffect(() => { districtApi.list().then(r => setDistricts(r.data || [])) }, [])
  useEffect(() => {
    if (firData.District_ID) stationApi.list(firData.District_ID).then(r => setStations(r.data || []))
  }, [firData.District_ID])

  const validateStep1 = () => {
    const e = {}
    if (!firData.FIR_Number) e.FIR_Number = 'Required'
    if (!firData.Date) e.Date = 'Required'
    if (!firData.Crime_Group) e.Crime_Group = 'Required'
    if (!firData.Station_ID) e.Station_ID = 'Required'
    const lat = parseFloat(firData.Latitude), lon = parseFloat(firData.Longitude)
    if (!firData.Latitude || lat < 11.5 || lat > 18.5) e.Latitude = 'Must be 11.5–18.5 (Karnataka)'
    if (!firData.Longitude || lon < 74.0 || lon > 78.5) e.Longitude = 'Must be 74.0–78.5 (Karnataka)'
    setErrors(e)
    return Object.keys(e).length === 0
  }

  const submitStep1 = async () => {
    if (!validateStep1()) return
    setSubmitting(true)
    try {
      const r = await firApi.create({
        ...firData,
        Station_ID: parseInt(firData.Station_ID),
        Latitude: parseFloat(firData.Latitude),
        Longitude: parseFloat(firData.Longitude),
      })
      const newId = r.data?.ROWID || r.data?.[0]?.ROWID
      setFirId(newId)
      setStep(1)
    } catch (e) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  const addAccused = async () => {
    if (!currentAccused.Name) return
    setSubmitting(true)
    try {
      const ar = await accusedApi.create(currentAccused)
      const accId = ar.data?.ROWID || ar.data?.[0]?.ROWID
      await caseAccusedApi.create({ FIR_ID: firId, Accused_ID: accId, Involvement_Type: currentAccused.Involvement_Type })
      setAccusedList(l => [...l, { ...currentAccused, ROWID: accId }])
      setCurrentAccused({ Name: '', DOB: '', Gender: '', Occupation: '', Involvement_Type: 'Primary' })
    } catch (e) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  const addVictim = async () => {
    if (!currentVictim.Name) return
    setSubmitting(true)
    try {
      const vr = await victimApi.create({ ...currentVictim, FIR_ID: firId })
      setVictimList(l => [...l, { ...currentVictim, ROWID: vr.data?.ROWID }])
      setCurrentVictim({ Name: '', DOB: '', Gender: '', Socioeconomic_Status: '' })
    } catch (e) { alert(e.message) }
    finally { setSubmitting(false) }
  }

  const finish = () => navigate(`/firs/${firId}`)

  return (
    <div className="fade-in" style={{ padding: 24, height: '100%', overflowY: 'auto' }}>
      {/* Step indicator */}
      <div style={{ display: 'flex', gap: 0, marginBottom: 24, alignItems: 'center' }}>
        {STEPS.map((s, i) => (
          <div key={i} style={{ display: 'flex', alignItems: 'center' }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 8, padding: '6px 12px',
              borderRadius: 6, fontSize: 12, fontWeight: 500,
              background: i === step ? 'var(--accent-bg)' : 'transparent',
              color: i === step ? 'var(--accent)' : i < step ? 'var(--success)' : 'var(--text-muted)',
              border: i === step ? '1px solid var(--accent)' : '1px solid transparent',
            }}>
              <div style={{
                width: 20, height: 20, borderRadius: '50%', fontSize: 11, fontWeight: 700,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                background: i < step ? 'var(--success)' : i === step ? 'var(--accent)' : 'var(--bg-elevated)',
                color: i <= step ? '#fff' : 'var(--text-muted)',
              }}>
                {i < step ? <Check size={11} /> : i + 1}
              </div>
              {s}
            </div>
            {i < STEPS.length - 1 && <ChevronRight size={14} color="var(--text-muted)" />}
          </div>
        ))}
      </div>

      {/* Step 1 */}
      {step === 0 && (
        <Card style={{ maxWidth: 680 }}>
          <CardHeader title="Incident Details" />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
              <Select label="District" value={firData.District_ID} error={errors.District_ID}
                onChange={e => setFirData(d => ({ ...d, District_ID: e.target.value, Station_ID: '' }))}>
                <option value="">Select District</option>
                {districts.map(d => <option key={d.ROWID} value={d.ROWID}>{d.Name}</option>)}
              </Select>
              <Select label="Station *" value={firData.Station_ID} error={errors.Station_ID}
                onChange={e => setFirData(d => ({ ...d, Station_ID: e.target.value }))}
                disabled={!firData.District_ID}>
                <option value="">Select Station</option>
                {stations.map(s => <option key={s.ROWID} value={s.ROWID}>{s.Name}</option>)}
              </Select>
              <Input label="FIR Number *" placeholder="CR-001/2026" value={firData.FIR_Number} error={errors.FIR_Number}
                onChange={e => setFirData(d => ({ ...d, FIR_Number: e.target.value }))} />
              <Input label="Date *" type="date" value={firData.Date} error={errors.Date}
                onChange={e => setFirData(d => ({ ...d, Date: e.target.value }))} />
              <Select label="Crime Group *" value={firData.Crime_Group} error={errors.Crime_Group}
                onChange={e => setFirData(d => ({ ...d, Crime_Group: e.target.value }))}>
                <option value="">Select Crime Group</option>
                {CRIME_GROUPS.map(g => <option key={g} value={g}>{g}</option>)}
              </Select>
              <Input label="Crime Subgroup" value={firData.Crime_Subgroup}
                onChange={e => setFirData(d => ({ ...d, Crime_Subgroup: e.target.value }))} />
              <Input label="Latitude * (11.5–18.5)" type="number" step="0.0001" placeholder="12.9716"
                value={firData.Latitude} error={errors.Latitude}
                onChange={e => setFirData(d => ({ ...d, Latitude: e.target.value }))} />
              <Input label="Longitude * (74.0–78.5)" type="number" step="0.0001" placeholder="77.5946"
                value={firData.Longitude} error={errors.Longitude}
                onChange={e => setFirData(d => ({ ...d, Longitude: e.target.value }))} />
              <Select label="Status" value={firData.Status}
                onChange={e => setFirData(d => ({ ...d, Status: e.target.value }))}>
                {FIR_STATUSES.map(s => <option key={s} value={s}>{s}</option>)}
              </Select>
            </div>
            <div style={{ display: 'flex', flexDirection: 'column', gap: 4 }}>
              <label style={{ fontSize: 12, fontWeight: 500, color: 'var(--text-secondary)' }}>Narrative</label>
              <textarea
                value={firData.Narrative}
                onChange={e => setFirData(d => ({ ...d, Narrative: e.target.value }))}
                rows={4}
                placeholder="Describe the incident..."
                style={{
                  padding: '8px 12px', borderRadius: 6, resize: 'vertical',
                  background: 'var(--bg-elevated)', border: '1px solid var(--border)',
                  color: 'var(--text-primary)', fontSize: 13, fontFamily: 'var(--font-sans)',
                }}
              />
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: 4 }}>
              <Button onClick={submitStep1} disabled={submitting}>
                {submitting ? 'Saving...' : 'Save & Continue →'}
              </Button>
            </div>
          </div>
        </Card>
      )}

      {/* Step 2 - Accused */}
      {step === 1 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          <Card>
            <CardHeader title="Add Accused" subtitle="Add one or more accused persons" />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Name *" value={currentAccused.Name} onChange={e => setCurrentAccused(a => ({ ...a, Name: e.target.value }))} />
                <Input label="Date of Birth" type="date" value={currentAccused.DOB} onChange={e => setCurrentAccused(a => ({ ...a, DOB: e.target.value }))} />
                <Select label="Gender" value={currentAccused.Gender} onChange={e => setCurrentAccused(a => ({ ...a, Gender: e.target.value }))}>
                  <option value="">Select</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
                <Input label="Occupation" value={currentAccused.Occupation} onChange={e => setCurrentAccused(a => ({ ...a, Occupation: e.target.value }))} />
                <Select label="Involvement Type" value={currentAccused.Involvement_Type} onChange={e => setCurrentAccused(a => ({ ...a, Involvement_Type: e.target.value }))}>
                  {INVOLVEMENT_TYPES.map(t => <option key={t} value={t}>{t}</option>)}
                </Select>
              </div>
              <Button onClick={addAccused} disabled={submitting || !currentAccused.Name}>
                <UserPlus size={14} /> Add Accused
              </Button>
            </div>
          </Card>

          {accusedList.length > 0 && (
            <Card>
              <CardHeader title={`Added Accused (${accusedList.length})`} />
              {accusedList.map((a, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-elevated)', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12 }}>
                    {a.Name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{a.Name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{a.Involvement_Type} · {a.Gender || 'Unknown gender'}</div>
                  </div>
                  <Badge color="var(--warning)">{a.Involvement_Type}</Badge>
                </div>
              ))}
            </Card>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setStep(2)}>Skip this step</Button>
            <Button onClick={() => setStep(2)}>Continue to Victims →</Button>
          </div>
        </div>
      )}

      {/* Step 3 - Victims */}
      {step === 2 && (
        <div style={{ display: 'flex', flexDirection: 'column', gap: 16, maxWidth: 680 }}>
          <Card>
            <CardHeader title="Add Victims" subtitle="Link victims to this FIR" />
            <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 12 }}>
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                <Input label="Name *" value={currentVictim.Name} onChange={e => setCurrentVictim(v => ({ ...v, Name: e.target.value }))} />
                <Input label="Date of Birth" type="date" value={currentVictim.DOB} onChange={e => setCurrentVictim(v => ({ ...v, DOB: e.target.value }))} />
                <Select label="Gender" value={currentVictim.Gender} onChange={e => setCurrentVictim(v => ({ ...v, Gender: e.target.value }))}>
                  <option value="">Select</option>
                  {GENDERS.map(g => <option key={g} value={g}>{g}</option>)}
                </Select>
                <Select label="Socioeconomic Status" value={currentVictim.Socioeconomic_Status} onChange={e => setCurrentVictim(v => ({ ...v, Socioeconomic_Status: e.target.value }))}>
                  <option value="">Select</option>
                  {SES_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                </Select>
              </div>
              <Button onClick={addVictim} disabled={submitting || !currentVictim.Name}>
                <Heart size={14} /> Add Victim
              </Button>
            </div>
          </Card>

          {victimList.length > 0 && (
            <Card>
              <CardHeader title={`Added Victims (${victimList.length})`} />
              {victimList.map((v, i) => (
                <div key={i} style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '10px 16px', borderBottom: '1px solid var(--border-subtle)' }}>
                  <div style={{ width: 30, height: 30, borderRadius: '50%', background: 'var(--bg-elevated)', border: '1px solid #bc8cff44', display: 'flex', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 12, color: '#bc8cff' }}>
                    {v.Name[0]}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ fontSize: 13, fontWeight: 500 }}>{v.Name}</div>
                    <div style={{ fontSize: 11, color: 'var(--text-secondary)' }}>{v.Gender} · {v.Socioeconomic_Status}</div>
                  </div>
                </div>
              ))}
            </Card>
          )}

          <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end' }}>
            <Button variant="ghost" onClick={() => setStep(3)}>Skip</Button>
            <Button onClick={() => setStep(3)}>Review & Submit →</Button>
          </div>
        </div>
      )}

      {/* Step 4 - Review */}
      {step === 3 && (
        <Card style={{ maxWidth: 680 }}>
          <CardHeader title="Review & Confirm" />
          <div style={{ padding: 20, display: 'flex', flexDirection: 'column', gap: 16 }}>
            <div style={{
              background: 'var(--success-bg)', border: '1px solid var(--success)',
              borderRadius: 8, padding: 16, display: 'flex', alignItems: 'center', gap: 12,
            }}>
              <Check size={20} color="var(--success)" />
              <div>
                <div style={{ fontWeight: 600 }}>FIR Filed Successfully</div>
                <div style={{ fontSize: 12, color: 'var(--text-secondary)', fontFamily: 'var(--font-mono)', marginTop: 2 }}>
                  {firData.FIR_Number} · ID: {firId}
                </div>
              </div>
            </div>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 12 }}>
              <SummaryCard label="Crime Group" value={firData.Crime_Group} />
              <SummaryCard label="Date" value={firData.Date} />
              <SummaryCard label="Status" value={firData.Status} />
              <SummaryCard label="Accused Added" value={accusedList.length} />
              <SummaryCard label="Victims Added" value={victimList.length} />
            </div>
            <div style={{ display: 'flex', gap: 10, justifyContent: 'flex-end', marginTop: 8 }}>
              <Button variant="secondary" onClick={() => navigate('/firs')}>Back to Case List</Button>
              <Button onClick={finish}>View Full FIR →</Button>
            </div>
          </div>
        </Card>
      )}
    </div>
  )
}

function SummaryCard({ label, value }) {
  return (
    <div style={{ background: 'var(--bg-elevated)', borderRadius: 6, padding: '10px 14px' }}>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 4 }}>{label}</div>
      <div style={{ fontSize: 14, fontWeight: 600 }}>{value}</div>
    </div>
  )
}
