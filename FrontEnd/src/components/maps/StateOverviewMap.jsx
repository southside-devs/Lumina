import React, { useState, useMemo, useEffect } from 'react';
import { Play, Pause, RotateCcw, Filter, Flame, ShieldAlert, Sparkles, MapPin, Layers, Globe, Activity, ChevronDown } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup, useMapEvents } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

// Fix default Leaflet icon paths
delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Statewide Karnataka Crime Incidents Dataset
export const KARNATAKA_SAMPLE_CRIME_EVENTS = [
  { id: 'EV-101', districtName: 'Bengaluru Urban', stationId: 'KSP-BLR-01', category: 'Cybercrime', threatScore: 94, firCount: 3420, latitude: 12.9716, longitude: 77.5946 },
  { id: 'EV-102', districtName: 'Bengaluru Rural', stationId: 'KSP-BLR-04', category: 'Financial & Commercial Fraud', threatScore: 78, firCount: 1240, latitude: 13.2257, longitude: 77.5750 },
  { id: 'EV-103', districtName: 'Mysuru City', stationId: 'KSP-MYS-01', category: 'Property & Vehicle Theft', threatScore: 68, firCount: 980, latitude: 12.2958, longitude: 76.6394 },
  { id: 'EV-104', districtName: 'Hubballi-Dharwad', stationId: 'KSP-DHW-02', category: 'Organized Narcotics', threatScore: 82, firCount: 1540, latitude: 15.3647, longitude: 75.1240 },
  { id: 'EV-105', districtName: 'Mangaluru', stationId: 'KSP-MNG-01', category: 'Violent Crime / Assault', threatScore: 86, firCount: 1890, latitude: 12.9141, longitude: 74.8560 },
  { id: 'EV-106', districtName: 'Belagavi', stationId: 'KSP-BEL-03', category: 'Cybercrime', threatScore: 72, firCount: 1120, latitude: 15.8497, longitude: 74.4977 },
  { id: 'EV-107', districtName: 'Kalaburagi', stationId: 'KSP-KLB-01', category: 'Organized Narcotics', threatScore: 75, firCount: 1310, latitude: 17.3297, longitude: 76.8343 },
  { id: 'EV-108', districtName: 'Tumakuru', stationId: 'KSP-TUM-02', category: 'Financial & Commercial Fraud', threatScore: 64, firCount: 870, latitude: 13.3392, longitude: 77.1015 },
  { id: 'EV-109', districtName: 'Shivamogga', stationId: 'KSP-SHV-01', category: 'Property & Vehicle Theft', threatScore: 58, firCount: 650, latitude: 13.9299, longitude: 75.5681 },
  { id: 'EV-110', districtName: 'Ballari', stationId: 'KSP-BAL-01', category: 'Violent Crime / Assault', threatScore: 79, firCount: 1430, latitude: 15.1394, longitude: 76.9214 },
  { id: 'EV-111', districtName: 'Udupi', stationId: 'KSP-UDP-01', category: 'Cybercrime', threatScore: 62, firCount: 710, latitude: 13.3409, longitude: 74.7421 },
  { id: 'EV-112', districtName: 'Davangere', stationId: 'KSP-DVG-01', category: 'Financial & Commercial Fraud', threatScore: 66, firCount: 820, latitude: 14.4644, longitude: 75.9218 },
];

const KARNATAKA_INITIAL_VIEW = {
  longitude: 75.7139,
  latitude: 15.3173,
  zoom: 6.8,
  pitch: 35,
  bearing: 0,
};

function ZoomTracker({ onZoomChange }) {
  const map = useMapEvents({
    zoomend() {
      onZoomChange(map.getZoom());
    },
  });
  return null;
}

