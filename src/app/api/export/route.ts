import { NextResponse } from "next/server";
import { ContractAnalysis } from "@/types/contract";

// Generate HTML report that can be printed to PDF
function generateReportHTML(
  title: string,
  analysis: ContractAnalysis,
  extractedText?: string
): string {
  const riskColors = {
    high: "#ef4444",
    medium: "#f59e0b",
    low: "#22c55e",
  };

  const riskBgColors = {
    high: "rgba(239, 68, 68, 0.1)",
    medium: "rgba(245, 158, 11, 0.1)",
    low: "rgba(34, 197, 94, 0.1)",
  };

  const riskBorderColors = {
    high: "rgba(239, 68, 68, 0.3)",
    medium: "rgba(245, 158, 11, 0.3)",
    low: "rgba(34, 197, 94, 0.3)",
  };

  const riskLevel = analysis.overallRiskAssessment as keyof typeof riskColors || "medium";
  const riskColor = riskColors[riskLevel] || "#6b7280";
  const riskBg = riskBgColors[riskLevel] || "rgba(107, 114, 128, 0.1)";
  const riskBorder = riskBorderColors[riskLevel] || "rgba(107, 114, 128, 0.3)";
  const primaryColor = "#facc15"; // Yellow primary

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - EasyTerms Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, 'Helvetica Neue', sans-serif;
      line-height: 1.6;
      color: #e5e5e5;
      background: #0a0a0a;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }

    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: center;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 1px solid #262626;
    }
    .logo {
      font-size: 20px;
      font-weight: 600;
      color: ${primaryColor};
      letter-spacing: -0.02em;
    }
    .header-meta {
      text-align: right;
    }
    .generated {
      font-size: 11px;
      color: #525252;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }
    .confidence {
      font-size: 12px;
      color: #737373;
      margin-top: 4px;
    }

    /* Title Section */
    .title-section {
      margin-bottom: 32px;
    }
    .contract-title {
      font-size: 28px;
      font-weight: 600;
      color: #ffffff;
      margin-bottom: 8px;
      letter-spacing: -0.02em;
    }
    .contract-meta {
      display: flex;
      align-items: center;
      gap: 16px;
      flex-wrap: wrap;
    }
    .contract-type {
      font-size: 13px;
      color: #737373;
    }
    .industry-badge {
      font-size: 11px;
      color: #a3a3a3;
      padding: 4px 10px;
      background: #171717;
      border: 1px solid #262626;
      text-transform: uppercase;
      letter-spacing: 0.05em;
    }

    /* Risk Badge */
    .risk-badge {
      display: inline-flex;
      align-items: center;
      gap: 8px;
      padding: 10px 16px;
      font-weight: 500;
      font-size: 13px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      color: ${riskColor};
      background: ${riskBg};
      border: 1px solid ${riskBorder};
      margin-top: 16px;
    }
    .risk-dot {
      width: 8px;
      height: 8px;
      background: ${riskColor};
    }

    /* Summary */
    .summary {
      background: #0f0f0f;
      padding: 24px;
      border: 1px solid #262626;
      margin-bottom: 32px;
    }
    .summary h2 {
      font-size: 11px;
      margin-bottom: 12px;
      color: #737373;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      font-weight: 500;
    }
    .summary p {
      font-size: 14px;
      color: #d4d4d4;
      line-height: 1.7;
    }

    /* Section */
    .section {
      margin-bottom: 32px;
    }
    .section-title {
      font-size: 11px;
      font-weight: 500;
      margin-bottom: 16px;
      padding-bottom: 12px;
      border-bottom: 1px solid #262626;
      color: #737373;
      text-transform: uppercase;
      letter-spacing: 0.1em;
    }

    /* Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 12px;
    }
    .grid-3 {
      grid-template-columns: repeat(3, 1fr);
    }
    .grid-item {
      background: #0f0f0f;
      padding: 16px;
      border: 1px solid #262626;
    }
    .grid-item-label {
      font-size: 10px;
      color: #525252;
      text-transform: uppercase;
      letter-spacing: 0.1em;
      margin-bottom: 6px;
    }
    .grid-item-value {
      font-size: 14px;
      font-weight: 500;
      color: #e5e5e5;
    }

    /* Key Terms */
    .key-term {
      padding: 16px;
      margin-bottom: 12px;
      border: 1px solid;
      background: #0f0f0f;
    }
    .key-term.high {
      border-color: rgba(239, 68, 68, 0.3);
      border-left: 3px solid #ef4444;
    }
    .key-term.medium {
      border-color: rgba(245, 158, 11, 0.3);
      border-left: 3px solid #f59e0b;
    }
    .key-term.low {
      border-color: rgba(34, 197, 94, 0.3);
      border-left: 3px solid #22c55e;
    }
    .key-term-header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 8px;
    }
    .key-term-title {
      font-weight: 500;
      font-size: 14px;
      color: #ffffff;
    }
    .key-term-risk {
      font-size: 10px;
      text-transform: uppercase;
      font-weight: 500;
      letter-spacing: 0.05em;
      padding: 3px 8px;
    }
    .key-term.high .key-term-risk { color: #ef4444; background: rgba(239, 68, 68, 0.1); }
    .key-term.medium .key-term-risk { color: #f59e0b; background: rgba(245, 158, 11, 0.1); }
    .key-term.low .key-term-risk { color: #22c55e; background: rgba(34, 197, 94, 0.1); }
    .key-term-content {
      font-size: 13px;
      color: #a3a3a3;
      line-height: 1.6;
    }
    .key-term-original {
      margin-top: 12px;
      padding: 12px;
      background: #0a0a0a;
      border-left: 2px solid #262626;
      font-size: 12px;
      color: #737373;
      font-style: italic;
    }
    .key-term-original-label {
      font-size: 10px;
      color: #525252;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      margin-bottom: 6px;
      font-style: normal;
    }

    /* Concerns */
    .concern {
      display: flex;
      gap: 12px;
      padding: 14px;
      background: rgba(239, 68, 68, 0.05);
      border: 1px solid rgba(239, 68, 68, 0.2);
      margin-bottom: 8px;
    }
    .concern-icon {
      width: 20px;
      height: 20px;
      background: rgba(239, 68, 68, 0.2);
      display: flex;
      align-items: center;
      justify-content: center;
      color: #ef4444;
      font-size: 11px;
      font-weight: 600;
      flex-shrink: 0;
    }
    .concern-text {
      font-size: 13px;
      color: #d4d4d4;
      line-height: 1.5;
    }

    /* Missing Clauses */
    .missing-clause {
      display: flex;
      gap: 12px;
      padding: 14px;
      background: #0f0f0f;
      border: 1px solid #262626;
      margin-bottom: 8px;
    }
    .missing-clause.critical {
      border-color: rgba(239, 68, 68, 0.3);
    }
    .missing-clause.high {
      border-color: rgba(245, 158, 11, 0.3);
    }
    .missing-clause.medium {
      border-color: rgba(250, 204, 21, 0.3);
    }
    .missing-clause-severity {
      font-size: 10px;
      text-transform: uppercase;
      letter-spacing: 0.05em;
      padding: 2px 6px;
      flex-shrink: 0;
    }
    .missing-clause.critical .missing-clause-severity {
      color: #ef4444;
      background: rgba(239, 68, 68, 0.1);
    }
    .missing-clause.high .missing-clause-severity {
      color: #f59e0b;
      background: rgba(245, 158, 11, 0.1);
    }
    .missing-clause.medium .missing-clause-severity {
      color: ${primaryColor};
      background: rgba(250, 204, 21, 0.1);
    }
    .missing-clause-content {
      flex: 1;
    }
    .missing-clause-title {
      font-size: 13px;
      font-weight: 500;
      color: #e5e5e5;
      margin-bottom: 4px;
    }
    .missing-clause-desc {
      font-size: 12px;
      color: #737373;
    }

    /* Recommendations */
    .recommendation {
      display: flex;
      gap: 12px;
      padding: 14px;
      background: rgba(34, 197, 94, 0.05);
      border: 1px solid rgba(34, 197, 94, 0.2);
      margin-bottom: 8px;
    }
    .recommendation-icon {
      color: #22c55e;
      font-size: 14px;
      flex-shrink: 0;
    }
    .recommendation-text {
      font-size: 13px;
      color: #d4d4d4;
      line-height: 1.5;
    }

    /* Footer */
    .footer {
      margin-top: 48px;
      padding-top: 24px;
      border-top: 1px solid #262626;
      text-align: center;
    }
    .footer-brand {
      font-size: 12px;
      color: #525252;
      margin-bottom: 8px;
    }
    .footer-brand span {
      color: ${primaryColor};
    }
    .disclaimer {
      font-size: 11px;
      color: #404040;
      line-height: 1.6;
      max-width: 600px;
      margin: 0 auto;
    }

    /* Print styles */
    @media print {
      body {
        padding: 20px;
        background: white;
        color: #1a1a1a;
      }
      .header { border-color: #e5e5e5; }
      .logo { color: #1a1a1a; }
      .summary, .grid-item, .key-term, .missing-clause {
        background: #f8f8f8;
        border-color: #e5e5e5;
      }
      .section-title { border-color: #e5e5e5; color: #666; }
      .contract-title, .key-term-title, .missing-clause-title { color: #1a1a1a; }
      .grid-item-value, .concern-text, .recommendation-text { color: #333; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">EasyTerms</div>
    <div class="header-meta">
      <div class="generated">Generated ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "short", day: "numeric" })}</div>
      ${analysis.confidenceScore ? `<div class="confidence">${Math.round(analysis.confidenceScore * 100)}% Analysis Confidence</div>` : ""}
    </div>
  </div>

  <div class="title-section">
    <h1 class="contract-title">${title}</h1>
    <div class="contract-meta">
      <span class="contract-type">${analysis.contractType || "Contract Analysis"}</span>
    </div>
    <div class="risk-badge">
      <span class="risk-dot"></span>
      ${analysis.overallRiskAssessment} Risk Assessment
    </div>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <p>${analysis.summary || "No summary available."}</p>
  </div>

  ${analysis.parties ? `
  <div class="section">
    <h2 class="section-title">Parties Involved</h2>
    <div class="grid">
      ${analysis.parties.artist ? `<div class="grid-item"><div class="grid-item-label">Artist / Creator</div><div class="grid-item-value">${analysis.parties.artist}</div></div>` : ""}
      ${analysis.parties.label ? `<div class="grid-item"><div class="grid-item-label">Label / Company</div><div class="grid-item-value">${analysis.parties.label}</div></div>` : ""}
      ${analysis.parties.publisher ? `<div class="grid-item"><div class="grid-item-label">Publisher</div><div class="grid-item-value">${analysis.parties.publisher}</div></div>` : ""}
      ${analysis.parties.producer ? `<div class="grid-item"><div class="grid-item-label">Producer</div><div class="grid-item-value">${analysis.parties.producer}</div></div>` : ""}
      ${analysis.parties.manager ? `<div class="grid-item"><div class="grid-item-label">Manager</div><div class="grid-item-value">${analysis.parties.manager}</div></div>` : ""}
    </div>
  </div>
  ` : ""}

  <div class="section">
    <h2 class="section-title">Contract Overview</h2>
    <div class="grid grid-3">
      ${analysis.termLength ? `<div class="grid-item"><div class="grid-item-label">Term Length</div><div class="grid-item-value">${analysis.termLength}</div></div>` : ""}
      ${analysis.territory ? `<div class="grid-item"><div class="grid-item-label">Territory</div><div class="grid-item-value">${analysis.territory}</div></div>` : ""}
      ${analysis.exclusivity ? `<div class="grid-item"><div class="grid-item-label">Exclusivity</div><div class="grid-item-value">${analysis.exclusivity}</div></div>` : ""}
    </div>
  </div>

  ${analysis.financialTerms ? `
  <div class="section">
    <h2 class="section-title">Financial Terms</h2>
    <div class="grid">
      ${analysis.financialTerms.royaltyRate ? `<div class="grid-item"><div class="grid-item-label">Royalty Rate</div><div class="grid-item-value">${analysis.financialTerms.royaltyRate}</div></div>` : ""}
      ${analysis.financialTerms.advanceAmount ? `<div class="grid-item"><div class="grid-item-label">Advance</div><div class="grid-item-value">${analysis.financialTerms.advanceAmount}</div></div>` : ""}
      ${analysis.financialTerms.paymentSchedule ? `<div class="grid-item"><div class="grid-item-label">Payment Schedule</div><div class="grid-item-value">${analysis.financialTerms.paymentSchedule}</div></div>` : ""}
      ${analysis.financialTerms.recoupment ? `<div class="grid-item"><div class="grid-item-label">Recoupment</div><div class="grid-item-value">${analysis.financialTerms.recoupment}</div></div>` : ""}
      ${analysis.financialTerms.mechanicalRate ? `<div class="grid-item"><div class="grid-item-label">Mechanical Rate</div><div class="grid-item-value">${analysis.financialTerms.mechanicalRate}</div></div>` : ""}
      ${analysis.financialTerms.syncFees ? `<div class="grid-item"><div class="grid-item-label">Sync Fees</div><div class="grid-item-value">${analysis.financialTerms.syncFees}</div></div>` : ""}
    </div>
  </div>
  ` : ""}

  ${analysis.rightsGranted ? `
  <div class="section">
    <h2 class="section-title">Rights Granted</h2>
    <div class="grid">
      ${analysis.rightsGranted.masterRights !== undefined ? `<div class="grid-item"><div class="grid-item-label">Master Rights</div><div class="grid-item-value">${analysis.rightsGranted.masterRights ? "Granted" : "Retained"}</div></div>` : ""}
      ${analysis.rightsGranted.publishingRights !== undefined ? `<div class="grid-item"><div class="grid-item-label">Publishing Rights</div><div class="grid-item-value">${analysis.rightsGranted.publishingRights ? "Granted" : "Retained"}</div></div>` : ""}
      ${analysis.rightsGranted.syncRights !== undefined ? `<div class="grid-item"><div class="grid-item-label">Sync Rights</div><div class="grid-item-value">${analysis.rightsGranted.syncRights ? "Granted" : "Retained"}</div></div>` : ""}
      ${analysis.rightsGranted.merchandisingRights !== undefined ? `<div class="grid-item"><div class="grid-item-label">Merchandising</div><div class="grid-item-value">${analysis.rightsGranted.merchandisingRights ? "Granted" : "Retained"}</div></div>` : ""}
    </div>
  </div>
  ` : ""}

  ${analysis.potentialConcerns && analysis.potentialConcerns.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Potential Concerns</h2>
    ${analysis.potentialConcerns.map((concern, i) => `
      <div class="concern">
        <div class="concern-icon">${i + 1}</div>
        <div class="concern-text">${concern}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${analysis.missingClauses && analysis.missingClauses.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Missing Clauses</h2>
    ${analysis.missingClauses.map((clause) => `
      <div class="missing-clause ${clause.severity}">
        <span class="missing-clause-severity">${clause.severity}</span>
        <div class="missing-clause-content">
          <div class="missing-clause-title">${clause.clause}</div>
          <div class="missing-clause-desc">${clause.description}</div>
        </div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${analysis.keyTerms && analysis.keyTerms.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Key Terms Analysis</h2>
    ${analysis.keyTerms.map((term) => `
      <div class="key-term ${term.riskLevel}">
        <div class="key-term-header">
          <div class="key-term-title">${term.title}</div>
          <span class="key-term-risk">${term.riskLevel}</span>
        </div>
        <div class="key-term-content">${term.explanation || term.content}</div>
        ${term.originalText ? `
          <div class="key-term-original">
            <div class="key-term-original-label">Original Contract Text</div>
            "${term.originalText}"
          </div>
        ` : ""}
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${analysis.recommendations && analysis.recommendations.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Recommendations</h2>
    ${analysis.recommendations.map((rec) => `
      <div class="recommendation">
        <div class="recommendation-icon">→</div>
        <div class="recommendation-text">${rec}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="footer">
    <p class="footer-brand">Generated by <span>EasyTerms</span> — AI-Powered Contract Analysis</p>
    <p class="disclaimer">This report is for informational purposes only and does not constitute legal advice. Always consult with a qualified attorney before signing any contract.</p>
  </div>
</body>
</html>
  `.trim();
}

export async function POST(request: Request) {
  try {
    const { title, analysis, format } = await request.json();

    if (!analysis) {
      return NextResponse.json(
        { error: "Analysis data is required" },
        { status: 400 }
      );
    }

    const html = generateReportHTML(title || "Contract Analysis", analysis);

    if (format === "html") {
      return new NextResponse(html, {
        headers: {
          "Content-Type": "text/html",
          "Content-Disposition": `attachment; filename="${title || "contract"}-report.html"`,
        },
      });
    }

    // Default: return HTML for browser printing to PDF
    return new NextResponse(html, {
      headers: {
        "Content-Type": "text/html",
      },
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json(
      { error: "Failed to generate report" },
      { status: 500 }
    );
  }
}





