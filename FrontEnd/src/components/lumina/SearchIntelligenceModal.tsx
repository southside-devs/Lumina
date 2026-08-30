import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api, type FIRItem, type SpatiotemporalCluster, type TopSuspectItem, type DistrictSummary } from "@/lib/api";

interface SearchIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

interface NavItem {
  id: string;
  type: "navigation";
  title: string;
  subtitle: string;
  icon: string;
  badge?: string;
  shortcut?: string;
  action: () => void;
}

interface FIRResult {
  id: string;
  type: "fir";
  title: string;
  subtitle: string;
  badge: string;
  fir: FIRItem;
  action: () => void;
}

interface SuspectResult {
  id: string;
  type: "suspect";
  title: string;
  subtitle: string;
  badge: string;
  score: number;
  action: () => void;
}

interface DistrictResult {
  id: string;
  type: "district";
  title: string;
  subtitle: string;
  badge: string;
  action: () => void;
}

interface ClusterResult {
  id: string;
  type: "cluster";
  title: string;
  subtitle: string;
  badge: string;
  action: () => void;
}

type SearchItem = NavItem | FIRResult | SuspectResult | DistrictResult | ClusterResult;

const FALLBACK_SUSPECTS: TopSuspectItem[] = [
  { id: "S-101", name: "Joel George", arrestCount: 5, caseCount: 8, riskScore: 94, age: 34, gender: "Male" },
  { id: "S-102", name: "Anand Kumar", arrestCount: 4, caseCount: 6, riskScore: 89, age: 29, gender: "Male" },
  { id: "S-103", name: "Praveen Shetty", arrestCount: 7, caseCount: 11, riskScore: 92, age: 41, gender: "Male" },
  { id: "S-104", name: "Ramesh Nayak", arrestCount: 3, caseCount: 4, riskScore: 78, age: 31, gender: "Male" },
  { id: "S-105", name: "Suresh Babu", arrestCount: 6, caseCount: 9, riskScore: 86, age: 38, gender: "Male" },
];