export default function StateOverviewMap({
  rawCrimeEvents = KARNATAKA_SAMPLE_CRIME_EVENTS,
  onSelectHotspot
}) {
  const [viewState, setViewState] = useState(KARNATAKA_INITIAL_VIEW);
  const [selectedPoint, setSelectedPoint] = useState(KARNATAKA_SAMPLE_CRIME_EVENTS[0]);
  const [activeCategory, setActiveCategory] = useState('ALL');
  const [timelineIndex, setTimelineIndex] = useState(85);
  const [isPlaying, setIsPlaying] = useState(false);
  const [mapMode, setMapMode] = useState('heatmap'); // 'heatmap' | 'hotspots'
  const [zoomLevel, setZoomLevel] = useState(7);

  const categories = [
    'ALL',
    'Cybercrime',
    'Organized Narcotics',
    'Violent Crime / Assault',
    'Financial & Commercial Fraud',
    'Property & Vehicle Theft'
  ];

  // Aggregated Karnataka Statewide Marker for zoomed-out view (zoom < 7)
  const aggregatedCluster = useMemo(() => {
    const totalFirs = rawCrimeEvents.reduce((acc, curr) => acc + curr.firCount, 0);
    const maxScore = Math.max(...rawCrimeEvents.map((e) => e.threatScore));
    return {
      id: 'STATEWIDE-CLUSTER',
      districtName: 'Karnataka Statewide Intelligence Hub',
      threatScore: maxScore,
      firCount: totalFirs,
      category: 'Aggregated Hotspots (12 Districts)',
      latitude: 14.5,
      longitude: 75.8,
    };
  }, [rawCrimeEvents]);

  // Timeline Animation Loop
  useEffect(() => {
    let interval = null;
    if (isPlaying) {
      interval = setInterval(() => {
        setTimelineIndex((prev) => (prev >= 100 ? 0 : prev + 2));
      }, 250);
    } else {
      clearInterval(interval);
    }
    return () => clearInterval(interval);
  }, [isPlaying]);

  // Filter dataset based on active selections
  const filteredData = useMemo(() => {
    return rawCrimeEvents.filter((item) => {
      const matchCategory = activeCategory === 'ALL' || item.category === activeCategory;
      const matchTimeline = item.threatScore <= timelineIndex + 20;
      return matchCategory && matchTimeline;
    });
  }, [rawCrimeEvents, activeCategory, timelineIndex]);

  const handleResetView = () => {
    setViewState(KARNATAKA_INITIAL_VIEW);
    setSelectedPoint(null);
  };

  const handleHotspotClick = (point) => {
    setSelectedPoint(point);
    setViewState({
      longitude: point.longitude,
      latitude: point.latitude,
      zoom: 10.5,
      pitch: 45,
      bearing: 15,
    });
    if (onSelectHotspot) onSelectHotspot(point);
  };

  return (
    <div className="relative w-full h-[680px] rounded-2xl overflow-hidden border border-[rgba(100,100,100,0.3)] shadow-2xl bg-[#000000] font-sans flex flex-col justify-between">
      
      {/* 1. ORGANIZED TOP CONTROL HEADER */}
      <div className="bg-[#000000]/90 backdrop-blur-xl border-b border-[rgba(100,100,100,0.3)] px-5 py-3.5 z-20 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        
        {/* Title & GIS Status Telemetry */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E85002]/15 border border-[#E85002]/30 flex items-center justify-center text-[#E85002]">
            <Globe size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F9F9F9] font-display uppercase tracking-wider">
              Karnataka Statewide GIS Spatial Map
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#A7A7A7] mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-emerald-400 animate-pulse"></span>
              <span>31 Districts Connected</span>
              <span className="text-[#646464]">•</span>
              <span>{filteredData.length} Active Hotspot Nodes</span>
            </div>
          </div>
        </div>

        {/* Filters & View Mode Controls */}
        <div className="flex items-center gap-3">
          
          {/* Category Dropdown Selector */}
          <div className="relative flex items-center bg-[#333333]/80 border border-[rgba(100,100,100,0.4)] rounded-xl px-3 py-1.5 text-xs text-[#F9F9F9]">
            <Filter size={13} className="text-[#E85002] mr-2" />
            <select
              value={activeCategory}
              onChange={(e) => setActiveCategory(e.target.value)}
              className="bg-transparent text-[#F9F9F9] font-mono outline-none cursor-pointer pr-4 text-xs"
            >
              <option value="ALL" className="bg-[#1a1a1a]">All Crime Categories</option>
              <option value="Cybercrime" className="bg-[#1a1a1a]">Cybercrime</option>
              <option value="Organized Narcotics" className="bg-[#1a1a1a]">Organized Narcotics</option>
              <option value="Violent Crime / Assault" className="bg-[#1a1a1a]">Violent Crime / Assault</option>
              <option value="Financial & Commercial Fraud" className="bg-[#1a1a1a]">Financial Fraud</option>
              <option value="Property & Vehicle Theft" className="bg-[#1a1a1a]">Property & Vehicle Theft</option>
            </select>
          </div>

          {/* Heatmap / Hotspot Overlay Switcher */}
          <button
            type="button"
            onClick={() => setMapMode(mapMode === 'heatmap' ? 'hotspots' : 'heatmap')}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl transition-all border flex items-center gap-2 ${
              mapMode === 'heatmap'
                ? 'bg-[#E85002]/20 border-[#E85002]/50 text-[#E85002] shadow-[0_0_15px_rgba(232,80,2,0.3)]'
                : 'bg-[#333333]/80 border-[rgba(100,100,100,0.3)] text-[#A7A7A7] hover:text-[#F9F9F9]'
            }`}
          >
            <Flame size={14} />
            <span>{mapMode === 'heatmap' ? 'Heatmap Overlay' : 'Cluster Nodes'}</span>
          </button>

          {/* Reset View Button */}
          <button
            type="button"
            onClick={handleResetView}
            className="px-3 py-1.5 text-xs font-mono font-medium text-[#A7A7A7] hover:text-[#F9F9F9] bg-[#333333]/80 hover:bg-[#333333] border border-[rgba(100,100,100,0.3)] rounded-xl transition-all flex items-center gap-1.5"
          >
            <RotateCcw size={13} />
            <span>Reset View</span>
          </button>
        </div>
      </div>

      {/* 2. SPATIAL MAP CANVAS CONTAINER */}
      <div className="relative flex-1 w-full h-[520px] bg-[#000000] overflow-hidden rounded-2xl border border-[rgba(100,100,100,0.3)]">
        <MapContainer
          center={[15.3173, 75.7139]}
          zoom={7}
          minZoom={5.5}
          maxZoom={18}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#090d16' }}
        >
          <ZoomTracker onZoomChange={setZoomLevel} />

          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {/* If zoomed out below 6.8, collapse all markers into a single statewide macro cluster */}
          {zoomLevel < 6.8 ? (
            <React.Fragment>
              <CircleMarker
                center={[aggregatedCluster.latitude, aggregatedCluster.longitude]}
                radius={45}
                pathOptions={{
                  color: '#f43f5e',
                  fillColor: '#f43f5e',
                  fillOpacity: 0.25,
                  weight: 2,
                  dashArray: '6, 6'
                }}
              />
              <CircleMarker
                center={[aggregatedCluster.latitude, aggregatedCluster.longitude]}
                radius={24}
                pathOptions={{
                  color: '#f43f5e',
                  fillColor: '#e85002',
                  fillOpacity: 0.9,
                  weight: 3
                }}
                eventHandlers={{
                  click: () => handleHotspotClick(rawCrimeEvents[0])
                }}
              >
                <Popup className="cy-map-popup">
                  <div className="font-mono text-xs p-2.5 bg-[#0d1117] text-white rounded-lg border border-[#f59e0b]">
                    <div className="font-bold text-[#f59e0b] text-sm">{aggregatedCluster.districtName}</div>
                    <div className="mt-1 text-gray-300">Total Statewide FIRs: <strong className="text-white">{aggregatedCluster.firCount.toLocaleString()}</strong></div>
                    <div>Peak Threat Score: <strong className="text-[#f43f5e]">{aggregatedCluster.threatScore}/100</strong></div>
                    <div className="text-[10px] text-amber-400 mt-1.5 font-sans">💡 Zoom in closer to inspect individual district hotspots</div>
                  </div>
                </Popup>
              </CircleMarker>
            </React.Fragment>
          ) : (
            filteredData.map((spot) => {
              const isCritical = spot.threatScore >= 80;
              const color = isCritical ? '#f43f5e' : spot.threatScore >= 70 ? '#f59e0b' : '#3b82f6';
              const radius = Math.max(12, Math.round(spot.threatScore / 4));

              return (
                <React.Fragment key={spot.id}>
                  {mapMode === 'heatmap' && (
                    <CircleMarker
                      center={[spot.latitude, spot.longitude]}
                      radius={radius * 2}
                      pathOptions={{
                        color: color,
                        fillColor: color,
                        fillOpacity: 0.2,
                        weight: 1
                      }}
                    />
                  )}

                  <CircleMarker
                    center={[spot.latitude, spot.longitude]}
                    radius={radius}
                    pathOptions={{
                      color: color,
                      fillColor: color,
                      fillOpacity: 0.85,
                      weight: 2
                    }}
                    eventHandlers={{
                      click: () => handleHotspotClick(spot)
                    }}
                  >
                    <Popup className="cy-map-popup">
                      <div className="font-mono text-xs p-2 bg-[#0d1117] text-white rounded border border-[#f59e0b]">
                        <div className="font-bold text-[#f59e0b]">{spot.districtName}</div>
                        <div>Threat Score: {spot.threatScore}/100</div>
                        <div>FIRs: {spot.firCount.toLocaleString()}</div>
                        <div>Category: {spot.category}</div>
                      </div>
                    </Popup>
                  </CircleMarker>
                </React.Fragment>
              );
            })
          )}
        </MapContainer>

        {/* 3. FLOATING GLASS INSPECTOR DRAWER */}
        {selectedPoint && (
          <div className="absolute top-6 right-6 w-80 bg-[#333333]/90 backdrop-blur-2xl border border-[rgba(100,100,100,0.4)] p-5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(232,80,2,0.25)] text-xs text-[#F9F9F9] z-30 transition-all">
            <div className="flex justify-between items-start border-b border-[rgba(100,100,100,0.25)] pb-3">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  selectedPoint.threatScore >= 80
                    ? 'bg-[#C10801]/20 text-[#F9F9F9] border-[#C10801]/40'
                    : 'bg-[#E85002]/20 text-[#E85002] border-[#E85002]/40'
                }`}>
                  {selectedPoint.threatScore >= 80 ? 'Critical Risk Zone' : 'Monitored Region'}
                </span>
                <h3 className="text-base font-bold font-display text-[#F9F9F9] mt-2">{selectedPoint.districtName}</h3>
              </div>
              <button
                type="button"
                onClick={() => setSelectedPoint(null)}
                className="text-[#A7A7A7] hover:text-[#F9F9F9] p-1"
              >
                ✕
              </button>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2.5 my-4 font-mono">
              <div className="bg-[#000000]/60 border border-[rgba(100,100,100,0.3)] p-3 rounded-xl">
                <div className="text-[10px] text-[#A7A7A7] uppercase">Threat Index</div>
                <div className="text-lg font-bold text-[#E85002] mt-0.5">{selectedPoint.threatScore}/100</div>
              </div>
              <div className="bg-[#000000]/60 border border-[rgba(100,100,100,0.3)] p-3 rounded-xl">
                <div className="text-[10px] text-[#A7A7A7] uppercase">Active FIRs</div>
                <div className="text-lg font-bold text-[#38BDF8] mt-0.5">{selectedPoint.firCount.toLocaleString()}</div>
              </div>
            </div>

            {/* Specifications */}
            <div className="space-y-2 text-xs font-mono text-[#A7A7A7] border-t border-[rgba(100,100,100,0.2)] pt-3">
              <div className="flex justify-between">
                <span>Primary Category:</span>
                <span className="text-[#F9F9F9] font-bold">{selectedPoint.category}</span>
              </div>
              <div className="flex justify-between">
                <span>Jurisdiction:</span>
                <span className="text-[#F9F9F9]">{selectedPoint.stationId}</span>
              </div>
              <div className="flex justify-between">
                <span>Geo Bounds:</span>
                <span className="text-[#646464]">{selectedPoint.latitude.toFixed(2)}°N, {selectedPoint.longitude.toFixed(2)}°E</span>
              </div>
            </div>
          </div>
        )}
      </div>

      {/* 4. SPATIOTEMPORAL TIMELINE DOCK */}
      <div className="bg-[#000000]/95 backdrop-blur-xl border-t border-[rgba(100,100,100,0.3)] p-3.5 flex items-center gap-4 shadow-2xl z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-9 px-4 rounded-xl bg-[#E85002] hover:bg-[#F16001] text-[#F9F9F9] font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(232,80,2,0.4)]"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY TIMELINE'}</span>
        </button>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-mono text-[#A7A7A7]">
            <span>Jan 2026 Baseline</span>
            <span className="text-[#E85002] font-bold">Timeline Scrub: {timelineIndex}%</span>
            <span>Jul 2026 Real-Time</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={timelineIndex}
            onChange={(e) => setTimelineIndex(Number(e.target.value))}
            className="w-full h-1.5 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#E85002]"
          />
        </div>
      </div>

    </div>
  );
}
