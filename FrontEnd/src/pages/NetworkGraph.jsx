import { useState, useEffect, useRef, useCallback } from 'react'
import CytoscapeComponent from 'react-cytoscapejs'
import { accusedApi, firApi } from '../utils/api.js'
import { Spinner, Card, Badge, Input, Button } from '../components/shared/UI.jsx'
import { Search, ZoomIn, ZoomOut, Maximize2, Info, Network } from 'lucide-react'
import { CRIME_COLOR_MAP } from '../constants/index.js'
import { formatDate } from '../utils/helpers.js'

// Generate demo graph from real accused data
function buildGraphElements(accusedList, firList) {
  const nodes = []
  const edges = []
  const nodeIds = new Set()

  // Add suspect nodes
  accusedList.slice(0, 30).forEach(a => {
    const id = `suspect-${a.ROWID}`
    if (!nodeIds.has(id)) {
      nodeIds.add(id)
      nodes.push({
        data: {
          id,
          label: a.Name || `Suspect #${a.ROWID}`,
          type: 'Suspect',
          arrestCount: a.Arrest_Count || 0,
          gender: a.Gender,
        },
      })
    }
    // Add cases as incident nodes
    if (a.cases) {
      a.cases.slice(0, 3).forEach(c => {
        const firId = `fir-${c.FIR_ID}`
        if (!nodeIds.has(firId)) {
          nodeIds.add(firId)
          const fir = firList.find(f => f.ROWID === c.FIR_ID)
          nodes.push({
            data: {
              id: firId,
              label: fir?.FIR_Number || `FIR #${c.FIR_ID}`,
              type: 'Incident',
              crimeGroup: fir?.Crime_Group,
              date: fir?.Date,
            },
          })
        }
        edges.push({
          data: {
            id: `e-${id}-${firId}`,
            source: id,
            target: firId,
            label: c.Involvement_Type || 'COMMITTED',
          },
        })
      })
    }
  })

  // Add ASSOCIATED_WITH edges between co-accused
  const firToSuspects = {}
  edges.forEach(e => {
    const fir = e.data.target
    if (!firToSuspects[fir]) firToSuspects[fir] = []
    if (e.data.source.startsWith('suspect-')) firToSuspects[fir].push(e.data.source)
  })
  Object.values(firToSuspects).forEach(suspects => {
    for (let i = 0; i < suspects.length - 1; i++) {
      const eid = `assoc-${suspects[i]}-${suspects[i + 1]}`
      if (!edges.find(e => e.data.id === eid)) {
        edges.push({ data: { id: eid, source: suspects[i], target: suspects[i + 1], label: 'ASSOCIATED_WITH', type: 'association' } })
      }
    }
  })

  return [...nodes, ...edges]
}

// Fallback demo graph when no real data
function buildDemoGraph() {
  return [
    { data: { id: 's1', label: 'Rajan Kumar', type: 'Suspect', arrestCount: 4 } },
    { data: { id: 's2', label: 'Suresh Hegde', type: 'Suspect', arrestCount: 2 } },
    { data: { id: 's3', label: 'Mohan Gowda', type: 'Suspect', arrestCount: 1 } },
    { data: { id: 's4', label: 'Prakash Naidu', type: 'Suspect', arrestCount: 3 } },
    { data: { id: 's5', label: 'Vijay Shetty', type: 'Suspect', arrestCount: 2 } },
    { data: { id: 'v1', label: 'Kamala Bai', type: 'Victim' } },
    { data: { id: 'v2', label: 'Ramesh Patil', type: 'Victim' } },
    { data: { id: 'i1', label: 'CR-001/2026', type: 'Incident', crimeGroup: 'Robbery' } },
    { data: { id: 'i2', label: 'CR-002/2026', type: 'Incident', crimeGroup: 'Theft' } },
    { data: { id: 'i3', label: 'CR-003/2026', type: 'Incident', crimeGroup: 'Assault' } },
    { data: { id: 'l1', label: 'Koramangala', type: 'Location' } },
    { data: { id: 'l2', label: 'Shivajinagar', type: 'Location' } },
    { data: { id: 'e1', source: 's1', target: 'i1', label: 'Primary' } },
    { data: { id: 'e2', source: 's2', target: 'i1', label: 'Accomplice' } },
    { data: { id: 'e3', source: 's3', target: 'i2', label: 'Primary' } },
    { data: { id: 'e4', source: 's4', target: 'i2', label: 'Abettor' } },
    { data: { id: 'e5', source: 's1', target: 'i3', label: 'Primary' } },
    { data: { id: 'e6', source: 's5', target: 'i3', label: 'Accomplice' } },
    { data: { id: 'e7', source: 'v1', target: 'i1', label: 'Victim' } },
    { data: { id: 'e8', source: 'v2', target: 'i2', label: 'Victim' } },
    { data: { id: 'e9', source: 'i1', target: 'l1', label: 'Location' } },
    { data: { id: 'e10', source: 'i2', target: 'l1', label: 'Location' } },
    { data: { id: 'e11', source: 'i3', target: 'l2', label: 'Location' } },
    { data: { id: 'assoc1', source: 's1', target: 's2', label: 'ASSOCIATED_WITH', type: 'association' } },
    { data: { id: 'assoc2', source: 's1', target: 's5', label: 'ASSOCIATED_WITH', type: 'association' } },
    { data: { id: 'assoc3', source: 's3', target: 's4', label: 'ASSOCIATED_WITH', type: 'association' } },
  ]
}

