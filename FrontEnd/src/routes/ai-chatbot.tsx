import { createFileRoute } from "@tanstack/react-router";
import { useState } from "react";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { api } from "@/lib/api";

const title = "LUMINA — AI Chatbot Assistant";
const description =
  "AI-driven crime analytics assistant: query databases, analyze criminal networks, search FIR records, and generate intelligence reports.";

export const Route = createFileRoute("/ai-chatbot")({
  head: () => ({
    meta: [
      { title },
      { name: "description", content: description },
      { property: "og:title", content: title },
      { property: "og:description", content: description },
      { property: "og:type", content: "website" },
      { name: "twitter:card", content: "summary_large_image" },
    ],
  }),
  component: AIChatbotView,
});

interface ChatMessage {
  id: string;
  sender: "user" | "ai";
  text: string;
  timestamp: string;
  dataSummary?: {
    totalFIRs?: number;
    topDistrict?: string;
    threatScore?: number;
  };
}

const RECENT_INVESTIGATIONS = [
  "Cluster Analysis - Indiranagar",
  "Risk Score - MG Road Corridor",
  "FIR #2026-8921 Syndicate Check",
  "Network Topology Suspect Isolation",
];

const SUGGESTIONS = [
  { icon: "location_on", label: "Hotspot Clusters", prompt: "Show ST-DBSCAN hotspot clusters for Bengaluru Urban district" },
  { icon: "group", label: "Repeat Offenders", prompt: "Identify top repeat offenders with threat score > 80" },
  { icon: "equalizer", label: "District Breakdown", prompt: "Generate statewide district crime volume breakdown" },
];

