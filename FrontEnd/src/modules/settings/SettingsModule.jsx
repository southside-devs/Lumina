import React, { useState } from "react";
import { Settings, Bell, Database, Shield, User, Save, RefreshCw, CheckCircle2 } from "lucide-react";

const TABS = [
  { id: "profile",      icon: User,      label: "Officer Profile" },
  { id: "alerts",       icon: Bell,      label: "Alert Thresholds" },
  { id: "datasync",     icon: Database,  label: "Data Sync" },
  { id: "security",     icon: Shield,    label: "Security" },
];

function ToggleSwitch({ value, onChange }) {
  return (
    <div
      onClick={() => onChange(!value)}
      style={{
        width: "44px", height: "24px", borderRadius: "12px", cursor: "pointer",
        background: value ? "#3b82f6" : "rgba(100,116,139,0.4)",
        position: "relative", transition: "background 0.2s", flexShrink: 0,
      }}
    >
      <div style={{
        width: "18px", height: "18px", borderRadius: "50%", background: "white",
        position: "absolute", top: "3px", left: value ? "23px" : "3px",
        transition: "left 0.2s", boxShadow: "0 1px 4px rgba(0,0,0,0.3)"
      }} />
    </div>
  );
}

function SliderInput({ value, onChange, min = 0, max = 100 }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
      <input
        type="range" min={min} max={max} value={value}
        onChange={(e) => onChange(Number(e.target.value))}
        style={{ flex: 1, accentColor: "#3b82f6" }}
      />
      <span style={{ fontFamily: "JetBrains Mono, monospace", fontSize: "13px", color: "#38bdf8", fontWeight: 700, minWidth: "35px" }}>{value}</span>
    </div>
  );
}

function SettingRow({ label, desc, children }) {
  return (
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "16px 0", borderBottom: "1px solid rgba(255,255,255,0.05)" }}>
      <div style={{ flex: 1, marginRight: "24px" }}>
        <div style={{ fontSize: "13.5px", fontWeight: 600, color: "#f1f5f9" }}>{label}</div>
        {desc && <div style={{ fontSize: "12px", color: "#64748b", marginTop: "3px" }}>{desc}</div>}
      </div>
      <div style={{ flexShrink: 0 }}>{children}</div>
    </div>
  );
}

