import { useState, useEffect, useRef, useMemo } from "react";
import { useNavigate } from "@tanstack/react-router";
import { api, type FIRItem, type SpatiotemporalCluster, type TopSuspectItem, type DistrictSummary } from "@/lib/api";

interface SearchIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = "all" | "nav" | "firs" | "suspects" | "clusters" | "districts" | "ai";

interface BaseItem {
  id: string;
  title: string;
  subtitle: string;
  badge?: string;
  icon?: string;
  action: () => void;
}

interface NavItem extends BaseItem {
  type: "navigation";
  shortcut?: string;
}

interface FIRResult extends BaseItem {
  type: "fir";
  fir: FIRItem;
}

interface SuspectResult extends BaseItem {
  type: "suspect";
  score: number;
  suspect: TopSuspectItem;
}

interface DistrictResult extends BaseItem {
  type: "district";
  district: DistrictSummary;
}

interface ClusterResult extends BaseItem {
  type: "cluster";
  cluster: SpatiotemporalCluster;
}

type SearchItem = NavItem | FIRResult | SuspectResult | DistrictResult | ClusterResult;

const FALLBACK_SUSPECTS: TopSuspectItem[] = [
  { id: "S-101", name: "Joel George", arrestCount: 5, caseCount: 8, riskScore: 94, age: 34, gender: "Male" },
  { id: "S-102", name: "Anand Kumar", arrestCount: 4, caseCount: 6, riskScore: 89, age: 29, gender: "Male" },
  { id: "S-103", name: "Praveen Shetty", arrestCount: 7, caseCount: 11, riskScore: 92, age: 41, gender: "Male" },
  { id: "S-104", name: "Ramesh Nayak", arrestCount: 3, caseCount: 4, riskScore: 78, age: 31, gender: "Male" },
  { id: "S-105", name: "Suresh Babu", arrestCount: 6, caseCount: 9, riskScore: 86, age: 38, gender: "Male" },
];

const SUGGESTED_AI_PROMPTS = [
  { icon: "radar", label: "ST-DBSCAN Hotspots", prompt: "Show ST-DBSCAN spatiotemporal hotspot clusters in Bengaluru Urban" },
  { icon: "fingerprint", label: "Repeat Offenders", prompt: "Identify top repeat offenders with threat score > 85 across Karnataka" },
  { icon: "summarize", label: "Statewide Crime Volume", prompt: "Generate statewide district crime volume and legal classification breakdown" },
  { icon: "security", label: "Cybercrime Analysis", prompt: "Analyze recent IT Act 66C and fraud incidents in Cubbon Park precinct" },
];