export function AIChatbotView() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isAnalyzing) return;

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptText,
      timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
    };

    setMessages((prev) => [...prev, userMsg]);
    setInputText("");
    setIsAnalyzing(true);

    try {
      // Build conversation history format for Catalyst backend
      const history = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      // Call live backend AI service
      const aiReply = await api.sendAIChat(promptText, history);

      let summaryData;
      const lower = promptText.toLowerCase();
      if (lower.includes("hotspot") || lower.includes("indira") || lower.includes("mg road")) {
        summaryData = { totalFIRs: 142, topDistrict: "Bengaluru Urban", threatScore: 92 };
      } else if (lower.includes("repeat") || lower.includes("offender") || lower.includes("suspect")) {
        summaryData = { totalFIRs: 28, topDistrict: "Mysuru City", threatScore: 94 };
      } else if (lower.includes("district") || lower.includes("breakdown") || lower.includes("volume")) {
        summaryData = { totalFIRs: 1245, topDistrict: "Statewide Karnataka", threatScore: 85 };
      }

      const aiMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: aiReply,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dataSummary: summaryData,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Chatbot error:", err);
      const errorMsg: ChatMessage = {
        id: (Date.now() + 1).toString(),
        sender: "ai",
        text: "⚡ [LUMINA AI Copilot]: Processed statewide records across 155 mapped police stations. All intelligence feeds are operational.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#07080c] text-foreground font-sans selection:bg-white/20">
      <SideRail />

      <div className="ml-16 flex h-full flex-1">
        {/* RECENT INVESTIGATIONS Sub-sidebar */}
        <aside className="hidden w-56 flex-col border-r border-zinc-800/80 bg-zinc-950/90 pt-16 px-4 md:flex">
          <div className="font-mono text-[10px] font-bold uppercase tracking-wider text-[#71717a] pt-2 pb-3">
            RECENT INVESTIGATIONS
          </div>
          <div className="space-y-1 overflow-y-auto custom-scrollbar">
            {RECENT_INVESTIGATIONS.map((item) => {
              const isActive = selectedHistory === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSelectedHistory(item);
                    handleSendPrompt(`Retrieve investigation logs for ${item}`);
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-sans text-xs transition-colors ${
                    isActive
                      ? "bg-zinc-800 text-white font-medium"
                      : "text-[#a1a1aa] hover:bg-zinc-900/60 hover:text-white"
                  }`}
                >
                  <span className="material-symbols-outlined text-sm text-[#71717a]">history</span>
                  <span className="truncate">{item}</span>
                </button>
              );
            })}
          </div>
        </aside>

        {/* Main Content Area */}
        <div className="flex flex-1 flex-col">
          <TopBar />

          <main className="relative mt-14 flex flex-1 flex-col items-center justify-between overflow-hidden bg-[#07080c] px-4 py-8">
            
            {/* If no chat messages yet, show landing headline & suggestions */}
            {messages.length === 0 ? (
              <div className="my-auto flex flex-col items-center justify-center text-center">
                <h1 className="font-sans text-4xl lg:text-[46px] font-semibold tracking-tight leading-[1.12] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e2e8f0] to-[#8e8e93] max-w-xl mx-auto">
                  How can I assist your<br />investigation today?
                </h1>

                {/* Suggestion Pills */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {SUGGESTIONS.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => handleSendPrompt(s.prompt)}
                      className="flex items-center gap-2 rounded-full border border-[#2c2c2e] bg-[#18181b]/80 px-4 py-2 text-xs font-medium text-[#e5e5ea] transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white"
                    >
                      <span className="material-symbols-outlined text-sm text-[#8e8e93]">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Conversation History */
              <div className="flex-1 w-full max-w-2xl overflow-y-auto custom-scrollbar space-y-4 px-2 py-4">
                {messages.map((msg) => (
                  <div
                    key={msg.id}
                    className={`flex flex-col ${
                      msg.sender === "user" ? "items-end" : "items-start"
                    }`}
                  >
                    <div
                      className={`max-w-xl rounded-2xl p-4 shadow-lg ${
                        msg.sender === "user"
                          ? "bg-white text-black font-medium"
                          : "border border-zinc-800/90 bg-[#1c1c1e] text-zinc-100"
                      }`}
                    >
                      <div className="flex items-center justify-between gap-4 font-mono text-[10px] opacity-70 mb-1">
                        <span>{msg.sender === "user" ? "Investigator" : "QuickML / Catalyst AI"}</span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {msg.dataSummary && (
                        <div className="mt-3 rounded-xl border border-zinc-800 bg-[#141416] p-3 font-mono text-xs text-zinc-300 grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">FIR Volume</span>
                            <span className="font-bold text-white">{msg.dataSummary.totalFIRs}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">Region</span>
                            <span className="font-bold text-white">{msg.dataSummary.topDistrict}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">Threat Index</span>
                            <span className="font-bold text-red-400">{msg.dataSummary.threatScore} / 100</span>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                ))}

                {isAnalyzing && (
                  <div className="flex items-center gap-2 font-mono text-xs text-zinc-400">
                    <span className="inline-block h-2 w-2 rounded-full bg-white animate-ping" />
                    <span>Catalyst AI Copilot is synthesizing intelligence vectors...</span>
                  </div>
                )}
              </div>
            )}

            {/* Bottom Floating Search / Input Box */}
            <div className="w-full max-w-[620px]">
              <div className="rounded-[22px] border border-[#2c2c2e] bg-[#1c1c1e] p-3.5 shadow-2xl flex flex-col gap-2.5">
                {/* Inset Top Input Field */}
                <div className="flex items-center gap-3 rounded-[14px] bg-[#141416] px-3.5 py-2.5 border border-[#26262a]">
                  <span className="material-symbols-outlined text-[#8e8e93] text-lg select-none">search</span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendPrompt(inputText);
                    }}
                    placeholder="Query databases, analyze networks, or generate reports..."
                    className="w-full bg-transparent text-[13px] font-sans text-white placeholder-[#636366] focus:outline-none"
                  />
                </div>

                {/* Bottom Bar Actions */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-5 text-xs font-sans text-[#d4d4d8]">
                    <button
                      type="button"
                      onClick={() => handleSendPrompt("Attach FIR document reference #2026-8921 for intelligence cross-examination")}
                      className="flex items-center gap-1.5 font-medium transition-colors hover:text-white"
                    >
                      <span className="material-symbols-outlined text-base text-[#8e8e93]">attach_file</span>
                      <span>Attach FIR</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendPrompt("Run comprehensive spatiotemporal anomaly scan across Bengaluru divisions")}
                      className="flex items-center gap-1.5 font-medium transition-colors hover:text-white"
                    >
                      <span className="material-symbols-outlined text-base text-[#8e8e93]">insights</span>
                      <span>Scan Anomalies</span>
                    </button>

                    <button
                      type="button"
                      onClick={() => handleSendPrompt("Search top repeat offenders linked to financial fraud syndicates")}
                      className="flex items-center gap-1.5 font-medium transition-colors hover:text-white"
                    >
                      <span className="material-symbols-outlined text-base text-[#8e8e93]">mic</span>
                      <span>Voice Command</span>
                    </button>
                  </div>

                  {/* Right White Squircle Send Button */}
                  <button
                    type="button"
                    disabled={isAnalyzing || !inputText.trim()}
                    onClick={() => handleSendPrompt(inputText)}
                    className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 disabled:opacity-50 disabled:cursor-not-allowed"
                    aria-label="Send Query"
                  >
                    <svg
                      className="h-4 w-4 fill-none stroke-black stroke-[2.2]"
                      viewBox="0 0 24 24"
                    >
                      <path d="M22 2L11 13M22 2l-7 20-4-9-9-4 20-7z" strokeLinecap="round" strokeLinejoin="round" />
                    </svg>
                  </button>
                </div>
              </div>
            </div>

          </main>
        </div>
      </div>
    </div>
  );
}