export default function SettingsModule() {
  const [tab, setTab] = useState("profile");
  const [saved, setSaved] = useState(false);

  const [profile, setProfile] = useState({ name: "Superintendent S. Rao", rank: "Superintendent of Police", badge: "KSP-2019-0042", zone: "Bengaluru Urban", email: "s.rao@ksp.gov.in" });
  const [alerts, setAlerts] = useState({ riskThreshold: 65, emailAlerts: true, smsAlerts: false, criticalOnly: true, districtPushNotifs: true });
  const [datasync, setDatasync] = useState({ syncInterval: 30, autoRefresh: true, cacheData: true, offlineMode: false, telemetry: true });
  const [security, setSecurity] = useState({ twoFactor: true, sessionTimeout: true, activityLog: true, apiRateLimit: true });

  const handleSave = () => {
    setSaved(true);
    setTimeout(() => setSaved(false), 2500);
  };

  return (
    <div>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: "24px" }}>
        <div>
          <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>System Settings</h1>
          <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "4px" }}>Officer Preferences · Alert Configuration · Data Sync · Platform Security</p>
        </div>
        <button
          onClick={handleSave}
          style={{
            background: saved ? "linear-gradient(135deg,#10b981,#059669)" : "linear-gradient(135deg,#3b82f6,#2563eb)",
            color: "white", border: "none", borderRadius: "8px", padding: "10px 18px",
            fontSize: "13px", fontWeight: 600, cursor: "pointer",
            display: "flex", alignItems: "center", gap: "8px",
            boxShadow: "0 4px 12px rgba(37,99,235,0.3)", transition: "all 0.3s"
          }}
        >
          {saved ? <><CheckCircle2 size={16} /> Saved!</> : <><Save size={15} /> Save Changes</>}
        </button>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "220px 1fr", gap: "20px" }}>
        {/* Sidebar */}
        <div className="panel-card" style={{ padding: "12px", height: "fit-content" }}>
          {TABS.map((t) => {
            const Icon = t.icon;
            return (
              <button
                key={t.id}
                onClick={() => setTab(t.id)}
                style={{
                  width: "100%", background: tab === t.id ? "rgba(59,130,246,0.15)" : "transparent",
                  border: tab === t.id ? "1px solid rgba(59,130,246,0.3)" : "1px solid transparent",
                  borderRadius: "8px", padding: "10px 14px", cursor: "pointer",
                  color: tab === t.id ? "#38bdf8" : "#64748b", fontSize: "13px",
                  fontWeight: tab === t.id ? 700 : 500, display: "flex", alignItems: "center", gap: "10px",
                  marginBottom: "6px", textAlign: "left", transition: "all 0.2s"
                }}
              >
                <Icon size={16} /> {t.label}
              </button>
            );
          })}
        </div>

        {/* Panel */}
        <div className="panel-card">
          <div className="panel-body">
            {tab === "profile" && (
              <div>
                <h3 style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "20px" }}>Officer Profile</h3>
                <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "14px" }}>
                  {[["Full Name", "name"], ["Police Rank", "rank"], ["Badge Number", "badge"], ["Zone / Division", "zone"], ["Official Email", "email"]].map(([label, key]) => (
                    <div key={key} style={{ gridColumn: key === "email" ? "1 / -1" : undefined }}>
                      <label style={{ fontSize: "12px", fontWeight: 600, color: "#94a3b8", display: "block", marginBottom: "6px" }}>{label}</label>
                      <input
                        value={profile[key]}
                        onChange={(e) => setProfile({ ...profile, [key]: e.target.value })}
                        style={{ width: "100%", padding: "10px 14px", background: "rgba(15,23,42,0.8)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: "8px", color: "#f1f5f9", fontSize: "13px", outline: "none" }}
                      />
                    </div>
                  ))}
                </div>
              </div>
            )}

            {tab === "alerts" && (
              <div>
                <h3 style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Alert Thresholds</h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Configure when and how you receive threat notifications</p>
                <SettingRow label="District Risk Alert Threshold" desc="Trigger alerts when risk score exceeds this value">
                  <SliderInput value={alerts.riskThreshold} onChange={(v) => setAlerts({ ...alerts, riskThreshold: v })} />
                </SettingRow>
                <SettingRow label="Email Notifications" desc="Receive critical alerts to your official email">
                  <ToggleSwitch value={alerts.emailAlerts} onChange={(v) => setAlerts({ ...alerts, emailAlerts: v })} />
                </SettingRow>
                <SettingRow label="SMS Alerts" desc="Send SMS for critical-level alerts only">
                  <ToggleSwitch value={alerts.smsAlerts} onChange={(v) => setAlerts({ ...alerts, smsAlerts: v })} />
                </SettingRow>
                <SettingRow label="Critical Alerts Only" desc="Suppress medium and low severity notifications">
                  <ToggleSwitch value={alerts.criticalOnly} onChange={(v) => setAlerts({ ...alerts, criticalOnly: v })} />
                </SettingRow>
                <SettingRow label="District Push Notifications" desc="Real-time push for assigned district events">
                  <ToggleSwitch value={alerts.districtPushNotifs} onChange={(v) => setAlerts({ ...alerts, districtPushNotifs: v })} />
                </SettingRow>
              </div>
            )}

            {tab === "datasync" && (
              <div>
                <h3 style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Data Sync Settings</h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>Manage Catalyst Data Store sync intervals and performance options</p>
                <SettingRow label="Sync Interval (seconds)" desc="How often to poll Catalyst API for live updates">
                  <SliderInput value={datasync.syncInterval} onChange={(v) => setDatasync({ ...datasync, syncInterval: v })} min={10} max={300} />
                </SettingRow>
                <SettingRow label="Auto Refresh Dashboard" desc="Automatically refresh all widgets on sync">
                  <ToggleSwitch value={datasync.autoRefresh} onChange={(v) => setDatasync({ ...datasync, autoRefresh: v })} />
                </SettingRow>
                <SettingRow label="Local Data Cache" desc="Cache results in browser for faster navigation">
                  <ToggleSwitch value={datasync.cacheData} onChange={(v) => setDatasync({ ...datasync, cacheData: v })} />
                </SettingRow>
                <SettingRow label="Offline Mode" desc="Use cached data when network is unavailable">
                  <ToggleSwitch value={datasync.offlineMode} onChange={(v) => setDatasync({ ...datasync, offlineMode: v })} />
                </SettingRow>
                <SettingRow label="Platform Telemetry" desc="Send anonymous usage telemetry to improve Lumina">
                  <ToggleSwitch value={datasync.telemetry} onChange={(v) => setDatasync({ ...datasync, telemetry: v })} />
                </SettingRow>
              </div>
            )}

            {tab === "security" && (
              <div>
                <h3 style={{ fontWeight: 700, color: "#f1f5f9", marginBottom: "4px" }}>Security Settings</h3>
                <p style={{ fontSize: "12px", color: "#64748b", marginBottom: "20px" }}>RBAC authentication, session management, and API security</p>
                <SettingRow label="Two-Factor Authentication" desc="Catalyst Auth TOTP for all logins">
                  <ToggleSwitch value={security.twoFactor} onChange={(v) => setSecurity({ ...security, twoFactor: v })} />
                </SettingRow>
                <SettingRow label="Session Auto-Timeout" desc="Automatically logout after 15 minutes of inactivity">
                  <ToggleSwitch value={security.sessionTimeout} onChange={(v) => setSecurity({ ...security, sessionTimeout: v })} />
                </SettingRow>
                <SettingRow label="Activity Audit Log" desc="Record all actions taken on this platform">
                  <ToggleSwitch value={security.activityLog} onChange={(v) => setSecurity({ ...security, activityLog: v })} />
                </SettingRow>
                <SettingRow label="API Rate Limiting" desc="Limit Catalyst API calls to prevent abuse">
                  <ToggleSwitch value={security.apiRateLimit} onChange={(v) => setSecurity({ ...security, apiRateLimit: v })} />
                </SettingRow>
                <div style={{ marginTop: "20px", padding: "14px", background: "rgba(16,185,129,0.05)", border: "1px solid rgba(16,185,129,0.15)", borderRadius: "8px" }}>
                  <div style={{ display: "flex", alignItems: "center", gap: "8px", color: "#34d399", fontWeight: 600, fontSize: "13px", marginBottom: "4px" }}>
                    <Shield size={15} /> Security Status: Operational
                  </div>
                  <p style={{ fontSize: "12px", color: "#64748b" }}>Last security audit: 18 Jul 2026 · Next scheduled: 18 Aug 2026</p>
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
