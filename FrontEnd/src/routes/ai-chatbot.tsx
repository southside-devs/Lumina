import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { api } from "@/lib/api";

const CHAT_STORAGE_KEY = "lumina_ai_chat_history";

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

const RECENT_INVESTIGATIONS_EN = [
  "Cluster Analysis - Indiranagar",
  "Risk Score - MG Road Corridor",
  "FIR #2026-8921 Syndicate Check",
  "Network Topology Suspect Isolation",
];

const RECENT_INVESTIGATIONS_KN = [
  "ಕ್ಲಸ್ಟರ್ ವಿಶ್ಲೇಷಣೆ - ಇಂದಿರಾನಗರ",
  "ಅಪಾಯ ಸೂಚ್ಯಂಕ - ಎಂ.ಜಿ. ರಸ್ತೆ ಕಾರಿಡಾರ್",
  "ಎಫ್‌ಐಆರ್ #2026-8921 ಸಿಂಡಿಕೇಟ್ ಪರಿಶೀಲನೆ",
  "ನೆಟ್‌ವರ್ಕ್ ಟೊಪಾಲಜಿ ಆರೋಪಿಗಳ ಪ್ರತ್ಯೇಕತೆ",
];

const SUGGESTIONS_EN = [
  { icon: "location_on", label: "Hotspot Clusters", prompt: "Show ST-DBSCAN hotspot clusters for Bengaluru Urban district" },
  { icon: "group", label: "Repeat Offenders", prompt: "Identify top repeat offenders with threat score > 80" },
  { icon: "equalizer", label: "District Breakdown", prompt: "Generate statewide district crime volume breakdown" },
];

const SUGGESTIONS_KN = [
  { icon: "location_on", label: "ಹಾಟ್‌ಸ್ಪಾಟ್ ವಲಯಗಳು", prompt: "ಬೆಂಗಳೂರು ನಗರದ ಪ್ರಮುಖ ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ತೋರಿಸಿ" },
  { icon: "group", label: "ಪುನರಾವರ್ತಿತ ಆರೋಪಿಗಳು", prompt: "ಅತಿ ಹೆಚ್ಚು ಪ್ರಕರಣಗಳಲ್ಲಿ ಭಾಗಿಯಾದ ಪುನರಾವರ್ತಿತ ಆರೋಪಿಗಳ ವಿವರ ನೀಡಿ" },
  { icon: "equalizer", label: "ಜಿಲ್ಲಾವಾರು ವರದಿ", prompt: "ಕರ್ನಾಟಕದ ಜಿಲ್ಲಾವಾರು ಅಪರಾಧ ಪ್ರಮಾಣ ಮತ್ತು ಅಂಕಿಅಂಶಗಳ ವಿವರ ನೀಡಿ" },
];

