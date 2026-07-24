import React, { useState, useMemo } from 'react';
import { Sliders, Flame, ShieldAlert, Sparkles, MapPin, Layers, RefreshCw, FileText, ChevronDown, Activity, Play, Pause } from 'lucide-react';
import { MapContainer, TileLayer, CircleMarker, Popup } from 'react-leaflet';
import 'leaflet/dist/leaflet.css';
import L from 'leaflet';

delete L.Icon.Default.prototype._getIconUrl;
L.Icon.Default.mergeOptions({
  iconRetinaUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon-2x.png',
  iconUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-icon.png',
  shadowUrl: 'https://cdnjs.cloudflare.com/ajax/libs/leaflet/1.7.1/images/marker-shadow.png'
});

// Sample ST-DBSCAN Crime Clusters in Karnataka
export const ST_DBSCAN_SAMPLE_CLUSTERS = [
  {
    id: 'CLUSTER-BLR-01',
    name: 'Bengaluru Tech Corridor',
    district: 'Bengaluru Urban',
    firCount: 142,
    threatScore: 92,
    threatLevel: 'Critical',
    eps1_meters: 500,
    eps2_hours: 24,
    minPts: 15,
    primaryMO: 'Organized Cyber Extortion & Banking Trojans',
    coordinates: [12.9716, 77.5946],
    radius: 45,
    recentFIRs: ['FIR-2026-9901', 'FIR-2026-9904', 'FIR-2026-9912']
  },
  {
    id: 'CLUSTER-MYS-02',
    name: 'Mysuru Tourist Transit Hub',
    district: 'Mysuru City',
    firCount: 68,
    threatScore: 74,
    threatLevel: 'High',
    eps1_meters: 800,
    eps2_hours: 48,
    minPts: 8,
    primaryMO: 'Vehicle Theft & Snatching Operations',
    coordinates: [12.2958, 76.6394],
    radius: 35,
    recentFIRs: ['FIR-2026-8802', 'FIR-2026-8819']
  },
  {
    id: 'CLUSTER-MNG-03',
    name: 'Mangaluru Coastal Port Belt',
    district: 'Mangaluru',
    firCount: 95,
    threatScore: 84,
    threatLevel: 'Critical',
    eps1_meters: 600,
    eps2_hours: 36,
    minPts: 12,
    primaryMO: 'Narcotics Smuggling & Contraband Transit',
    coordinates: [12.9141, 74.8560],
    radius: 40,
    recentFIRs: ['FIR-2026-7701', 'FIR-2026-7714', 'FIR-2026-7722']
  },
  {
    id: 'CLUSTER-DHW-04',
    name: 'Hubballi Commercial Junction',
    district: 'Hubballi-Dharwad',
    firCount: 52,
    threatScore: 65,
    threatLevel: 'Moderate',
    eps1_meters: 1000,
    eps2_hours: 72,
    minPts: 6,
    primaryMO: 'Commercial Forgery & Land Fraud',
    coordinates: [15.3647, 75.1240],
    radius: 30,
    recentFIRs: ['FIR-2026-6611']
  }
];

