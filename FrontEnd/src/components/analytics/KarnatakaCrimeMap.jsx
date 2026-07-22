import React, { useState } from 'react'
import { MapContainer, TileLayer, Marker, Popup, CircleMarker } from 'react-leaflet'
import 'leaflet/dist/leaflet.css'
import L from 'leaflet'
import { ShieldAlert, MapPin, Zap, Layers, Navigation, Crosshair } from 'lucide-react'

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
})

// Karnataka Crime Hotspots Coordinates & Telemetry
export const KARNATAKA_HOTSPOTS = [
  {
    id: 'HOT-BLR-01',
    name: 'Bengaluru Urban (BCP Command)',
    code: 'BLR-U',
    lat: 12.9716,
    lng: 77.5946,
    score: 92,
    risk: 'Critical',
    incidents: 3420,
    topCrime: 'Financial Cyber Fraud & ATM Tampering',
    policeStation: 'Halasuru PS & Cyber Crime CID HQ',
    patrols: 'PCR-04, PCR-12 (Indiranagar Outer Ring Beat)',
    coords: '12.9716° N, 77.5946° E'
  },
  {
    id: 'HOT-MYS-02',
    name: 'Mysuru City (MCP Command)',
    code: 'MYS-C',
    lat: 12.2958,
    lng: 76.6394,
    score: 78,
    risk: 'High',
    incidents: 1890,
    topCrime: 'Heritage Property Theft & Commercial Burglary',
    policeStation: 'Devaraja PS, Mysuru',
    patrols: 'BEAT-08 (Palace Division)',
    coords: '12.2958° N, 76.6394° E'
  },
  {
    id: 'HOT-HBL-03',
    name: 'Hubballi-Dharwad Industrial Hub',
    code: 'HBL-DHD',
    lat: 15.3647,
    lng: 75.1240,
    score: 76,
    risk: 'High',
    incidents: 1410,
    topCrime: 'Group Assault & Public Intoxication',
    policeStation: 'Gokul Road PS',
    patrols: 'PCR-09 (Gokul Industrial Corridor)',
    coords: '15.3647° N, 75.1240° E'
  },
  {
    id: 'HOT-MNG-04',
    name: 'Mangaluru Port & Coastal Zone',
    code: 'MNG-P',
    lat: 12.9141,
    lng: 74.8560,
    score: 74,
    risk: 'High',
    incidents: 1280,
    topCrime: 'NDPS Narcotics Transit & Contraband',
    policeStation: 'Panambur PS & Coastal Security Police',
    patrols: 'CSP Unit 2 (Harbour Checkpoint)',
    coords: '12.9141° N, 74.8560° E'
  },
  {
    id: 'HOT-BGM-05',
    name: 'Belagavi Highway Border',
    code: 'BGM-BDR',
    lat: 15.8497,
    lng: 74.4977,
    score: 64,
    risk: 'Medium',
    incidents: 950,
    topCrime: 'Interstate Motor Vehicle Theft Syndicate',
    policeStation: 'Nipani Highway Gate PS',
    patrols: 'Nipani Border Inspection Unit',
    coords: '15.8497° N, 74.4977° E'
  },
  {
    id: 'HOT-KLB-06',
    name: 'Kalaburagi Division',
    code: 'KLB-C',
    lat: 17.3297,
    lng: 76.8343,
    score: 70,
    risk: 'High',
    incidents: 1120,
    topCrime: 'Agricultural Contraband & NDPS',
    policeStation: 'Kalaburagi Town PS',
    patrols: 'PCR-03 (Ring Road Division)',
    coords: '17.3297° N, 76.8343° E'
  },
  {
    id: 'HOT-BLR-07',
    name: 'Ballari Mining Belt',
    code: 'BLR-M',
    lat: 15.1394,
    lng: 76.9214,
    score: 68,
    risk: 'Medium',
    incidents: 890,
    topCrime: 'Illegal Freight Transport & extortion',
    policeStation: 'Ballari City PS',
    patrols: 'Mining Corridor Patrol Unit 1',
    coords: '15.1394° N, 76.9214° E'
  },
  {
    id: 'HOT-SMG-08',
    name: 'Shivamogga Malnad Zone',
    code: 'SMG-Z',
    lat: 13.9299,
    lng: 75.5681,
    score: 55,
    risk: 'Medium',
    incidents: 640,
    topCrime: 'Illegal Timber & Forest Offences',
    policeStation: 'Shivamogga Forest & Town PS',
    patrols: 'Forest Beat Unit #4',
    coords: '13.9299° N, 75.5681° E'
  }
]

