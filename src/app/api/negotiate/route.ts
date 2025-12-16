import { NextResponse } from "next/server";
import OpenAI from "openai";
import { ContractAnalysis } from "@/types/contract";

const openai = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY,
});

interface NegotiateRequest {
  analysis: ContractAnalysis;
  contractTitle?: string;
  concerns: string[];
  highRiskTerms: Array<{
    title: string;
    content: string;
    explanation?: string;
  }>;
}

export async function POST(request: Request) {
  try {
    const body: NegotiateRequest = await request.json();
    const { analysis, contractTitle, concerns, highRiskTerms } = body;

    const counterparty = analysis.parties?.label || analysis.parties?.publisher || "the other party";
    
    const prompt = `You are a music industry negotiation expert helping an artist draft a professional counter-offer email.

Contract Type: ${contractTitle || analysis.contractType || "Music Contract"}
Counterparty: ${counterparty}
Overall Risk: ${analysis.overallRiskAssessment}

High-Risk Terms to Address:
${highRiskTerms.map((t, i) => `${i + 1}. ${t.title}: ${t.content}${t.explanation ? ` (Concern: ${t.explanation})` : ""}`).join("\n")}

Additional Concerns:
${concerns.map((c, i) => `${i + 1}. ${c}`).join("\n")}

Financial Terms:
- Royalty Rate: ${analysis.financialTerms?.royaltyRate || "Not specified"}
- Advance: ${analysis.financialTerms?.advanceAmount || "Not specified"}
- Term: ${analysis.termLength || "Not specified"}

Write a professional, assertive but polite counter-offer email that:
1. Thanks them for the opportunity
2. Addresses the top 2-3 most concerning issues with specific alternative proposals
3. Uses industry-standard language
4. Maintains a collaborative tone while being firm on key points
5. Ends with a clear call to action

Keep it concise (under 400 words). Use [BRACKETS] for any information the artist needs to fill in.`;

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [{ role: "user", content: prompt }],
      max_tokens: 800,
      temperature: 0.7,
    });

    const email = completion.choices[0].message.content || "";

    return NextResponse.json({ email });
  } catch (err) {
    console.error("Negotiate API error:", err);
    return NextResponse.json(
      { error: "Failed to generate negotiation email" },
      { status: 500 }
    );
  }
}

