// reportGenerator.ts - Ultra-simple PDF using pdfkit alternative

export class ProfessionalReportGenerator {
  async generateReport(analysisData: any): Promise<void> {
    try {
      // Use native browser download with simple HTML approach
      const html = this.buildSimpleHTML(analysisData);

      // Create blob and download
      const blob = new Blob([html], { type: "text/html" });
      const url = URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = `${analysisData.startupName}_Report.html`;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
    } catch (error: any) {
      throw new Error(`Report generation failed: ${error.message}`);
    }
  }

  private buildSimpleHTML(data: any): string {
    const score = data.recommendation?.score || 0;
    const metrics = data.keyMetrics || [];
    const risks = data.risks || [];
    const market = data.marketAnalysis || {};
    const financial = data.financialAnalysis || {};

    return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${data.startupName} - Investment Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; background: white; }
    .page { page-break-after: always; padding: 40px; min-height: 100vh; page-break-inside: avoid; }
    .cover { display: flex; flex-direction: column; justify-content: center; align-items: center; text-align: center; min-height: 100vh; }
    .cover h1 { font-size: 56px; margin: 20px 0; font-weight: bold; }
    .divider { width: 80px; height: 4px; background: #0099cc; margin: 30px auto; }
    .score { font-size: 56px; font-weight: bold; color: #fb923c; margin: 40px 0; }
    .rec { font-size: 18px; color: #666; }
    
    h2 { font-size: 32px; color: #0099cc; margin: 30px 0 20px; border-bottom: 3px solid #0099cc; padding-bottom: 10px; }
    h3 { font-size: 18px; margin: 20px 0 10px; color: #222; }
    p { margin: 15px 0; line-height: 1.8; }
    
    .metrics { display: grid; grid-template-columns: 1fr 1fr; gap: 20px; margin: 20px 0; }
    .metric { padding: 15px; background: #f5f5f5; border-left: 4px solid #0099cc; }
    .label { font-size: 12px; color: #0099cc; font-weight: bold; text-transform: uppercase; }
    .value { font-size: 18px; font-weight: bold; color: #22c55e; margin-top: 8px; }
    
    .risk { margin: 15px 0; padding: 15px; background: #ffe6e6; border-left: 4px solid #ef4444; }
    .risk-title { font-weight: bold; color: #ef4444; }
    .risk-text { font-size: 14px; margin-top: 5px; }
    
    @media print { .page { page-break-after: always; } }
  </style>
</head>
<body>
  <!-- COVER -->
  <div class="page cover">
    <div style="font-size: 14px; color: #999; margin-bottom: 40px;">INVESTMENT ANALYSIS REPORT</div>
    <h1>${data.startupName}</h1>
    <div class="divider"></div>
    <div class="score">${score}/100</div>
    <div class="rec">Recommendation: <strong>${data.recommendation?.recommendation || "REVIEW"}</strong></div>
    <div style="margin-top: 60px; color: #999;">${new Date().toLocaleDateString("en-IN")}</div>
  </div>

  <!-- SUMMARY -->
  <div class="page">
    <h2>Executive Summary</h2>
    <p>${typeof data.summaryContent === "string" ? data.summaryContent : "Investment analysis completed."}</p>
    
    <h3>Key Metrics</h3>
    <div class="metrics">
      ${metrics
        .slice(0, 8)
        .map(
          (m: any) => `
        <div class="metric">
          <div class="label">${m.label}</div>
          <div class="value">${m.value}</div>
        </div>
      `
        )
        .join("")}
    </div>
  </div>

 <!-- RISKS -->
  ${
    risks.length > 0
      ? `
    <div class="page">
      <h2>Investment Risks</h2>
      ${risks
        .slice(0, 6)
        .map(
          (r: { label: string; description: string }, i: number) => `
        <div class="risk">
          <div class="risk-title">${i + 1}. ${r.label}</div>
          <div class="risk-text">${r.description || "N/A"}</div>
        </div>
      `
        )
        .join("")}
    </div>
  `
      : ""
  }

  <!-- MARKET -->
  <div class="page">
    <h2>Market & Financial</h2>
    
    ${
      market.marketSize
        ? `
      <h3>Market Sizing</h3>
      <table style="width: 100%; margin: 15px 0;">
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>TAM</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${market.marketSize.TAM || "—"}</td>
        </tr>
        <tr>
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>SAM</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${market.marketSize.SAM || "—"}</td>
        </tr>
        <tr style="background: #f5f5f5;">
          <td style="padding: 10px; border: 1px solid #ddd;"><strong>SOM</strong></td>
          <td style="padding: 10px; border: 1px solid #ddd;">${market.marketSize.SOM || "—"}</td>
        </tr>
      </table>
    `
        : ""
    }

    ${
      market.competitors && market.competitors.length > 0
        ? `
      <h3>Competitors</h3>
      ${market.competitors
        .slice(0, 3)
        .map(
          (c: any) => `
        <div style="margin: 10px 0; padding: 10px; background: #f5f5f5;">
          <strong>${c.name}</strong><br/>
          <span style="font-size: 13px; color: #666;">${c.positioning || ""}</span>
        </div>
      `
        )
        .join("")}
    `
        : ""
    }

    ${
      financial.projections
        ? `
      <h3>Financial Projections</h3>
      <table style="width: 100%; margin: 15px 0;">
        ${financial.projections
          .slice(0, 4)
          .map((p: any) => {
            return `
          <tr>
            <td style="padding: 8px; border: 1px solid #ddd;"><strong>${p.year}</strong></td>
            <td style="padding: 8px; border: 1px solid #ddd;">${p.value}</td>
          </tr>
        `;
          })
          .join("")}
      </table>
    `
        : ""
    }
  </div>

  <div style="text-align: center; font-size: 11px; color: #999; padding: 40px; border-top: 1px solid #ddd; margin-top: 40px;">
    <div>AnalystIQ - Investment Analysis Platform</div>
    <div>Confidential - For Internal Use Only</div>
    <div>${new Date().toLocaleString("en-IN")}</div>
  </div>
</body>
</html>
    `;
  }
}
