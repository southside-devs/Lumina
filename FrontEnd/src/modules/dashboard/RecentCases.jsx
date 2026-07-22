import React, { useState } from "react";
import { TableProperties, Search, ExternalLink, X } from "lucide-react";

const CASES = [
  { id: "FIR-2026-9901", district: "Bengaluru Urban", type: "Cybercrime",       officer: "Insp. V. Raju",    status: "Under Investigation", priority: "critical", date: "22 Jul 2026" },
  { id: "FIR-2026-9877", district: "Mysuru City",     type: "Narcotics",        officer: "SI K. Patel",      status: "Charge Sheeted",      priority: "high",     date: "21 Jul 2026" },
  { id: "FIR-2026-9854", district: "Mangaluru City",  type: "Organised Theft",  officer: "Insp. R. Shetty",  status: "Pending Review",      priority: "high",     date: "21 Jul 2026" },
  { id: "FIR-2026-9832", district: "Belagavi",        type: "Financial Fraud",  officer: "ASI N. Desai",     status: "Closed",              priority: "medium",   date: "20 Jul 2026" },
  { id: "FIR-2026-9810", district: "Hubballi-Dharwad",type: "Violent Crime",    officer: "SI M. Patil",      status: "Under Investigation", priority: "critical", date: "20 Jul 2026" },
  { id: "FIR-2026-9798", district: "Tumakuru",        type: "Cybercrime",       officer: "Insp. G. Kumar",   status: "Charge Sheeted",      priority: "medium",   date: "19 Jul 2026" },
  { id: "FIR-2026-9781", district: "Kalaburagi",      type: "Missing Person",   officer: "SI S. Bhatt",      status: "Under Investigation", priority: "high",     date: "19 Jul 2026" },
];

const STATUS_STYLES = {
  "Under Investigation": { color: "#60a5fa", bg: "rgba(59,130,246,0.12)", border: "rgba(59,130,246,0.3)" },
  "Charge Sheeted":      { color: "#34d399", bg: "rgba(16,185,129,0.12)", border: "rgba(16,185,129,0.3)" },
  "Pending Review":      { color: "#fbbf24", bg: "rgba(245,158,11,0.12)", border: "rgba(245,158,11,0.3)" },
  "Closed":              { color: "#64748b", bg: "rgba(100,116,139,0.12)", border: "rgba(100,116,139,0.3)" },
};

const PRIORITY_DOT = {
  critical: "#f43f5e",
  high:     "#f59e0b",
  medium:   "#3b82f6",
};

