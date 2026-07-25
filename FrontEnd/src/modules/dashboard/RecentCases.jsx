import React, { useState, useEffect } from "react";
import { TableProperties, Search, ExternalLink, X, RefreshCw } from "lucide-react";
import { fetchRecentFIRs } from "../../api/dashboard";

const STATUS_STYLES = {
  "Under Investigation": { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  "Chargesheeted":       { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Charge Sheeted":      { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Closed":              { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
  "Convicted":           { color: "#10b981", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Acquitted":           { color: "#94a3b8", bg: "rgba(148,163,184,0.12)", border: "rgba(148,163,184,0.3)" },
};

export default function RecentCases() {
  const [cases, setCases] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState("");
  const [selected, setSelected] = useState(null);

  const load = () => {
    setLoading(true);
    fetchRecentFIRs(15).then((rows) => {
      setCases(rows || []);
      setLoading(false);
    });
  };

  useEffect(() => { load(); }, []);

  const filtered = cases.filter((c) => {
    const q = query.toLowerCase();
    return (
      (c.FIR_Number || "").toLowerCase().includes(q) ||
      (c.Crime_Group || "").toLowerCase().includes(q) ||
      (c.Status || "").toLowerCase().includes(q)
    );
  });

  return (
    <>
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <TableProperties size={18} style={{ color: "#8b5cf6" }} />
            <h3>Recent FIRs</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>
              ({loading ? "…" : filtered.length} records — live)
            </span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search FIR, crime type…"
                style={{
                  paddingLeft: "30px", paddingRight: "12px", paddingTop: "7px", paddingBottom: "7px",
                  background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "12px", outline: "none", width: "200px",
                }}
              />
            </div>
            <button
              onClick={load}
              style={{ background: "none", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", padding: "7px 10px", cursor: "pointer", color: "#64748b" }}
              title="Refresh"
            >
              <RefreshCw size={13} className={loading ? "spin" : ""} />
            </button>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          {loading ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: "13px" }}>
              Loading latest FIRs from database…
            </div>
          ) : filtered.length === 0 ? (
            <div style={{ padding: "40px", textAlign: "center", color: "#475569", fontSize: "13px" }}>
              No records found
            </div>
          ) : (
            <table className="custom-table">
              <thead>
                <tr>
                  <th>FIR Number</th>
                  <th>Crime Group</th>
                  <th>Sub-Group</th>
                  <th>Station ID</th>
                  <th>Incident Date</th>
                  <th>Status</th>
                  <th>Actions</th>
                </tr>
              </thead>
              <tbody>
                {filtered.map((c, i) => {
                  const st = STATUS_STYLES[c.Status] || STATUS_STYLES["Under Investigation"];
                  return (
                    <tr key={c.ROWID ?? i}>
                      <td>
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>
                          {c.FIR_Number || `#${c.ROWID}`}
                        </span>
                      </td>
                      <td style={{ color: "#cbd5e1" }}>{c.Crime_Group || "—"}</td>
                      <td style={{ color: "#94a3b8", fontSize: "12px" }}>
                        {c.Crime_Subgroup ? String(c.Crime_Subgroup).replace(/IPC/g, "BNS") : "—"}
                      </td>
                      <td style={{ color: "#64748b", fontFamily: "JetBrains Mono, monospace", fontSize: "12px" }}>{c.Station_ID || "—"}</td>
                      <td style={{ color: "#64748b", fontSize: "12px" }}>{c.Incident_Date || "—"}</td>
                      <td>
                        <span style={{
                          background: st.bg, color: st.color,
                          border: `1px solid ${st.border}`, borderRadius: "6px",
                          fontSize: "11px", fontWeight: 600, padding: "3px 10px", whiteSpace: "nowrap"
                        }}>{c.Status || "Unknown"}</span>
                      </td>
                      <td>
                        <button
                          onClick={() => setSelected(c)}
                          style={{
                            background: "rgba(59,130,246,0.1)", color: "#60a5fa",
                            border: "1px solid rgba(59,130,246,0.25)", borderRadius: "6px",
                            padding: "5px 10px", fontSize: "11px", fontWeight: 600, cursor: "pointer",
                            display: "flex", alignItems: "center", gap: "4px"
                          }}
                        >
                          <ExternalLink size={11} /> View
                        </button>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Case Detail Modal */}
      {selected && (
        <div className="modal-overlay" onClick={() => setSelected(null)}>
          <div
            onClick={(e) => e.stopPropagation()}
            style={{
              background: "#0d1830", border: "1px solid rgba(255,255,255,0.12)",
              borderRadius: "16px", padding: "28px", width: "100%", maxWidth: "540px",
              boxShadow: "0 30px 60px rgba(0,0,0,0.7)",
            }}
          >
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: "20px" }}>
              <div>
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>FIRST INFORMATION REPORT</div>
                <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", color: "#38bdf8" }}>
                  {selected.FIR_Number || `FIR #${selected.ROWID}`}
                </h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "12px", marginBottom: "20px" }}>
              {[
                ["Crime Group", selected.Crime_Group],
                ["Crime Sub-Group", selected.Crime_Subgroup],
                ["Station ID", selected.Station_ID],
                ["Incident Date", selected.Incident_Date],
                ["Latitude", selected.Latitude],
                ["Longitude", selected.Longitude],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{k}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{v ?? "—"}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "14px", marginBottom: "14px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Status</div>
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
    </>
  );
}