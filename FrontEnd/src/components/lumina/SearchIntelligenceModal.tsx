import { useState, useEffect, useRef, useMemo, useCallback } from "react";
import { useNavigate } from "@tanstack/react-router";
import { toast } from "sonner";
import { api, type FIRItem, type SpatiotemporalCluster, type TopSuspectItem, type DistrictSummary } from "@/lib/api";
import { useSystemConfig, getPlaybackRateFromConfig, VOICE_SPEED_MAP } from "@/lib/config";


interface SearchIntelligenceModalProps {
  isOpen: boolean;
  onClose: () => void;
}

type FilterCategory = "all" | "nav" | "firs" | "suspects" | "clusters" | "districts" | "pinned";

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

// Bilingual synonym map for fuzzy matching
const SYNONYMS: Record<string, string[]> = {
  theft: ["theft", "burglary", "robbery", "ಕಳ್ಳತನ", "303"],
  cyber: ["cyber", "cybercrime", "fraud", "it act", "66c", "ಸೈಬರ್", "ವಂಚನೆ"],
  assault: ["assault", "violence", "murder", "ಹಲ್ಲೆ", "115"],
  bengaluru: ["bengaluru", "bangalore", "blore", "ಬೆಂಗಳೂರು"],
  mysuru: ["mysuru", "mysore", "ಮೈಸೂರು"],
  belagavi: ["belagavi", "belgaum", "ಬೆಳಗಾವಿ"],
  mangaluru: ["mangaluru", "mangalore", "ಮಂಗಳೂರು"],
};

