import React, { useState } from "react";
import { FileText, Plus, Search, Filter, ExternalLink, X, Calendar, User, MapPin, Tag, AlertTriangle } from "lucide-react";

const ALL_FIRS = [
  { id: "FIR-2026-9901", type: "Cybercrime",       district: "Bengaluru Urban",  officer: "Insp. V. Raju",    date: "22 Jul 2026", status: "Under Investigation", priority: "critical", accused: 2, victims: 5 },
  { id: "FIR-2026-9877", type: "Narcotics",         district: "Mysuru City",     officer: "SI K. Patel",      date: "21 Jul 2026", status: "Charge Sheeted",      priority: "high",     accused: 3, victims: 0 },
  { id: "FIR-2026-9854", type: "Organised Theft",   district: "Mangaluru City",  officer: "Insp. R. Shetty",  date: "21 Jul 2026", status: "Pending Review",      priority: "high",     accused: 5, victims: 8 },
  { id: "FIR-2026-9832", type: "Financial Fraud",   district: "Belagavi",        officer: "ASI N. Desai",     date: "20 Jul 2026", status: "Closed",              priority: "medium",   accused: 1, victims: 12 },
  { id: "FIR-2026-9810", type: "Violent Crime",     district: "Hubballi-Dharwad",officer: "SI M. Patil",      date: "20 Jul 2026", status: "Under Investigation", priority: "critical", accused: 1, victims: 1 },
  { id: "FIR-2026-9798", type: "Cybercrime",        district: "Tumakuru",        officer: "Insp. G. Kumar",   date: "19 Jul 2026", status: "Charge Sheeted",      priority: "medium",   accused: 2, victims: 7 },
  { id: "FIR-2026-9781", type: "Missing Person",    district: "Kalaburagi",      officer: "SI S. Bhatt",      date: "19 Jul 2026", status: "Under Investigation", priority: "high",     accused: 0, victims: 1 },
  { id: "FIR-2026-9765", type: "Property Dispute",  district: "Shivamogga",      officer: "HC D. Rao",        date: "18 Jul 2026", status: "Pending Review",      priority: "medium",   accused: 2, victims: 1 },
  { id: "FIR-2026-9742", type: "Narcotics",         district: "Raichur",         officer: "SI P. Verma",      date: "18 Jul 2026", status: "Charge Sheeted",      priority: "high",     accused: 4, victims: 0 },
  { id: "FIR-2026-9720", type: "Violent Crime",     district: "Bengaluru Rural",  officer: "Insp. C. Das",    date: "17 Jul 2026", status: "Closed",              priority: "high",     accused: 2, victims: 2 },
];

const TABS = ["All", "Under Investigation", "Pending Review", "Charge Sheeted", "Closed"];

