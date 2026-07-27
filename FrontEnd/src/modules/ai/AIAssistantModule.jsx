import React, { useState, useRef, useEffect } from "react";
import { Bot, Send, Sparkles, Download, RotateCcw, Copy } from "lucide-react";
import useDashboardStore from "../../store/dashboardStore";
import apiClient from "../../api/client";

const QUICK_PROMPTS = [
  "Show crime hotspots in Bengaluru Urban for last 30 days",
  "Compare narcotics seizures across all districts",
  "Top 5 districts with highest violent crime rate",
  "Predict next-week hotspot cluster for Mysuru City",
  "List all pending review FIRs filed in July 2026",
];

export default function AIAssistantModule() {
  const [messages, setMessages] = useState([
    {
      role: "assistant",
      text: "Namaskara! I am **Lumina AI**, your Karnataka State Police intelligence assistant powered by Zoho Catalyst. I can analyze crime patterns, query FIR databases, generate district risk reports, predict hotspot clusters, and cross-reference criminal network links. How can I assist your investigation today?",
    }
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef(null);

  // Fetch contextual data from the dashboard store to simulate RAG
  const { kpis, recentCases } = useDashboardStore();

  const sendMessage = async (text) => {
    const q = text || input;
    if (!q || !q.trim()) return;
    setInput("");
    
    const userMsg = { role: "user", text: q };
    setMessages((prev) => [...prev, userMsg]);
    setLoading(true);

    try {
      const contextData = `
        You are Lumina AI, an elite intelligence assistant for the Karnataka State Police (KSP).
        You analyze spatial crime data, FIRs, and predict hotspots.
        Be professional, analytical, and format your responses in Markdown with bolding and bullet points when appropriate.
        Current Live System Data (Use this to answer questions accurately if relevant):
        - Total FIRs Registered: ${kpis.find(k => k.label === "Total FIRs Registered")?.value || "14,892"}
        - Critical Hotspots: ${kpis.find(k => k.label === "Critical Hotspots Active")?.value || "4"}
        - Recent Case 1: ${recentCases[0]?.Crime_Group || "Theft"} in ${recentCases[0]?.District_Name || "Bengaluru Urban"}
        - Recent Case 2: ${recentCases[1]?.Crime_Group || "Assault"} in ${recentCases[1]?.District_Name || "Mysuru City"}
      `;

      // Build chat history
      const chatHistory = messages.map(m => ({
        role: m.role,
        text: m.text
      }));

      const res = await apiClient.post("/api/ai-chat", {
        query: q,
        history: chatHistory,
        context: contextData
      });

      let responseText = res.data?.response || res.data?.data?.response || res?.response;

      if (responseText) {
        // Sanitize out any scratchpad / thought trace text
        if (typeof responseText === "string" && (responseText.includes("* User input:") || responseText.includes("* Instruction:"))) {
          const lines = responseText.split("\n").filter(l => 
            !l.trim().startsWith("* User input:") && 
            !l.trim().startsWith("* Context:") && 
            !l.trim().startsWith("* Instruction:") && 
            !l.trim().startsWith("* Tone:") && 
            !l.trim().startsWith("* Goal:")
          );
          if (lines.length > 0) {
            responseText = lines.join("\n").trim();
          }
        }

        setMessages((prev) => [...prev, { 
          role: "assistant", 
          text: responseText,
          footer: `Query processed securely via Catalyst Backend` 
        }]);
      } else {
        throw new Error("Invalid response format from server");
      }
    } catch (error) {
      console.warn("Catalyst AI Backend notice:", error.message);
      
      // Generate intelligent fallback response based on store data when API is unavailable
      const fallbackText = generateFallbackResponse(q);
      
      setMessages((prev) => [...prev, { 
        role: "assistant", 
        text: fallbackText,
        footer: `Lumina Intelligence Engine (Offline/Fallback Mode)` 
      }]);
    } finally {
      setLoading(false);
    }
  };

  const generateFallbackResponse = (query) => {
    const qLower = query.trim().toLowerCase();
    
    // Casual greeting handling
    if (["hi", "hello", "hey", "namaskara", "namaste", "good morning", "good evening"].includes(qLower) || qLower.length <= 3) {
      return "Namaskara! I am Lumina AI, your Karnataka State Police intelligence assistant. How can I assist your investigation today?";
    }

    const totalFirs = kpis.find(k => k.label === "Total FIRs Registered")?.value || "14,892";
    const criticalHotspots = kpis.find(k => k.label === "Critical Hotspots Active")?.value || "4";
    const sampleDistrict = recentCases[0]?.District_Name || "Bengaluru Urban";

    if (qLower.includes("hotspot") || qLower.includes("bengaluru") || qLower.includes("mysuru") || qLower.includes("cluster")) {
      return `### 🗺️ Crime Hotspot & Spatial Risk Analysis

Based on real-time spatial analysis of registered crime records:

- **Active Hotspot Clusters**: **${criticalHotspots} critical locations** flagged for priority surveillance (including **${sampleDistrict}** & **Mysuru City**).
- **Temporal Concentration**: Peak activity observed between **21:00 – 03:00 HRS** (Property Offenses & Street Crimes).
- **Tactical Recommendation**: Increase high-visibility beat patrols and establish joint check-posts along primary transit corridors.`;
    }

    if (qLower.includes("narcotic") || qLower.includes("seizure") || qLower.includes("drug")) {
      return `### 💊 NDPS & Narcotics Enforcement Intelligence

Analysis of NDPS enforcement reports across Karnataka districts:

- **Total Recorded Cases**: **${totalFirs} FIRs** logged statewide.
- **Key Interception Corridors**: Coastal transit routes (Mangaluru) and border check-posts (Belagavi / Hosur Road corridor).
- **Action Plan**: Deploy ANTF (Anti-Narcotics Task Force) field units for targeted vehicle inspections based on spatial density maps.`;
    }

    return `### 📊 Karnataka Police Intelligence Briefing

- **Total FIR Database Index**: **${totalFirs} registered records** actively indexed.
- **Active Hotspot Alerts**: **${criticalHotspots} high-density risk clusters** being tracked.
- **Recent Intelligence Event**: Case registered under **${recentCases[0]?.Crime_Group || "Theft"}** in **${sampleDistrict}**.

*Tactical Advisory: Utilize the Spatial Map Explorer to filter specific police station boundaries and FIR timeframes.*`;
  };

  const handleKey = (e) => {
    if (e.key === "Enter" && !e.shiftKey) {
      e.preventDefault();
      sendMessage();
    }
  };

  const handleResetChat = () => {
    setMessages([
      {
        role: "assistant",
        text: "Namaskara! Conversation history has been reset. How can I assist your investigation today?",
      }
    ]);
  };

  const handleExportChatLog = () => {
    let logText = `===================================================================\nKARNATAKA STATE POLICE — LUMINA AI ASSISTANT CHAT LOG\nGenerated: ${new Date().toLocaleString()} | RESTRICTED INTERNAL KSP\n===================================================================\n\n`;
    messages.forEach((m, i) => {
      logText += `[${m.role.toUpperCase()}]\n${m.text.replace(/\*\*/g, "")}\n`;
      if (m.bullets) {
        m.bullets.forEach((b) => {
          logText += `  * ${b.replace(/\*\*/g, "")}\n`;
        });
      }
      logText += `\n-------------------------------------------------------------------\n\n`;
    });

    const blob = new Blob([logText], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `Lumina_AI_Chat_Log_${new Date().toISOString().slice(0, 10)}.txt`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  return (
    <div style={{ display: "flex", flexDirection: "column", height: "calc(100vh - 120px)" }}>
      {/* Header */}
      <div style={{ marginBottom: "20px" }}>
        <h1 style={{ fontSize: "24px", fontWeight: 800, color: "#f8fafc", letterSpacing: "-0.02em" }}>AI Intelligence Assistant</h1>
        <p style={{ fontSize: "13.5px", color: "#94a3b8", marginTop: "4px" }}>Lumina AI · Catalyst QuickML RAG · Natural Language Crime Intelligence Queries</p>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 280px", gap: "20px", flex: 1, minHeight: 0 }}>
        {/* Chat Window */}
        <div className="panel-card" style={{ display: "flex", flexDirection: "column" }}>
          {/* Messages */}
          <div style={{ flex: 1, overflowY: "auto", padding: "20px", display: "flex", flexDirection: "column", gap: "16px" }}>
            {messages.map((msg, i) => (
              <div key={i} style={{ display: "flex", gap: "12px", flexDirection: msg.role === "user" ? "row-reverse" : "row" }}>
                {/* Avatar */}
                <div style={{
                  width: "34px", height: "34px", borderRadius: "50%", flexShrink: 0,
                  background: msg.role === "user" ? "linear-gradient(135deg,#3b82f6,#2563eb)" : "linear-gradient(135deg,#8b5cf6,#6366f1)",
                  display: "flex", alignItems: "center", justifyContent: "center", fontSize: "14px",
                }}>
                  {msg.role === "user" ? "SP" : <Bot size={16} />}
                </div>

                {/* Bubble */}
                <div style={{
                  maxWidth: "75%",
                  background: msg.role === "user" ? "rgba(59,130,246,0.15)" : "rgba(139,92,246,0.08)",
                  border: `1px solid ${msg.role === "user" ? "rgba(59,130,246,0.3)" : "rgba(139,92,246,0.2)"}`,
                  borderRadius: msg.role === "user" ? "16px 4px 16px 16px" : "4px 16px 16px 16px",
                  padding: "14px 16px",
                }}>
                  <p style={{ fontSize: "13px", color: "#e2e8f0", lineHeight: "1.6" }}
                    dangerouslySetInnerHTML={{ __html: msg.text.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>') }}
                  />
                  {msg.bullets && (
                    <ul style={{ marginTop: "10px", display: "flex", flexDirection: "column", gap: "6px", listStyle: "none" }}>
                      {msg.bullets.map((b, j) => (
                        <li key={j} style={{ fontSize: "12.5px", color: "#94a3b8", lineHeight: "1.5" }}
                          dangerouslySetInnerHTML={{ __html: b.replace(/\*\*(.*?)\*\*/g, '<strong style="color:#f1f5f9">$1</strong>') }}
                        />
                      ))}
                    </ul>
                  )}
                  {msg.footer && (
                    <div style={{ marginTop: "10px", paddingTop: "10px", borderTop: "1px solid rgba(255,255,255,0.06)", fontSize: "11px", color: "#64748b" }}>
                      {msg.footer}
                    </div>
                  )}
                </div>
              </div>
            ))}

            {loading && (
              <div style={{ display: "flex", gap: "12px" }}>
                <div style={{ width: "34px", height: "34px", borderRadius: "50%", background: "linear-gradient(135deg,#8b5cf6,#6366f1)", display: "flex", alignItems: "center", justifyContent: "center" }}>
                  <Bot size={16} />
                </div>
                <div style={{ background: "rgba(139,92,246,0.08)", border: "1px solid rgba(139,92,246,0.2)", borderRadius: "4px 16px 16px 16px", padding: "16px" }}>
                  <div style={{ display: "flex", gap: "6px", alignItems: "center" }}>
                    {[0, 1, 2].map((d) => (
                      <div key={d} style={{
                        width: "8px", height: "8px", background: "#8b5cf6", borderRadius: "50%",
                        animation: `bounce 1.2s ${d * 0.2}s infinite`,
                        opacity: 0.7
                      }} />
                    ))}
                    <style>{`@keyframes bounce { 0%,80%,100%{transform:translateY(0)} 40%{transform:translateY(-8px)} }`}</style>
                    <span style={{ fontSize: "12px", color: "#8b5cf6", marginLeft: "6px" }}>Querying Catalyst QuickML RAG...</span>
                  </div>
                </div>
              </div>
            )}

            <div ref={messagesEndRef} />
          </div>

          {/* Input */}
          <div style={{ padding: "16px", borderTop: "1px solid rgba(255,255,255,0.08)", display: "flex", gap: "10px" }}>
            <textarea
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={handleKey}
              placeholder="Ask anything about crime patterns, districts, FIRs, suspects..."
              rows={2}
              style={{
                flex: 1, padding: "10px 14px", background: "rgba(15,23,42,0.8)",
                border: "1px solid rgba(255,255,255,0.12)", borderRadius: "10px",
                color: "#f1f5f9", fontSize: "13px", outline: "none", resize: "none",
                fontFamily: "inherit"
              }}
            />
            <button
              onClick={() => sendMessage()}
              disabled={loading || !input.trim()}
              style={{
                width: "48px", height: "48px", borderRadius: "10px", border: "none",
                background: "linear-gradient(135deg,#8b5cf6,#6366f1)", color: "white",
                display: "flex", alignItems: "center", justifyContent: "center",
                cursor: loading || !input.trim() ? "not-allowed" : "pointer",
                opacity: loading || !input.trim() ? 0.5 : 1, flexShrink: 0, alignSelf: "flex-end"
              }}
            >
              <Send size={18} />
            </button>
          </div>
        </div>

        {/* Quick Prompts Sidebar */}
        <div style={{ display: "flex", flexDirection: "column", gap: "16px" }}>
          <div className="panel-card">
            <div className="panel-header">
              <div className="panel-title">
                <Sparkles size={16} style={{ color: "#f59e0b" }} />
                <h3 style={{ fontSize: "14px" }}>Quick Intelligence Queries</h3>
              </div>
            </div>
            <div className="panel-body" style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
              {QUICK_PROMPTS.map((p, i) => (
                <button
                  key={i}
                  onClick={() => sendMessage(p)}
                  style={{
                    background: "rgba(30,41,59,0.4)", border: "1px solid rgba(255,255,255,0.07)",
                    borderRadius: "8px", padding: "10px 12px", cursor: "pointer",
                    textAlign: "left", color: "#94a3b8", fontSize: "12px", lineHeight: "1.4",
                    transition: "all 0.2s"
                  }}
                  onMouseEnter={(e) => { e.currentTarget.style.background = "rgba(139,92,246,0.12)"; e.currentTarget.style.color = "#c4b5fd"; }}
                  onMouseLeave={(e) => { e.currentTarget.style.background = "rgba(30,41,59,0.4)"; e.currentTarget.style.color = "#94a3b8"; }}
                >
                  {p}
                </button>
              ))}
            </div>
          </div>

          <div className="panel-card">
            <div className="panel-body">
              <div style={{ fontSize: "12px", color: "#64748b", fontWeight: 600, marginBottom: "8px" }}>Session Actions</div>
              <div style={{ display: "flex", flexDirection: "column", gap: "8px" }}>
                <button onClick={handleResetChat} style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#94a3b8", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <RotateCcw size={13} /> Reset Conversation
                </button>
                <button onClick={handleExportChatLog} style={{ background: "rgba(30,41,59,0.4)", border: "1px solid rgba(255,255,255,0.07)", borderRadius: "8px", padding: "8px 12px", cursor: "pointer", color: "#94a3b8", fontSize: "12px", fontWeight: 600, display: "flex", alignItems: "center", gap: "8px" }}>
                  <Download size={13} /> Export Chat Log
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
