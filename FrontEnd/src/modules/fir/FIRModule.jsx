import React, { useState, useEffect, useCallback } from "react";
import { FileText, Plus, Search, X, RefreshCw, CheckCircle2, AlertCircle, MapPin, Calendar, User } from "lucide-react";
import { listFIRs, searchFIRs, createFIR } from "../../services/fir.service";

// ── Status / Priority style maps ────────────────────────────────────────
const STATUS_STYLES = {
  "Under Investigation": { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  "Chargesheeted":       { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Closed":              { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
  "Convicted":           { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Acquitted":           { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
};

const TABS = ["All", "Under Investigation", "Chargesheeted", "Closed", "Convicted", "Acquitted"];

const CRIME_GROUPS = [
  "Murder", "Attempt to Murder", "Robbery", "Dacoity", "Theft",
  "Burglary", "Kidnapping & Abduction", "Assault", "Rioting",
  "Cheating & Fraud", "Criminal Breach of Trust", "Counterfeiting",
  "Arson", "Dowry Death", "Cybercrime", "Sexual Offences",
  "Narcotics (NDPS Act)", "Arms Act Violations", "SC/ST Atrocities",
  "Motor Vehicle Theft",
];

const BLANK_FORM = {
  FIR_Number: "",
  Station_ID: "",
  Incident_Date: new Date().toISOString().slice(0, 10),
  Crime_Group: "Theft",
  Crime_Subgroup: "",
  Latitude: "",
  Longitude: "",
  Narrative: "",
  Status: "Under Investigation",
};

// ── Toast helper ──────────────────────────────────────────────────────
function Toast({ msg, ok, onDone }) {
  useEffect(() => { const t = setTimeout(onDone, 3500); return () => clearTimeout(t); }, [onDone]);
  return (
    <div style={{
      position: "fixed", bottom: "24px", right: "24px", zIndex: 9999,
      display: "flex", alignItems: "center", gap: "10px",
      background: ok ? "rgba(16,185,129,0.15)" : "rgba(239,68,68,0.15)",
      border: `1px solid ${ok ? "rgba(16,185,129,0.4)" : "rgba(239,68,68,0.4)"}`,
      color: ok ? "#34d399" : "#fb7185",
      borderRadius: "12px", padding: "14px 20px", fontSize: "13px", fontWeight: 600,
      boxShadow: "0 10px 30px rgba(0,0,0,0.5)",
      animation: "slideUp 0.3s ease",
    }}>
      {ok ? <CheckCircle2 size={18} /> : <AlertCircle size={18} />}
      {msg}
    </div>
  );
}

export default function FIRModule() {
  const [firs, setFirs] = useState([]);
  const [total, setTotal] = useState(0);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("All");
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);
  const [showNewFIR, setShowNewFIR] = useState(false);
  const [form, setForm] = useState(BLANK_FORM);
  const [submitting, setSubmitting] = useState(false);
  const [toast, setToast] = useState(null);

  const showToast = (msg, ok = true) => setToast({ msg, ok });

  // ── Load FIRs ──────────────────────────────────────────────────────
  const loadFIRs = useCallback(async () => {
    setLoading(true);
    try {
      const params = { limit: 100, offset: 0 };
      if (activeTab !== "All") params.status = activeTab;

      let result;
      if (query.trim()) {
        result = await searchFIRs({ ...params, crime_group: query });
      } else {
        result = await listFIRs(params);
      }

      const rows = Array.isArray(result) ? result : result.rows ?? [];
      setFirs(rows);
      setTotal(result.total ?? rows.length);
    } catch (err) {
      showToast(`Failed to load FIRs: ${err.message}`, false);
      setFirs([]);
    } finally {
      setLoading(false);
    }
  }, [activeTab, query]);

  useEffect(() => {
    const id = setTimeout(loadFIRs, 300);
    return () => clearTimeout(id);
  }, [loadFIRs]);

  // ── Submit new FIR ─────────────────────────────────────────────────
  const handleSubmit = async () => {
    const required = ["FIR_Number", "Station_ID", "Incident_Date", "Crime_Group", "Latitude", "Longitude"];
    const missing = required.filter((k) => !form[k]);
    if (missing.length) {
      showToast(`Missing fields: ${missing.join(", ")}`, false);
      return;
    }

    setSubmitting(true);
    try {
      await createFIR({
        ...form,
        Station_ID: parseInt(form.Station_ID, 10),
        Latitude: parseFloat(form.Latitude),
        Longitude: parseFloat(form.Longitude),
      });
      showToast(`FIR ${form.FIR_Number} filed successfully!`);
      setShowNewFIR(false);
      setForm(BLANK_FORM);
      loadFIRs();
    } catch (err) {
      showToast(`Failed to file FIR: ${err.message}`, false);
    } finally {
      setSubmitting(false);
    }
  };

  const tabCount = (tab) => {
    if (tab === "All") return total;
    return firs.filter((f) => f.Status === tab).length;
  };

  const displayFIRs = activeTab === "All"
    ? firs
    : firs.filter((f) => f.Status === activeTab);

  return (
    <div>
      {toast && <Toast msg={toast.msg} ok={toast.ok} onDone={() => setToast(null)} />}

      {/* Page Header */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>FIR Management</h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "4px" }}>
            First Information Reports — State-Wide Registry
            {!loading && <span style={{ marginLeft: "8px", color: "#3b82f6", fontFamily: "JetBrains Mono, monospace" }}>({total.toLocaleString("en-IN")} total)</span>}
          </p>
        </div>
        <div style={{ display: "flex", gap: "10px" }}>
          <button
            onClick={loadFIRs}
            style={{ background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "10px 14px", cursor: "pointer", color: "#94a3b8", display: "flex", alignItems: "center", gap: "6px", fontSize: "13px" }}
          >
            <RefreshCw size={14} className={loading ? "spin" : ""} /> Refresh
          </button>
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
      </div>

      {/* Status Tabs */}
      <div style={{ display: "flex", gap: "4px", marginBottom: "20px", borderBottom: "1px solid rgba(255,255,255,0.07)", paddingBottom: "0", flexWrap: "wrap" }}>
        {TABS.map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            style={{
              background: "none", border: "none", padding: "10px 14px", cursor: "pointer",
              fontSize: "13px", fontWeight: activeTab === tab ? 700 : 500,
              color: activeTab === tab ? "#38bdf8" : "#64748b",
              borderBottom: activeTab === tab ? "2px solid #3b82f6" : "2px solid transparent",
              transition: "all 0.2s", whiteSpace: "nowrap",
            }}
          >
            {tab}
            <span style={{
              background: activeTab === tab ? "rgba(59,130,246,0.2)" : "rgba(255,255,255,0.06)",
              color: activeTab === tab ? "#60a5fa" : "#64748b",
              borderRadius: "9999px", padding: "1px 7px", fontSize: "11px", fontWeight: 700, marginLeft: "6px"
            }}>
              {tabCount(tab)}
            </span>
          </button>
        ))}
      </div>

      {/* Search */}
      <div style={{ position: "relative", marginBottom: "16px", width: "340px" }}>
        <Search size={14} style={{ position: "absolute", left: "12px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
        <input
          value={query} onChange={(e) => setQuery(e.target.value)}
          placeholder="Search by crime group (e.g. Theft, Cybercrime)…"
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
        {loading ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#475569", fontSize: "13px" }}>
            <RefreshCw size={24} style={{ margin: "0 auto 12px", opacity: 0.4 }} />
            <p>Loading FIRs from database…</p>
          </div>
        ) : displayFIRs.length === 0 ? (
          <div style={{ padding: "60px", textAlign: "center", color: "#475569", fontSize: "13px" }}>
            <FileText size={36} style={{ margin: "0 auto 12px", opacity: 0.3 }} />
            <p>No FIRs found</p>
          </div>
        ) : (
          <table className="custom-table">
            <thead>
              <tr>
                <th>FIR Number</th>
                <th>Crime Group</th>
                <th>Sub-Group</th>
                <th>Station</th>
                <th>Incident Date</th>
                <th>Status</th>
                <th>Action</th>
              </tr>
            </thead>
            <tbody>
              {displayFIRs.map((f, i) => {
                const st = STATUS_STYLES[f.Status] || STATUS_STYLES["Under Investigation"];
                return (
                  <tr key={f.ROWID ?? i}>
                    <td>
                      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>
                        {f.FIR_Number || `#${f.ROWID}`}
                      </span>
                    </td>
                    <td style={{ color: "#cbd5e1" }}>{f.Crime_Group || "—"}</td>
                    <td style={{ color: "#94a3b8", fontSize: "12px" }}>{f.Crime_Subgroup || "—"}</td>
                    <td style={{ color: "#64748b", fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>{f.Station_ID || "—"}</td>
                    <td style={{ color: "#64748b", fontSize: "12px" }}>{f.Incident_Date || "—"}</td>
                    <td>
                      <span style={{ background: st.bg, color: st.color, border: `1px solid ${st.border}`, borderRadius: "6px", fontSize: "11px", fontWeight: 600, padding: "3px 9px" }}>
                        {f.Status || "Unknown"}
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
        )}
      </div>

      {/* ── Detail Modal ──────────────────────────────────────────────── */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#0d1830", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px",
            padding: "28px", width: "100%", maxWidth: "580px", boxShadow: "0 30px 60px rgba(0,0,0,0.7)"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "24px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>FIRST INFORMATION REPORT</div>
                <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "22px", color: "#38bdf8" }}>
                  {selected.FIR_Number || `#${selected.ROWID}`}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                ["Crime Group", selected.Crime_Group],
                ["Sub-Group", selected.Crime_Subgroup],
                ["Station ID", selected.Station_ID],
                ["Incident Date", selected.Incident_Date],
                ["Latitude", selected.Latitude],
                ["Longitude", selected.Longitude],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{k}</div>
                  <div style={{ fontSize: "14px", fontWeight: 600, color: "#f1f5f9" }}>{v ?? "—"}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Current Status</div>
              <span style={{
                background: STATUS_STYLES[selected.Status]?.bg,
                color: STATUS_STYLES[selected.Status]?.color,
                border: `1px solid ${STATUS_STYLES[selected.Status]?.border}`,
                padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600
              }}>{selected.Status || "Unknown"}</span>
            </div>

            {selected.Narrative && (
              <div style={{ background: "rgba(139,92,246,0.05)", border: "1px solid rgba(139,92,246,0.15)", borderRadius: "8px", padding: "14px" }}>
                <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Incident Narrative</div>
                <p style={{ fontSize: "13px", color: "#94a3b8", lineHeight: "1.6", margin: 0 }}>{selected.Narrative}</p>
              </div>
            )}
          </div>
        </div>
      )}

      {/* ── New FIR Modal ─────────────────────────────────────────────── */}
      {showNewFIR && (
        <div className="modal-overlay" onClick={() => setShowNewFIR(false)}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: "#0d1830", border: "1px solid rgba(255,255,255,0.12)", borderRadius: "16px",
            padding: "28px", width: "100%", maxWidth: "560px", boxShadow: "0 30px 60px rgba(0,0,0,0.7)",
            maxHeight: "90vh", overflowY: "auto"
          }}>
            <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "20px" }}>
              <h2 style={{ fontSize: "18px", fontWeight: 700, color: "#f1f5f9" }}>File New FIR</h2>
              <button onClick={() => setShowNewFIR(false)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}><X size={20} /></button>
            </div>

            <div style={{ display: "flex", flexDirection: "column", gap: "14px" }}>
              {/* FIR Number */}
              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>FIR Number *</label>
                <input
                  value={form.FIR_Number}
                  onChange={(e) => setForm({ ...form, FIR_Number: e.target.value })}
                  placeholder="e.g. FIR/2026/BLR/001"
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Station ID *</label>
                  <input
                    type="number"
                    value={form.Station_ID}
                    onChange={(e) => setForm({ ...form, Station_ID: e.target.value })}
                    placeholder="e.g. 1"
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Incident Date *</label>
                  <input
                    type="date"
                    value={form.Incident_Date}
                    onChange={(e) => setForm({ ...form, Incident_Date: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Crime Group *</label>
                  <select
                    value={form.Crime_Group}
                    onChange={(e) => setForm({ ...form, Crime_Group: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none" }}
                  >
                    {CRIME_GROUPS.map((g) => <option key={g} value={g} style={{ background: "#0f172a" }}>{g}</option>)}
                  </select>
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Status</label>
                  <select
                    value={form.Status}
                    onChange={(e) => setForm({ ...form, Status: e.target.value })}
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none" }}
                  >
                    {["Under Investigation", "Chargesheeted", "Closed", "Convicted", "Acquitted"].map((s) => (
                      <option key={s} value={s} style={{ background: "#0f172a" }}>{s}</option>
                    ))}
                  </select>
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Crime Sub-Group</label>
                <input
                  value={form.Crime_Subgroup}
                  onChange={(e) => setForm({ ...form, Crime_Subgroup: e.target.value })}
                  placeholder="Optional: e.g. ATM Fraud"
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                />
              </div>

              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px" }}>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Latitude *</label>
                  <input
                    type="number" step="0.0001"
                    value={form.Latitude}
                    onChange={(e) => setForm({ ...form, Latitude: e.target.value })}
                    placeholder="e.g. 12.9716"
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
                <div>
                  <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Longitude *</label>
                  <input
                    type="number" step="0.0001"
                    value={form.Longitude}
                    onChange={(e) => setForm({ ...form, Longitude: e.target.value })}
                    placeholder="e.g. 77.5946"
                    style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", boxSizing: "border-box" }}
                  />
                </div>
              </div>

              <div>
                <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>Incident Narrative</label>
                <textarea
                  value={form.Narrative}
                  onChange={(e) => setForm({ ...form, Narrative: e.target.value })}
                  rows={4} placeholder="Describe the incident in detail…"
                  style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none", resize: "vertical", boxSizing: "border-box" }}
                />
              </div>

              <button
                onClick={handleSubmit}
                disabled={submitting}
                style={{
                  background: submitting ? "rgba(37,99,235,0.5)" : "linear-gradient(135deg,#3b82f6,#2563eb)",
                  color: "white", border: "none", borderRadius: "8px",
                  padding: "12px", fontSize: "14px", fontWeight: 700, cursor: submitting ? "not-allowed" : "pointer",
                  marginTop: "4px", display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                }}
              >
                {submitting ? <><RefreshCw size={16} className="spin" /> Submitting…</> : "Submit FIR to Database"}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
