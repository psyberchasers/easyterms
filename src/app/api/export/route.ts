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

  const riskColor = riskColors[analysis.overallRiskAssessment as keyof typeof riskColors] || "#6b7280";

  return `
<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${title} - EasyTerms Analysis Report</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body {
      font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, sans-serif;
      line-height: 1.6;
      color: #1a1a1a;
      padding: 40px;
      max-width: 900px;
      margin: 0 auto;
    }
    
    /* Header */
    .header {
      display: flex;
      justify-content: space-between;
      align-items: flex-start;
      margin-bottom: 40px;
      padding-bottom: 20px;
      border-bottom: 2px solid #e5e5e5;
    }
    .logo {
      font-size: 24px;
      font-weight: 700;
      color: #7c3aed;
    }
    .generated {
      font-size: 12px;
      color: #666;
    }
    
    /* Title Section */
    .title-section {
      margin-bottom: 30px;
    }
    .contract-title {
      font-size: 28px;
      font-weight: 700;
      margin-bottom: 10px;
    }
    .contract-type {
      font-size: 16px;
      color: #666;
      margin-bottom: 15px;
    }
    
    /* Risk Badge */
    .risk-badge {
      display: inline-block;
      padding: 8px 16px;
      border-radius: 6px;
      font-weight: 600;
      font-size: 14px;
      text-transform: uppercase;
      color: white;
      background: ${riskColor};
    }
    
    /* Summary */
    .summary {
      background: #f8f8f8;
      padding: 20px;
      border-radius: 8px;
      margin-bottom: 30px;
    }
    .summary h2 {
      font-size: 16px;
      margin-bottom: 10px;
      color: #333;
    }
    .summary p {
      font-size: 14px;
      color: #555;
    }
    
    /* Section */
    .section {
      margin-bottom: 30px;
    }
    .section-title {
      font-size: 18px;
      font-weight: 600;
      margin-bottom: 15px;
      padding-bottom: 8px;
      border-bottom: 1px solid #e5e5e5;
    }
    
    /* Grid */
    .grid {
      display: grid;
      grid-template-columns: repeat(2, 1fr);
      gap: 15px;
    }
    .grid-item {
      background: #fafafa;
      padding: 15px;
      border-radius: 6px;
      border: 1px solid #eee;
    }
    .grid-item-label {
      font-size: 12px;
      color: #666;
      text-transform: uppercase;
      margin-bottom: 5px;
    }
    .grid-item-value {
      font-size: 14px;
      font-weight: 500;
    }
    
    /* Key Terms */
    .key-term {
      padding: 15px;
      margin-bottom: 10px;
      border-radius: 6px;
      border-left: 4px solid;
    }
    .key-term.high { border-color: #ef4444; background: #fef2f2; }
    .key-term.medium { border-color: #f59e0b; background: #fffbeb; }
    .key-term.low { border-color: #22c55e; background: #f0fdf4; }
    .key-term-title {
      font-weight: 600;
      margin-bottom: 5px;
    }
    .key-term-content {
      font-size: 14px;
      color: #555;
    }
    .key-term-risk {
      font-size: 11px;
      text-transform: uppercase;
      margin-top: 8px;
      font-weight: 600;
    }
    .key-term.high .key-term-risk { color: #ef4444; }
    .key-term.medium .key-term-risk { color: #f59e0b; }
    .key-term.low .key-term-risk { color: #22c55e; }
    
    /* Concerns */
    .concern {
      display: flex;
      gap: 10px;
      padding: 12px;
      background: #fef2f2;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .concern-icon {
      width: 20px;
      height: 20px;
      background: #ef4444;
      border-radius: 50%;
      display: flex;
      align-items: center;
      justify-content: center;
      color: white;
      font-size: 12px;
      font-weight: bold;
      flex-shrink: 0;
    }
    .concern-text {
      font-size: 14px;
    }
    
    /* Recommendations */
    .recommendation {
      display: flex;
      gap: 10px;
      padding: 12px;
      background: #f0fdf4;
      border-radius: 6px;
      margin-bottom: 8px;
    }
    .recommendation-icon {
      color: #22c55e;
      font-size: 16px;
    }
    .recommendation-text {
      font-size: 14px;
    }
    
    /* Footer */
    .footer {
      margin-top: 50px;
      padding-top: 20px;
      border-top: 1px solid #e5e5e5;
      font-size: 12px;
      color: #999;
      text-align: center;
    }
    .disclaimer {
      margin-top: 10px;
      font-style: italic;
    }
    
    @media print {
      body { padding: 20px; }
      .section { page-break-inside: avoid; }
    }
  </style>
</head>
<body>
  <div class="header">
    <div class="logo">EasyTerms</div>
    <div class="generated">Generated: ${new Date().toLocaleDateString("en-US", { year: "numeric", month: "long", day: "numeric" })}</div>
  </div>

  <div class="title-section">
    <h1 class="contract-title">${title}</h1>
    <div class="contract-type">${analysis.contractType || "Contract Analysis"}</div>
    <span class="risk-badge">${analysis.overallRiskAssessment} Risk</span>
  </div>

  <div class="summary">
    <h2>Executive Summary</h2>
    <p>${analysis.summary || "No summary available."}</p>
  </div>

  ${analysis.parties ? `
  <div class="section">
    <h2 class="section-title">Parties</h2>
    <div class="grid">
      ${analysis.parties.artist ? `<div class="grid-item"><div class="grid-item-label">Artist/Creator</div><div class="grid-item-value">${analysis.parties.artist}</div></div>` : ""}
      ${analysis.parties.label ? `<div class="grid-item"><div class="grid-item-label">Label/Company</div><div class="grid-item-value">${analysis.parties.label}</div></div>` : ""}
      ${analysis.parties.publisher ? `<div class="grid-item"><div class="grid-item-label">Publisher</div><div class="grid-item-value">${analysis.parties.publisher}</div></div>` : ""}
    </div>
  </div>
  ` : ""}

  <div class="section">
    <h2 class="section-title">Financial Terms</h2>
    <div class="grid">
      ${analysis.financialTerms?.royaltyRate ? `<div class="grid-item"><div class="grid-item-label">Royalty Rate</div><div class="grid-item-value">${analysis.financialTerms.royaltyRate}</div></div>` : ""}
      ${analysis.financialTerms?.advanceAmount ? `<div class="grid-item"><div class="grid-item-label">Advance</div><div class="grid-item-value">${analysis.financialTerms.advanceAmount}</div></div>` : ""}
      ${analysis.financialTerms?.paymentSchedule ? `<div class="grid-item"><div class="grid-item-label">Payment Schedule</div><div class="grid-item-value">${analysis.financialTerms.paymentSchedule}</div></div>` : ""}
      ${analysis.termLength ? `<div class="grid-item"><div class="grid-item-label">Contract Term</div><div class="grid-item-value">${analysis.termLength}</div></div>` : ""}
    </div>
  </div>

  ${analysis.keyTerms && analysis.keyTerms.length > 0 ? `
  <div class="section">
    <h2 class="section-title">Key Terms Analysis</h2>
    ${analysis.keyTerms.map((term) => `
      <div class="key-term ${term.riskLevel}">
        <div class="key-term-title">${term.title}</div>
        <div class="key-term-content">${term.explanation || term.content}</div>
        <div class="key-term-risk">${term.riskLevel} Risk</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${analysis.potentialConcerns && analysis.potentialConcerns.length > 0 ? `
  <div class="section">
    <h2 class="section-title">⚠️ Potential Concerns</h2>
    ${analysis.potentialConcerns.map((concern, i) => `
      <div class="concern">
        <div class="concern-icon">${i + 1}</div>
        <div class="concern-text">${concern}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  ${analysis.recommendations && analysis.recommendations.length > 0 ? `
  <div class="section">
    <h2 class="section-title">✅ Recommendations</h2>
    ${analysis.recommendations.map((rec) => `
      <div class="recommendation">
        <div class="recommendation-icon">→</div>
        <div class="recommendation-text">${rec}</div>
      </div>
    `).join("")}
  </div>
  ` : ""}

  <div class="footer">
    <p>Generated by EasyTerms - AI-Powered Contract Analysis</p>
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