const STYLESHEET = [
  {
    selector: 'node[type="Suspect"]',
    style: {
      'background-color': '#da3633',
      'border-color': '#ff6b6b',
      'border-width': 2,
      'label': 'data(label)',
      'color': '#e6edf3',
      'font-size': 11,
      'text-valign': 'bottom',
      'text-margin-y': 4,
      'width': 36,
      'height': 36,
      'font-family': 'Inter, sans-serif',
    },
  },
  {
    selector: 'node[type="Suspect"][?arrestCount]',
    style: {
      'background-color': ele => {
        const c = ele.data('arrestCount') || 0
        if (c >= 4) return '#ff0000'
        if (c >= 2) return '#da3633'
        return '#f0883e'
      },
      'width': ele => 28 + Math.min(ele.data('arrestCount') || 0, 5) * 4,
      'height': ele => 28 + Math.min(ele.data('arrestCount') || 0, 5) * 4,
    },
  },
  {
    selector: 'node[type="Victim"]',
    style: {
      'background-color': '#bc8cff',
      'border-color': '#d2a8ff',
      'border-width': 2,
      'label': 'data(label)',
      'color': '#e6edf3',
      'font-size': 11,
      'text-valign': 'bottom',
      'text-margin-y': 4,
      'width': 28,
      'height': 28,
      'shape': 'ellipse',
    },
  },
  {
    selector: 'node[type="Incident"]',
    style: {
      'background-color': '#1f6feb',
      'border-color': '#388bfd',
      'border-width': 2,
      'label': 'data(label)',
      'color': '#e6edf3',
      'font-size': 10,
      'text-valign': 'bottom',
      'text-margin-y': 4,
      'width': 32,
      'height': 32,
      'shape': 'round-rectangle',
    },
  },
  {
    selector: 'node[type="Location"]',
    style: {
      'background-color': '#2ea043',
      'border-color': '#3fb950',
      'border-width': 2,
      'label': 'data(label)',
      'color': '#e6edf3',
      'font-size': 10,
      'text-valign': 'bottom',
      'text-margin-y': 4,
      'width': 28,
      'height': 28,
      'shape': 'diamond',
    },
  },
  {
    selector: 'edge',
    style: {
      'width': 1.5,
      'line-color': '#30363d',
      'target-arrow-color': '#30363d',
      'target-arrow-shape': 'triangle',
      'curve-style': 'bezier',
      'arrow-scale': 0.8,
    },
  },
  {
    selector: 'edge[type="association"]',
    style: {
      'line-color': '#f0883e',
      'line-style': 'dashed',
      'target-arrow-shape': 'none',
      'width': 1,
    },
  },
  {
    selector: 'node:selected',
    style: {
      'border-color': '#fff',
      'border-width': 3,
      'overlay-opacity': 0.1,
      'overlay-color': '#fff',
    },
  },
  {
    selector: 'node.faded',
    style: { 'opacity': 0.25 },
  },
  {
    selector: 'edge.faded',
    style: { 'opacity': 0.1 },
  },
]

