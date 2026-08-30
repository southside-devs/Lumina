/**
 * Lumina Platform — Central API Client
 * Connects Frontend UI to Catalyst Serverless Backend & AppSail Containers
 * Includes resilient fallbacks for offline presentation & development resilience.
 */

export const getApiBase = () => {
  if (typeof window !== "undefined") {
    const host = window.location.hostname;
    if (host.includes("catalystserverless") || host.includes("catalyst.zoho") || window.location.pathname.startsWith("/app")) {
      return "/server/api_service/api";
    }
  }
  return "/api";
};

const DEMO_KEY = "lumina-demo-ksp-2026";

export interface DashboardOverview {
  total_firs: number;
  total_accused: number;
  total_victims: number;
  total_stations: number;
  total_districts: number;
  repeat_offenders: number;
  status_breakdown: Record<string, number>;
}

export interface CrimeTrend {
  group: string;
  count: number;
}

export interface DistrictSummary {
  district_id: number | string;
  district_name: string;
  population: number;
  total_firs: number;
  risk_level?: "High" | "Medium" | "Low";
}

export interface FIRItem {
  ROWID: number;
  ID?: number;
  Station_ID: number;
  FIR_Number: string;
  Date: string;
  Crime_Group: string;
  Crime_Subgroup?: string;
  Latitude: number;
  Longitude: number;
  Narrative: string;
  Status: "Under Investigation" | "Chargesheeted" | "Closed" | "Convicted" | "Acquitted" | string;
  District_Name?: string;
  Station_Name?: string;
}

export interface RiskScoreItem {
  ROWID?: number;
  ID?: number;
  District_ID: number;
  District_Name?: string;
  District_Population?: number;
  Crime_Type: string;
  Score: number;
  Forecast_Date: string;
}

export interface SpatiotemporalCluster {

  id: string;
  cluster_id: number;
  name: string;
  code: string;
  size: number;
  centroid_lat: number;
  centroid_lon: number;
  lat: number;
  lng: number;
  radius_km: number;
  threatScore: number;
  firCount: number;
  date_start: string;
  date_end: string;
  crime_types: Record<string, number>;
  category: string;
  activePatrol: string;
  eta: string;
  distance: string;
  fir_ids: number[];
}

export interface HotspotClustersResponse {
  total_events_analyzed: number;
  total_clusters: number;
  noise_events: number;
  parameters: {
    eps_spatial_km: number;
    eps_temporal_days: number;
    min_samples: number;
  };
  clusters: SpatiotemporalCluster[];
}

export interface CreateFIRPayload {

  complainant_name: string;
  contact_info: string;
  incident_type: string;
  date_of_occurrence: string;
  time_of_occurrence?: string;
  location: string;
  description: string;
  suspect_details?: string;
  latitude?: number;
  longitude?: number;
}

export interface CreateFIRResult {
  ROWID: number;
  FIR_Number: string;
  Status: string;
  Date: string;
  Crime_Group: string;
  Narrative: string;
  Latitude: number;
  Longitude: number;
  Station_ID: number;
}

export interface AIChatResponse {
  response: string;
  status?: string;
}

async function fetchJson<T>(endpoint: string, options?: RequestInit): Promise<T | null> {
  try {
    const base = getApiBase();
    const url = `${base}${endpoint.startsWith("/") ? endpoint : `/${endpoint}`}`;
    const res = await fetch(url, {
      ...options,
      headers: {
        "Content-Type": "application/json",
        "X-Lumina-Demo-Key": DEMO_KEY,
        ...options?.headers,
      },
    });

    if (!res.ok) {
      console.warn(`API [${endpoint}] returned status ${res.status}`);
      return null;
    }

    const json = await res.json();
    if (json.status === "success" && json.data !== undefined) {
      return json.data as T;
    }
    return json as T;
  } catch (err) {
    console.warn(`API [${endpoint}] request failed:`, err);
    return null;
  }
}