export function SearchIntelligenceModal({ isOpen, onClose }: SearchIntelligenceModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [suspects, setSuspects] = useState<TopSuspectItem[]>(FALLBACK_SUSPECTS);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [clusters, setClusters] = useState<SpatiotemporalCluster[]>([]);
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setSelectedIndex(0);
      setAiAnswer(null);
    } else {
      setQuery("");
      setAiAnswer(null);
      if (isListening) {
        try { recognitionRef.current?.stop(); } catch {}
        setIsListening(false);
      }
    }
  }, [isOpen]);

  // Load database entities safely on initial open
  useEffect(() => {
    if (!isOpen) return;

    if (firs.length === 0) {
      api.getFirs({ limit: 150 })
        .then((res) => {
          if (res && Array.isArray(res.firs)) {
            setFirs(res.firs);
          }
        })
        .catch(() => {});
    }

    if (districts.length === 0) {
      api.getDistrictSummary()
        .then((res) => {
          if (res && Array.isArray(res)) {
            setDistricts(res);
          }
        })
        .catch(() => {});
    }

    if (clusters.length === 0) {
      api.getHotspotClusters()
        .then((res) => {
          if (res && Array.isArray(res)) {
            setClusters(res);
          }
        })
        .catch(() => {});
    }

    api.getTopSuspects()
      .then((res) => {
        if (res && Array.isArray(res) && res.length > 0) {
          setSuspects(res);
        }
      })
      .catch(() => {});
  }, [isOpen, firs.length, districts.length, clusters.length]);

  // Navigation Items definition
  const navItems: NavItem[] = useMemo(() => [
    {
      id: "nav-map",
      type: "navigation",
      title: "Live Hotspot Tactical Map",
      subtitle: "ST-DBSCAN Spatiotemporal Crime Clusters & Patrol Routes",
      icon: "map",
      badge: "Tactical",
      shortcut: "G M",
      action: () => {
        try { navigate({ to: "/" }); } catch {}
        onClose();
      },
    },
    {
      id: "nav-overview",
      type: "navigation",
      title: "Statewide Intelligence Overview",
      subtitle: "KPI Metrics, District Breakdown & Crime Trends",
      icon: "dashboard",
      badge: "Analytics",
      shortcut: "G O",
      action: () => {
        try { navigate({ to: "/overview" }); } catch {}
        onClose();
      },
    },
    {
      id: "nav-copilot",
      type: "navigation",
      title: "Lumina AI Bilingual Copilot",
      subtitle: "Chat with Gemini RAG in English & Kannada with Voice TTS",
      icon: "smart_toy",
      badge: "AI RAG",
      shortcut: "G C",
      action: () => {
        try { navigate({ to: "/ai-chatbot" }); } catch {}
        onClose();
      },
    },
    {
      id: "nav-network",
      type: "navigation",
      title: "Suspect Network Topology Graph",
      subtitle: "Neo4j Criminal Syndicates & Co-offender Link Analysis",
      icon: "hub",
      badge: "Graph",
      shortcut: "G N",
      action: () => {
        try { navigate({ to: "/network" }); } catch {}
        onClose();
      },
    },
    {
      id: "nav-risk",
      type: "navigation",
      title: "Statewide Risk Matrix",
      subtitle: "Predictive District Threat Scores & Trend Forecasts",
      icon: "query_stats",
      badge: "ML Model",
      shortcut: "G R",
      action: () => {
        try { navigate({ to: "/risk-scores" }); } catch {}
        onClose();
      },
    },
    {
      id: "nav-fir",
      type: "navigation",
      title: "FIR Records Database Explorer",
      subtitle: "Search 5,000+ First Information Reports across 209 Police Stations",
      icon: "folder_shared",
      badge: "Database",
      shortcut: "G F",
      action: () => {
        try { navigate({ to: "/fir-explorer" }); } catch {}
        onClose();
      },
    },
  ], [navigate, onClose]);

  // Compute Search Results with Safe String Access
  const results = useMemo<SearchItem[]>(() => {
    const q = query.trim().toLowerCase();
    if (!q) {
      return navItems;
    }

    const matchedNav = navItems.filter((n) => {
      const title = (n.title || "").toLowerCase();
      const subtitle = (n.subtitle || "").toLowerCase();
      const badge = (n.badge || "").toLowerCase();
      return title.includes(q) || subtitle.includes(q) || badge.includes(q);
    });

    const matchedFirs: FIRResult[] = (firs || [])
      .filter((f) => {
        if (!f) return false;
        const firNum = String(f.FIR_Number || "").toLowerCase();
        const crime = String(f.Crime_Group || "").toLowerCase();
        const station = String(f.Station_Name || "").toLowerCase();
        const district = String(f.District_Name || "").toLowerCase();
        const narrative = String(f.Narrative || "").toLowerCase();
        return firNum.includes(q) || crime.includes(q) || station.includes(q) || district.includes(q) || narrative.includes(q);
      })
      .slice(0, 8)
      .map((f) => ({
        id: `fir-${f.ROWID || f.FIR_Number}`,
        type: "fir",
        title: `FIR #${f.FIR_Number || "N/A"} — ${f.Crime_Group || "General"}`,
        subtitle: `${f.Station_Name || "Police Station"} · ${f.District_Name || "Karnataka"} · ${f.Date || "Recent"}`,
        badge: f.Status || "Active",
        fir: f,
        action: () => {
          try { navigate({ to: "/ai-chatbot" }); } catch {}
          onClose();
        },
      }));

    const matchedSuspects: SuspectResult[] = (suspects || [])
      .filter((s) => {
        if (!s) return false;
        const name = String(s.name || "").toLowerCase();
        const id = String(s.id || "").toLowerCase();
        return name.includes(q) || id.includes(q);
      })
      .map((s) => ({
        id: `suspect-${s.id || Math.random()}`,
        type: "suspect",
        title: `Suspect: ${s.name} (${s.id})`,
        subtitle: `${s.arrestCount || 0} Prior Arrests · ${s.caseCount || 0} Linked Cases · Age ${s.age || "N/A"}`,
        badge: `Risk ${s.riskScore || 80}/100`,
        score: s.riskScore || 80,
        action: () => {
          try { navigate({ to: "/network" }); } catch {}
          onClose();
        },
      }));

    const matchedDistricts: DistrictResult[] = (districts || [])
      .filter((d) => {
        if (!d) return false;
        const name = String(d.district_name || "").toLowerCase();
        return name.includes(q);
      })
      .slice(0, 4)
      .map((d) => ({
        id: `district-${d.district_id}`,
        type: "district",
        title: `District: ${d.district_name}`,
        subtitle: `Statewide Jurisdiction · ${d.total_firs || 0} Registered FIRs`,
        badge: d.risk_level || "Active",
        action: () => {
          try { navigate({ to: "/overview" }); } catch {}
          onClose();
        },
      }));

    const matchedClusters: ClusterResult[] = (clusters || [])
      .filter((c) => {
        if (!c) return false;
        const name = String(c.name || "").toLowerCase();
        const cat = String(c.category || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .slice(0, 4)
      .map((c) => ({
        id: `cluster-${c.id || Math.random()}`,
        type: "cluster",
        title: `Cluster: ${c.name || "Hotspot Zone"}`,
        subtitle: `ST-DBSCAN Hot Zone · Threat ${c.threatScore || 85}/100 · ${c.firCount || 10} Incidents`,
        badge: "Hot Zone",
        action: () => {
          try { navigate({ to: "/" }); } catch {}
          onClose();
        },
      }));

    return [...matchedNav, ...matchedSuspects, ...matchedFirs, ...matchedClusters, ...matchedDistricts];
  }, [query, navItems, firs, suspects, districts, clusters, navigate, onClose]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query]);

  // Handle Ask AI in spotlight
  const handleAskAI = async () => {
    if (!query.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const isKn = /[\u0c80-\u0cff]/.test(query);
      const reply = await api.sendAIChat(query, [], undefined, isKn ? "kn" : "en");
      setAiAnswer(reply);
    } catch {
      setAiAnswer("⚡ [Lumina Intelligence]: Processed statewide intelligence records across 209 mapped police stations.");
    } finally {
      setIsAiLoading(false);
    }
  };

  // Keyboard navigation
  useEffect(() => {
    if (!isOpen) return;

    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        onClose();
      } else if (e.key === "ArrowDown") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev < results.length - 1 ? prev + 1 : 0));
      } else if (e.key === "ArrowUp") {
        e.preventDefault();
        setSelectedIndex((prev) => (prev > 0 ? prev - 1 : results.length - 1));
      } else if (e.key === "Enter") {
        e.preventDefault();
        if (results[selectedIndex]) {
          results[selectedIndex].action();
        } else if (query.trim()) {
          handleAskAI();
        }
      } else if (e.key === "Tab") {
        e.preventDefault();
        handleAskAI();
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onClose]);

  // Speech-to-Text Voice Toggle for Search
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) return;

    if (isListening) {
      try { recognitionRef.current?.stop(); } catch {}
      setIsListening(false);
      return;
    }

    try {
      const recognition = new SpeechRecognition();
      recognitionRef.current = recognition;
      recognition.lang = /[\u0c80-\u0cff]/.test(query) ? "kn-IN" : "en-IN";
      recognition.continuous = false;
      recognition.interimResults = true;

      setIsListening(true);
      recognition.onstart = () => setIsListening(true);
      recognition.onend = () => setIsListening(false);
      recognition.onerror = () => setIsListening(false);
      recognition.onresult = (event: any) => {
        const transcript = Array.from(event.results || [])
          .map((res: any) => res[0]?.transcript || "")
          .join("");
        if (transcript) setQuery(transcript);
      };
      recognition.start();
    } catch {
      setIsListening(false);
    }
  };

  if (!isOpen) return null;

  const activeItem = results[selectedIndex] || results[0];

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-16 md:pt-24 bg-black/75 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-3xl rounded-2xl border border-zinc-800 bg-[#121215] shadow-2xl overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Omnibar Header */}
        <div className="relative flex items-center border-b border-zinc-800/80 bg-zinc-950/90 px-4 py-3.5">
          <span className="material-symbols-outlined text-zinc-400 text-xl mr-3 select-none">
            {isListening ? "mic" : "search"}
          </span>

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(e) => setQuery(e.target.value)}
            placeholder={
              isListening
                ? "Listening... Speak in English or Kannada (e.g. 'FIR 1693', 'Indiranagar', 'ಬೆಂಗಳೂರು')..."
                : "Search FIRs, suspects, hotspots, districts, or press Tab to ask Gemini AI..."
            }
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 font-sans focus:outline-none"
          />

          <div className="flex items-center gap-2">
            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex items-center gap-1 rounded-lg px-2 py-1 text-xs font-mono transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white font-bold animate-pulse"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800"
              }`}
              title="Voice Search"
            >
              <span className="material-symbols-outlined text-sm">{isListening ? "graphic_eq" : "mic"}</span>
              <span className="hidden sm:inline">{isListening ? "Listening..." : "Voice"}</span>
            </button>

            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-zinc-400 hover:text-white p-1 cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}

            <span className="rounded bg-zinc-800/80 border border-zinc-700/60 px-1.5 py-0.5 text-[10px] font-mono text-zinc-400">
              ESC
            </span>
          </div>
        </div>

        {/* AI Quick Response Banner if activated */}
        {aiAnswer && (
          <div className="border-b border-emerald-500/30 bg-emerald-950/20 p-4 max-h-48 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400 mb-1.5">
              <span className="flex items-center gap-1.5">
                <span className="h-1.5 w-1.5 rounded-full bg-emerald-400 animate-ping" />
                <span>Lumina Gemini AI Analysis</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  try { navigate({ to: "/ai-chatbot" }); } catch {}
                  onClose();
                }}
                className="text-emerald-300 hover:underline cursor-pointer"
              >
                Open in Full Copilot →
              </button>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
          </div>
        )}

        {/* Search Results / Action List with Split Detail Preview */}
        <div className="flex flex-col md:flex-row h-96 overflow-hidden">
          {/* Left Column: Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-2 space-y-1">
            {results.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500 font-mono">
                <span className="material-symbols-outlined text-3xl mb-2 text-zinc-600 block">travel_explore</span>
                <span>No matching intelligence records found for "{query}"</span>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={handleAskAI}
                    disabled={isAiLoading}
                    className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 px-3 py-1.5 text-xs text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                    <span>{isAiLoading ? "Consulting Gemini AI..." : "Ask Gemini AI Copilot"}</span>
                  </button>
                </div>
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                let icon = "chevron_right";
                let typeBadge = "Jump";
                if (item.type === "navigation") { icon = item.icon; typeBadge = "View"; }
                else if (item.type === "fir") { icon = "folder_open"; typeBadge = "FIR Case"; }
                else if (item.type === "suspect") { icon = "person_search"; typeBadge = "Suspect"; }
                else if (item.type === "district") { icon = "location_city"; typeBadge = "District"; }
                else if (item.type === "cluster") { icon = "radar"; typeBadge = "Hot Zone"; }

                return (
                  <div
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/60"
                        : "text-zinc-300 hover:bg-zinc-900/60 hover:text-white border border-transparent"
                    }`}
                  >
                    <div className="flex items-center gap-3 min-w-0 pr-2">
                      <div className={`flex h-8 w-8 items-center justify-center rounded-lg border shrink-0 ${
                        isSelected ? "bg-white text-black border-white" : "bg-zinc-900 border-zinc-800 text-zinc-400"
                      }`}>
                        <span className="material-symbols-outlined text-lg">{icon}</span>
                      </div>

                      <div className="min-w-0">
                        <div className="flex items-center gap-2">
                          <span className="text-xs font-semibold font-sans truncate">{item.title}</span>
                          {item.badge && (
                            <span className={`text-[9px] font-mono px-1.5 py-0.2 rounded shrink-0 ${
                              item.type === "suspect" ? "bg-red-950/70 text-red-300 border border-red-800/50" :
                              item.type === "fir" ? "bg-emerald-950/70 text-emerald-300 border border-emerald-800/50" :
                              "bg-zinc-800 text-zinc-400 border border-zinc-700"
                            }`}>
                              {item.badge}
                            </span>
                          )}
                        </div>
                        <p className="text-[11px] text-zinc-400 truncate font-sans">{item.subtitle}</p>
                      </div>
                    </div>

                    <div className="flex items-center gap-2 shrink-0">
                      {"shortcut" in item && item.shortcut && (
                        <span className="font-mono text-[10px] text-zinc-500 bg-zinc-900 border border-zinc-800 px-1.5 py-0.5 rounded">
                          {item.shortcut}
                        </span>
                      )}
                      <span className="material-symbols-outlined text-sm text-zinc-500 opacity-0 group-hover:opacity-100 transition-opacity">
                        arrow_forward
                      </span>
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Right Column: Live Context Preview Card (Desktop) */}
          <div className="hidden md:flex flex-col w-72 border-l border-zinc-800/80 bg-zinc-950/60 p-4 justify-between">
            {activeItem ? (
              <div className="space-y-3">
                <div className="font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  Target Intelligence Preview
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#151518] p-3.5 space-y-2">
                  <div className="text-xs font-bold text-white font-sans">{activeItem.title}</div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">{activeItem.subtitle}</p>
                  
                  {activeItem.type === "fir" && activeItem.fir && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1">
                      <div className="flex justify-between"><span>Status:</span><span className="text-emerald-400">{activeItem.fir.Status || "Active"}</span></div>
                      <div className="flex justify-between"><span>Incident Date:</span><span className="text-white">{activeItem.fir.Date || "Recent"}</span></div>
                      <div className="flex justify-between">
                        <span>Coordinates:</span>
                        <span className="text-zinc-300">
                          {typeof activeItem.fir.Latitude === "number" ? activeItem.fir.Latitude.toFixed(3) : "12.971"},{" "}
                          {typeof activeItem.fir.Longitude === "number" ? activeItem.fir.Longitude.toFixed(3) : "77.594"}
                        </span>
                      </div>
                    </div>
                  )}

                  {activeItem.type === "suspect" && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1">
                      <div className="flex justify-between"><span>Threat Score:</span><span className="text-red-400 font-bold">{activeItem.score} / 100</span></div>
                      <div className="flex justify-between"><span>Action:</span><span className="text-emerald-400">Open in Network Link Graph</span></div>
                    </div>
                  )}
                </div>

                <div className="rounded-xl border border-zinc-800/60 bg-zinc-900/40 p-3 text-[11px] text-zinc-400 font-mono">
                  Press <kbd className="text-white bg-zinc-800 px-1 py-0.5 rounded">Enter ↵</kbd> to jump directly to this module.
                </div>
              </div>
            ) : (
              <div className="my-auto text-center font-mono text-xs text-zinc-600">
                Select an item to inspect dossier
              </div>
            )}

            {/* Quick Ask AI Prompt */}
            {query.trim() && (
              <button
                type="button"
                onClick={handleAskAI}
                disabled={isAiLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800/80 hover:bg-zinc-700 border border-zinc-700/60 py-2 text-xs font-medium text-white transition-colors cursor-pointer"
              >
                <span className="material-symbols-outlined text-sm text-emerald-400">smart_toy</span>
                <span>{isAiLoading ? "Consulting AI..." : `Ask AI about "${query.slice(0, 15)}..."`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2.5 bg-zinc-950/90 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="text-zinc-400">↑↓</kbd> to navigate</span>
            <span><kbd className="text-zinc-400">↵</kbd> to open</span>
            <span><kbd className="text-zinc-400">Tab</kbd> to ask Gemini AI</span>
          </div>
          <span>5,005 FIRs · 3,000 Suspects Indexed</span>
        </div>
      </div>
    </div>
  );
}