const STATUS_STYLES = {
  "Under Investigation": { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  "Charge Sheeted":      { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Pending Review":      { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  "Closed":              { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
};

const PRIORITY_DOT = { critical: "#f43f5e", high: "#f59e0b", medium: "#3b82f6" };

export default function FIRModule() {
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNewFIR, setShowNewFIR] = useState(false);
  const [newFIR, setNewFIR] = useState({ complainant: "", type: "Cybercrime", district: "Bengaluru Urban", description: "" });

  const filtered = ALL_FIRS.filter((f) => {
    const matchTab = activeTab === "All" || f.status === activeTab;
    const matchQ = f.id.toLowerCase().includes(query.toLowerCase()) ||
      f.district.toLowerCase().includes(query.toLowerCase()) ||
      f.type.toLowerCase().includes(query.toLowerCase());
    return matchTab && matchQ;
  });

  const tabCounts = (tab) => tab === "All" ? ALL_FIRS.length : ALL_FIRS.filter((f) => f.status === tab).length;

  return (
    <div>
      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>FIR Management</h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "4px" }}>First Information Reports — State-Wide Registry</p>
        </div>
        <button
          onClick={() => setShowNewFIR(true)}
          style={{
            background: "linear-gradient(135deg, #3b82f6, #2563eb)", color: "white",
            border: "none", borderRadius: "8px", padding: "10px 18px", fontSize: "13px",
            fontWeight: 600, cursor: "pointer", display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)"
          }}
        >
          <Plus size={16} /> File New FIR
        </button>
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "6px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none", border: "none", padding: "10px 16px", cursor: "pointer",
              fontSize: "13px", fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#38bdf8" : "#64748b",
              borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {tab} <span style={{
              background: activeTab === tab ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
              color: activeTab === tab ? "#60a5fa" : "#64748b",
              borderRadius: "9999px", padding: "1px 7px", fontSize: "11px", fontWeight: 700, marginLeft: "4px"
            }}>{tabCounts(tab)}</span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px", width: "320px" }}>
        <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by FIR ID, district, type..."
          style={{
            paddingLeft: "34px", paddingRight: "12px", paddingTop: "9px", paddingBottom: "9px",
            background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)",
            borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", width: "100%"
          }}
        />
      </div>

      {/* Table */}
      <div style={{
        background: "rgba(15,23,42,0.75)", border: "1px solid rgba(255,255,255,0.08)",
        borderRadius: "14px", overflow: "hidden"
      }}>
        <table className="custom-table">
          <thead>
            <tr>
              <th>FIR ID</th><th>Crime Type</th><th>District</th><th>Officer IC</th>
              <th>Date Filed</th><th>Accused</th><th>Victims</th><th>Status</th><th>Action</th>
            </tr>
          </thead>
          <tbody>
            {filtered.map((f) => {
              const st = STATUS_STYLES[f.status] || STATUS_STYLES["Closed"];
              return (
                <tr key={f.id}>
                  <td>
                    <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                      <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PRIORITY_DOT[f.priority] || "#64748b", flexShrink: 0 }} />
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>{f.id}</span>
                    </div>
                  </td>
                  <td style={{ color: "#cbd5e1" }}>{f.type}</td>
                  <td style={{ color: "#94a3b8" }}>{f.district}</td>
                  <td style={{ color: "#94a3b8" }}>{f.officer}</td>
                  <td style={{ color: "#64748b", fontSize: "12px" }}>{f.date}</td>
                  <td style={{ color: f.accused > 0 ? "#fb7185" : "#64748b", fontWeight: f.accused > 0 ? 700 : 400, fontFamily: "JetBrains Mono, monospace" }}>{f.accused}</td>
                  <td style={{ color: f.victims > 0 ? "#fbbf24" : "#64748b", fontWeight: f.victims > 0 ? 700 : 400, fontFamily: "JetBrains Mono, monospace" }}>{f.victims}</td>
                  <td>
                    <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "6px", fontSize: "11px", fontWeight: 600, padding: "3px 9px" }}>
                      {f.status}
                    </span>
                  </td>
                  <td>
                    <button onClick={() => setSelected(f)} style={{ background: "rgba(59,130,246,0.1)", color: "#60a5fa", border: "1px solid rgba(59,130,246,0.25)", borderRadius: "6px", padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer" }}>
                      Details
                    </button>
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>

      {/* Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#0d1830", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px",
            padding: "28px", width: "100%", maxWidth: "580px", boxShadow: "0 30px 60px rgba(0,0,0,0.7)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>FIRST INFORMATION REPORT</div>
                <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "22px", color: "#38bdf8" }}>{selected.id}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[["Crime Type", selected.type], ["District", selected.district], ["Officer IC", selected.officer], ["Date Filed", selected.date], ["Accused Count", selected.accused], ["Victim Count", selected.victims]].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{k}</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>{v}</div>
                </div>
              ))}
            </div>
            <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Current Status</div>
              <span style={{ background: STATUS_STYLES[selected.status]?.bg, color: STATUS_STYLES[selected.status]?.color, border: `1px solid ${STATUS_STYLES[selected.status]?.border}`, padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600 }}>{selected.status}</span>
            </div>
            <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Investigation Timeline</div>
              {["FIR registered at Police Station", "Preliminary investigation initiated", "Forensic team deployed to scene", "Accused identified via network link"].map((e, i) => (
                <div key={i} style={{ fontSize: "12px", color: "#94a3b8", display: "flex", gap: "10px", marginBottom: "6px" }}>
                  <span style={{ color: "#8b5cf6", fontWeight: 700 }}>Day {i + 1}</span> {e}
                </div>
              ))}
            </div>
          </div>
        </div>
      )}

      {/* New FIR Modal */}
      {showNewFIR && (
        <div className="modal-overlay" onClick={() => setShowNewFIR(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#0d1830", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px",
            padding: "28px", width: "100%", maxWidth: "520px", boxShadow: "0 30px 60px rgba(0,0,0,0.7)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9" }}>File New FIR</h2>
              <button onClick={() => setShowNewFIR(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}><X size={20} /></button>
            </div>
            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Complainant Name</label>
                <input value={newFIR.complainant} onChange={(e) => setNewFIR({ ...newFIR, complainant: e.target.value })}
                  placeholder="Enter full name" style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none" }} />
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Crime Type</label>
                  <select value={newFIR.type} onChange={(e) => setNewFIR({ ...newFIR, type: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none" }}>
                    {["Cybercrime", "Narcotics", "Organised Theft", "Violent Crime", "Financial Fraud", "Missing Person", "Property Dispute"].map((t) => (
                      <option key={t} value={t} style={{ background: "#0f172a" }}>{t}</option>
                    ))}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>District</label>
                  <select value={newFIR.district} onChange={(e) => setNewFIR({ ...newFIR, district: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none" }}>
                    {["Bengaluru Urban", "Mysuru City", "Mangaluru City", "Hubballi-Dharwad", "Belagavi", "Tumakuru", "Kalaburagi"].map((d) => (
                      <option key={d} value={d} style={{ background: "#0f172a" }}>{d}</option>
                    ))}
                  </select>
                </div>
              </div>
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Incident Description</label>
                <textarea value={newFIR.description} onChange={(e) => setNewFIR({ ...newFIR, description: e.target.value })}
                  rows={4} placeholder="Describe the incident in detail..."
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", resize: "vertical" }} />
              </div>
              <button
                onClick={() => { alert("FIR submitted successfully! Auto-assigned ID: FIR-2026-9999"); setShowNewFIR(false); }}
                style={{ background: "linear-gradient(135deg,#3b82f6,#2563eb)", color: "white", border: "none", borderRadius: "8px", padding: "12px", fontSize: "14px", fontWeight: 700, cursor: "pointer", marginTop: "4px" }}>
                Submit FIR
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