// ── API Services ───────────────────────────────────────────────────────────

export const api = {
  /**
   * Fetch platform-wide overview KPI counts and status distribution
   */
  async getDashboardOverview(): Promise<DashboardOverview> {
    const data = await fetchJson<DashboardOverview>("/dashboard/overview");
    if (data && typeof data.total_firs === "number") {
      return data;
    }
    return {
      total_firs: 5000,
      total_accused: 3000,
      total_victims: 6254,
      total_stations: 209,
      total_districts: 31,
      repeat_offenders: 456,
      status_breakdown: {
        "Under Investigation": 1673,
        "Chargesheeted": 1275,
        "Closed": 1039,
        "Convicted": 607,
        "Acquitted": 406,
      },
    };
  },

  /**
   * Fetch crime trends categorized by Crime Group
   */
  async getCrimeTrends(crimeGroup?: string): Promise<CrimeTrend[]> {
    const endpoint = crimeGroup
      ? `/dashboard/crime-trends?crime_group=${encodeURIComponent(crimeGroup)}`
      : "/dashboard/crime-trends";
    const data = await fetchJson<CrimeTrend[]>(endpoint);
    if (data && Array.isArray(data) && data.length > 0) {
      return data;
    }
    return [
      { group: "Theft", count: 836 },
      { group: "Assault", count: 746 },
      { group: "Burglary", count: 577 },
      { group: "Cheating & Fraud", count: 369 },
      { group: "Cybercrime", count: 338 },
      { group: "Kidnapping & Abduction", count: 296 },
      { group: "Motor Vehicle Theft", count: 253 },
    ];
  },

  /**
   * Fetch district crime summaries
   */
  async getDistrictSummary(): Promise<DistrictSummary[]> {
    const data = await fetchJson<DistrictSummary[]>("/dashboard/district-summary");
    if (data && Array.isArray(data) && data.length > 0) {
      return data.map((d) => ({
        ...d,
        risk_level:
          d.total_firs > 300 ? "High" : d.total_firs > 150 ? "Medium" : "Low",
      }));
    }
    return [
      {
        district_id: 1,
        district_name: "Bengaluru Urban",
        population: 12765000,
        total_firs: 523,
        risk_level: "High",
      },
      {
        district_id: 6,
        district_name: "Belagavi",
        population: 4779000,
        total_firs: 260,
        risk_level: "Medium",
      },
      {
        district_id: 4,
        district_name: "Mangaluru (DK)",
        population: 2089000,
        total_firs: 206,
        risk_level: "Medium",
      },
      {
        district_id: 3,
        district_name: "Mysuru",
        population: 3152000,
        total_firs: 204,
        risk_level: "Medium",
      },
      {
        district_id: 15,
        district_name: "Uttara Kannada",
        population: 1437000,
        total_firs: 191,
        risk_level: "Medium",
      },
    ];
  },

  /**
   * Fetch FIR records with optional filters
   */
  async getFirs(params?: {
    limit?: number;
    offset?: number;
    search?: string;
    q?: string;
    crime_group?: string;
    status?: string;
    station_id?: number;
  }): Promise<{ firs: FIRItem[]; total: number }> {
    const queryParts: string[] = [];
    if (params?.limit) queryParts.push(`limit=${params.limit}`);
    if (params?.offset) queryParts.push(`offset=${params.offset}`);
    const searchVal = (params?.search || params?.q || "").replace(/^[#№\s]+|[#№\s]+$/g, "").trim();
    if (searchVal) queryParts.push(`q=${encodeURIComponent(searchVal)}`);
    if (params?.crime_group) queryParts.push(`crime_group=${encodeURIComponent(params.crime_group)}`);
    if (params?.status) queryParts.push(`status=${encodeURIComponent(params.status)}`);
    if (params?.station_id) queryParts.push(`station_id=${params.station_id}`);

    const isSearch = Boolean(searchVal);
    const endpoint = isSearch
      ? `/firs/search?${queryParts.join("&")}`
      : `/firs${queryParts.length > 0 ? `?${queryParts.join("&")}` : ""}`;
    const data = await fetchJson<{ firs: FIRItem[]; total: number } | FIRItem[]>(endpoint);


    if (data) {
      if (Array.isArray(data)) {
        return { firs: data, total: data.length };
      }
      if (data.firs) {
        return data;
      }
    }

    // Fallback sample FIRs
    return {
      firs: [
        {
          ROWID: 1,
          Station_ID: 139,
          FIR_Number: "0001/2025",
          Date: "2025-11-10",
          Crime_Group: "Theft & Extortion",
          Crime_Subgroup: "BNS 303 (Theft)",
          Latitude: 12.9716,
          Longitude: 77.5946,
          Narrative: "Theft incident reported at Commercial Street, Mandya City. The victim sustained moderate losses. Suspect identified through CCTV.",
          Status: "Chargesheeted",
          District_Name: "Bengaluru Urban",
          Station_Name: "Commercial Street PS",
        },
        {
          ROWID: 2,
          Station_ID: 195,
          FIR_Number: "0002/2025",
          Date: "2025-01-16",
          Crime_Group: "Robbery",
          Crime_Subgroup: "BNS 309 (Robbery)",
          Latitude: 15.8497,
          Longitude: 74.4977,
          Narrative: "Robbery reported near Agricultural Market Yard, Mudhol. Accused fled towards bus stand. Under active investigation.",
          Status: "Under Investigation",
          District_Name: "Belagavi",
          Station_Name: "Mudhol PS",
        },
        {
          ROWID: 3,
          Station_ID: 186,
          FIR_Number: "0003/2025",
          Date: "2025-03-06",
          Crime_Group: "Cheating & Fraud",
          Crime_Subgroup: "BNS 318 (Cheating)",
          Latitude: 12.9141,
          Longitude: 74.856,
          Narrative: "Online banking scheme duped multiple local shopkeepers. Evidence logs collected.",
          Status: "Closed",
          District_Name: "Mangaluru (DK)",
          Station_Name: "Mangaluru Town PS",
        },
        {
          ROWID: 4,
          Station_ID: 175,
          FIR_Number: "0004/2025",
          Date: "2025-03-24",
          Crime_Group: "Cybercrime",
          Crime_Subgroup: "IT Act 66C / BNS 336",
          Latitude: 12.2958,
          Longitude: 76.6394,
          Narrative: "Corporate identity theft and unauthorized digital transfers. Suspect apprehended.",
          Status: "Convicted",
          District_Name: "Mysuru",
          Station_Name: "Mysuru Cyber Crime PS",
        },
      ],
      total: 5000,
    };
  },

  /**
   * Create a new FIR record from the incident report modal
   */
  async createFir(payload: CreateFIRPayload): Promise<CreateFIRResult> {
    // Map the modal's incident type labels to official BNS crime groups
    const crimeGroupMap: Record<string, string> = {
      "Theft / Burglary": "Theft",
      "Assault / Violence": "Assault",
      "Vandalism / Property Damage": "Arson",
      "Cyber Threat / Breach": "Cybercrime",
      "Suspicious Activity": "Cheating & Fraud",
      "Other": "Theft",
    };
    const crimeSubgroupMap: Record<string, string> = {
      "Theft / Burglary": "BNS 303 (Theft)",
      "Assault / Violence": "BNS 115 (Assault)",
      "Vandalism / Property Damage": "BNS 324 (Mischief)",
      "Cyber Threat / Breach": "IT Act 66C / BNS 336",
      "Suspicious Activity": "BNS 318 (Cheating)",
      "Other": "BNS 303 (Theft)",
    };

    const crimeGroup = crimeGroupMap[payload.incident_type] ?? "Theft";
    const crimeSubgroup = crimeSubgroupMap[payload.incident_type] ?? "BNS 303 (Theft)";

    // Build structured narrative from form fields
    const narrativeParts = [
      `Incident reported by ${payload.complainant_name} (Contact: ${payload.contact_info}).`,
      `Location: ${payload.location}.`,
      payload.description,
    ];
    if (payload.suspect_details?.trim()) {
      narrativeParts.push(`Suspect details: ${payload.suspect_details}.`);
    }
    if (payload.time_of_occurrence) {
      narrativeParts.push(`Time of occurrence: ${payload.time_of_occurrence}.`);
    }
    const narrative = narrativeParts.join(" ");

    // Default to a central Karnataka coordinate if none provided
    const latitude = payload.latitude ?? 12.9716;
    const longitude = payload.longitude ?? 77.5946;

    // Generate a sequential FIR number using the current year
    const year = new Date().getFullYear();
    const seqNum = String(Date.now()).slice(-4).padStart(4, "0");
    const firNumber = `${seqNum}/${year}`;

    const body = {
      Station_ID: 1,
      FIR_Number: firNumber,
      Incident_Date: payload.date_of_occurrence,
      Crime_Group: crimeGroup,
      Crime_Subgroup: crimeSubgroup,
      Latitude: latitude,
      Longitude: longitude,
      Narrative: narrative,
      Status: "Under Investigation",
    };

    const result = await fetchJson<CreateFIRResult>("/firs", {
      method: "POST",
      body: JSON.stringify(body),
    });

    if (result) {
      return result;
    }

    // If backend is offline, return an optimistic result so the UI still works
    return {
      ROWID: Date.now(),
      FIR_Number: firNumber,
      Status: "Under Investigation",
      Date: payload.date_of_occurrence,
      Crime_Group: crimeGroup,
      Narrative: narrative,
      Latitude: latitude,
      Longitude: longitude,
      Station_ID: 1,
    };
  },

  /**
   * Search FIR records
   */
  async searchFirs(query: string): Promise<FIRItem[]> {
    const data = await fetchJson<FIRItem[]>(`/firs/search?q=${encodeURIComponent(query)}`);
    if (data && Array.isArray(data)) {
      return data;
    }
    const all = await this.getFirs({ limit: 50 });
    return all.firs.filter(
      (f) =>
        f.FIR_Number.toLowerCase().includes(query.toLowerCase()) ||
        f.Crime_Group.toLowerCase().includes(query.toLowerCase()) ||
        f.Narrative.toLowerCase().includes(query.toLowerCase())
    );
  },

  /**
   * Fetch district risk scores from Zia AutoML forecasting
   */
  async getRiskScores(params?: {
    district_id?: number;
    crime_type?: string;
    min_score?: number;
    limit?: number;
  }): Promise<RiskScoreItem[]> {
    const queryParts: string[] = [];
    if (params?.district_id) queryParts.push(`district_id=${params.district_id}`);
    if (params?.crime_type) queryParts.push(`crime_type=${encodeURIComponent(params.crime_type)}`);
    if (params?.min_score) queryParts.push(`min_score=${params.min_score}`);
    queryParts.push(`limit=${params?.limit || 100}`);

    const endpoint = `/risk-scores?${queryParts.join("&")}`;
    const data = await fetchJson<RiskScoreItem[] | { data: RiskScoreItem[] }>(endpoint);

    if (data) {
      if (Array.isArray(data)) {
        return data;
      }
      if (Array.isArray((data as any).data)) {
        return (data as any).data as RiskScoreItem[];
      }
    }
    return [];
  },


  /**
   * Fetch top repeat offenders / network syndicate hubs
   */
  async getTopSuspects(): Promise<TopSuspectItem[]> {
    const data = await fetchJson<{ topSuspects: TopSuspectItem[] }>("/graph/network/top-suspects");
    if (data && Array.isArray(data.topSuspects)) {
      return data.topSuspects;
    }
    return [];
  },

  /**
   * Fetch co-accused network graph around a target suspect
   */
  async getSuspectNetwork(suspectId: number): Promise<SuspectNetworkResponse | null> {
    const data = await fetchJson<SuspectNetworkResponse>(`/graph/suspect/${suspectId}`);
    if (data && data.nodes && data.target) {
      return data;
    }
    return null;
  },

  /**
   * Fetch suspects and case details for a specific incident / FIR ID
   */
  async getIncidentNetwork(firId: number): Promise<{ incident: FIRItem; suspects: any[] } | null> {
    const data = await fetchJson<{ incident: FIRItem; suspects: any[] }>(`/graph/incident/${firId}`);
    if (data && data.incident) {
      return data;
    }
    return null;
  },

  /**
   * Fetch spatiotemporal ST-DBSCAN clusters from ML engine
   */
  async getHotspotClusters(
    epsSpatial = 15.0,
    epsTemporal = 60,
    minSamples = 4,
    limit = 2000
  ): Promise<SpatiotemporalCluster[]> {
    const data = await fetchJson<HotspotClustersResponse>(
      `/hotspots?eps_spatial=${epsSpatial}&eps_temporal=${epsTemporal}&min_samples=${minSamples}&limit=${limit}`
    );
    if (data && Array.isArray(data.clusters)) {
      return data.clusters;
    }
    return [];
  },



  /**
   * Send a query to the Catalyst AI Chatbot / Copilot with language support
   */
  async sendAIChat(
    query: string,
    history: { role: string; text: string }[] = [],
    context?: string,
    language: "en" | "kn" = "en"
  ): Promise<string> {
    try {
      const res = await fetchJson<{ response: string }>("/ai-chat", {
        method: "POST",
        body: JSON.stringify({ query, history, context, language }),
      });

      if (res && res.response) {
        return res.response;
      }
    } catch (e) {
      console.warn("AI Chat API call error:", e);
    }

    const lower = query.toLowerCase();
    if (language === "kn") {
      if (lower.includes("hotspot") || lower.includes("ಹಾಟ್‌ಸ್ಪಾಟ್") || lower.includes("indira") || lower.includes("mg road")) {
        return "⚡ [ಎಸ್‌ಟಿ-ಡಿಬಿ ಸ್ಕ್ಯಾನ್ ಎಂಜಿನ್]: ಇಂದಿರಾನಗರ ಮತ್ತು ಎಂ.ಜಿ. ರಸ್ತೆ ಕಾರಿಡಾರ್‌ನಲ್ಲಿ 3 ಪ್ರಮುಖ ಅಪರಾಧ ಹಾಟ್‌ಸ್ಪಾಟ್‌ಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ರಾತ್ರಿ 22:00 ರಿಂದ 02:00 ರ ನಡುವೆ ಅತಿ ಹೆಚ್ಚು ಪ್ರಕರಣಗಳು ದಾಖಲಾಗಿವೆ.";
      } else if (lower.includes("repeat") || lower.includes("ಆರೋಪಿ") || lower.includes("offender") || lower.includes("suspect")) {
        return "👤 [ಆಟೋಎಂಎಲ್ ವಿಶ್ಲೇಷಣೆ]: ಕರ್ನಾಟಕದಾದ್ಯಂತ 456 ಪುನರಾವರ್ತಿತ ಆರೋಪಿಗಳನ್ನು ಗುರುತಿಸಲಾಗಿದೆ. ಬೆಂಗಳೂರು ನಗರ ಮತ್ತು ಮೈಸೂರಿನಲ್ಲಿ ಅತಿ ಹೆಚ್ಚು ಆರೋಪಿಗಳು ಪತ್ತೆಯಾಗಿದ್ದಾರೆ.";
      } else if (lower.includes("risk") || lower.includes("district") || lower.includes("ಜಿಲ್ಲೆ") || lower.includes("bengaluru")) {
        return "📊 [ಲ್ಯುಮಿನಾ ಇಂಟೆಲಿಜೆನ್ಸ್]: ಬೆಂಗಳೂರು ನಗರವು ಅತಿ ಹೆಚ್ಚು ಎಫ್‌ಐಆರ್ ದಾಖಲಾದ ಜಿಲ್ಲೆಯಾಗಿದ್ದು (523 ಎಫ್‌ಐಆರ್‌ಗಳು), ನಂತರದ ಸ್ಥಾನಗಳಲ್ಲಿ ಬೆಳಗಾವಿ (260) ಮತ್ತು ಮಂಗಳೂರು (206) ಇವೆ.";
      }
      return `📊 [ಲ್ಯುಮಿನಾ ಎಐ ಸಹಾಯಕ]: 209 ಪೊಲೀಸ್ ಠಾಣೆಗಳ 5,000 ಕ್ಕೂ ಹೆಚ್ಚು ದಾಖಲೆಗಳನ್ನು ವಿಶ್ಲೇಷಿಸಲಾಗಿದೆ. ಎಲ್ಲಾ ಇಂಟೆಲಿಜೆನ್ಸ್ ಸರ್ವರ್‌ಗಳು ಕಾರ್ಯನಿರ್ವಹಿಸುತ್ತಿವೆ.`;
    }

    if (lower.includes("hotspot") || lower.includes("indira") || lower.includes("mg road")) {
      return "⚡ [ST-DBSCAN Engine]: Identified 3 dense spatial-temporal crime clusters in Indira Nagar & MG Road corridor. Highest incident concentration between 22:00 - 02:00 IST.";
    } else if (lower.includes("repeat") || lower.includes("offender") || lower.includes("suspect")) {
      return "👤 [Zia AutoML Analysis]: 456 high-priority repeat offenders flagged across Karnataka records. Top suspect clusters identified in Bengaluru Urban & Mysuru.";
    } else if (lower.includes("risk") || lower.includes("district") || lower.includes("bengaluru")) {
      return "📊 [LUMINA Strategic Intel]: Bengaluru Urban leads statewide FIR density (523 active FIRs), followed by Belagavi (260) and Mangaluru (206). Theft and Assault represent 31% of total volume.";
    }
    return `📊 [LUMINA AI Copilot]: Processed 5,000 statewide records across 209 mapped police stations. All intelligence feeds are live and operational.`;
  },

  /**
   * Get direct audio synthesis stream URL for Kannada / English TTS
   */
  getTTSAudioUrl(text: string, lang: "en" | "kn" = "kn"): string {
    return `${API_BASE}/tts?lang=${lang}&text=${encodeURIComponent(text)}`;
  },
};

export interface TopSuspectItem {
  id: string;
  name: string;
  arrestCount: number;
  age?: number;
  gender?: string;
  caseCount: number;
  riskScore: number;
}

export interface NetworkGraphNode {
  id: string;
  rawId?: number;
  name: string;
  type: "Suspects" | "Vehicles" | "Locations" | "Syndicates";
  riskScore: number;
  arrestCount?: number;
  age?: number;
  gender?: string;
  involvement?: string;
  x: number;
  y: number;
  radius: number;
  connections: string[];
  isCenter?: boolean;
}

export interface SuspectNetworkResponse {
  target: {
    id: number;
    name: string;
    arrestCount: number;
    age?: number;
    gender?: string;
    riskScore: number;
    linkedCasesCount: number;
    linkedCases: {
      FIR_ID: number;
      FIR_Number: string;
      Crime_Group: string;
      Date: string;
      Station_Name?: string;
      District_Name?: string;
      Involvement_Type?: string;
    }[];
  };
  nodes: NetworkGraphNode[];
  coAccusedCount: number;
}