export default function RecentCases() {
  const [query, setQuery] = useState("");
  const [filterStatus, setFilterStatus] = useState("all");
  const [selected, setSelected] = useState(null);

  const filtered = CASES.filter((c) => {
    const matchQuery = c.id.toLowerCase().includes(query.toLowerCase()) ||
      c.district.toLowerCase().includes(query.toLowerCase()) ||
      c.type.toLowerCase().includes(query.toLowerCase());
    const matchStatus = filterStatus === "all" || c.status === filterStatus;
    return matchQuery && matchStatus;
  });

  return (
    <>
      <div className="panel-card">
        <div className="panel-header">
          <div className="panel-title">
            <TableProperties size={18} style={{ color: "#8b5cf6" }} />
            <h3>Recent Cases</h3>
            <span style={{ fontSize: "12px", color: "#64748b" }}>({filtered.length} records)</span>
          </div>
          <div style={{ display: "flex", gap: "10px", alignItems: "center" }}>
            <div style={{ position: "relative" }}>
              <Search size={13} style={{ position: "absolute", left: "10px", top: "50%", transform: "translateY(-50%)", color: "#64748b" }} />
              <input
                type="text"
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search FIR, district, type..."
                style={{
                  paddingLeft: "30px", paddingRight: "12px", paddingTop: "7px", paddingBottom: "7px",
                  background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)",
                  borderRadius: "8px", color: "#f1f5f9", fontSize: "12px", outline: "none", width: "200px",
                }}
              />
            </div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              style={{
                background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)",
                borderRadius: "8px", color: "#f1f5f9", fontSize: "12px", padding: "7px 12px", outline: "none",
              }}
            >
              <option value="all" style={{ background: "#0f172a" }}>All Statuses</option>
              <option value="Under Investigation" style={{ background: "#0f172a" }}>Under Investigation</option>
              <option value="Charge Sheeted" style={{ background: "#0f172a" }}>Charge Sheeted</option>
              <option value="Pending Review" style={{ background: "#0f172a" }}>Pending Review</option>
              <option value="Closed" style={{ background: "#0f172a" }}>Closed</option>
            </select>
          </div>
        </div>

        <div style={{ overflowX: "auto" }}>
          <table className="custom-table">
            <thead>
              <tr>
                <th>FIR ID</th>
                <th>District</th>
                <th>Crime Type</th>
                <th>Officer IC</th>
                <th>Status</th>
                <th>Date</th>
                <th>Actions</th>
              </tr>
            </thead>
            <tbody>
              {filtered.map((c) => {
                const st = STATUS_STYLES[c.status] || STATUS_STYLES["Closed"];
                return (
                  <tr key={c.id}>
                    <td>
                      <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                        <div style={{ width: "8px", height: "8px", borderRadius: "50%", background: PRIORITY_DOT[c.priority], flexShrink: 0 }} />
                        <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "12px", color: "#38bdf8", fontWeight: 600 }}>{c.id}</span>
                      </div>
                    </td>
                    <td style={{ color: "#cbd5e1" }}>{c.district}</td>
                    <td style={{ color: "#94a3b8" }}>{c.type}</td>
                    <td style={{ color: "#94a3b8" }}>{c.officer}</td>
                    <td>
                      <span style={{
                        background: st.bg, color: st.color,
                        border: `1px solid ${st.border}`, borderRadius: "6px",
                        fontSize: "11px", fontWeight: 600, padding: "3px 10px", whiteSpace: "nowrap"
                      }}>{c.status}</span>
                    </td>
                    <td style={{ color: "#64748b", fontSize: "12px" }}>{c.date}</td>
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
                <div style={{ fontSize: "11px", color: "#64748b", fontWeight: 700, letterSpacing: "0.05em", marginBottom: "4px" }}>CASE FILE</div>
                <h2 style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "20px", color: "#38bdf8" }}>{selected.id}</h2>
              </div>
              <button onClick={() => setSelected(null)} style={{ background: "none", border: "none", color: "#475569", cursor: "pointer" }}>
                <X size={20} />
              </button>
            </div>

            <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px", marginBottom: "20px" }}>
              {[
                ["Crime Type", selected.type],
                ["District", selected.district],
                ["Officer In Charge", selected.officer],
                ["Filed Date", selected.date],
              ].map(([k, v]) => (
                <div key={k} style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "12px" }}>
                  <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "4px" }}>{k}</div>
                  <div style={{ fontSize: "13px", fontWeight: 600, color: "#f1f5f9" }}>{v}</div>
                </div>
              ))}
            </div>

            <div style={{ background: "rgba(15,23,42,0.6)", borderRadius: "8px", padding: "14px", marginBottom: "16px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Case Status</div>
              <span style={{
                background: STATUS_STYLES[selected.status]?.bg,
                color: STATUS_STYLES[selected.status]?.color,
                border: `1px solid ${STATUS_STYLES[selected.status]?.border}`,
                padding: "4px 12px", borderRadius: "6px", fontSize: "12px", fontWeight: 600
              }}>{selected.status}</span>
            </div>

            <div style={{ background: "rgba(59,130,246,0.05)", border: "1px solid rgba(59,130,246,0.15)", borderRadius: "8px", padding: "14px" }}>
              <div style={{ fontSize: "11px", color: "#64748b", marginBottom: "8px" }}>Evidence Log</div>
              <ul style={{ listStyle: "none", display: "flex", flexDirection: "column", gap: "6px" }}>
                {["CCTV Footage — Sector 7 ATM", "Bank Transaction Records (7 docs)", "Forensic Report — Digital Device", "Witness Statement — 2 affidavits"].map((e) => (
                  <li key={e} style={{ fontSize: "12px", color: "#94a3b8", display: "flex", gap: "8px" }}>
                    <span style={{ color: "#34d399" }}>✓</span> {e}
                  </li>
                ))}
              </ul>
            </div>
          </div>
        </div>
      )}
    </>
  );
}