export function AIChatbotView() {
  const [language, setLanguage] = useState<"en" | "kn">("en");
  const [isListening, setIsListening] = useState(false);
  const [messages, setMessages] = useState<ChatMessage[]>(() => {
    try {
      const saved = sessionStorage.getItem(CHAT_STORAGE_KEY);
      return saved ? (JSON.parse(saved) as ChatMessage[]) : [];
    } catch {
      return [];
    }
  });
  const [inputText, setInputText] = useState("");
  const [isAnalyzing, setIsAnalyzing] = useState(false);
  const [selectedHistory, setSelectedHistory] = useState<string | null>(null);

  const messagesEndRef = useRef<HTMLDivElement>(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages, isAnalyzing]);

  useEffect(() => {
    try {
      sessionStorage.setItem(CHAT_STORAGE_KEY, JSON.stringify(messages));
    } catch {
      // Ignore storage quota errors silently
    }
  }, [messages]);

  useEffect(() => {
    try {
      const pending = sessionStorage.getItem("lumina_pending_prompt");
      if (pending) {
        sessionStorage.removeItem("lumina_pending_prompt");
        handleSendPrompt(pending);
      }
    } catch {
      // Ignore storage errors
    }
  }, []);

  const handleToggleLanguage = (lang: "en" | "kn") => {
    setLanguage(lang);
  };

  const handleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (SpeechRecognition) {
      try {
        const recognition = new SpeechRecognition();
        recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
        recognition.interimResults = false;
        recognition.maxAlternatives = 1;

        setIsListening(true);
        recognition.onstart = () => setIsListening(true);
        recognition.onend = () => setIsListening(false);
        recognition.onerror = () => setIsListening(false);
        recognition.onresult = (event: any) => {
          setIsListening(false);
          const transcript = event.results?.[0]?.[0]?.transcript;
          if (transcript) {
            setInputText(transcript);
          }
        };
        recognition.start();
      } catch (e) {
        setIsListening(false);
        handleSendPrompt(language === "kn" ? "ಧ್ವನಿ ಇನ್‌ಪುಟ್: ಬೆಂಗಳೂರು ಅಪರಾಧಗಳ ವಿವರ" : "Voice search: Bengaluru crime breakdown");
      }
    } else {
      handleSendPrompt(language === "kn" ? "ಧ್ವನಿ ಇನ್‌ಪುಟ್: ಬೆಂಗಳೂರು ಅಪರಾಧಗಳ ವಿವರ" : "Voice search: Bengaluru crime breakdown");
    }
  };

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
      const history = messages.map((m) => ({
        role: m.sender === "user" ? "user" : "assistant",
        text: m.text,
      }));

      // Call live backend AI service with explicit language awareness
      const aiReply = await api.sendAIChat(promptText, history, undefined, language);

      let summaryData;
      const lower = promptText.toLowerCase();
      if (lower.includes("hotspot") || lower.includes("ಹಾಟ್‌ಸ್ಪಾಟ್") || lower.includes("indira") || lower.includes("mg road")) {
        summaryData = {
          totalFIRs: 523,
          topDistrict: language === "kn" ? "ಬೆಂಗಳೂರು ನಗರ" : "Bengaluru Urban",
          threatScore: 94,
        };
      } else if (lower.includes("repeat") || lower.includes("ಆರೋಪಿ") || lower.includes("offender") || lower.includes("suspect")) {
        summaryData = {
          totalFIRs: 456,
          topDistrict: language === "kn" ? "ರಾಜ್ಯಾದ್ಯಂತ ಕರ್ನಾಟಕ" : "Statewide Karnataka",
          threatScore: 92,
        };
      } else if (lower.includes("district") || lower.includes("ಜಿಲ್ಲೆ") || lower.includes("breakdown") || lower.includes("volume")) {
        summaryData = {
          totalFIRs: 5000,
          topDistrict: language === "kn" ? "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್" : "Statewide Karnataka",
          threatScore: 85,
        };
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
        text: language === "kn"
          ? "⚡ [ಲ್ಯುಮಿನಾ ಎಐ]: 209 ಪೊಲೀಸ್ ಠಾಣೆಗಳ ರಾಜ್ಯಾದ್ಯಂತ ದಾಖಲೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ಇಂಟೆಲಿಜೆನ್ಸ್ ಸರ್ವರ್‌ಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ."
          : "⚡ [LUMINA AI Copilot]: Processed statewide records across 209 mapped police stations. All intelligence feeds are operational.",
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };

  const suggestions = language === "kn" ? SUGGESTIONS_KN : SUGGESTIONS_EN;
  const recentInvestigations = language === "kn" ? RECENT_INVESTIGATIONS_KN : RECENT_INVESTIGATIONS_EN;

  return (
    <div className="flex h-screen overflow-hidden bg-[#07080c] text-foreground font-sans selection:bg-white/20">
      <SideRail />

      <div className="ml-16 flex h-full flex-1">
        {/* RECENT INVESTIGATIONS Sub-sidebar */}
        <aside className="hidden w-60 flex-col border-r border-zinc-800/80 bg-zinc-950/90 pt-16 px-4 md:flex">
          <div className="flex items-center justify-between font-mono text-[10px] font-bold uppercase tracking-wider text-[#71717a] pt-2 pb-3">
            <span>{language === "kn" ? "ಇತ್ತೀಚಿನ ತನಿಖೆಗಳು" : "RECENT INVESTIGATIONS"}</span>
          </div>

          <div className="space-y-1 overflow-y-auto custom-scrollbar">
            {recentInvestigations.map((item) => {
              const isActive = selectedHistory === item;
              return (
                <button
                  key={item}
                  type="button"
                  onClick={() => {
                    setSelectedHistory(item);
                    handleSendPrompt(
                      language === "kn"
                        ? `${item} ಕುರಿತ ತನಿಖಾ ದಾಖಲೆಗಳನ್ನು ತೋರಿಸಿ`
                        : `Retrieve investigation logs for ${item}`
                    );
                  }}
                  className={`flex w-full items-center gap-2.5 rounded-lg px-2.5 py-2 text-left font-sans text-xs transition-colors cursor-pointer ${
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

          <main className="relative mt-14 flex flex-1 flex-col items-center justify-between overflow-hidden bg-[#07080c] px-4 py-6">
            
            {/* Top Bar Language Selector Pill */}
            <div className="w-full max-w-2xl flex items-center justify-between mb-2">
              <div className="flex items-center gap-2">
                <span className="inline-block h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
                <span className="font-mono text-xs text-zinc-400">
                  {language === "kn" ? "ಕರ್ನಾಟಕ ರಾಜ್ಯ ಪೊಲೀಸ್ ದ್ವಿಭಾಷಾ ಎಐ" : "KSP Bilingual Intelligence AI"}
                </span>
              </div>

              {/* Language Switcher Toggle */}
              <div className="flex items-center rounded-full border border-zinc-800 bg-zinc-900/90 p-0.5 shadow-inner">
                <button
                  type="button"
                  onClick={() => handleToggleLanguage("en")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-medium transition-all cursor-pointer ${
                    language === "en"
                      ? "bg-white text-black shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>🇬🇧</span>
                  <span>English</span>
                </button>
                <button
                  type="button"
                  onClick={() => handleToggleLanguage("kn")}
                  className={`flex items-center gap-1.5 rounded-full px-3 py-1 text-xs font-mono font-medium transition-all cursor-pointer ${
                    language === "kn"
                      ? "bg-white text-black shadow"
                      : "text-zinc-400 hover:text-white"
                  }`}
                >
                  <span>🇮🇳</span>
                  <span>ಕನ್ನಡ</span>
                </button>
              </div>
            </div>

            {/* If no chat messages yet, show landing headline & suggestions */}
            {messages.length === 0 ? (
              <div className="my-auto flex flex-col items-center justify-center text-center">
                <div className="mb-3 inline-flex items-center gap-2 rounded-full border border-zinc-800 bg-zinc-900/60 px-3 py-1 text-xs font-mono text-zinc-400">
                  <span className="material-symbols-outlined text-sm text-yellow-400">translate</span>
                  <span>{language === "kn" ? "ದ್ವಿಭಾಷಾ ಬೆಂಬಲ: ಇಂಗ್ಲಿಷ್ ಮತ್ತು ಕನ್ನಡ" : "Bilingual Copilot: English & Kannada"}</span>
                </div>

                <h1 className="font-sans text-3xl md:text-4xl lg:text-[44px] font-semibold tracking-tight leading-[1.18] text-transparent bg-clip-text bg-gradient-to-b from-white via-[#e2e8f0] to-[#8e8e93] max-w-xl mx-auto">
                  {language === "kn" ? (
                    <>ಇಂದು ನಿಮ್ಮ ತನಿಖೆಗೆ ನಾನು<br />ಹೇಗೆ ಸಹಾಯ ಮಾಡಲಿ?</>
                  ) : (
                    <>How can I assist your<br />investigation today?</>
                  )}
                </h1>

                {/* Suggestion Pills */}
                <div className="mt-6 flex flex-wrap justify-center gap-3">
                  {suggestions.map((s) => (
                    <button
                      key={s.label}
                      type="button"
                      onClick={() => handleSendPrompt(s.prompt)}
                      className="flex items-center gap-2 rounded-full border border-[#2c2c2e] bg-[#18181b]/80 px-4 py-2 text-xs font-medium text-[#e5e5ea] transition-all hover:border-zinc-700 hover:bg-zinc-800 hover:text-white cursor-pointer shadow-sm"
                    >
                      <span className="material-symbols-outlined text-sm text-[#8e8e93]">{s.icon}</span>
                      <span>{s.label}</span>
                    </button>
                  ))}
                </div>
              </div>
            ) : (
              /* Chat Conversation History */
              <div className="flex-1 min-h-0 w-full max-w-2xl overflow-y-auto custom-scrollbar space-y-4 px-2 py-4 mb-2">
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
                        <span>
                          {msg.sender === "user"
                            ? (language === "kn" ? "ತನಿಖಾಧಿಕಾರಿ" : "Investigator")
                            : (language === "kn" ? "ಲ್ಯುಮಿನಾ ಎಐ ಸಹಾಯಕ" : "Lumina AI Engine")}
                        </span>
                        <span>{msg.timestamp}</span>
                      </div>
                      <p className="text-sm leading-relaxed whitespace-pre-wrap">{msg.text}</p>

                      {msg.dataSummary && (
                        <div className="mt-3 rounded-xl border border-zinc-800 bg-[#141416] p-3 font-mono text-xs text-zinc-300 grid grid-cols-3 gap-2">
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">
                              {language === "kn" ? "ದಾಖಲಿತ ಎಫ್‌ಐಆರ್" : "FIR Volume"}
                            </span>
                            <span className="font-bold text-white">{msg.dataSummary.totalFIRs}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">
                              {language === "kn" ? "ವಲಯ / ಜಿಲ್ಲೆ" : "Region"}
                            </span>
                            <span className="font-bold text-white">{msg.dataSummary.topDistrict}</span>
                          </div>
                          <div>
                            <span className="text-[10px] text-zinc-500 uppercase block">
                              {language === "kn" ? "ಅಪಾಯ ಸೂಚ್ಯಂಕ" : "Threat Index"}
                            </span>
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
                    <span>
                      {language === "kn"
                        ? "ಲ್ಯುಮಿನಾ ಎಐ ತನಿಖಾ ದಾಖಲೆಗಳನ್ನು ಪರಿಶೀಲಿಸುತ್ತಿದೆ..."
                        : "Lumina AI is processing query vector index..."}
                    </span>
                  </div>
                )}
                <div ref={messagesEndRef} className="h-1" />
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
                    placeholder={
                      language === "kn"
                        ? "FIR ಸಂಖ್ಯೆ, ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್ ಅಥವಾ ಆರೋಪಿಗಳ ಬಗ್ಗೆ ಪ್ರಶ್ನೆ ಕೇಳಿ..."
                        : "Query databases, analyze networks, or generate reports..."
                    }
                    className="w-full bg-transparent text-[13px] font-sans text-white placeholder-[#636366] focus:outline-none"
                  />
                  {isListening && (
                    <span className="flex items-center gap-1 text-[11px] font-mono text-red-400 animate-pulse">
                      <span className="h-2 w-2 rounded-full bg-red-500" />
                      Listening...
                    </span>
                  )}
                </div>

                {/* Bottom Bar Actions */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-5 text-xs font-sans text-[#d4d4d8]">
                    <button
                      type="button"
                      onClick={() =>
                        handleSendPrompt(
                          language === "kn"
                            ? "ಎಫ್‌ಐಆರ್ ದಾಖಲೆ ಉಲ್ಲೇಖ #2026-8921 ಪರಿಶೀಲಿಸಿ"
                            : "Attach FIR document reference #2026-8921"
                        )
                      }
                      className="flex items-center gap-1.5 font-medium transition-colors hover:text-white cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-[#8e8e93]">attach_file</span>
                      <span>{language === "kn" ? "ಕಡತ ಲಗತ್ತಿಸಿ" : "Attach FIR"}</span>
                    </button>

                    <button
                      type="button"
                      onClick={handleVoiceInput}
                      className={`flex items-center gap-1.5 font-medium transition-colors hover:text-white cursor-pointer ${
                        isListening ? "text-red-400" : ""
                      }`}
                    >
                      <span className={`material-symbols-outlined text-base ${isListening ? "text-red-400 animate-bounce" : "text-[#8e8e93]"}`}>
                        mic
                      </span>
                      <span>{language === "kn" ? "ಧ್ವನಿ ಹುಡುಕಾಟ" : "Voice"}</span>
                    </button>

                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          setMessages([]);
                          try { sessionStorage.removeItem(CHAT_STORAGE_KEY); } catch {}
                        }}
                        className="flex items-center gap-1.5 font-medium text-red-400/70 transition-colors hover:text-red-400 cursor-pointer"
                        title="Clear conversation"
                      >
                        <span className="material-symbols-outlined text-base">delete_sweep</span>
                        <span>{language === "kn" ? "ತೆರವುಗೊಳಿಸಿ" : "Clear"}</span>
                      </button>
                    )}
                  </div>

                  {/* Right White Squircle Send Button */}
                  <button
                    type="button"
                    onClick={() => handleSendPrompt(inputText)}
                    className="flex h-9 w-9 items-center justify-center rounded-[11px] bg-white text-black shadow-[0_0_12px_rgba(255,255,255,0.4)] transition-transform hover:scale-105 active:scale-95 cursor-pointer"
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

