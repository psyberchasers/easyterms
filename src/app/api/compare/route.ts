import { NextResponse } from "next/server";
import OpenAI from "openai";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface ContractData {
  id: string;
  title: string;
  analysis: {
    financialTerms?: {
      royaltyRate?: string;
      advanceAmount?: string;
      paymentSchedule?: string;
    };
    termLength?: string;
    keyTerms?: Array<{
      title: string;
      content: string;
      riskLevel: string;
    }>;
    potentialConcerns?: string[];
    overallRiskAssessment?: string;
    summary?: string;
  };
}

interface ComparisonMetric {
  label: string;
  values: (string | number)[];
  winner: number | null;
  higherIsBetter: boolean;
}

export async function POST(request: Request) {
  try {
    const { contracts } = await request.json() as { contracts: ContractData[] };

    if (!contracts || contracts.length < 2) {
      return NextResponse.json(
        { error: "At least 2 contracts required for comparison" },
        { status: 400 }
      );
    }

    // Extract metrics for comparison
    const metrics: ComparisonMetric[] = [];

    // Compare royalty rates
    const royalties = contracts.map((c) => {
      const rate = c.analysis?.financialTerms?.royaltyRate;
      const match = rate?.match(/(\d+(?:\.\d+)?)/);
      return match ? parseFloat(match[1]) : null;
    });
    if (royalties.some((r) => r !== null)) {
      const validRoyalties = royalties.filter((r): r is number => r !== null);
      const maxRoyalty = Math.max(...validRoyalties);
      metrics.push({
        label: "Royalty Rate",
        values: contracts.map((c) => c.analysis?.financialTerms?.royaltyRate || "Not specified"),
        winner: royalties.indexOf(maxRoyalty),
        higherIsBetter: true,
      });
    }

    // Compare advance amounts
    const advances = contracts.map((c) => {
      const amount = c.analysis?.financialTerms?.advanceAmount;
      const match = amount?.match(/\$?([\d,]+)/);
      return match ? parseFloat(match[1].replace(/,/g, "")) : null;
    });
    if (advances.some((a) => a !== null)) {
      const validAdvances = advances.filter((a): a is number => a !== null);
      const maxAdvance = Math.max(...validAdvances);
      metrics.push({
        label: "Advance",
        values: contracts.map((c) => c.analysis?.financialTerms?.advanceAmount || "Not specified"),
        winner: advances.indexOf(maxAdvance),
        higherIsBetter: true,
      });
    }

    // Compare term lengths
    const terms = contracts.map((c) => {
      const term = c.analysis?.termLength;
      const match = term?.match(/(\d+)\s*(year|month)/i);
      if (!match) return null;
      const num = parseInt(match[1]);
      const unit = match[2].toLowerCase();
      return unit === "year" ? num * 12 : num;
    });
    if (terms.some((t) => t !== null)) {
      const validTerms = terms.filter((t): t is number => t !== null);
      const minTerm = Math.min(...validTerms);
      metrics.push({
        label: "Contract Term",
        values: contracts.map((c) => c.analysis?.termLength || "Not specified"),
        winner: terms.indexOf(minTerm),
        higherIsBetter: false,
      });
    }

    // Compare risk levels
    const riskOrder = { low: 1, medium: 2, high: 3 };
    const risks = contracts.map((c) => {
      const risk = c.analysis?.overallRiskAssessment?.toLowerCase();
      return riskOrder[risk as keyof typeof riskOrder] || 2;
    });
    const minRisk = Math.min(...risks);
    metrics.push({
      label: "Risk Level",
      values: contracts.map((c) => c.analysis?.overallRiskAssessment || "Unknown"),
      winner: risks.indexOf(minRisk),
      higherIsBetter: false,
    });

    // Compare number of concerns
    const concernCounts = contracts.map((c) => c.analysis?.potentialConcerns?.length || 0);
    const minConcerns = Math.min(...concernCounts);
    metrics.push({
      label: "Red Flags",
      values: concernCounts.map((c) => `${c} concerns`),
      winner: concernCounts.indexOf(minConcerns),
      higherIsBetter: false,
    });

    // Generate AI summary
    let aiSummary = "";
    let recommendation = "";

    try {
      const contractSummaries = contracts.map((c) => `
**${c.title}**
- Type: ${c.analysis?.financialTerms?.royaltyRate ? "Music Contract" : "Contract"}
- Royalty: ${c.analysis?.financialTerms?.royaltyRate || "Not specified"}
- Advance: ${c.analysis?.financialTerms?.advanceAmount || "Not specified"}
- Term: ${c.analysis?.termLength || "Not specified"}
- Risk Level: ${c.analysis?.overallRiskAssessment || "Unknown"}
- Key Concerns: ${c.analysis?.potentialConcerns?.slice(0, 3).join("; ") || "None identified"}
      `).join("\n---\n");

      const prompt = `You are a music industry contract advisor. Compare these ${contracts.length} contracts and provide:

1. A brief 2-3 sentence summary of which deal is better overall and why
2. A one-sentence actionable recommendation

Contracts:
${contractSummaries}

Respond in JSON format:
{
  "summary": "Your analysis...",
  "recommendation": "Your recommendation..."
}`;

      const completion = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [{ role: "user", content: prompt }],
        response_format: { type: "json_object" },
        max_tokens: 500,
      });

      const result = JSON.parse(completion.choices[0].message.content || "{}");
      aiSummary = result.summary || "";
      recommendation = result.recommendation || "";
    } catch (aiError) {
      console.error("AI comparison error:", aiError);
      // Fall back to basic summary
      const winners = metrics.map((m) => m.winner).filter((w): w is number => w !== null);
      const winCounts = contracts.map((_, i) => winners.filter((w) => w === i).length);
      const overallWinner = winCounts.indexOf(Math.max(...winCounts));

      aiSummary = `Based on ${metrics.length} key metrics, "${contracts[overallWinner].title}" appears to be the stronger offer overall, winning in ${winCounts[overallWinner]} out of ${metrics.length} categories.`;
      recommendation = winCounts[overallWinner] > metrics.length / 2
        ? `The "${contracts[overallWinner].title}" deal looks more favorable. However, consider negotiating the weaker points before signing.`
        : "These deals are fairly balanced. Focus your negotiation on the specific terms that matter most to you.";
    }

    return NextResponse.json({
      metrics,
      aiSummary,
      recommendation,
    });
  } catch (err) {
    console.error("Comparison API error:", err);
    return NextResponse.json(
      { error: "Failed to compare contracts" },
      { status: 500 }
    );
  }
}