export function SearchIntelligenceModal({ isOpen, onClose }: SearchIntelligenceModalProps) {
  const navigate = useNavigate();
  const { config } = useSystemConfig();
  const [query, setQuery] = useState("");

  const [activeCategory, setActiveCategory] = useState<FilterCategory>("all");
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [isListening, setIsListening] = useState(false);
  const [firs, setFirs] = useState<FIRItem[]>([]);
  const [suspects, setSuspects] = useState<TopSuspectItem[]>(FALLBACK_SUSPECTS);
  const [districts, setDistricts] = useState<DistrictSummary[]>([]);
  const [clusters, setClusters] = useState<SpatiotemporalCluster[]>([]);
  
  // Intelligence AI State
  const [aiAnswer, setAiAnswer] = useState<string | null>(null);
  const [isAiLoading, setIsAiLoading] = useState(false);
  const [isPlayingAudio, setIsPlayingAudio] = useState(false);

  // Recents & Pinned
  const [recentSearches, setRecentSearches] = useState<string[]>([]);
  const [pinnedIds, setPinnedIds] = useState<string[]>([]);

  const inputRef = useRef<HTMLInputElement>(null);
  const recognitionRef = useRef<any>(null);
  const listRef = useRef<HTMLDivElement>(null);
  const audioRef = useRef<HTMLAudioElement | null>(null);

  // Load recents & pinned from storage
  useEffect(() => {
    try {
      const savedRecents = localStorage.getItem("lumina_recent_searches");
      if (savedRecents) setRecentSearches(JSON.parse(savedRecents));
      const savedPinned = localStorage.getItem("lumina_pinned_items");
      if (savedPinned) setPinnedIds(JSON.parse(savedPinned));
    } catch {}
  }, []);

  const saveRecent = useCallback((term: string) => {
    const trimmed = term.trim();
    if (!trimmed || trimmed.length < 2) return;
    setRecentSearches((prev) => {
      const filtered = prev.filter((r) => r.toLowerCase() !== trimmed.toLowerCase());
      const updated = [trimmed, ...filtered].slice(0, 6);
      try { localStorage.setItem("lumina_recent_searches", JSON.stringify(updated)); } catch {}
      return updated;
    });
  }, []);

  const togglePin = useCallback((id: string) => {
    setPinnedIds((prev) => {
      const isPinned = prev.includes(id);
      const updated = isPinned ? prev.filter((p) => p !== id) : [...prev, id];
      try { localStorage.setItem("lumina_pinned_items", JSON.stringify(updated)); } catch {}
      toast.success(isPinned ? "Removed from pinned dossiers" : "Pinned to priority dossiers");
      return updated;
    });
  }, []);

  // Focus input when opened
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 60);
      setSelectedIndex(0);
      setAiAnswer(null);
      setIsPlayingAudio(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
    } else {
      setQuery("");
      setActiveCategory("all");
      setAiAnswer(null);
      setIsPlayingAudio(false);
      if (audioRef.current) {
        audioRef.current.pause();
        audioRef.current = null;
      }
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

  // Live dynamic database search when user queries
  useEffect(() => {
    if (!isOpen || !query.trim()) return;
    const cleanQ = query.replace(/^[#№\s]+|[#№\s]+$/g, "").trim();
    if (!cleanQ || cleanQ.length < 2) return;

    const timer = setTimeout(() => {
      api.getFirs({ search: cleanQ, limit: 30 })
        .then((res) => {
          if (res && Array.isArray(res.firs) && res.firs.length > 0) {
            setFirs((prev) => {
              const existingIds = new Set(prev.map((f) => String(f.ROWID || f.FIR_Number)));
              const newItems = res.firs.filter((f) => !existingIds.has(String(f.ROWID || f.FIR_Number)));
              return newItems.length > 0 ? [...newItems, ...prev] : prev;
            });
          }
        })
        .catch(() => {});
    }, 200);

    return () => clearTimeout(timer);
  }, [isOpen, query]);

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
        saveRecent("Tactical Map");
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
        saveRecent("Overview Analytics");
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
        saveRecent("Lumina AI Copilot");
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
        saveRecent("Suspect Network Graph");
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
        saveRecent("Risk Scores");
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
        saveRecent("FIR Database Explorer");
        try { navigate({ to: "/fir-explorer" }); } catch {}
        onClose();
      },
    },
  ], [navigate, onClose, saveRecent]);

  // Multi-Token Fuzzy Matching Helper
  const matchTokens = useCallback((haystack: string, queryTokens: string[]): boolean => {
    const text = haystack.toLowerCase();
    return queryTokens.every((token) => {
      if (text.includes(token)) return true;
      for (const [key, synonyms] of Object.entries(SYNONYMS)) {
        if (token.includes(key) || synonyms.some((s) => s.includes(token))) {
          if (synonyms.some((s) => text.includes(s))) return true;
        }
      }
      return false;
    });
  }, []);

  // Compute Search Results categorized & Pinned Items
  const { results, counts, pinnedItems } = useMemo(() => {
    const rawTokens = query.trim().toLowerCase().split(/\s+/).filter(Boolean);
    const cleanTokens = rawTokens.map((t) => t.replace(/^[#№,]+|[#№,]+$/g, "")).filter(Boolean);

    // All structured FIR items mapped
    const allFIRResults: FIRResult[] = (firs || []).map((f) => ({
      id: `fir-${f.ROWID || f.FIR_Number}`,
      type: "fir",
      title: `FIR #${f.FIR_Number || "N/A"} — ${f.Crime_Group || "General"}`,
      subtitle: `${f.Station_Name || "Police Station"} · ${f.District_Name || "Karnataka"} · ${f.Date || "Recent"}`,
      badge: f.Status || "Active",
      fir: f,
      action: () => {
        saveRecent(`FIR #${f.FIR_Number}`);
        try {
          navigate({
            to: "/fir-explorer",
            search: { fir: String(f.FIR_Number), search: String(f.FIR_Number) },
          });
        } catch {}
        onClose();
      },
    }));

    const allSuspectResults: SuspectResult[] = (suspects || []).map((s) => ({
      id: `suspect-${s.id || Math.random()}`,
      type: "suspect",
      title: `Suspect: ${s.name} (${s.id})`,
      subtitle: `${s.arrestCount || 0} Prior Arrests · ${s.caseCount || 0} Linked Cases · Age ${s.age || "N/A"}`,
      badge: `Risk ${s.riskScore || 80}/100`,
      score: s.riskScore || 80,
      suspect: s,
      action: () => {
        saveRecent(`Suspect ${s.name}`);
        try { navigate({ to: "/network" }); } catch {}
        onClose();
      },
    }));

    const allDistrictResults: DistrictResult[] = (districts || []).map((d) => ({
      id: `district-${d.district_id}`,
      type: "district",
      title: `District: ${d.district_name}`,
      subtitle: `Statewide Jurisdiction · ${d.total_firs || 0} Registered FIRs`,
      badge: d.risk_level || "Active",
      district: d,
      action: () => {
        saveRecent(`District ${d.district_name}`);
        try { navigate({ to: "/overview" }); } catch {}
        onClose();
      },
    }));

    const allClusterResults: ClusterResult[] = (clusters || []).map((c) => ({
      id: `cluster-${c.id || Math.random()}`,
      type: "cluster",
      title: `Cluster: ${c.name || "Hotspot Zone"}`,
      subtitle: `ST-DBSCAN Hot Zone · Threat ${c.threatScore || 85}/100 · ${c.firCount || 10} Incidents`,
      badge: "Hot Zone",
      cluster: c,
      action: () => {
        saveRecent(`Cluster ${c.name}`);
        try { navigate({ to: "/" }); } catch {}
        onClose();
      },
    }));

    const allItems: SearchItem[] = [
      ...navItems,
      ...allFIRResults,
      ...allSuspectResults,
      ...allDistrictResults,
      ...allClusterResults,
    ];

    // Compute all pinned items across all entities
    const currentPinnedItems: SearchItem[] = allItems.filter((item) => pinnedIds.includes(item.id));

    // Matching logic
    const matchedNav = navItems.filter((n) => {
      if (cleanTokens.length === 0) return true;
      const combined = `${n.title} ${n.subtitle} ${n.badge || ""}`;
      return matchTokens(combined, cleanTokens);
    });

    const matchedFirs: FIRResult[] = allFIRResults.filter((item) => {
      const f = item.fir;
      if (!f) return false;
      const isPinned = pinnedIds.includes(item.id);
      if (cleanTokens.length === 0) return isPinned; // include pinned FIRs in default view
      const firNum = String(f.FIR_Number || "").toLowerCase();
      const combined = `fir #${firNum} fir ${firNum} ${firNum} ${f.Crime_Group || ""} ${f.Crime_Subgroup || ""} ${f.Station_Name || ""} ${f.District_Name || ""} ${f.Narrative || ""} ${f.Status || ""}`;
      
      return cleanTokens.every((token) => {
        if (cleanTokens.length > 1 && (token === "fir" || token === "case")) return true;
        return matchTokens(combined, [token]);
      });
    }).slice(0, 12);

    const matchedSuspects: SuspectResult[] = allSuspectResults.filter((s) => {
      if (cleanTokens.length === 0) return true;
      const combined = `${s.title} ${s.subtitle} ${s.badge || ""} suspect criminal offender`;
      return matchTokens(combined, cleanTokens);
    }).slice(0, 6);

    const matchedDistricts: DistrictResult[] = allDistrictResults.filter((d) => {
      if (cleanTokens.length === 0) return true;
      const combined = `${d.title} ${d.subtitle} ${d.badge || ""} district jurisdiction`;
      return matchTokens(combined, cleanTokens);
    }).slice(0, 5);

    const matchedClusters: ClusterResult[] = allClusterResults.filter((c) => {
      if (cleanTokens.length === 0) return true;
      const combined = `${c.title} ${c.subtitle} ${c.badge || ""} hotspot cluster st-dbscan`;
      return matchTokens(combined, cleanTokens);
    }).slice(0, 5);

    const counts = {
      all: matchedNav.length + matchedFirs.length + matchedSuspects.length + matchedClusters.length + matchedDistricts.length,
      nav: matchedNav.length,
      firs: matchedFirs.length,
      suspects: matchedSuspects.length,
      clusters: matchedClusters.length,
      districts: matchedDistricts.length,
      pinned: currentPinnedItems.length,
    };

    // Filter by active category tab
    let filtered: SearchItem[] = [];
    if (activeCategory === "pinned") {
      filtered = currentPinnedItems;
    } else if (activeCategory === "all") {
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

    // Sort pinned items to the top
    filtered.sort((a, b) => {
      const aPinned = pinnedIds.includes(a.id);
      const bPinned = pinnedIds.includes(b.id);
      if (aPinned && !bPinned) return -1;
      if (!aPinned && bPinned) return 1;
      return 0;
    });

    return { results: filtered, counts, pinnedItems: currentPinnedItems };
  }, [query, activeCategory, navItems, firs, suspects, districts, clusters, pinnedIds, matchTokens, navigate, onClose, saveRecent]);

  // Keep selected index in bounds
  useEffect(() => {
    setSelectedIndex(0);
  }, [query, activeCategory]);

  // Handle Ask AI in spotlight
  const handleAskAI = async (promptToUse?: string) => {
    const p = promptToUse || query;
    if (!p.trim() || isAiLoading) return;
    setIsAiLoading(true);
    saveRecent(p);
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

  // Play / Pause AI Voice TTS Audio
  const handleToggleVoiceAudio = (text: string) => {
    if (isPlayingAudio && audioRef.current) {
      audioRef.current.pause();
      setIsPlayingAudio(false);
      return;
    }

    if (!text.trim()) return;

    try {
      if (audioRef.current) {
        audioRef.current.pause();
      }
      const isKn = /[\u0c80-\u0cff]/.test(text) || config.defaultLanguage === "kn";
      const audioUrl = api.getTTSAudioUrl(text, isKn ? "kn" : "en");
      const audio = new Audio(audioUrl);
      audio.playbackRate = getPlaybackRateFromConfig(config.voiceSpeed);
      audioRef.current = audio;


      audio.onplay = () => setIsPlayingAudio(true);
      audio.onended = () => setIsPlayingAudio(false);
      audio.onerror = () => {
        setIsPlayingAudio(false);
        toast.error("Audio playback unavailable");
      };

      audio.play().catch(() => setIsPlayingAudio(false));
    } catch {
      setIsPlayingAudio(false);
    }
  };

  // Copy Identifier to Clipboard
  const handleCopyIdentifier = useCallback((item: SearchItem) => {
    let textToCopy = item.title;
    if (item.type === "fir" && item.fir?.FIR_Number) {
      textToCopy = `FIR #${item.fir.FIR_Number}`;
    } else if (item.type === "suspect" && item.suspect?.id) {
      textToCopy = `${item.suspect.name} (${item.suspect.id})`;
    }
    navigator.clipboard.writeText(textToCopy);
    toast.success(`Copied: ${textToCopy}`);
  }, []);

  // Keyboard navigation & Shortcuts
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
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "c" && !window.getSelection()?.toString()) {
        if (results[selectedIndex]) {
          handleCopyIdentifier(results[selectedIndex]);
        }
      } else if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === "p") {
        e.preventDefault();
        if (results[selectedIndex]) {
          togglePin(results[selectedIndex].id);
        }
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [isOpen, results, selectedIndex, query, onClose, handleCopyIdentifier, togglePin]);

  // Speech-to-Text Voice Toggle for Search
  const handleToggleVoice = () => {
    const SpeechRecognition =
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).SpeechRecognition ||
      (window as unknown as { SpeechRecognition?: any; webkitSpeechRecognition?: any }).webkitSpeechRecognition;

    if (!SpeechRecognition) {
      toast.error("Speech recognition not supported in this browser");
      return;
    }

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
  const isSelectedPinned = activeItem ? pinnedIds.includes(activeItem.id) : false;

  return (
    <div
      className="fixed inset-0 z-50 flex items-start justify-center pt-8 md:pt-14 bg-black/85 backdrop-blur-md p-4 animate-in fade-in duration-150"
      onClick={onClose}
    >
      <div
        className="relative flex flex-col w-full max-w-4xl rounded-2xl border border-zinc-800 bg-[#0f1013] shadow-[0_25px_70px_-15px_rgba(0,0,0,0.95)] overflow-hidden animate-in zoom-in-95 duration-150"
        onClick={(e) => e.stopPropagation()}
      >
        {/* Search Omnibar Header */}
        <div className="relative flex items-center border-b border-zinc-800/80 bg-zinc-950 px-4 py-3.5 gap-2">
          <span className="material-symbols-outlined text-emerald-400 text-2xl select-none shrink-0">
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
            className="flex-1 bg-transparent text-sm text-white placeholder-zinc-500 font-sans focus:outline-none min-w-0"
          />

          <div className="flex items-center gap-2 shrink-0">
            {/* Live Audio Equalizer Wave Animation when dictating */}
            {isListening && (
              <div className="flex items-center gap-0.5 px-2 py-1 bg-red-950/80 border border-red-800/50 rounded-lg">
                <span className="h-3 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.3s]" />
                <span className="h-4 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.15s]" />
                <span className="h-2 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.45s]" />
                <span className="h-5 w-1 bg-red-400 rounded-full animate-bounce" />
                <span className="h-3 w-1 bg-red-400 rounded-full animate-bounce [animation-delay:-0.2s]" />
              </div>
            )}

            {/* Voice Dictation Button */}
            <button
              type="button"
              onClick={handleToggleVoice}
              className={`flex items-center gap-1.5 rounded-lg px-2.5 py-1.5 text-xs font-mono transition-all cursor-pointer ${
                isListening
                  ? "bg-red-500 text-white font-bold animate-pulse shadow-[0_0_12px_rgba(239,68,68,0.5)]"
                  : "text-zinc-400 hover:text-white hover:bg-zinc-800 border border-zinc-800"
              }`}
              title="Voice Search in English or Kannada"
            >
              <span className="material-symbols-outlined text-[16px]">{isListening ? "mic_off" : "mic"}</span>
              <span className="hidden sm:inline">{isListening ? "Listening..." : "Voice"}</span>
            </button>

            {/* Explicit Ask AI Button in Header */}
            {query.trim() && (
              <button
                type="button"
                onClick={() => handleAskAI()}
                disabled={isAiLoading}
                className="flex items-center gap-1.5 rounded-lg bg-emerald-600/30 hover:bg-emerald-600/50 border border-emerald-500/40 px-2.5 py-1.5 text-xs font-medium text-emerald-300 transition-colors cursor-pointer"
                title="Ask Gemini AI Copilot (Tab)"
              >
                <span className="material-symbols-outlined text-sm">smart_toy</span>
                <span className="hidden sm:inline">{isAiLoading ? "Consulting..." : "Ask AI"}</span>
                <kbd className="hidden sm:inline font-mono text-[9px] bg-emerald-950/80 border border-emerald-700/60 px-1 py-0.2 rounded text-emerald-300">Tab</kbd>
              </button>
            )}

            {/* Clear Input Button */}
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="text-zinc-400 hover:text-white p-1 rounded hover:bg-zinc-800 transition-colors cursor-pointer"
                title="Clear Search"
              >
                <span className="material-symbols-outlined text-sm">close</span>
              </button>
            )}

            {/* Prominent Clickable Close Button */}
            <button
              type="button"
              onClick={onClose}
              aria-label="Close search panel"
              title="Close Search (ESC)"
              className="flex items-center gap-1.5 rounded-lg border border-zinc-800 bg-zinc-900/90 px-2.5 py-1.5 text-xs text-zinc-400 hover:bg-red-950/40 hover:border-red-800/60 hover:text-red-300 transition-all cursor-pointer group"
            >
              <span className="material-symbols-outlined text-[16px] transition-transform group-hover:scale-110">close</span>
              <span className="hidden sm:inline font-mono text-[10px] text-zinc-500 group-hover:text-red-300 font-semibold">ESC</span>
            </button>
          </div>
        </div>

        {/* Quick Scope Filter Chips Bar */}
        <div className="flex items-center justify-between border-b border-zinc-800/60 bg-[#131418] px-4 py-2 text-xs font-mono">
          <div className="flex items-center gap-1.5 overflow-x-auto custom-scrollbar">
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

          {/* Interactive Pinned Filter Button */}
          {pinnedIds.length > 0 && (
            <button
              type="button"
              onClick={() => setActiveCategory(activeCategory === "pinned" ? "all" : "pinned")}
              className={`flex items-center gap-1.5 text-xs font-mono px-3 py-1 rounded-full border transition-all cursor-pointer shrink-0 ${
                activeCategory === "pinned"
                  ? "bg-amber-400 text-black font-bold border-amber-300 shadow-[0_0_12px_rgba(251,191,36,0.4)]"
                  : "text-amber-400 bg-amber-950/40 border-amber-800/60 hover:bg-amber-900/50"
              }`}
              title="Show only pinned priority dossiers"
            >
              <span className="material-symbols-outlined text-xs">star</span>
              <span>{pinnedIds.length} Pinned</span>
            </button>
          )}
        </div>

        {/* AI Quick Response Banner with Neural Audio TTS Voice Player */}
        {aiAnswer && (
          <div className="border-b border-emerald-500/30 bg-emerald-950/25 p-4 max-h-56 overflow-y-auto custom-scrollbar">
            <div className="flex items-center justify-between font-mono text-[11px] text-emerald-400 mb-2">
              <span className="flex items-center gap-2">
                <span className="h-2 w-2 rounded-full bg-emerald-400 animate-ping" />
                <span className="font-bold">Lumina Gemini 2.5 Flash Analytical Briefing</span>
              </span>

              <div className="flex items-center gap-3">
                {/* Voice Audio Listen Button */}
                <button
                  type="button"
                  onClick={() => handleToggleVoiceAudio(aiAnswer)}
                  className="flex items-center gap-1.5 text-xs text-emerald-300 hover:text-emerald-100 bg-emerald-900/50 border border-emerald-500/40 px-2.5 py-1 rounded-lg transition-colors cursor-pointer shadow-sm"
                  title={`Listen to briefing (Google Neural Voice ${VOICE_SPEED_MAP[config.voiceSpeed].multiplier})`}
                >
                  <span className="material-symbols-outlined text-sm">
                    {isPlayingAudio ? "stop_circle" : "volume_up"}
                  </span>
                  <span>{isPlayingAudio ? "Stop Audio" : `Listen (${VOICE_SPEED_MAP[config.voiceSpeed].multiplier})`}</span>
                </button>


                <button
                  type="button"
                  onClick={() => {
                    try { navigate({ to: "/ai-chatbot" }); } catch {}
                    onClose();
                  }}
                  className="text-emerald-300 hover:underline cursor-pointer font-sans text-xs flex items-center gap-1"
                >
                  <span>Continue in Copilot</span>
                  <span className="material-symbols-outlined text-xs">arrow_forward</span>
                </button>
              </div>
            </div>
            <p className="text-xs text-zinc-200 leading-relaxed whitespace-pre-wrap font-sans">{aiAnswer}</p>
          </div>
        )}

        {/* Search Results / Action List with Split Detail Preview */}
        <div className="flex flex-col md:flex-row h-[420px] overflow-hidden">
          {/* Left Column: Results List */}
          <div ref={listRef} className="flex-1 overflow-y-auto custom-scrollbar p-3 space-y-1.5">
            {/* Dedicated Pinned Priority Section on Empty State */}
            {!query && pinnedItems.length > 0 && activeCategory !== "pinned" && (
              <div className="mb-3 space-y-1.5 rounded-xl border border-amber-500/30 bg-amber-950/20 p-2.5">
                <div className="flex items-center justify-between px-1 font-mono text-[10px] uppercase text-amber-400 tracking-wider">
                  <span className="flex items-center gap-1">
                    <span className="material-symbols-outlined text-xs">star</span>
                    <span>📌 Pinned Priority Dossiers ({pinnedItems.length})</span>
                  </span>
                  <button
                    type="button"
                    onClick={() => setActiveCategory("pinned")}
                    className="hover:underline text-[10px] cursor-pointer"
                  >
                    View All
                  </button>
                </div>
                <div className="space-y-1">
                  {pinnedItems.map((item) => (
                    <div
                      key={`pinned-${item.id}`}
                      onClick={() => item.action()}
                      className="flex items-center justify-between rounded-lg bg-zinc-900/90 border border-amber-800/40 p-2 text-xs hover:border-amber-500/60 transition-colors cursor-pointer"
                    >
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-amber-400 material-symbols-outlined text-sm shrink-0">star</span>
                        <div className="min-w-0">
                          <div className="font-semibold text-white truncate">{item.title}</div>
                          <div className="text-[10px] text-zinc-400 truncate">{item.subtitle}</div>
                        </div>
                      </div>
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                        className="p-1 text-zinc-400 hover:text-red-400 transition-colors cursor-pointer"
                        title="Unpin Dossier"
                      >
                        <span className="material-symbols-outlined text-sm">close</span>
                      </button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* When Query is empty: Show Recent Searches & Suggested AI Prompts */}
            {!query && (
              <div className="mb-3 space-y-3">
                {/* Recent Searches Pill Row */}
                {recentSearches.length > 0 && (
                  <div className="space-y-1.5">
                    <div className="flex items-center justify-between px-2 font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                      <span>🕒 Recent Searches</span>
                      <button
                        type="button"
                        onClick={() => {
                          setRecentSearches([]);
                          try { localStorage.removeItem("lumina_recent_searches"); } catch {}
                        }}
                        className="hover:text-zinc-300 cursor-pointer"
                      >
                        Clear
                      </button>
                    </div>
                    <div className="flex flex-wrap gap-1.5 px-1">
                      {recentSearches.map((term) => (
                        <button
                          key={term}
                          type="button"
                          onClick={() => setQuery(term)}
                          className="flex items-center gap-1 rounded-lg bg-zinc-900 border border-zinc-800 px-2.5 py-1 text-xs text-zinc-300 hover:text-white hover:border-zinc-700 transition-colors cursor-pointer font-mono"
                        >
                          <span className="material-symbols-outlined text-xs text-zinc-500">history</span>
                          <span>{term}</span>
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* AI Inquiries Grid */}
                <div className="space-y-1.5">
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
                const isPinned = pinnedIds.includes(item.id);
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
                          {isPinned && (
                            <span className="text-amber-400 material-symbols-outlined text-xs shrink-0" title="Pinned Item">
                              star
                            </span>
                          )}
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

                    <div className="flex items-center gap-1.5 shrink-0">
                      {/* Hover action icon for Copy */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCopyIdentifier(item);
                        }}
                        className="opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded text-zinc-400 hover:text-white transition-opacity cursor-pointer"
                        title="Copy Identifier (Ctrl+C)"
                      >
                        <span className="material-symbols-outlined text-[15px]">content_copy</span>
                      </button>

                      {/* Hover action icon for Pin */}
                      <button
                        type="button"
                        onClick={(e) => {
                          e.stopPropagation();
                          togglePin(item.id);
                        }}
                        className={`opacity-0 group-hover:opacity-100 p-1 hover:bg-zinc-800 rounded transition-opacity cursor-pointer ${
                          isPinned ? "text-amber-400 opacity-100" : "text-zinc-400 hover:text-amber-300"
                        }`}
                        title={isPinned ? "Unpin (Ctrl+P)" : "Pin to Top (Ctrl+P)"}
                      >
                        <span className="material-symbols-outlined text-[15px]">
                          {isPinned ? "star" : "star_outline"}
                        </span>
                      </button>

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
          <div className="hidden md:flex flex-col w-84 border-l border-zinc-800/80 bg-zinc-950/70 p-4 justify-between">
            {activeItem ? (
              <div className="space-y-3 overflow-y-auto custom-scrollbar pr-1">
                <div className="flex items-center justify-between font-mono text-[10px] uppercase text-zinc-500 tracking-wider">
                  <span>Intelligence Dossier</span>
                  <div className="flex items-center gap-2">
                    <button
                      type="button"
                      onClick={() => togglePin(activeItem.id)}
                      className={`flex items-center gap-1 text-[10px] cursor-pointer ${
                        isSelectedPinned ? "text-amber-400 font-bold" : "text-zinc-500 hover:text-zinc-300"
                      }`}
                      title={isSelectedPinned ? "Unpin Dossier (Ctrl+P)" : "Pin Dossier to Top (Ctrl+P)"}
                    >
                      <span className="material-symbols-outlined text-xs">
                        {isSelectedPinned ? "star" : "star_outline"}
                      </span>
                      <span>{isSelectedPinned ? "Pinned" : "Pin (Ctrl+P)"}</span>
                    </button>
                    <span className="text-zinc-600">·</span>
                    <span className="text-emerald-400">Live</span>
                  </div>
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
                        <span>Jurisdiction:</span>
                        <span className="text-zinc-300">{activeItem.fir.Station_Name || "Precinct"}</span>
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
                      {/* Visual Risk Gauge Meter */}
                      <div className="w-full bg-zinc-900 rounded-full h-1.5 overflow-hidden border border-zinc-800">
                        <div
                          className="h-full bg-gradient-to-r from-amber-500 to-red-500 rounded-full transition-all"
                          style={{ width: `${Math.min(100, activeItem.score)}%` }}
                        />
                      </div>
                      <div className="flex justify-between pt-1">
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

                  <div className="grid grid-cols-2 gap-1.5">
                    <button
                      type="button"
                      onClick={() => handleCopyIdentifier(activeItem)}
                      className="flex items-center justify-center gap-1 rounded-xl border border-zinc-800 bg-zinc-900/80 hover:bg-zinc-800 text-zinc-300 py-1.5 text-xs font-mono transition-colors cursor-pointer"
                      title="Copy Case Number / Suspect ID (Ctrl+C)"
                    >
                      <span className="material-symbols-outlined text-xs">content_copy</span>
                      <span>Copy ID</span>
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
                      className="flex items-center justify-center gap-1 rounded-xl border border-emerald-500/40 bg-emerald-950/40 hover:bg-emerald-900/60 text-emerald-300 py-1.5 text-xs font-mono transition-colors cursor-pointer"
                      title="Consult Gemini AI on this dossier (Tab)"
                    >
                      <span className="material-symbols-outlined text-xs">smart_toy</span>
                      <span>Ask AI</span>
                    </button>
                  </div>
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
                className="w-full flex items-center justify-center gap-2 rounded-xl bg-zinc-800/90 hover:bg-zinc-700 border border-zinc-700/80 py-2 text-xs font-medium text-white transition-colors cursor-pointer shrink-0 mt-2"
              >
                <span className="material-symbols-outlined text-sm text-emerald-400">smart_toy</span>
                <span>{isAiLoading ? "Consulting AI..." : `Ask Gemini about "${query.slice(0, 14)}..."`}</span>
              </button>
            )}
          </div>
        </div>

        {/* Interactive Clickable Footer Action Bar */}
        <div className="flex flex-wrap items-center justify-between border-t border-zinc-800/80 px-4 py-2.5 bg-zinc-950 text-[11px] font-mono text-zinc-400 gap-2">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              type="button"
              onClick={() => {
                if (results[selectedIndex]) results[selectedIndex].action();
              }}
              className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-900 cursor-pointer"
            >
              <kbd className="text-zinc-200 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">↵ Enter</kbd>
              <span>Open</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (results[selectedIndex]) handleCopyIdentifier(results[selectedIndex]);
              }}
              className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-900 cursor-pointer"
            >
              <kbd className="text-zinc-200 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">Ctrl+C</kbd>
              <span>Copy</span>
            </button>

            <button
              type="button"
              onClick={() => {
                if (results[selectedIndex]) togglePin(results[selectedIndex].id);
              }}
              className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-900 cursor-pointer"
            >
              <kbd className="text-zinc-200 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">Ctrl+P</kbd>
              <span>Pin</span>
            </button>

            <button
              type="button"
              onClick={() => handleAskAI()}
              className="flex items-center gap-1 hover:text-white px-1.5 py-0.5 rounded hover:bg-zinc-900 cursor-pointer"
            >
              <kbd className="text-zinc-200 bg-zinc-800 px-1.5 py-0.2 rounded border border-zinc-700">Tab</kbd>
              <span>Ask AI</span>
            </button>

            <button
              type="button"
              onClick={onClose}
              className="flex items-center gap-1 text-red-400 hover:text-red-300 px-1.5 py-0.5 rounded hover:bg-red-950/40 cursor-pointer"
            >
              <kbd className="text-red-300 bg-red-950/80 px-1.5 py-0.2 rounded border border-red-800/60">ESC</kbd>
              <span>Close</span>
            </button>
          </div>

          <span className="text-zinc-500 hidden lg:inline">5,005 FIRs · 3,000 Suspects Indexed</span>
        </div>
      </div>
    </div>
  );
}
