import React from "react";
import { FileText, AlertTriangle, ShieldCheck, Cpu, TrendingUp, TrendingDown } from "lucide-react";

export default function KPIGrid() {
  const kpis = [
    {
      id: "total_firs",
      title: "Total FIRs Registered",
      value: "14,892",
      change: "+12.4%",
      isPositive: false, // More crimes registered
      period: "vs last month",
      icon: FileText,
      color: "#3b82f6",
      bgGradient: "linear-gradient(135deg, rgba(59, 130, 246, 0.15), rgba(59, 130, 246, 0.03))",
      borderColor: "#3b82f6"
    },
    {
      id: "high_risk_hotspots",
      title: "Active Risk Hotspots",
      value: "42",
      change: "-4.1%",
      isPositive: true, // Decreased hotspot count is good
      period: "ST-DBSCAN Cluster",
      icon: AlertTriangle,
      color: "#f43f5e",
      bgGradient: "linear-gradient(135deg, rgba(244, 63, 94, 0.15), rgba(244, 63, 94, 0.03))",
      borderColor: "#f43f5e"
    },
    {
      id: "charge_sheet_rate",
      title: "Charge Sheet Rate",
      value: "78.6%",
      change: "+5.2%",
      isPositive: true,
      period: "Target: 75%",
      icon: ShieldCheck,
      color: "#10b981",
      bgGradient: "linear-gradient(135deg, rgba(16, 185, 129, 0.15), rgba(16, 185, 129, 0.03))",
      borderColor: "#10b981"
    },
    {
      id: "ai_risk_score",
      title: "Predictive State Risk Index",
      value: "6.4 / 10",
      change: "+0.3",
      isPositive: false,
      period: "Zia AutoML Forecast",
      icon: Cpu,
      color: "#8b5cf6",
      bgGradient: "linear-gradient(135deg, rgba(139, 92, 246, 0.15), rgba(139, 92, 246, 0.03))",
      borderColor: "#8b5cf6"
    }
  ];

  return (
    <div className="kpi-grid">
      {kpis.map((kpi) => {
        const Icon = kpi.icon;
        return (
          <div
            key={kpi.id}
            className="kpi-card"
            style={{
              "--card-accent": kpi.borderColor,
              background: kpi.bgGradient,
            }}
          >
            <div className="kpi-card-header">
              <span className="kpi-label">{kpi.title}</span>
              <div
                className="kpi-icon-wrapper"
                style={{
                  background: `${kpi.color}20`,
                  color: kpi.color,
                  border: `1px solid ${kpi.color}40`
                }}
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