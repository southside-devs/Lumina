import React, { useState, useEffect } from "react";
import { Sparkles, Download, RefreshCw, X, ShieldCheck, CheckCircle2, ArrowRight } from "lucide-react";

export default function UpdateNotificationModal({ onClose }) {
  const [updateInfo, setUpdateInfo] = useState(null);
  const [downloading, setDownloading] = useState(false);
  const [downloadProgress, setDownloadProgress] = useState(0);
  const [readyToRestart, setReadyToRestart] = useState(false);

  useEffect(() => {
    // 1. Listen for real Electron Auto-Updater events
    if (window.electronAPI && window.electronAPI.onUpdateAvailable) {
      window.electronAPI.onUpdateAvailable((info) => {
        setUpdateInfo(info);
      });
      window.electronAPI.onUpdateDownloaded((info) => {
        setDownloading(false);
        setReadyToRestart(true);
      });
      if (window.electronAPI.onDownloadProgress) {
        window.electronAPI.onDownloadProgress((percent) => {
          setDownloadProgress(percent);
        });
      }
    } else {
      // 2. Demo fallback info for preview/testing
      setUpdateInfo({
        version: "v0.2.2",
        releaseNotes: [
          "Legal Act Code Transition: Replaced outdated IPC with BNS (Bharatiya Nyaya Sanhita, 2023) across all crime categories.",
          "Briefing & Tactical Reports: Added direct browser download for Intelligence Briefing text/PDF & ST-DBSCAN Cluster Dossiers.",
          "Karnataka State Police Branding: Embedded official KSP Crest emblem in top navbar.",
          "AI Copilot Upgrades: Added support for custom user queries, Reset Conversation, and Export Chat Log file download.",
          "UI Clutter Fixes: Added close control to Hotspot Inspector panel & resolved Pie Chart legend text overlaps.",
          "Role Authentication: Interactive Catalyst RBAC clearance switching with live OAuth notifications."
        ],
        releaseDate: new Date().toLocaleDateString()
      });
    }
  }, []);

  const handleStartUpdate = () => {
    if (window.electronAPI && window.electronAPI.downloadUpdate) {
      setDownloading(true);
      window.electronAPI.downloadUpdate();
    } else {
      // Simulate download progress in web mode
      setDownloading(true);
      let p = 0;
      const interval = setInterval(() => {
        p += 15;
        setDownloadProgress(Math.min(p, 100));
        if (p >= 100) {
          clearInterval(interval);
          setDownloading(false);
          setReadyToRestart(true);
        }
      }, 300);
    }
  };

  const handleRestart = () => {
    if (window.electronAPI && window.electronAPI.quitAndInstall) {
      window.electronAPI.quitAndInstall();
    } else {
      window.location.reload();
    }
  };

  if (!updateInfo) return null;

  const notesList = Array.isArray(updateInfo.releaseNotes)
    ? updateInfo.releaseNotes
    : String(updateInfo.releaseNotes).split("\n").filter(Boolean);

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, right: 0, bottom: 0,
      background: "rgba(9, 13, 22, 0.85)", backdropFilter: "blur(12px)",
      zIndex: 99999, display: "flex", alignItems: "center", justifyContent: "center",
      padding: "20px"
    }}>
      <div style={{
        width: "100%", maxWidth: "560px", background: "#121620",
        border: "1px solid rgba(232, 80, 2, 0.4)", borderRadius: "20px",
        boxShadow: "0 25px 50px -12px rgba(232, 80, 2, 0.25), 0 0 30px rgba(0, 0, 0, 0.8)",
        overflow: "hidden", fontFamily: "Inter, sans-serif", color: "#f8fafc"
      }}>
        {/* Modal Header */}
        <div style={{
          background: "linear-gradient(135deg, rgba(232,80,2,0.2), rgba(193,8,1,0.3))",
          borderBottom: "1px solid rgba(255, 255, 255, 0.1)", padding: "20px 24px",
          display: "flex", alignItems: "center", justifyContent: "space-between"
        }}>
          <div style={{ display: "flex", alignItems: "center", gap: "12px" }}>
            <div style={{
              width: "36px", height: "36px", borderRadius: "10px",
              background: "rgba(232,80,2,0.3)", border: "1px solid rgba(232,80,2,0.6)",
              display: "flex", alignItems: "center", justifyContent: "center", color: "#e85002"
            }}>
              <Sparkles size={20} />
            </div>
            <div>
              <div style={{ fontSize: "11px", fontWeight: "700", fontFamily: "JetBrains Mono, monospace", color: "#e85002" }}>
                SOFTWARE UPDATE AVAILABLE
              </div>
              <h3 style={{ fontSize: "18px", fontWeight: "800", color: "#ffffff", margin: "2px 0 0" }}>
                Lumina {updateInfo.version}
              </h3>
            </div>
          </div>
          <button
            onClick={onClose}
            style={{ background: "rgba(255,255,255,0.08)", border: "none", color: "#94a3b8", width: "30px", height: "30px", borderRadius: "8px", cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center" }}
          >
            <X size={16} />
          </button>
        </div>

        {/* Modal Body: Changelog & Release Notes */}
        <div style={{ padding: "24px", maxHeight: "360px", overflowY: "auto" }}>
          <div style={{ fontSize: "12px", fontWeight: "700", fontFamily: "JetBrains Mono, monospace", color: "#94a3b8", marginBottom: "12px", textTransform: "uppercase" }}>
            📋 Release Notes & Improvements:
          </div>
          <div style={{ display: "flex", flexDirection: "column", gap: "10px" }}>
            {notesList.map((note, i) => (
              <div key={i} style={{
                background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.07)",
                borderRadius: "10px", padding: "12px 14px", display: "flex", alignItems: "flex-start", gap: "10px"
              }}>
                <CheckCircle2 size={16} style={{ color: "#10b981", flexShrink: 0, marginTop: "2px" }} />
                <span style={{ fontSize: "13px", color: "#cbd5e1", lineHeight: "1.5" }}>{note}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Download Progress Bar */}
        {downloading && (
          <div style={{ padding: "0 24px 16px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: "11px", fontFamily: "JetBrains Mono, monospace", color: "#e85002", marginBottom: "6px", fontWeight: "700" }}>
              <span>Downloading Update Package...</span>
              <span>{downloadProgress}%</span>
            </div>
            <div style={{ height: "8px", background: "rgba(255,255,255,0.1)", borderRadius: "999px", overflow: "hidden" }}>
              <div style={{ height: "100%", width: `${downloadProgress}%`, background: "linear-gradient(90deg, #e85002, #38bdf8)", transition: "width 0.3s ease" }} />
            </div>
          </div>
        )}

        {/* Modal Footer CTAs */}
        <div style={{
          padding: "16px 24px", background: "rgba(0,0,0,0.4)",
          borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", alignItems: "center", justifyContent: "flex-end", gap: "12px"
        }}>
          {!readyToRestart ? (
            <>
              <button
                onClick={onClose}
                disabled={downloading}
                style={{
                  background: "transparent", border: "1px solid rgba(255,255,255,0.15)",
                  color: "#94a3b8", padding: "10px 18px", borderRadius: "10px",
                  fontSize: "13px", fontWeight: "600", cursor: downloading ? "not-allowed" : "pointer"
                }}
              >
                Remind Me Later
              </button>
              <button
                onClick={handleStartUpdate}
                disabled={downloading}
                style={{
                  background: "linear-gradient(135deg, #e85002, #c10801)",
                  border: "none", color: "#ffffff", padding: "10px 20px", borderRadius: "10px",
                  fontSize: "13px", fontWeight: "700", cursor: downloading ? "not-allowed" : "pointer",
                  display: "flex", alignItems: "center", gap: "8px", boxShadow: "0 0 20px rgba(232,80,2,0.4)"
                }}
              >
                {downloading ? (
                  <>
                    <RefreshCw size={16} className="spin" />
                    <span>Downloading...</span>
                  </>
                ) : (
                  <>
                    <Download size={16} />
                    <span>Download & Update Now</span>
                  </>
                )}
              </button>
            </>
          ) : (
            <button
              onClick={handleRestart}
              style={{
                width: "100%", background: "linear-gradient(135deg, #10b981, #059669)",
                border: "none", color: "#ffffff", padding: "12px 20px", borderRadius: "10px",
                fontSize: "14px", fontWeight: "800", cursor: "pointer",
                display: "flex", alignItems: "center", justifyContent: "center", gap: "8px",
                boxShadow: "0 0 20px rgba(16,185,129,0.4)"
              }}
            >
              <RefreshCw size={16} />
              <span>Update Downloaded — Restart & Apply Now</span>
            </button>
          )}
        </div>
      </div>
    </div>
  );
}