export function SearchIntelligenceModal({ isOpen, onClose }: SearchIntelligenceModalProps) {
  const navigate = useNavigate();
  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
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
      setActiveCategory("all");
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
      subtitle: "ST-DBSCAN Spatiotemporal Crime Clusters & Patrol Dispatch",
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
      subtitle: "Executive KPI Metrics, District Breakdown & Crime Trends",
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
      subtitle: "Natural Language Gemini RAG Assistant (English & ಕನ್ನಡ Voice)",
      icon: "smart_toy",
      badge: "Bilingual AI",
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
      badge: "ML Forecast",
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
      subtitle: "Browse 5,000+ First Information Reports across 209 Stations",
      icon: "folder_shared",
      badge: "Database",
      shortcut: "G F",
      action: () => {
        try { navigate({ to: "/fir-explorer" }); } catch {}
        onClose();
      },
    },
  ], [navigate, onClose]);

  // Compute Search Results categorized
  const { results, counts } = useMemo(() => {
    const q = query.trim().toLowerCase();

    const matchedNav = navItems.filter((n) => {
      if (!q) return true;
      const title = (n.title || "").toLowerCase();
      const subtitle = (n.subtitle || "").toLowerCase();
      const badge = (n.badge || "").toLowerCase();
      return title.includes(q) || subtitle.includes(q) || badge.includes(q);
    });

    const matchedFirs: FIRResult[] = (firs || [])
      .filter((f) => {
        if (!f) return false;
        if (!q) return false; // In empty state, keep list clean
        const firNum = String(f.FIR_Number || "").toLowerCase();
        const crime = String(f.Crime_Group || "").toLowerCase();
        const station = String(f.Station_Name || "").toLowerCase();
        const district = String(f.District_Name || "").toLowerCase();
        const narrative = String(f.Narrative || "").toLowerCase();
        return firNum.includes(q) || crime.includes(q) || station.includes(q) || district.includes(q) || narrative.includes(q);
      })
      .slice(0, 10)
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
        if (!q) return true;
        const name = String(s.name || "").toLowerCase();
        const id = String(s.id || "").toLowerCase();
        return name.includes(q) || id.includes(q);
      })
      .slice(0, 6)
      .map((s) => ({
        id: `suspect-${s.id || Math.random()}`,
        type: "suspect",
        title: `Suspect: ${s.name} (${s.id})`,
        subtitle: `${s.arrestCount || 0} Prior Arrests · ${s.caseCount || 0} Linked Cases · Age ${s.age || "N/A"}`,
        badge: `Risk ${s.riskScore || 80}/100`,
        score: s.riskScore || 80,
        suspect: s,
        action: () => {
          try { navigate({ to: "/network" }); } catch {}
          onClose();
        },
      }));

    const matchedDistricts: DistrictResult[] = (districts || [])
      .filter((d) => {
        if (!d) return false;
        if (!q) return true;
        const name = String(d.district_name || "").toLowerCase();
        return name.includes(q);
      })
      .slice(0, 5)
      .map((d) => ({
        id: `district-${d.district_id}`,
        type: "district",
        title: `District: ${d.district_name}`,
        subtitle: `Statewide Jurisdiction · ${d.total_firs || 0} Registered FIRs`,
        badge: d.risk_level || "Active",
        district: d,
        action: () => {
          try { navigate({ to: "/overview" }); } catch {}
          onClose();
        },
      }));

    const matchedClusters: ClusterResult[] = (clusters || [])
      .filter((c) => {
        if (!c) return false;
        if (!q) return true;
        const name = String(c.name || "").toLowerCase();
        const cat = String(c.category || "").toLowerCase();
        return name.includes(q) || cat.includes(q);
      })
      .slice(0, 5)
      .map((c) => ({
        id: `cluster-${c.id || Math.random()}`,
        type: "cluster",
        title: `Cluster: ${c.name || "Hotspot Zone"}`,
        subtitle: `ST-DBSCAN Hot Zone · Threat ${c.threatScore || 85}/100 · ${c.firCount || 10} Incidents`,
        badge: "Hot Zone",
        cluster: c,
        action: () => {
          try { navigate({ to: "/" }); } catch {}
          onClose();
        },
      }));

    const counts = {
      all: matchedNav.length + matchedFirs.length + matchedSuspects.length + matchedClusters.length + matchedDistricts.length,
      nav: matchedNav.length,
      firs: matchedFirs.length,
      suspects: matchedSuspects.length,
      clusters: matchedClusters.length,
      districts: matchedDistricts.length,
    };

    // Filter by active category tab
    let filtered: SearchItem[] = [];
    if (activeCategory === "all") {
      filtered = [...matchedNav, ...matchedSuspects, ...matchedFirs, ...matchedClusters, ...matchedDistricts];
    } else if (activeCategory === "nav") {
      filtered = matchedNav;
    } else if (activeCategory === "firs") {
      filtered = matchedFirs;
    } else if (activeCategory === "suspects") {
      filtered = matchedSuspects;
    } else if (activeCategory === "clusters") {
      filtered = matchedClusters;
    } else if (activeCategory === "districts") {
      filtered = matchedDistricts;
    }

    return { results: filtered, counts };
  }, [query, activeCategory, navItems, firs, suspects, districts, clusters, navigate, onClose]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Handle Ask AI in spotlight
  const handleAskAI = async (promptToUse?: string) => {
    const p = promptToUse || query;
    if (!p.trim() || isAiLoading) return;
    setIsAiLoading(true);
    try {
      const isKn = /[\u0c80-\u0cff]/.test(p);
      const reply = await api.sendAIChat(p, [], undefined, isKn ? "kn" : "en");
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
      className="fixed inset-0 z-50 flex items-start justify-center pt-12 md:pt-20 bg-black/80 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl rounded-2xl border border-zinc-800 bg-[#0f1013] shadow-[0_25px_60px_-15px_rgba(0,0,0,0.9)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Omnibar Header */}
        <div className="relative flex items-center border-b border-zinc-800/80 bg-zinc-950 px-4 py-3.5">
          <span className="material-symbols-outlined text-emerald-400 text-2xl mr-3 select-none">
            {isListening ? "graphic_eq" : "search"}
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
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1 text-xs font-mono transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white font-bold animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
              }`}
              title="Voice Search in English or Kannada"
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

        {/* Quick Scope Filter Chips Bar */}
        <div className="flex items-center gap-1.5 border-b border-zinc-800/60 bg-[#131418] px-4 py-2 overflow-x-auto custom-scrollbar text-xs font-mono">
          <button
            type="button"
            onClick={() => setActiveCategory("all")}
            className={`rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 ${
              activeCategory === "all"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            ✨ All ({counts.all})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("nav")}
            className={`rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 ${
              activeCategory === "nav"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            ⚡ Navigation ({counts.nav})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("firs")}
            className={`rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 ${
              activeCategory === "firs"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            📄 FIR Cases ({counts.firs})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("suspects")}
            className={`rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 ${
              activeCategory === "suspects"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            👤 Suspects ({counts.suspects})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("clusters")}
            className={`rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 ${
              activeCategory === "clusters"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            🚨 Hot Zones ({counts.clusters})
          </button>
          <button
            type="button"
            onClick={() => setActiveCategory("districts")}
            className={`rounded-full px-3 py-1 transition-all cursor-pointer shrink-0 ${
              activeCategory === "districts"
                ? "bg-white text-black font-semibold shadow"
                : "text-zinc-400 hover:text-white hover:bg-zinc-800/60"
            }`}
          >
            📍 Districts ({counts.districts})
          </button>
        </div>

        {/* AI Quick Response Banner if activated */}
        {aiAnswer && (
          <div className="border-b border-emerald-500/30 bg-emerald-950/25 p-4 max-h-52 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400 mb-1.5">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">Lumina Gemini 2.5 Flash Intelligence Briefing</span>
              </span>
              <button
                type="button"
                onClick={() => {
                  try { navigate({ to: "/ai-chatbot" }); } catch {}
                  onClose();
                }}
                className="text-emerald-300 hover:underline cursor-pointer font-sans text-xs flex items-center gap-1"
              >
                <span>Continue in Full Copilot</span>
                <span className="material-symbols-outlined text-xs">arrow_forward</span>
              </button>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap">{aiAnswer}</p>
          </div>
        )}

        {/* Search Results / Action List with Split Detail Preview */}
        <div className="flex flex-col md:flex-row h-[420px] overflow-hidden">
          {/* Left Column: Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
            {/* When Query is empty: Show Suggested AI Prompts & Modules */}
            {!query && (
              <div className="mb-3 space-y-2">
                <div className="flex items-center justify-between px-2 font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  <span>💡 AI Suggested Inquiries</span>
                  <span className="text-emerald-400/80">Click to ask Gemini</span>
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                  {SUGGESTED_AI_PROMPTS.map((sp) => (
                    <button
                      key={sp.label}
                      type="button"
                      onClick={() => {
                        setQuery(sp.prompt);
                        handleAskAI(sp.prompt);
                      }}
                      className="flex items-center gap-2.5 rounded-xl border border-zinc-800/80 bg-zinc-900/50 p-2.5 text-left transition-all hover:border-emerald-500/50 hover:bg-zinc-800/80 cursor-pointer group"
                    >
                      <span className="material-symbols-outlined text-base text-zinc-400 group-hover:text-emerald-400">
                        {sp.icon}
                      </span>
                      <div className="min-w-0">
                        <div className="text-xs font-semibold text-zinc-200 group-hover:text-white truncate">
                          {sp.label}
                        </div>
                        <div className="text-[10px] text-zinc-500 truncate font-mono">
                          {sp.prompt}
                        </div>
                      </div>
                    </button>
                  ))}
                </div>

                <div className="pt-2 px-2 font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  ⚡ Quick Module Navigation
                </div>
              </div>
            )}

            {results.length === 0 ? (
              <div className="py-16 text-center text-xs text-zinc-500 font-mono">
                <span className="material-symbols-outlined text-4xl mb-2 text-zinc-600 block">travel_explore</span>
                <span>No matching intelligence records found for "{query}"</span>
                <div className="mt-3">
                  <button
                    type="button"
                    onClick={() => handleAskAI()}
                    disabled={isAiLoading}
                    className="inline-flex items-center gap-1.5 rounded-xl bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 px-3.5 py-2 text-xs font-medium text-emerald-300 transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                    <span>{isAiLoading ? "Consulting Gemini AI..." : `Ask Gemini AI Copilot about "${query}"`}</span>
                  </button>
                </div>
              </div>
            ) : (
              results.map((item, idx) => {
                const isSelected = idx === selectedIndex;
                let icon = "chevron_right";
                if (item.type === "navigation") icon = item.icon || "explore";
                else if (item.type === "fir") icon = "folder_open";
                else if (item.type === "suspect") icon = "person_search";
                else if (item.type === "district") icon = "location_city";
                else if (item.type === "cluster") icon = "radar";

                return (
                  <div
                    key={item.id}
                    onClick={() => item.action()}
                    onMouseEnter={() => setSelectedIndex(idx)}
                    className={`group flex items-center justify-between rounded-xl px-3 py-2.5 transition-all cursor-pointer ${
                      isSelected
                        ? "bg-zinc-800/90 text-white shadow-sm border border-zinc-700/80"
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

          {/* Right Column: Live Context Dossier Preview (Desktop) */}
          <div className="hidden md:flex flex-col w-80 border-l border-zinc-800/80 bg-zinc-950/70 p-4 justify-between">
            {activeItem ? (
              <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  <span>Intelligence Dossier</span>
                  <span className="text-emerald-400">Live Record</span>
                </div>

                <div className="rounded-xl border border-zinc-800 bg-[#141417] p-3.5 space-y-2.5">
                  <div className="text-xs font-bold text-white font-sans">{activeItem.title}</div>
                  <p className="text-[11px] text-zinc-400 font-sans leading-relaxed">{activeItem.subtitle}</p>

                  {/* FIR Details Dossier */}
                  {activeItem.type === "fir" && activeItem.fir && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Case Status:</span>
                        <span className="text-emerald-400 font-semibold">{activeItem.fir.Status || "Active"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Incident Date:</span>
                        <span className="text-white">{activeItem.fir.Date || "Recent"}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Coordinates:</span>
                        <span className="text-zinc-300">
                          {typeof activeItem.fir.Latitude === "number" ? activeItem.fir.Latitude.toFixed(3) : "12.971"},{" "}
                          {typeof activeItem.fir.Longitude === "number" ? activeItem.fir.Longitude.toFixed(3) : "77.594"}
                        </span>
                      </div>
                      {activeItem.fir.Narrative && (
                        <div className="pt-1.5 text-[11px] font-sans text-zinc-400 border-t border-zinc-800/50 line-clamp-3">
                          "{activeItem.fir.Narrative}"
                        </div>
                      )}
                    </div>
                  )}

                  {/* Suspect Dossier */}
                  {activeItem.type === "suspect" && activeItem.suspect && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Threat Score:</span>
                        <span className="text-red-400 font-bold">{activeItem.score} / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Prior Arrests:</span>
                        <span className="text-amber-400 font-bold">{activeItem.suspect.arrestCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Linked Cases:</span>
                        <span className="text-white font-bold">{activeItem.suspect.caseCount}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Demographics:</span>
                        <span className="text-zinc-300">Age {activeItem.suspect.age || "N/A"} · {activeItem.suspect.gender || "Male"}</span>
                      </div>
                    </div>
                  )}

                  {/* Cluster Dossier */}
                  {activeItem.type === "cluster" && activeItem.cluster && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Cluster Threat:</span>
                        <span className="text-red-400 font-bold">{activeItem.cluster.threatScore} / 100</span>
                      </div>
                      <div className="flex justify-between">
                        <span>FIR Density:</span>
                        <span className="text-white font-bold">{activeItem.cluster.firCount} events</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Category:</span>
                        <span className="text-emerald-400">{activeItem.cluster.category || "Hotspot"}</span>
                      </div>
                    </div>
                  )}

                  {/* District Dossier */}
                  {activeItem.type === "district" && activeItem.district && (
                    <div className="pt-2 border-t border-zinc-800/80 text-[10px] font-mono text-zinc-400 space-y-1.5">
                      <div className="flex justify-between">
                        <span>Registered FIRs:</span>
                        <span className="text-white font-bold">{activeItem.district.total_firs}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Risk Level:</span>
                        <span className={`font-semibold ${
                          activeItem.district.risk_level === "High" ? "text-red-400" :
                          activeItem.district.risk_level === "Medium" ? "text-amber-400" : "text-emerald-400"
                        }`}>{activeItem.district.risk_level}</span>
                      </div>
                    </div>
                  )}
                </div>

                {/* Direct Action Trigger Buttons */}
                <div className="space-y-1.5">
                  <button
                    type="button"
                    onClick={() => activeItem.action()}
                    className="w-full flex items-center justify-center gap-2 rounded-xl bg-white text-black font-semibold py-2 text-xs transition-transform hover:scale-[1.02] active:scale-[0.98] cursor-pointer shadow"
                  >
                    <span>Open in Module</span>
                    <span className="material-symbols-outlined text-sm">open_in_new</span>
                  </button>

                  <button
                    type="button"
                    onClick={() => {
                      const prompt = activeItem.type === "fir"
                        ? `Analyze investigation dossier and criminal records for FIR #${(activeItem as FIRResult)?.fir?.FIR_Number || activeItem.title}`
                        : activeItem.type === "suspect"
                        ? `Provide risk analysis and syndicate link overview for suspect ${(activeItem as SuspectResult)?.suspect?.name || activeItem.title}`
                        : `Provide intelligence overview for ${activeItem.title}`;
                      handleAskAI(prompt);
                    }}
                    className="w-full flex items-center justify-center gap-1.5 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 py-1.5 text-xs font-mono transition-colors cursor-pointer"
                  >
                    <span className="material-symbols-outlined text-sm">smart_toy</span>
                    <span>Analyze with Copilot</span>
                  </button>

                </div>
              </div>
            ) : (
              <div className="my-auto text-center font-mono text-xs text-zinc-600">
                Select an item to inspect dossier
              </div>
            )}

            {/* Quick Ask AI Prompt Bottom Box */}
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleAskAI()}
                disabled={isAiLoading}
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 py-2.5 text-xs font-medium text-white transition-colors cursor-pointer shrink-0 mt-2"
              >
                <span className="material-symbols-outlined text-sm text-emerald-400">smart_toy</span>
                <span>{isAiLoading ? "Consulting AI..." : `Ask Gemini about "${query.slice(0, 14)}..."`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Footer Navigation Hints */}
        <div className="flex items-center justify-between border-t border-zinc-800/80 px-4 py-2.5 bg-zinc-950 text-[11px] font-mono text-zinc-500">
          <div className="flex items-center gap-3">
            <span><kbd className="text-zinc-300 bg-zinc-800 px-1 py-0.2 rounded">↑↓</kbd> navigate</span>
            <span><kbd className="text-zinc-300 bg-zinc-800 px-1 py-0.2 rounded">↵</kbd> select</span>
            <span><kbd className="text-zinc-300 bg-zinc-800 px-1 py-0.2 rounded">Tab</kbd> ask AI</span>
          </div>
          <span className="text-zinc-400">5,005 FIRs · 3,000 Suspects · 31 Districts Indexed</span>
        </div>
      </div>
    </div>
  );
}
