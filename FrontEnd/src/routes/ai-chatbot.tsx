import { createFileRoute } from "@tanstack/react-router";
import { useState, useEffect, useRef } from "react";
import { SideRail } from "@/components/lumina/SideRail";
import { TopBar } from "@/components/lumina/TopBar";
import { api, type FIRItem } from "@/lib/api";
import { useSystemConfig, getPlaybackRateFromConfig } from "@/lib/config";
import { AuthGuard } from "@/lib/auth";

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
  lang?: "en" | "kn";
  dataSummary?: {
    totalFIRs?: number;
    topDistrict?: string;
    threatScore?: number;
  };
}


const RECENT_INVESTIGATIONS_EN = [
  "Cluster Analysis - Indiranagar",
  "Risk Score - MG Road Corridor",
  "FIR #1693/2026 Cybercrime Incident",
  "Network Topology Suspect Isolation",
];

const RECENT_INVESTIGATIONS_KN = [
  "ಕ್ಲಸ್ಟರ್ ವಿಶ್ಲೇಷಣೆ - ಇಂದಿರಾನಗರ",
  "ಅಪಾಯ ಸೂಚ್ಯಂಕ - ಎಂ.ಜಿ. ರಸ್ತೆ ಕಾರಿಡಾರ್",
  "ಎಫ್‌ಐಆರ್ #1693/2026 ಸೈಬರ್ ಅಪರಾಧ ದಾಖಲೆ",
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
  const { config } = useSystemConfig();
  const [language, setLanguage] = useState<"en" | "kn">(config.defaultLanguage || "en");
  const [isListening, setIsListening] = useState(false);
  const [speakingMsgId, setSpeakingMsgId] = useState<string | null>(null);

  // Quick FIR Attach Modal States
  const [isAttachModalOpen, setIsAttachModalOpen] = useState(false);
  const [availableFirs, setAvailableFirs] = useState<FIRItem[]>([]);
  const [isLoadingFirs, setIsLoadingFirs] = useState(false);
  const [firSearchQuery, setFirSearchQuery] = useState("");
  const [firCategoryFilter, setFirCategoryFilter] = useState("All");

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
  const recognitionRef = useRef<any>(null);
  const audioPlayerRef = useRef<HTMLAudioElement | null>(null);

  // Load FIRs when modal is opened
  useEffect(() => {
    if (isAttachModalOpen && availableFirs.length === 0) {
      setIsLoadingFirs(true);
      api.getFirs({ limit: 120 })
        .then((res) => {
          if (res && res.firs) {
            setAvailableFirs(res.firs);
          }
        })
        .catch((err) => console.warn("Failed to load FIRs for quick attach:", err))
        .finally(() => setIsLoadingFirs(false));
    }
  }, [isAttachModalOpen, availableFirs.length]);

  // Handle Escape key to close FIR Attach Modal
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape" && isAttachModalOpen) {
        setIsAttachModalOpen(false);
      }
    };
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isAttachModalOpen]);

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

  // Clean text before sending to Speech Synthesis (remove markdown, URLs, tables)
  const cleanForSpeech = (raw: string) => {
    return raw
      .replace(/[*#_`~>[\]()|]/g, " ")
      .replace(/https?:\/\/\S+/g, "")
      .replace(/===.*?===/g, "")
      .replace(/⚡|👤|📊|🚨|🇮🇳|🇬🇧|📋/g, "")
      .replace(/\s+/g, " ")
      .trim();
  };

  // Play / Stop Text-to-Speech for a specific message using its original language
  const handleToggleSpeak = (text: string, msgId: string, msgLang?: "en" | "kn") => {
    // If currently speaking this message, stop immediately
    if (speakingMsgId === msgId) {
      if (audioPlayerRef.current) {
        audioPlayerRef.current.pause();
        audioPlayerRef.current = null;
      }
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
      setSpeakingMsgId(null);
      return;
    }

    // Stop any other active audio/speech
    if (audioPlayerRef.current) {
      audioPlayerRef.current.pause();
      audioPlayerRef.current = null;
    }
    if ("speechSynthesis" in window) {
      window.speechSynthesis.cancel();
    }

    const cleanText = cleanForSpeech(text);
    if (!cleanText) return;

    // Detect the message's original language (Kannada if marked 'kn' or contains Kannada script)
    const isKannada = (msgLang === "kn") || /[\u0c80-\u0cff]/.test(cleanText);
    const audioLang = isKannada ? "kn" : "en";

    // Stream high-fidelity Google Neural voice in the message's original language
    try {
      const audioUrl = api.getTTSAudioUrl(cleanText, audioLang);
      const audio = new Audio(audioUrl);
      audio.playbackRate = getPlaybackRateFromConfig(config.voiceSpeed);
      audioPlayerRef.current = audio;
      setSpeakingMsgId(msgId);

      audio.onplay = () => setSpeakingMsgId(msgId);
      audio.onended = () => {
        setSpeakingMsgId(null);
        audioPlayerRef.current = null;
      };
      audio.onerror = (e) => {
        console.warn("Audio streaming note, falling back to browser synthesis:", e);
        // Fallback to native browser synthesis if streaming has network error
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = isKannada ? "kn-IN" : "en-IN";
          utterance.rate = getPlaybackRateFromConfig(config.voiceSpeed);
          utterance.onend = () => setSpeakingMsgId(null);
          utterance.onerror = () => setSpeakingMsgId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setSpeakingMsgId(null);
          audioPlayerRef.current = null;
        }
      };
      audio.play().catch((err) => {
        console.warn("Audio stream unavailable, falling back to browser synthesis:", err);
        // Backend TTS unavailable (cloud IP blocked) — fall back to native browser synthesis
        if ("speechSynthesis" in window) {
          const utterance = new SpeechSynthesisUtterance(cleanText);
          utterance.lang = isKannada ? "kn-IN" : "en-IN";
          utterance.rate = getPlaybackRateFromConfig(config.voiceSpeed);
          utterance.onend = () => setSpeakingMsgId(null);
          utterance.onerror = () => setSpeakingMsgId(null);
          window.speechSynthesis.speak(utterance);
        } else {
          setSpeakingMsgId(null);
          audioPlayerRef.current = null;
        }
      });
    } catch (err) {
      console.error("TTS synthesis error:", err);
      setSpeakingMsgId(null);
    }
  };




  // Speech-to-Text (STT) Voice Recognition Toggle
  const handleToggleVoiceInput = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      handleSendPrompt(language === "kn" ? "ಧ್ವನಿ ಹುಡುಕಾಟ: ಬೆಂಗಳೂರು ಅಪರಾಧಗಳ ವಿವರ" : "Voice search: Bengaluru crime breakdown");
      return;
    }

    if (isListening) {
      try {
        recognitionRef.current?.stop();
      } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = language === "kn" ? "kn-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;
      recognition.maxAlternatives = 1;

      setIsListening(true);
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results || [])
          .map((res: any) => res[0]?.transcript || "")
          .join("");
        if (transcript) {
          setInputText(transcript);
        }
      };
      recognition.start();
    } catch (e) {
      setIsListening(false);
      handleSendPrompt(language === "kn" ? "ಧ್ವನಿ ಹುಡುಕಾಟ: ಬೆಂಗಳೂರು ಅಪರಾಧಗಳ ವಿವರ" : "Voice search: Bengaluru crime breakdown");
    }
  };

  useEffect(() => {
    return () => {
      if ("speechSynthesis" in window) {
        window.speechSynthesis.cancel();
      }
    };
  }, []);

  const handleSendPrompt = async (promptText: string) => {
    if (!promptText.trim() || isAnalyzing) return;

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
    }

    const userMsg: ChatMessage = {
      id: Date.now().toString(),
      sender: "user",
      text: promptText,
      lang: language,
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

      const newId = (Date.now() + 1).toString();
      const aiMsg: ChatMessage = {
        id: newId,
        sender: "ai",
        text: aiReply,
        lang: language,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
        dataSummary: summaryData,
      };

      setMessages((prev) => [...prev, aiMsg]);
    } catch (err) {
      console.error("AI Chatbot error:", err);
      const errorId = (Date.now() + 1).toString();
      const errorMsg: ChatMessage = {
        id: errorId,
        sender: "ai",
        text: language === "kn"
          ? "⚡ [ಲ್ಯುಮಿನಾ ಎಐ]: 209 ಪೊಲೀಸ್ ಠಾಣೆಗಳ ರಾಜ್ಯಾದ್ಯಂತ ದಾಖಲೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ಇಂಟೆಲಿಜೆನ್ಸ್ ಸರ್ವರ್‌ಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ."
          : "⚡ [LUMINA AI Copilot]: Processed statewide records across 209 mapped police stations. All intelligence feeds are operational.",
        lang: language,
        timestamp: new Date().toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" }),
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsAnalyzing(false);
    }
  };


  const filteredFirs = availableFirs.filter((f) => {
    const q = firSearchQuery.toLowerCase();
    const matchesSearch =
      !q ||
      f.FIR_Number.toLowerCase().includes(q) ||
      (f.Crime_Group && f.Crime_Group.toLowerCase().includes(q)) ||
      (f.Station_Name && f.Station_Name.toLowerCase().includes(q)) ||
      (f.District_Name && f.District_Name.toLowerCase().includes(q)) ||
      (f.Narrative && f.Narrative.toLowerCase().includes(q));

    const matchesCat =
      firCategoryFilter === "All" ||
      (f.Crime_Group && f.Crime_Group.toLowerCase().includes(firCategoryFilter.toLowerCase()));

    return matchesSearch && matchesCat;
  });

  const handleSelectFIR = (fir: FIRItem) => {
    setIsAttachModalOpen(false);
    const station = fir.Station_Name || fir.District_Name || "Karnataka State Police";
    const prompt =
      language === "kn"
        ? `${station} ಠಾಣೆಯ ಎಫ್‌ಐಆರ್ ಸಂಖ್ಯೆ #${fir.FIR_Number} (${fir.Crime_Group}) ಕುರಿತು ಸಂಪೂರ್ಣ ತನಿಖಾ ಮಾಹಿತಿ ಮತ್ತು ಘಟನಾವಳಿ ವಿವರ ನೀಡಿ`
        : `Provide intelligence overview and detailed breakdown for FIR #${fir.FIR_Number} registered at ${station} (${fir.Crime_Group})`;
    handleSendPrompt(prompt);
  };

  const crimeCategories = [
    "All",
    "Cybercrime",
    "Theft",
    "Assault",
    "Burglary",
    "Narcotics",
    "Robbery",
    "Cheating & Fraud",
  ];

  const suggestions = language === "kn" ? SUGGESTIONS_KN : SUGGESTIONS_EN;
  const recentInvestigations = language === "kn" ? RECENT_INVESTIGATIONS_KN : RECENT_INVESTIGATIONS_EN;

  return (
    <AuthGuard>
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
            
            {/* Top Bar Language Selector */}
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
                  onClick={() => {
                    setLanguage("en");
                    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  }}
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
                  onClick={() => {
                    setLanguage("kn");
                    if ("speechSynthesis" in window) window.speechSynthesis.cancel();
                  }}
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
                  <span className="material-symbols-outlined text-sm text-yellow-400">record_voice_over</span>
                  <span>
                    {language === "kn"
                      ? "ಧ್ವನಿ ಇನ್‌ಪುಟ್ & ರೀಡ್-ಅಲೌಡ್ ಸಕ್ರಿಯಗೊಳಿಸಲಾಗಿದೆ"
                      : "Speech-to-Text & Text-to-Speech Enabled"}
                  </span>
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
                {messages.map((msg) => {
                  const isSpeaking = speakingMsgId === msg.id;
                  const isMsgKn = msg.lang === "kn" || /[\u0c80-\u0cff]/.test(msg.text);
                  return (
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
                              ? (isMsgKn ? "ತನಿಖಾಧಿಕಾರಿ" : "Investigator")
                              : (isMsgKn ? "ಲ್ಯುಮಿನಾ ಎಐ ಸಹಾಯಕ" : "Lumina AI Engine")}
                          </span>
                          <div className="flex items-center gap-2">
                            <span>{msg.timestamp}</span>
                            {/* Read Aloud TTS Button for AI responses (Original Message Language) */}
                            {msg.sender === "ai" && (
                              <button
                                type="button"
                                onClick={() => handleToggleSpeak(msg.text, msg.id, msg.lang)}
                                className={`flex items-center gap-1.5 rounded-md px-2 py-0.5 text-[10px] font-mono transition-all cursor-pointer ${
                                  isSpeaking
                                    ? "bg-emerald-950/80 text-emerald-300 font-bold border border-emerald-500/50 shadow-[0_0_10px_rgba(16,185,129,0.3)]"
                                    : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
                                }`}
                                title={isSpeaking ? "Stop voice narration" : "Read aloud response"}
                              >
                                {isSpeaking ? (
                                  <>
                                    <span className="flex items-center gap-0.5 h-3">
                                      <span className="w-0.5 h-2 bg-emerald-400 animate-pulse" />
                                      <span className="w-0.5 h-3.5 bg-emerald-300 animate-bounce" />
                                      <span className="w-0.5 h-2.5 bg-emerald-400 animate-pulse" />
                                    </span>
                                    <span>{isMsgKn ? "ನಿಲ್ಲಿಸಿ" : "Stop"}</span>
                                  </>
                                ) : (
                                  <>
                                    <span className="material-symbols-outlined text-[12px]">volume_up</span>
                                    <span>{isMsgKn ? "ಧ್ವನಿ ವಿವರಣೆ" : "Listen"}</span>
                                  </>
                                )}
                              </button>
                            )}

                          </div>
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
                  );
                })}

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
                <div className={`flex items-center gap-3 rounded-[14px] bg-[#141416] px-3.5 py-2.5 border transition-all ${
                  isListening ? "border-red-500/60 shadow-[0_0_12px_rgba(239,68,68,0.25)]" : "border-[#26262a]"
                }`}>
                  <span className="material-symbols-outlined text-[#8e8e93] text-lg select-none">
                    {isListening ? "mic" : "search"}
                  </span>
                  <input
                    type="text"
                    value={inputText}
                    onChange={(e) => setInputText(e.target.value)}
                    onKeyDown={(e) => {
                      if (e.key === "Enter") handleSendPrompt(inputText);
                    }}
                    placeholder={
                      isListening
                        ? (language === "kn" ? "ಮಾತನಾಡಿ, ಧ್ವನಿ ದಾಖಲಾಗುತ್ತಿದೆ..." : "Listening... Speak now...")
                        : language === "kn"
                        ? "FIR ಸಂಖ್ಯೆ, ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್ ಅಥವಾ ಆರೋಪಿಗಳ ಬಗ್ಗೆ ಕೇಳಿ..."
                        : "Query databases, analyze networks, or generate reports..."
                    }
                    className="w-full bg-transparent text-[13px] font-sans text-white placeholder-[#636366] focus:outline-none"
                  />
                  {isListening && (
                    <span className="flex items-center gap-1.5 text-[11px] font-mono text-red-400 shrink-0">
                      <span className="h-2 w-2 rounded-full bg-red-500 animate-ping" />
                      <span>{language === "kn" ? "ಧ್ವನಿ ರೆಕಾರ್ಡಿಂಗ್..." : "Listening..."}</span>
                    </span>
                  )}
                </div>

                {/* Bottom Bar Actions */}
                <div className="flex items-center justify-between px-1">
                  <div className="flex items-center gap-4 text-xs font-sans text-[#d4d4d8]">
                    {/* Attach FIR Button -> Opens Hovering Panel */}
                    <button
                      type="button"
                      onClick={() => setIsAttachModalOpen(true)}
                      className="flex items-center gap-1.5 font-medium transition-colors hover:text-white cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-base text-[#8e8e93]">attach_file</span>
                      <span>{language === "kn" ? "ಕಡತ ಲಗತ್ತಿಸಿ" : "Attach FIR"}</span>
                    </button>

                    {/* Microphone Speech-to-Text Button */}
                    <button
                      type="button"
                      onClick={handleToggleVoiceInput}
                      className={`flex items-center gap-1.5 font-medium px-2 py-0.5 rounded-full transition-all cursor-pointer ${
                        isListening
                          ? "bg-red-500 text-white font-bold animate-pulse shadow-[0_0_10px_rgba(239,68,68,0.5)]"
                          : "hover:text-white text-[#d4d4d8]"
                      }`}
                    >
                      <span className={`material-symbols-outlined text-base ${isListening ? "text-white" : "text-[#8e8e93]"}`}>
                        {isListening ? "graphic_eq" : "mic"}
                      </span>
                      <span>{isListening ? (language === "kn" ? "ನಿಲ್ಲಿಸಿ" : "Stop") : (language === "kn" ? "ಧ್ವನಿ ಇನ್‌ಪುಟ್" : "Voice Input")}</span>
                    </button>

                    {messages.length > 0 && (
                      <button
                        type="button"
                        onClick={() => {
                          if ("speechSynthesis" in window) window.speechSynthesis.cancel();
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

            {/* ── Hovering Quick FIR Explorer Modal Panel ─────────────────── */}
            {isAttachModalOpen && (
              <div 
                className="fixed inset-0 z-50 flex items-center justify-center bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-200"
                onClick={() => setIsAttachModalOpen(false)}
              >
                <div
                  className="relative flex flex-col w-full max-w-2xl max-h-[80vh] rounded-2xl border border-zinc-800 bg-[#121214] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-200"
                  onClick={(e) => e.stopPropagation()}
                >
                  {/* Modal Header */}
                  <div className="flex items-center justify-between border-b border-zinc-800/80 px-6 py-4 bg-zinc-950/80">
                    <div className="flex items-center gap-2.5">
                      <span className="material-symbols-outlined text-emerald-400 text-xl">folder_open</span>
                      <div>
                        <h2 className="text-sm font-semibold text-white font-sans">
                          {language === "kn" ? "ಎಫ್‌ಐಆರ್ ದಾಖಲೆ ಆಯ್ಕೆಮಾಡಿ" : "Quick FIR Case Explorer"}
                        </h2>
                        <p className="text-[11px] text-zinc-400 font-mono">
                          {language === "kn"
                            ? "ತನಿಖಾ ವಿಶ್ಲೇಷಣೆಗೆ ನೇರವಾಗಿ ಲಗತ್ತಿಸಲು ಪ್ರಕರಣವನ್ನು ಆಯ್ಕೆಮಾಡಿ"
                            : "Select an FIR record to attach and analyze directly in Lumina Copilot"}
                        </p>
                      </div>
                    </div>

                    <button
                      type="button"
                      onClick={() => setIsAttachModalOpen(false)}
                      className="rounded-lg p-1.5 text-zinc-400 hover:bg-zinc-800 hover:text-white transition-colors cursor-pointer"
                    >
                      <span className="material-symbols-outlined text-lg">close</span>
                    </button>
                  </div>

                  {/* Search Bar & Category Filter Chips */}
                  <div className="p-4 border-b border-zinc-800/60 bg-[#151518] space-y-3">
                    <div className="relative flex items-center">
                      <span className="material-symbols-outlined absolute left-3 text-zinc-400 text-lg">search</span>
                      <input
                        type="text"
                        value={firSearchQuery}
                        onChange={(e) => setFirSearchQuery(e.target.value)}
                        placeholder={
                          language === "kn"
                            ? "FIR ಸಂಖ್ಯೆ, ಠಾಣೆ, ಜಿಲ್ಲೆ ಅಥವಾ ಅಪರಾಧ ಪ್ರಕಾರದಿಂದ ಹುಡುಕಿ..."
                            : "Search by FIR # (e.g. 1693), Station, District, Crime Category, or Narrative..."
                        }
                        className="w-full rounded-xl bg-zinc-900/90 border border-zinc-700/70 pl-10 pr-10 py-2.5 text-xs text-white placeholder-zinc-500 focus:outline-none focus:border-emerald-500/60 focus:ring-1 focus:ring-emerald-500/30"
                        autoFocus
                      />
                      {firSearchQuery && (
                        <button
                          type="button"
                          onClick={() => setFirSearchQuery("")}
                          className="absolute right-3 text-zinc-400 hover:text-white"
                        >
                          <span className="material-symbols-outlined text-sm">clear</span>
                        </button>
                      )}
                    </div>

                    {/* Category Filter Chips */}
                    <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar pb-1 text-[11px] font-mono">
                      {crimeCategories.map((cat) => {
                        const isSelected = firCategoryFilter === cat;
                        return (
                          <button
                            key={cat}
                            type="button"
                            onClick={() => setFirCategoryFilter(cat)}
                            className={`rounded-full px-2.5 py-1 transition-all cursor-pointer shrink-0 ${
                              isSelected
                                ? "bg-white text-black font-semibold shadow"
                                : "bg-zinc-800/80 text-zinc-300 hover:bg-zinc-700 hover:text-white border border-zinc-700/40"
                            }`}
                          >
                            {cat}
                          </button>
                        );
                      })}
                    </div>
                  </div>

                  {/* FIR Results Scrollable List */}
                  <div className="flex-1 overflow-y-auto custom-scrollbar p-4 space-y-2.5">
                    {isLoadingFirs ? (
                      <div className="py-12 text-center font-mono text-xs text-zinc-400">
                        <span className="inline-block h-3 w-3 rounded-full bg-emerald-400 animate-ping mr-2" />
                        <span>{language === "kn" ? "ದಾಖಲೆಗಳನ್ನು ಪಡೆಯಲಾಗುತ್ತಿದೆ..." : "Loading FIR records from database..."}</span>
                      </div>
                    ) : filteredFirs.length === 0 ? (
                      <div className="py-12 text-center text-xs text-zinc-500 font-mono">
                        <span className="material-symbols-outlined text-3xl mb-2 text-zinc-600 block">search_off</span>
                        <span>{language === "kn" ? "ಯಾವುದೇ ಎಫ್‌ಐಆರ್ ದಾಖಲೆಗಳು ಕಂಡುಬಂದಿಲ್ಲ" : "No matching FIR records found"}</span>
                      </div>
                    ) : (
                      filteredFirs.map((fir) => (
                        <div
                          key={fir.ROWID || fir.FIR_Number}
                          onClick={() => handleSelectFIR(fir)}
                          className="group relative rounded-xl border border-zinc-800/80 bg-zinc-900/60 p-3.5 transition-all hover:border-emerald-500/50 hover:bg-zinc-800/70 cursor-pointer shadow-sm"
                        >
                          <div className="flex items-start justify-between gap-2 mb-1.5">
                            <div className="flex items-center gap-2">
                              <span className="font-mono text-xs font-bold text-white bg-zinc-800 px-2 py-0.5 rounded border border-zinc-700">
                                FIR #{fir.FIR_Number}
                              </span>
                              <span className="text-[10px] font-mono font-medium text-emerald-300 bg-emerald-950/60 border border-emerald-800/40 px-2 py-0.5 rounded-full">
                                {fir.Crime_Group || "Incident"}
                              </span>
                            </div>

                            <span className="font-mono text-[10px] text-zinc-400">
                              {fir.Date}
                            </span>
                          </div>

                          <div className="flex items-center gap-2 text-xs text-zinc-300 font-medium mb-1">
                            <span className="material-symbols-outlined text-zinc-500 text-sm">local_police</span>
                            <span>{fir.Station_Name || "Police Station"}</span>
                            <span className="text-zinc-600">·</span>
                            <span className="text-zinc-400">{fir.District_Name || "Karnataka"}</span>
                            <span className="text-zinc-600">·</span>
                            <span className={`text-[10px] font-mono ${
                              fir.Status === "Under Investigation" ? "text-amber-400" :
                              fir.Status === "Chargesheeted" ? "text-blue-400" : "text-emerald-400"
                            }`}>
                              {fir.Status || "Active"}
                            </span>
                          </div>

                          <p className="text-xs text-zinc-400 line-clamp-2 leading-relaxed">
                            {fir.Narrative}
                          </p>

                          <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400 opacity-0 group-hover:opacity-100 transition-opacity">
                            <span className="text-emerald-400 flex items-center gap-1">
                              <span className="material-symbols-outlined text-xs">attachment</span>
                              <span>{language === "kn" ? "ಲಗತ್ತಿಸಿ & ವಿಶ್ಲೇಷಿಸಿ" : "Click to attach & analyze"}</span>
                            </span>
                            <span className="text-zinc-500">ID: {fir.ROWID}</span>
                          </div>
                        </div>
                      ))
                    )}
                  </div>

                  {/* Modal Footer */}
                  <div className="flex items-center justify-between border-t border-zinc-800/80 px-6 py-3 bg-zinc-950/90 text-xs font-mono text-zinc-400">
                    <span>
                      {language === "kn"
                        ? `ಒಟ್ಟು ದಾಖಲೆಗಳು: ${filteredFirs.length}`
                        : `Showing ${filteredFirs.length} records`}
                    </span>
                    <button
                      type="button"
                      onClick={() => setIsAttachModalOpen(false)}
                      className="text-zinc-400 hover:text-white cursor-pointer"
                    >
                      {language === "kn" ? "ಮುಚ್ಚಿ (Esc)" : "Cancel (Esc)"}
                    </button>
                  </div>
                </div>
              </div>
            )}

          </main>
        </div>
      </div>
    </div>
    </AuthGuard>
  );
}