export default function KarnatakaCrimeMap({ onSelectHotspot, onDeployPatrol }) {
  const [mapTileStyle, setMapTileStyle] = useState('dark') // 'dark', 'street', 'satellite'
  const [activeHotspot, setActiveHotspot] = useState(KARNATAKA_HOTSPOTS[0])

  // CartoDB & Esri Dark Map Tiles
  const tileUrls = {
    dark: 'https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png',
    street: 'https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png',
    satellite: 'https://server.arcgisonline.com/ArcGIS/rest/services/World_Imagery/MapServer/tile/{z}/{y}/{x}'
  }

  const centerCoordinates = [15.3173, 75.7139] // Karnataka State Center

  return (
    <div className="glass-panel" style={{ padding: '20px', display: 'flex', flexDirection: 'column', gap: '16px' }}>
      {/* Map Header & Controls */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px' }}>
        <div>
          <div className="font-mono" style={{ fontSize: '11px', color: 'var(--accent-orange)' }}>
            STATEWIDE GIS TELEMETRY • CARTODB DARK MATTER
          </div>
          <h3 style={{ fontSize: '18px', color: '#fff', marginTop: '2px' }}>
            Karnataka Tactical Crime Hotspots & GIS Heatmap
          </h3>
        </div>

        {/* Map Layer Switcher Tabs */}
        <div className="cy-view-tabs" style={{ padding: '3px' }}>
          <button
            type="button"
            className={`cy-tab-pill ${mapTileStyle === 'dark' ? 'active' : ''}`}
            onClick={() => setMapTileStyle('dark')}
          >
            <Crosshair size={12} /> Dark Tactical
          </button>
          <button
            type="button"
            className={`cy-tab-pill ${mapTileStyle === 'satellite' ? 'active' : ''}`}
            onClick={() => setMapTileStyle('satellite')}
          >
            <Layers size={12} /> Esri Satellite
          </button>
          <button
            type="button"
            className={`cy-tab-pill ${mapTileStyle === 'street' ? 'active' : ''}`}
            onClick={() => setMapTileStyle('street')}
          >
            <Navigation size={12} /> Street Map
          </button>
        </div>
      </div>

      {/* Leaflet Map & Inspection Sidebar Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: '2.5fr 1fr', gap: '16px' }}>
        {/* Leaflet Map Box */}
        <div style={{ height: '480px', width: '100%', borderRadius: '6px', overflow: 'hidden', border: '1px solid var(--border-color)', position: 'relative' }}>
          <MapContainer
            center={centerCoordinates}
            zoom={7}
            scrollWheelZoom={false}
            style={{ height: '100%', width: '100%', background: '#0B0C0E' }}
          >
            <TileLayer
              attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
              url={tileUrls[mapTileStyle]}
            />

            {KARNATAKA_HOTSPOTS.map((spot) => {
              const color = spot.risk === 'Critical' ? '#EF4444' : spot.score >= 70 ? '#FF3D00' : '#F59E0B'
              const radius = Math.max(12, Math.round(spot.score / 3))

              return (
                <React.Fragment key={spot.id}>
                  {/* Glowing Radius Heat Aura */}
                  <CircleMarker
                    center={[spot.lat, spot.lng]}
                    radius={radius * 1.8}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.15,
                      weight: 1
                    }}
                  />

                  {/* Core Pin Marker */}
                  <CircleMarker
                    center={[spot.lat, spot.lng]}
                    radius={radius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.85,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => {
                        setActiveHotspot(spot)
                        if (onSelectHotspot) onSelectHotspot(spot)
                      }
                    }}
                  >
                    <Popup className="cy-map-popup">
                      <div className="font-mono" style={{ background: '#14161A', color: '#fff', padding: '10px', borderRadius: '6px', border: '1px solid var(--accent-orange)', minWidth: '180px' }}>
                        <div style={{ fontSize: '11px', color: 'var(--accent-orange)', fontWeight: 700 }}>
                          {spot.code} • {spot.risk} Risk ({spot.score}/100)
                        </div>
                        <div style={{ fontSize: '14px', fontWeight: 800, color: '#fff', marginTop: '2px' }}>
                          {spot.name}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--text-muted)', marginTop: '4px' }}>
                          Crime: {spot.topCrime}
                        </div>
                        <div style={{ fontSize: '11px', color: 'var(--accent-cyan)', marginTop: '4px' }}>
                          FIRs: {spot.incidents.toLocaleString()}
                        </div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              )
            })}
          </MapContainer>

          {/* Map Overlay Badge */}
          <div
            style={{
              position: 'absolute',
              bottom: '12px',
              left: '12px',
              zIndex: 1000,
              background: 'rgba(11, 12, 14, 0.85)',
              border: '1px solid var(--border-color)',
              padding: '6px 12px',
              borderRadius: '4px',
              fontSize: '11px',
              display: 'flex',
              gap: '12px'
            }}
            className="font-mono"
          >
            <span style={{ color: '#EF4444' }}>● Critical (&gt;80)</span>
            <span style={{ color: '#FF3D00' }}>● High (70-79)</span>
            <span style={{ color: '#F59E0B' }}>● Medium (&lt;70)</span>
          </div>
        </div>

        {/* Selected Hotspot Inspection Drawer */}
        <div style={{ background: '#0B0C0E', border: '1px solid var(--border-color)', padding: '16px', borderRadius: '6px', display: 'flex', flexContent: 'column', flexDirection: 'column', gap: '12px' }}>
          {activeHotspot ? (
            <>
              <div style={{ borderBottom: '1px solid var(--border-color)', paddingBottom: '10px' }}>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--accent-orange)' }}>
                  INSPECTOR TELEMETRY • {activeHotspot.id}
                </span>
                <h4 style={{ fontSize: '16px', color: '#fff', marginTop: '2px' }}>{activeHotspot.name}</h4>
                <span className="font-mono" style={{ fontSize: '10px', color: 'var(--text-dim)' }}>
                  <MapPin size={10} style={{ verticalAlign: 'middle', marginRight: '3px' }} />
                  {activeHotspot.coords}
                </span>
              </div>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                <div style={{ background: '#14161A', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>THREAT SCORE</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: activeHotspot.risk === 'Critical' ? '#EF4444' : '#FF3D00' }} className="font-mono">
                    {activeHotspot.score}/100
                  </div>
                </div>
                <div style={{ background: '#14161A', padding: '8px', borderRadius: '4px', border: '1px solid var(--border-color)' }}>
                  <span className="font-mono" style={{ fontSize: '9px', color: 'var(--text-dim)' }}>REGISTERED FIRs</span>
                  <div style={{ fontSize: '20px', fontWeight: 800, color: '#fff' }} className="font-mono">
                    {activeHotspot.incidents.toLocaleString()}
                  </div>
                </div>
              </div>

              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '11px' }}>
                <div>
                  <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '9px', display: 'block' }}>PRIMARY CRIME PATTERN</span>
                  <span style={{ color: '#fff', fontWeight: 600 }}>{activeHotspot.topCrime}</span>
                </div>

                <div>
                  <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '9px', display: 'block' }}>PATROL BEAT UNITS</span>
                  <span className="font-mono" style={{ color: 'var(--accent-orange)' }}>{activeHotspot.patrols}</span>
                </div>

                <div>
                  <span className="font-mono" style={{ color: 'var(--text-dim)', fontSize: '9px', display: 'block' }}>STATION JURISDICTION</span>
                  <span style={{ color: 'var(--text-muted)' }}>{activeHotspot.policeStation}</span>
                </div>
              </div>

              <button
                type="button"
                className="btn-primary"
                style={{ width: '100%', justifyContent: 'center', marginTop: 'auto', fontSize: '12px' }}
                onClick={() => {
                  if (onDeployPatrol) onDeployPatrol(activeHotspot)
                }}
              >
                <Zap size={14} /> Deploy Emergency Response Unit
              </button>
            </>
          ) : (
            <div style={{ padding: '20px 10px', textAlign: 'center', color: 'var(--text-dim)' }}>
              <ShieldAlert size={24} style={{ marginBottom: '8px' }} />
              <p style={{ fontSize: '12px' }}>Click any marker on the map to inspect Karnataka SCRB telemetry.</p>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