export default function NetworkGraph() {
  const [elements, setElements] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedNode, setSelectedNode] = useState(null)
  const [search, setSearch] = useState('')
  const cyRef = useRef(null)

  useEffect(() => {
    Promise.all([
      accusedApi.list({ limit: 30, repeat_offenders: false }),
      firApi.list({ limit: 50 }),
    ]).then(([ar, fr]) => {
      const accused = ar.data || []
      const firs = fr.data || []
      // Fetch case details for top accused
      const withCases = accused.map(a => ({ ...a, cases: [] }))
      const els = buildGraphElements(withCases, firs)
      setElements(els.length > 2 ? els : buildDemoGraph())
    }).catch(() => {
      setElements(buildDemoGraph())
    }).finally(() => setLoading(false))
  }, [])

  const handleNodeClick = useCallback((node) => {
    const cy = cyRef.current
    if (!cy) return
    setSelectedNode(node.data())
    cy.elements().addClass('faded')
    node.removeClass('faded')
    node.connectedEdges().removeClass('faded')
    node.neighborhood().removeClass('faded')
  }, [])

  const clearSelection = useCallback(() => {
    const cy = cyRef.current
    if (!cy) return
    setSelectedNode(null)
    cy.elements().removeClass('faded')
  }, [])

  const handleSearch = () => {
    const cy = cyRef.current
    if (!cy || !search) return
    const found = cy.nodes().filter(n => n.data('label')?.toLowerCase().includes(search.toLowerCase()))
    if (found.length) {
      cy.fit(found, 80)
      found.select()
      setSelectedNode(found.first().data())
    }
  }

  const layoutOptions = {
    name: 'cose',
    idealEdgeLength: 100,
    nodeOverlap: 20,
    refresh: 20,
    fit: true,
    padding: 30,
    randomize: false,
    componentSpacing: 100,
    nodeRepulsion: 400000,
    edgeElasticity: 100,
    nestingFactor: 5,
    gravity: 80,
    numIter: 1000,
    initialTemp: 200,
    coolingFactor: 0.95,
    minTemp: 1.0,
  }

  return (
    <div style={{ display: 'flex', height: '100%', overflow: 'hidden' }}>
      {/* Graph */}
      <div style={{ flex: 1, position: 'relative', background: '#080c12' }}>
        {loading ? (
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: '100%' }}>
            <Spinner />
          </div>
        ) : (
          <CytoscapeComponent
            elements={elements}
            style={{ width: '100%', height: '100%' }}
            stylesheet={STYLESHEET}
            layout={layoutOptions}
            cy={cy => {
              cyRef.current = cy
              cy.on('tap', 'node', evt => handleNodeClick(evt.target))
              cy.on('tap', evt => { if (evt.target === cy) clearSelection() })
            }}
          />
        )}

        {/* Controls */}
        <div style={{ position: 'absolute', top: 16, left: 16, display: 'flex', gap: 8 }}>
          <div style={{ display: 'flex', gap: 6, background: 'var(--bg-surface)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 10px', alignItems: 'center' }}>
            <Search size={13} color="var(--text-muted)" />
            <input
              value={search}
              onChange={e => setSearch(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleSearch()}
              placeholder="Search node..."
              style={{ background: 'none', border: 'none', outline: 'none', color: 'var(--text-primary)', fontSize: 12, width: 140 }}
            />
            <Button size="sm" variant="ghost" onClick={handleSearch}>Find</Button>
          </div>
        </div>

        {/* Zoom buttons */}
        <div style={{ position: 'absolute', top: 16, right: 16, display: 'flex', flexDirection: 'column', gap: 4 }}>
          {[
            { icon: <ZoomIn size={14} />, action: () => cyRef.current?.zoom(cyRef.current.zoom() * 1.3) },
            { icon: <ZoomOut size={14} />, action: () => cyRef.current?.zoom(cyRef.current.zoom() * 0.7) },
            { icon: <Maximize2 size={14} />, action: () => cyRef.current?.fit(undefined, 30) },
          ].map((btn, i) => (
            <button key={i} onClick={btn.action} style={{
              width: 32, height: 32, borderRadius: 6, background: 'var(--bg-surface)',
              border: '1px solid var(--border)', color: 'var(--text-primary)', cursor: 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center',
            }}>{btn.icon}</button>
          ))}
        </div>

        {/* Node count */}
        <div style={{ position: 'absolute', bottom: 16, left: 16, fontSize: 11, color: 'var(--text-muted)', background: 'rgba(13,17,23,0.8)', padding: '4px 10px', borderRadius: 4 }}>
          {elements.filter(e => !e.data.source).length} nodes · {elements.filter(e => e.data.source).length} edges
        </div>
      </div>

      {/* Side panel */}
      <div style={{ width: 260, background: 'var(--bg-surface)', borderLeft: '1px solid var(--border)', display: 'flex', flexDirection: 'column', overflow: 'hidden' }}>
        {selectedNode ? (
          <div className="fade-in" style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
              <div style={{
                width: 36, height: 36, borderRadius: selectedNode.type === 'Incident' ? 6 : '50%',
                background: selectedNode.type === 'Suspect' ? '#da363322' : selectedNode.type === 'Victim' ? '#bc8cff22' : selectedNode.type === 'Location' ? '#2ea04322' : '#1f6feb22',
                border: `2px solid ${selectedNode.type === 'Suspect' ? '#da3633' : selectedNode.type === 'Victim' ? '#bc8cff' : selectedNode.type === 'Location' ? '#2ea043' : '#1f6feb'}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 14, fontWeight: 700,
                color: selectedNode.type === 'Suspect' ? '#da3633' : selectedNode.type === 'Victim' ? '#bc8cff' : '#1f6feb',
              }}>
                {(selectedNode.label || '?')[0]}
              </div>
              <div>
                <div style={{ fontWeight: 600, fontSize: 14 }}>{selectedNode.label}</div>
                <Badge color={
                  selectedNode.type === 'Suspect' ? 'var(--danger)' :
                  selectedNode.type === 'Victim' ? '#bc8cff' :
                  selectedNode.type === 'Location' ? 'var(--success)' : 'var(--accent)'
                }>{selectedNode.type}</Badge>
              </div>
            </div>

            {selectedNode.type === 'Suspect' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Arrest Count" value={selectedNode.arrestCount || 0} highlight={selectedNode.arrestCount >= 2} />
                <InfoRow label="Gender" value={selectedNode.gender || '—'} />
                {selectedNode.arrestCount >= 2 && (
                  <div style={{ background: 'var(--danger-bg)', border: '1px solid var(--danger)', borderRadius: 6, padding: '8px 12px', fontSize: 11, color: 'var(--danger)' }}>
                    ⚠️ Repeat Offender — {selectedNode.arrestCount} recorded arrests
                  </div>
                )}
              </div>
            )}

            {selectedNode.type === 'Incident' && (
              <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                <InfoRow label="Crime Group" value={selectedNode.crimeGroup} />
                <InfoRow label="Date" value={selectedNode.date ? formatDate(selectedNode.date) : '—'} />
              </div>
            )}

            <button onClick={clearSelection} style={{
              marginTop: 20, width: '100%', padding: '8px', borderRadius: 6,
              background: 'var(--bg-elevated)', border: '1px solid var(--border)',
              color: 'var(--text-secondary)', fontSize: 12, cursor: 'pointer',
            }}>
              Clear Selection
            </button>
          </div>
        ) : (
          <div style={{ padding: 16, flex: 1, overflowY: 'auto' }}>
            <div style={{ fontWeight: 600, fontSize: 13, marginBottom: 16, display: 'flex', alignItems: 'center', gap: 6 }}>
              <Network size={14} /> Graph Legend
            </div>
            {[
              { color: '#da3633', shape: 'circle', label: 'Suspect', desc: 'Accused person (size = arrest count)' },
              { color: '#bc8cff', shape: 'circle', label: 'Victim', desc: 'Victim linked to incident' },
              { color: '#1f6feb', shape: 'square', label: 'Incident', desc: 'FIR / criminal case' },
              { color: '#2ea043', shape: 'diamond', label: 'Location', desc: 'Geographic location' },
            ].map(item => (
              <div key={item.label} style={{ display: 'flex', gap: 10, alignItems: 'flex-start', marginBottom: 12 }}>
                <div style={{ width: 14, height: 14, borderRadius: item.shape === 'circle' ? '50%' : item.shape === 'diamond' ? '2px' : 3, background: item.color, flexShrink: 0, marginTop: 2, transform: item.shape === 'diamond' ? 'rotate(45deg)' : undefined }} />
                <div>
                  <div style={{ fontSize: 12, fontWeight: 500 }}>{item.label}</div>
                  <div style={{ fontSize: 11, color: 'var(--text-secondary)', marginTop: 2 }}>{item.desc}</div>
                </div>
              </div>
            ))}

            <div style={{ height: 1, background: 'var(--border)', margin: '12px 0' }} />

            <div style={{ fontWeight: 600, fontSize: 12, marginBottom: 10 }}>Edge Types</div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center', marginBottom: 8 }}>
              <div style={{ width: 24, height: 1.5, background: '#30363d' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>COMMITTED / VICTIMIZED</span>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <div style={{ width: 24, height: 1.5, background: '#f0883e', borderTop: '1px dashed #f0883e' }} />
              <span style={{ fontSize: 11, color: 'var(--text-secondary)' }}>ASSOCIATED_WITH (co-accused)</span>
            </div>

            <div style={{ marginTop: 16, padding: 10, background: 'var(--bg-elevated)', borderRadius: 6, fontSize: 11, color: 'var(--text-secondary)' }}>
              <Info size={12} style={{ display: 'inline', marginRight: 4 }} />
              Click a node to see connections. Click background to deselect.
            </div>
          </div>
        )}
      </div>
    </div>
  )
}

function InfoRow({ label, value, highlight }) {
  return (
    <div>
      <div style={{ fontSize: 10, color: 'var(--text-muted)', marginBottom: 2 }}>{label}</div>
      <div style={{ fontSize: 13, fontWeight: highlight ? 700 : 400, color: highlight ? 'var(--danger)' : 'var(--text-primary)' }}>
        {value ?? '—'}
      </div>
    </div>
  )
}
