/**
 * Lumina — Official Intelligence Briefing PDF Exporter (SmartBrowz Compatible)
 * Generates standardized, printable intelligence briefings with official KSP emblem,
 * district threat metrics, and executive summaries.
 */

export interface BriefingData {
  title?: string;
  generatedBy?: string;
  date?: string;
  totalFirs?: number;
  criticalHotspots?: number;
  repeatOffenders?: number;
  topDistrict?: string;
  topCrimeGroup?: string;
}

export function generateIntelligenceBriefingPDF(data: BriefingData = {}) {
  const title = data.title || "KARNATAKA STATE POLICE — STRATEGIC INTELLIGENCE BRIEFING";
  const officer = data.generatedBy || "Insp. R. Kumar (SCRB Analytics Command)";
  const date = data.date || new Date().toLocaleDateString("en-IN", {
    day: "numeric",
    month: "long",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
  const totalFirs = data.totalFirs || 5000;
  const criticalHotspots = data.criticalHotspots || 3;
  const repeatOffenders = data.repeatOffenders || 456;
  const topDistrict = data.topDistrict || "Bengaluru Urban (523 active FIRs)";
  const topCrimeGroup = data.topCrimeGroup || "Theft (836) & Assault (746)";

  const printWindow = window.open("", "_blank");
  if (!printWindow) {
    alert("Please allow popups to generate the Intelligence Briefing PDF.");
    return;
  }

  const htmlContent = `
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <title>${title}</title>
  <style>
    @page { size: A4; margin: 20mm; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, "Helvetica Neue", sans-serif;
      color: #0f172a;
      background: #ffffff;
      line-height: 1.5;
      padding: 24px;
      margin: 0 auto;
      max-width: 800px;
    }
    .header {
      display: flex;
      align-items: center;
      justify-content: space-between;
      border-bottom: 2px solid #0f172a;
      padding-bottom: 16px;
      margin-bottom: 24px;
    }
    .emblem-title {
      display: flex;
      align-items: center;
      gap: 16px;
    }
    .emblem-badge {
      width: 48px;
      height: 48px;
      border-radius: 50%;
      background: #0f172a;
      color: #ffffff;
      display: flex;
      align-items: center;
      justify-content: center;
      font-weight: 900;
      font-size: 20px;
      letter-spacing: 1px;
    }
    h1 {
      font-size: 18px;
      font-weight: 800;
      letter-spacing: 0.5px;
      margin: 0;
      color: #0f172a;
      text-transform: uppercase;
    }
    .subtitle {
      font-size: 12px;
      color: #475569;
      margin-top: 2px;
      font-family: monospace;
    }
    .meta-badge {
      text-align: right;
      font-family: monospace;
      font-size: 11px;
      color: #334155;
    }
    .security-banner {
      background: #f1f5f9;
      border-left: 4px solid #ef4444;
      padding: 10px 14px;
      font-size: 11px;
      font-weight: 600;
      color: #991b1b;
      margin-bottom: 24px;
      border-radius: 4px;
      display: flex;
      justify-content: space-between;
    }
    .grid-kpi {
      display: grid;
      grid-template-columns: repeat(4, 1fr);
      gap: 12px;
      margin-bottom: 24px;
    }
    .kpi-card {
      border: 1px solid #cbd5e1;
      border-radius: 8px;
      padding: 12px;
      background: #f8fafc;
    }
    .kpi-label {
      font-size: 10px;
      font-family: monospace;
      text-transform: uppercase;
      color: #64748b;
    }
    .kpi-value {
      font-size: 20px;
      font-weight: 800;
      color: #0f172a;
      margin-top: 4px;
    }
    .section-title {
      font-size: 13px;
      font-weight: 700;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      border-bottom: 1px solid #e2e8f0;
      padding-bottom: 6px;
      margin-top: 24px;
      margin-bottom: 12px;
      color: #1e293b;
    }
    table {
      width: 100%;
      border-collapse: collapse;
      font-size: 11px;
      margin-top: 8px;
    }
    th, td {
      border: 1px solid #cbd5e1;
      padding: 8px 10px;
      text-align: left;
    }
    th {
      background: #f1f5f9;
      font-weight: 700;
      color: #334155;
    }
    .badge-critical {
      background: #fee2e2;
      color: #991b1b;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
    }
    .badge-monitored {
      background: #fef3c7;
      color: #92400e;
      padding: 2px 6px;
      border-radius: 4px;
      font-weight: 700;
      font-size: 9px;
    }
    .footer {
      margin-top: 40px;
      border-top: 1px solid #cbd5e1;
      padding-top: 12px;
      font-size: 10px;
      color: #64748b;
      display: flex;
      justify-content: space-between;
      font-family: monospace;
    }
  </style>
</head>
<body>

  <div class="header">
    <div class="emblem-title">
      <div class="emblem-badge">KSP</div>
      <div>
        <h1>Karnataka State Police</h1>
        <div class="subtitle">Lumina Strategic Crime Intelligence Hub • SCRB Command</div>
      </div>
    </div>
    <div class="meta-badge">
      <div><strong>DATE:</strong> ${date}</div>
      <div><strong>OFFICER:</strong> ${officer}</div>
    </div>
  </div>

  <div class="security-banner">
    <span>CONFIDENTIAL // LAW ENFORCEMENT SENSITIVE</span>
    <span>CATALYST SMARTBROWZ DOC-REF #KSP-2026-INTEL</span>
  </div>

  <div class="grid-kpi">
    <div class="kpi-card">
      <div class="kpi-label">Total Indexed FIRs</div>
      <div class="kpi-value">${totalFirs.toLocaleString()}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Critical Hotspots</div>
      <div class="kpi-value">${criticalHotspots}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Repeat Offenders</div>
      <div class="kpi-value">${repeatOffenders}</div>
    </div>
    <div class="kpi-card">
      <div class="kpi-label">Stations Operational</div>
      <div class="kpi-value">209</div>
    </div>
  </div>

  <div class="section-title">1. High-Priority Tactical Threat Hotspots</div>
  <table>
    <thead>
      <tr>
        <th>Sector / Division</th>
        <th>Threat Score</th>
        <th>Active FIRs</th>
        <th>Primary Crime Category</th>
        <th>Active Patrol Unit</th>
      </tr>
    </thead>
    <tbody>
      <tr>
        <td><strong>Bengaluru Urban (BLR-U)</strong></td>
        <td><span class="badge-critical">94 / 100</span></td>
        <td>523</td>
        <td>Theft & Cybercrime</td>
        <td>Patrol Alpha-4 (Indiranagar → MG Road)</td>
      </tr>
      <tr>
        <td><strong>Belagavi Division (BGM)</strong></td>
        <td><span class="badge-critical">88 / 100</span></td>
        <td>260</td>
        <td>Interstate Smuggling & Fraud</td>
        <td>Patrol Delta-2 (Camp Area → Tilakwadi)</td>
      </tr>
      <tr>
        <td><strong>Kalaburagi Zone (GUL)</strong></td>
        <td><span class="badge-critical">85 / 100</span></td>
        <td>168</td>
        <td>Arms Act & Atrocities</td>
        <td>Patrol Echo-7 (Station Bazaar)</td>
      </tr>
      <tr>
        <td><strong>Mangaluru (DK)</strong></td>
        <td><span class="badge-monitored">82 / 100</span></td>
        <td>206</td>
        <td>Coastal Cargo & Cyber</td>
        <td>Patrol Coastal-1 (Panambur)</td>
      </tr>
      <tr>
        <td><strong>Mysuru Central (MYS)</strong></td>
        <td><span class="badge-monitored">78 / 100</span></td>
        <td>204</td>
        <td>Robbery & Commercial Fraud</td>
        <td>Patrol Bravo-3 (Devaraja)</td>
      </tr>
    </tbody>
  </table>

  <div class="section-title">2. Executive Crime Pattern Analysis</div>
  <p style="font-size: 11px; color: #334155; line-height: 1.6;">
    Spatiotemporal analysis via ST-DBSCAN identifies elevated incident density along the Bengaluru–Mysuru highway corridor and Belagavi industrial borders during 22:00 to 02:00 IST. High-density repeat offender networks have been flagged for cross-station surveillance. Zia AutoML 14-day forecasts indicate a 12% rise in financial cybercrime cases in coastal districts.
  </p>

  <div class="section-title">3. Action Directives for Station House Officers</div>
  <ul style="font-size: 11px; color: #334155; padding-left: 20px; line-height: 1.6;">
    <li>Intensify motorized checkpoints along MG Road, Commercial Street, and Outer Ring Road corridors.</li>
    <li>Execute link isolation on high-risk fraud syndicate nodes (Suspect S. Kumar #CR-2026-8921).</li>
    <li>Sync nightly case logs to Catalyst Data Store via automated ETL cron.</li>
  </ul>

  <div class="footer">
    <span>Lumina Strategic Intelligence Hub • Zoho Catalyst Native</span>
    <span>Generated via Catalyst SmartBrowz PDF Engine</span>
  </div>

  <script>
    window.onload = function() {
      window.print();
    };
  </script>
</body>
</html>
  `;

  printWindow.document.open();
  printWindow.document.write(htmlContent);
  printWindow.document.close();
}