export default function HotspotExplorerMap({
  clusters = ST_DBSCAN_SAMPLE_CLUSTERS,
  onSelectCluster
}) {
  const [selectedCluster, setSelectedCluster] = useState(ST_DBSCAN_SAMPLE_CLUSTERS[0]);
  const [showTuningPanel, setShowTuningPanel] = useState(false);
  const [eps1, setEps1] = useState(500); // Spatial distance threshold (meters)
  const [eps2, setEps2] = useState(24);  // Time window threshold (hours)
  const [minPts, setMinPts] = useState(10); // Density threshold (minimum FIRs)
  const [timelineScrub, setTimelineScrub] = useState(90);
  const [isPlaying, setIsPlaying] = useState(false);

  const handleClusterClick = (cluster) => {
    setSelectedCluster(cluster);
    if (onSelectCluster) onSelectCluster(cluster);
  };

  const handleGenerateReport = (cluster) => {
    alert(`Generating ST-DBSCAN Hotspot Intelligence Report for ${cluster.name} (${cluster.id})...`);
  };

  return (
    <div className="relative w-full h-[680px] rounded-2xl overflow-hidden border border-[rgba(100,100,100,0.3)] shadow-2xl bg-[#000000] font-sans flex flex-col justify-between">
      
      {/* 1. ORGANIZED TOP CONTROL HEADER */}
      <div className="bg-[#000000]/90 backdrop-blur-xl border-b border-[rgba(100,100,100,0.3)] px-5 py-3.5 z-20 flex flex-wrap items-center justify-between gap-4 shadow-xl">
        
        {/* Title & Cluster Stats */}
        <div className="flex items-center gap-3">
          <div className="w-8 h-8 rounded-xl bg-[#E85002]/15 border border-[#E85002]/30 flex items-center justify-center text-[#E85002]">
            <Flame size={18} />
          </div>
          <div>
            <h2 className="text-sm font-bold text-[#F9F9F9] font-display uppercase tracking-wider">
              ST-DBSCAN Hotspot Cluster Explorer
            </h2>
            <div className="flex items-center gap-2 text-[11px] font-mono text-[#A7A7A7] mt-0.5">
              <span className="flex h-2 w-2 rounded-full bg-[#E85002] animate-pulse"></span>
              <span>Spatiotemporal Clustering Engine</span>
              <span className="text-[#646464]">•</span>
              <span>{clusters.length} Polygon Hulls Active</span>
            </div>
          </div>
        </div>

        {/* Algorithm Tuning Toggle & Reset */}
        <div className="flex items-center gap-3">
          <button
            type="button"
            onClick={() => setShowTuningPanel(!showTuningPanel)}
            className={`px-3 py-1.5 text-xs font-mono font-semibold rounded-xl transition-all border flex items-center gap-2 ${
              showTuningPanel
                ? 'bg-[#E85002] text-[#F9F9F9] border-[#E85002] shadow-[0_0_15px_rgba(232,80,2,0.4)]'
                : 'bg-[#333333]/80 border-[rgba(100,100,100,0.4)] text-[#F9F9F9] hover:border-[#E85002]'
            }`}
          >
            <Sliders size={14} />
            <span>Tune Parameters (Eps1, Eps2, MinPts)</span>
            <ChevronDown size={13} className={`transition-transform ${showTuningPanel ? 'rotate-180' : ''}`} />
          </button>
        </div>
      </div>

      {/* 2. SLIDE-DOWN ST-DBSCAN TUNING DRAWER */}
      {showTuningPanel && (
        <div className="bg-[#333333]/95 backdrop-blur-2xl border-b border-[rgba(100,100,100,0.4)] px-6 py-4 z-30 font-mono text-xs text-[#F9F9F9] transition-all grid grid-cols-1 md:grid-cols-3 gap-6 shadow-2xl">
          
          {/* Spatial Distance Slider (Eps1) */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#A7A7A7]">Eps1 (Spatial Radius):</span>
              <span className="text-[#E85002] font-bold">{eps1} Meters</span>
            </div>
            <input
              type="range"
              min="100"
              max="2000"
              step="50"
              value={eps1}
              onChange={(e) => setEps1(Number(e.target.value))}
              className="w-full h-1.5 bg-[#000000] rounded-lg appearance-none cursor-pointer accent-[#E85002]"
            />
          </div>

          {/* Temporal Window Slider (Eps2) */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#A7A7A7]">Eps2 (Time Window):</span>
              <span className="text-[#38BDF8] font-bold">{eps2} Hours</span>
            </div>
            <input
              type="range"
              min="1"
              max="168"
              step="1"
              value={eps2}
              onChange={(e) => setEps2(Number(e.target.value))}
              className="w-full h-1.5 bg-[#000000] rounded-lg appearance-none cursor-pointer accent-[#38BDF8]"
            />
          </div>

          {/* Min FIRs Density Slider (MinPts) */}
          <div className="space-y-1.5">
            <div className="flex justify-between">
              <span className="text-[#A7A7A7]">MinPts (FIR Threshold):</span>
              <span className="text-[#10B981] font-bold">{minPts} Incidents</span>
            </div>
            <input
              type="range"
              min="3"
              max="30"
              step="1"
              value={minPts}
              onChange={(e) => setMinPts(Number(e.target.value))}
              className="w-full h-1.5 bg-[#000000] rounded-lg appearance-none cursor-pointer accent-[#10B981]"
            />
          </div>
        </div>
      )}

      {/* 3. CLUSTER MAP CANVAS VIEWPORT */}
      <div className="relative flex-1 w-full h-[520px] bg-[#000000] overflow-hidden rounded-2xl border border-[rgba(100,100,100,0.3)]">
        <MapContainer
          center={[15.3173, 75.7139]}
          zoom={7}
          scrollWheelZoom={true}
          style={{ height: '100%', width: '100%', background: '#090d16' }}
        >
          <TileLayer
            attribution='&copy; <a href="https://carto.com/">CARTO</a> &copy; OpenStreetMap'
            url="https://{s}.basemaps.cartocdn.com/dark_all/{z}/{x}/{y}{r}.png"
          />

          {clusters.map((cluster) => {
            const isSelected = selectedCluster?.id === cluster.id;
            const isCritical = cluster.threatLevel === 'Critical';
            const color = isCritical ? '#f43f5e' : cluster.threatScore >= 70 ? '#f59e0b' : '#38bdf8';
            const radius = Math.max(16, Math.round(cluster.threatScore / 3.5));

            return (
              <React.Fragment key={cluster.id}>
                {/* Cluster Outer Radius */}
                <CircleMarker
                  center={cluster.coordinates}
                  radius={radius * 2}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: isSelected ? 0.35 : 0.15,
                    weight: isSelected ? 2 : 1,
                    dashArray: '4, 4'
                  }}
                />

                {/* Core Cluster Pin */}
                <CircleMarker
                  center={cluster.coordinates}
                  radius={radius}
                  pathOptions={{
                    color: color,
                    fillColor: color,
                    fillOpacity: 0.85,
                    weight: 2
                  }}
                  eventHandlers={{
                    click: () => handleClusterClick(cluster)
                  }}
                >
                  <Popup className="cy-map-popup">
                    <div className="font-mono text-xs p-2 bg-[#0d1117] text-white rounded border border-[#f59e0b]">
                      <div className="font-bold text-[#f59e0b]">{cluster.name}</div>
                      <div>District: {cluster.district}</div>
                      <div>Threat Score: {cluster.threatScore}/100</div>
                      <div>FIR Density: {cluster.firCount} Cases</div>
                      <div>Primary MO: {cluster.primaryMO}</div>
                    </div>
                  </Popup>
                </CircleMarker>
              </React.Fragment>
            );
          })}
        </MapContainer>

        {/* 4. RIGHT SIDE GLASS CLUSTER INSPECTION DRAWER */}
        {selectedCluster && (
          <div className="absolute top-6 right-6 w-84 bg-[#333333]/90 backdrop-blur-2xl border border-[rgba(100,100,100,0.4)] p-5 rounded-2xl shadow-[0_10px_30px_-10px_rgba(232,80,2,0.25)] text-xs text-[#F9F9F9] z-30 transition-all space-y-4">
            
            <div className="flex justify-between items-start border-b border-[rgba(100,100,100,0.25)] pb-3">
              <div>
                <span className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold uppercase border ${
                  selectedCluster.threatLevel === 'Critical'
                    ? 'bg-[#C10801]/20 text-[#F9F9F9] border-[#C10801]/40'
                    : 'bg-[#E85002]/20 text-[#E85002] border-[#E85002]/40'
                }`}>
                  {selectedCluster.threatLevel} Cluster Zone
                </span>
                <h3 className="text-base font-bold font-display text-[#F9F9F9] mt-2">{selectedCluster.name}</h3>
                <p className="text-[11px] font-mono text-[#A7A7A7]">{selectedCluster.district} Jurisdiction</p>
              </div>
            </div>

            {/* Metrics */}
            <div className="grid grid-cols-2 gap-2.5 font-mono">
              <div className="bg-[#000000]/60 border border-[rgba(100,100,100,0.3)] p-3 rounded-xl">
                <div className="text-[10px] text-[#A7A7A7] uppercase">Cluster Score</div>
                <div className="text-lg font-bold text-[#E85002] mt-0.5">{selectedCluster.threatScore}/100</div>
              </div>
              <div className="bg-[#000000]/60 border border-[rgba(100,100,100,0.3)] p-3 rounded-xl">
                <div className="text-[10px] text-[#A7A7A7] uppercase">Density (FIRs)</div>
                <div className="text-lg font-bold text-[#38BDF8] mt-0.5">{selectedCluster.firCount} Cases</div>
              </div>
            </div>

            {/* Primary Modus Operandi */}
            <div className="bg-[#000000]/40 border border-[rgba(100,100,100,0.2)] p-3 rounded-xl font-mono text-[11px]">
              <div className="text-[#A7A7A7] text-[10px] uppercase mb-1">Primary Modus Operandi (MO)</div>
              <div className="text-[#F9F9F9] font-bold">{selectedCluster.primaryMO}</div>
            </div>

            {/* Action CTAs */}
            <button
              type="button"
              onClick={() => handleGenerateReport(selectedCluster)}
              className="w-full py-2.5 rounded-xl bg-[#E85002] hover:bg-[#F16001] text-[#F9F9F9] font-mono text-xs font-bold flex items-center justify-center gap-2 transition-all shadow-[0_0_15px_rgba(232,80,2,0.4)]"
            >
              <FileText size={14} />
              <span>GENERATE TACTICAL REPORT</span>
            </button>
          </div>
        )}
      </div>

      {/* 5. BOTTOM SPATIOTEMPORAL SCRUB DOCK */}
      <div className="bg-[#000000]/95 backdrop-blur-xl border-t border-[rgba(100,100,100,0.3)] p-3.5 flex items-center gap-4 shadow-2xl z-20">
        <button
          type="button"
          onClick={() => setIsPlaying(!isPlaying)}
          className="h-9 px-4 rounded-xl bg-[#E85002] hover:bg-[#F16001] text-[#F9F9F9] font-mono text-xs font-bold flex items-center gap-2 transition-all shadow-[0_0_15px_rgba(232,80,2,0.4)]"
        >
          {isPlaying ? <Pause size={14} /> : <Play size={14} />}
          <span>{isPlaying ? 'PAUSE' : 'PLAY CLUSTER TIMELINE'}</span>
        </button>

        <div className="flex-1 flex flex-col gap-1.5">
          <div className="flex justify-between text-[11px] font-mono text-[#A7A7A7]">
            <span>Initial FIR Seeding</span>
            <span className="text-[#E85002] font-bold">ST-DBSCAN Density: {timelineScrub}%</span>
            <span>Real-Time Polygon Hull</span>
          </div>
          <input
            type="range"
            min="0"
            max="100"
            value={timelineScrub}
            onChange={(e) => setTimelineScrub(Number(e.target.value))}
            className="w-full h-1.5 bg-[#333333] rounded-lg appearance-none cursor-pointer accent-[#E85002]"
          />
        </div>
      </div>

    </div>
  );
}
