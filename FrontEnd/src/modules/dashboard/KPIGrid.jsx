import React, { useEffect, useState } from "react";
import { FileText, AlertTriangle, ShieldCheck, Cpu, TrendingUp, TrendingDown, Users, Scale } from "lucide-react";
import { fetchOverview } from "../../api/dashboard";

export default function KPIGrid() {
  const [overview, setOverview] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchOverview().then((data) => {
      setOverview(data);
      setLoading(false);
    });
  }, []);

  // Build KPI cards from live overview data
  const buildKPIs = (data) => {
    if (!data) return [];
    const statusBreakdown = data.status_breakdown || {};
    const open = statusBreakdown["Under Investigation"] || 0;
    const chargesheeted = statusBreakdown["Chargesheeted"] || 0;
    const chargeSheetRate =
      data.total_firs > 0
        ? ((chargesheeted / data.total_firs) * 100).toFixed(1)
        : 0;

    return [
      {
        id: "total_firs",
        title: "Total FIRs Registered",
        value: data.total_firs?.toLocaleString("en-IN") ?? "—",
        change: `${open.toLocaleString("en-IN")} active`,
        isPositive: false,
        period: "Statewide registry",
        icon: FileText,
        color: "#3b82f6",
        bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.03))",
        borderColor: "#3b82f6",
      },
      {
        id: "repeat_offenders",
        title: "Repeat Offenders",
        value: data.repeat_offenders?.toLocaleString("en-IN") ?? "—",
        change: "Arrested 2+ times",
        isPositive: false,
        period: "Recidivism risk",
        icon: AlertTriangle,
        color: "#f43f5e",
        bgGradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.03))",
        borderColor: "#f43f5e",
      },
      {
        id: "charge_sheet_rate",
        title: "Charge Sheet Rate",
        value: `${chargeSheetRate}%`,
        change: chargeSheetRate >= 75 ? "Above target" : "Below 75% target",
        isPositive: parseFloat(chargeSheetRate) >= 75,
        period: "KSP target: 75%",
        icon: ShieldCheck,
        color: "#10b981",
        bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.03))",
        borderColor: "#10b981",
      },
      {
        id: "total_victims",
        title: "Total Victims",
        value: data.total_victims?.toLocaleString("en-IN") ?? "—",
        change: `${data.total_accused?.toLocaleString("en-IN") ?? "—"} accused`,
        isPositive: false,
        period: `${data.total_districts ?? 31} districts covered`,
        icon: Users,
        color: "#8b5cf6",
        bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.03))",
        borderColor: "#8b5cf6",
      },
    ];
  };

  const kpis = buildKPIs(overview);

  return (
    <div className="kpi-grid">
      {loading
        ? Array.from({ length: 4 }).map((_, i) => (
            <div key={i} className="kpi-card" style={{ opacity: 0.4, animation: "pulse 1.5s ease-in-out infinite" }}>
              <div style={{ height: "80px", borderRadius: "8px", background: "rgba(255,255,255,0.05)" }} />
            </div>
          ))
        : kpis.map((kpi) => {
            const Icon = kpi.icon;
            return (
              <div
                key={kpi.id}
                className="kpi-card"
                style={{ "--card-accent": kpi.borderColor, background: kpi.bgGradient }}
              >
                <div className="kpi-card-header">
                  <span className="kpi-label">{kpi.title}</span>
                  <div
                    className="kpi-icon-wrapper"
                    style={{ background: `${kpi.color}20`, color: kpi.color, border: `1px solid ${kpi.color}40` }}
                  >
                    <Icon size={20} />
                  </div>
                </div>
                <div className="kpi-value-row">
                  <span className="kpi-value">{kpi.value}</span>
                  <div className={`kpi-trend ${kpi.isPositive ? "positive" : "negative"}`}>
                    {kpi.isPositive ? <TrendingDown size={14} /> : <TrendingUp size={14} />}
                    <span>{kpi.change}</span>
                  </div>
                </div>
                <div className="kpi-subtext">{kpi.period}</div>
              </div>
            );
          })}
    </div>
  );
}