import { NextRequest, NextResponse } from "next/server";
import { ContractAnalysis } from "@/types/contract";

interface ChatMessage {
  role: "user" | "assistant";
  content: string;
}

interface AttachedContract {
  id: string;
  title: string;
  analysis: ContractAnalysis;
}

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { message, analysis, history, attachedContracts } = body as {
      message: string;
      analysis?: ContractAnalysis;
      history?: ChatMessage[];
      attachedContracts?: AttachedContract[];
    };

    if (!message) {
      return NextResponse.json({ error: "No message provided" }, { status: 400 });
    }

    // Build context from analysis
    let systemPrompt = `You are EasyTerms AI, a contract analyst assistant. You help users understand their contracts in plain, direct English. IMPORTANT: You must NEVER mention GPT, ChatGPT, OpenAI, or any other AI company. You are "EasyTerms AI", created by EasyTerms.

CRITICAL RULES:
- NEVER say "likely", "might", "probably", "may contain", or hedge language about the contract. You HAVE the full analysis — state facts directly.
- NEVER ask the user to upload or re-upload a contract if analysis data is present. You already have it.
- When referencing clauses or terms, quote them directly from the data provided.
- Be concise, direct, and confident. The user is trusting you with their career.
- When answering questions that go beyond the contract data (e.g. "is this royalty rate normal?", "what does the law say about this?", "what's standard in the industry?"), USE your broad knowledge of music industry standards, contract law, entertainment law, copyright law, and business practices to give informed, helpful answers. Combine your knowledge with the specific contract data to give the most useful response.
- You are an expert in music business, entertainment law, copyright, publishing, sync licensing, distribution deals, 360 deals, and artist management contracts. Use this expertise freely.`;

    if (analysis) {
      systemPrompt += `

YOU HAVE FULLY ANALYZED THIS CONTRACT. Here is everything you know:

CONTRACT TYPE: ${analysis.contractType || "Unknown"}
RISK LEVEL: ${analysis.overallRiskAssessment?.toUpperCase() || "Unknown"}
TERM LENGTH: ${analysis.termLength || "Not specified"}
EFFECTIVE DATE: ${analysis.effectiveDate || "Not specified"}

SUMMARY:
${analysis.summary || "No summary available"}

PARTIES:
${analysis.parties ? Object.entries(analysis.parties).filter(([, v]) => v && (typeof v === 'string' ? v : (v as string[]).length > 0)).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? (v as string[]).join(", ") : v}`).join("\n") : "Not specified"}

FINANCIAL TERMS:
- Royalty Rate: ${analysis.financialTerms?.royaltyRate || "Not specified"}
- Advance: ${analysis.financialTerms?.advanceAmount || "Not specified"}
- Payment Schedule: ${analysis.financialTerms?.paymentSchedule || "Not specified"}
- Recoupment: ${analysis.financialTerms?.recoupment || "Not specified"}
${analysis.financialTerms?.additionalNotes ? `- Notes: ${analysis.financialTerms.additionalNotes}` : ""}

RIGHTS & OWNERSHIP:
- Master Ownership: ${analysis.rightsAndOwnership?.masterOwnership || "Not specified"}
- Publishing Rights: ${analysis.rightsAndOwnership?.publishingRights || "Not specified"}
- Territorial Rights: ${analysis.rightsAndOwnership?.territorialRights || "Not specified"}
- Exclusivity: ${analysis.rightsAndOwnership?.exclusivity || "Not specified"}
- Reversion: ${analysis.rightsAndOwnership?.reversion || "Not specified"}
${analysis.rightsAndOwnership?.additionalNotes ? `- Notes: ${analysis.rightsAndOwnership.additionalNotes}` : ""}

${analysis.obligationsAndDeliverables ? `OBLIGATIONS & DELIVERABLES:
${analysis.obligationsAndDeliverables.artistObligations?.length ? `Artist Obligations:\n${analysis.obligationsAndDeliverables.artistObligations.map(o => `  - ${o}`).join("\n")}` : ""}
${analysis.obligationsAndDeliverables.labelObligations?.length ? `Label/Company Obligations:\n${analysis.obligationsAndDeliverables.labelObligations.map(o => `  - ${o}`).join("\n")}` : ""}
${analysis.obligationsAndDeliverables.deliverables?.length ? `Deliverables:\n${analysis.obligationsAndDeliverables.deliverables.map(d => `  - ${d}`).join("\n")}` : ""}
${analysis.obligationsAndDeliverables.timeline ? `Timeline: ${analysis.obligationsAndDeliverables.timeline}` : ""}` : ""}

ALL KEY TERMS/CLAUSES FOUND (${analysis.keyTerms?.length || 0} total):
${analysis.keyTerms?.map((t, i) => `${i + 1}. [${t.riskLevel?.toUpperCase()} RISK] ${t.title}
   Content: ${t.content}
   Explanation: ${t.explanation}${t.originalText ? `\n   Original text: "${t.originalText}"` : ""}${t.actionItems?.length ? `\n   Action items: ${t.actionItems.join("; ")}` : ""}`).join("\n\n") || "None found"}

POTENTIAL CONCERNS (${analysis.potentialConcerns?.length || 0}):
${analysis.potentialConcerns?.map((c, i) => `${i + 1}. ${c}${analysis.concernExplanations?.[i] ? ` — ${analysis.concernExplanations[i]}` : ""}`).join("\n") || "None"}

${analysis.missingClauses?.length ? `MISSING CLAUSES:
${analysis.missingClauses.map(mc => `- [${mc.severity.toUpperCase()}] ${mc.clause}: ${mc.description}`).join("\n")}` : ""}

RECOMMENDATIONS:
${analysis.recommendations?.map((r, i) => {
  if (typeof r === 'string') return `${i + 1}. ${r}`;
  return `${i + 1}. [${r.priority?.toUpperCase()}] ${r.advice}
   Rationale: ${r.rationale}
   How to implement: ${r.howToImplement}${r.riskIfIgnored ? `\n   Risk if ignored: ${r.riskIfIgnored}` : ""}${r.sampleLanguage ? `\n   Suggested language: "${r.sampleLanguage}"` : ""}`;
}).join("\n\n") || "None"}

CONFIDENCE: ${analysis.confidenceScore ? `${Math.round(analysis.confidenceScore * 100)}%` : "N/A"}

You have ALL of this data. Answer questions about this contract DIRECTLY and DEFINITIVELY. Never say you need to see the contract — you already have the full analysis.`;
    } else {
      systemPrompt += `

The user hasn't uploaded a contract yet. You can:
- Encourage them to drop a contract file for analysis
- Answer general questions about contract terms
- Explain what types of files you accept (PDF, Word, TXT)
- Discuss what to look for in music/entertainment contracts`;
    }

    // Add attached contracts context — full detail just like the main analysis
    if (attachedContracts && attachedContracts.length > 0) {
      systemPrompt += `

The user has attached ${attachedContracts.length} contract(s). You have FULL analysis data for each:`;

      for (const contract of attachedContracts) {
        const a = contract.analysis;
        systemPrompt += `

=== CONTRACT: "${contract.title}" ===
CONTRACT TYPE: ${a.contractType || "Unknown"}
RISK LEVEL: ${a.overallRiskAssessment?.toUpperCase() || "Unknown"}
TERM LENGTH: ${a.termLength || "Not specified"}
EFFECTIVE DATE: ${a.effectiveDate || "Not specified"}

SUMMARY: ${a.summary || "No summary available"}

PARTIES:
${a.parties ? Object.entries(a.parties).filter(([, v]) => v && (typeof v === 'string' ? v : (v as string[]).length > 0)).map(([k, v]) => `- ${k}: ${Array.isArray(v) ? (v as string[]).join(", ") : v}`).join("\n") : "Not specified"}

FINANCIAL TERMS:
- Royalty Rate: ${a.financialTerms?.royaltyRate || "Not specified"}
- Advance: ${a.financialTerms?.advanceAmount || "Not specified"}
- Payment Schedule: ${a.financialTerms?.paymentSchedule || "Not specified"}
- Recoupment: ${a.financialTerms?.recoupment || "Not specified"}

RIGHTS & OWNERSHIP:
- Master Ownership: ${a.rightsAndOwnership?.masterOwnership || "Not specified"}
- Publishing Rights: ${a.rightsAndOwnership?.publishingRights || "Not specified"}
- Territorial Rights: ${a.rightsAndOwnership?.territorialRights || "Not specified"}
- Exclusivity: ${a.rightsAndOwnership?.exclusivity || "Not specified"}
- Reversion: ${a.rightsAndOwnership?.reversion || "Not specified"}

${a.obligationsAndDeliverables ? `OBLIGATIONS:
${a.obligationsAndDeliverables.artistObligations?.length ? `Artist: ${a.obligationsAndDeliverables.artistObligations.join("; ")}` : ""}
${a.obligationsAndDeliverables.labelObligations?.length ? `Company: ${a.obligationsAndDeliverables.labelObligations.join("; ")}` : ""}` : ""}

ALL KEY TERMS/CLAUSES (${a.keyTerms?.length || 0}):
${a.keyTerms?.map((t, i) => `${i + 1}. [${t.riskLevel?.toUpperCase()}] ${t.title}: ${t.content}${t.explanation ? ` — ${t.explanation}` : ""}${t.originalText ? ` (Original: "${t.originalText}")` : ""}`).join("\n") || "None"}

CONCERNS (${a.potentialConcerns?.length || 0}):
${a.potentialConcerns?.map((c, i) => `${i + 1}. ${c}${a.concernExplanations?.[i] ? ` — ${a.concernExplanations[i]}` : ""}`).join("\n") || "None"}

${a.missingClauses?.length ? `MISSING CLAUSES:
${a.missingClauses.map(mc => `- [${mc.severity.toUpperCase()}] ${mc.clause}: ${mc.description}`).join("\n")}` : ""}

RECOMMENDATIONS:
${a.recommendations?.map((r, i) => {
  if (typeof r === 'string') return `${i + 1}. ${r}`;
  return `${i + 1}. [${r.priority?.toUpperCase()}] ${r.advice}: ${r.rationale}`;
}).join("\n") || "None"}
=== END CONTRACT ===`;
      }

      systemPrompt += `

You have ALL of this data. Answer questions about these contracts DIRECTLY. Never hedge or say "likely" — you know exactly what's in them. When the user asks about clauses, list the actual key terms found. If they ask to compare, highlight specific differences.`;
    }

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return helpful mock response
      let mockResponses: string[];

      if (attachedContracts && attachedContracts.length > 0) {
        const contractNames = attachedContracts.map(c => c.title).join(", ");
        mockResponses = [
          `I can see you've attached ${attachedContracts.length} contract(s): ${contractNames}. What would you like to know about them?`,
          `Looking at ${contractNames}, I can help you understand the key terms, compare them, or answer specific questions.`,
        ];
      } else if (analysis) {
        mockResponses = [
          `Based on my analysis of your ${analysis.contractType || "contract"}, ${analysis.summary?.split(".")[0] || "this appears to be a standard agreement"}.`,
          `Looking at this contract, the ${analysis.overallRiskAssessment || "overall"} risk level is primarily due to ${analysis.potentialConcerns?.[0] || "standard industry terms"}.`,
          `The key financial terms show ${analysis.financialTerms?.royaltyRate || "typical royalty structures"}. I'd recommend ${analysis.recommendations?.[0] && (typeof analysis.recommendations[0] === 'object' ? analysis.recommendations[0].advice : analysis.recommendations[0]) || "reviewing all terms carefully"}.`,
        ];
      } else {
        mockResponses = [
          "Drop a contract and I'll analyze it for you! I can identify key terms, risks, and give you recommendations.",
          "I can analyze PDFs, Word docs, and text files. Just drag and drop a contract to get started!",
          "You can also use the @ symbol or Attach button to reference your existing contracts.",
        ];
      }

      return NextResponse.json({
        response: mockResponses[Math.floor(Math.random() * mockResponses.length)],
      });
    }

    // Build messages array
    const messages: Array<{ role: "system" | "user" | "assistant"; content: string }> = [
      { role: "system", content: systemPrompt },
    ];

    // Add conversation history
    if (history?.length) {
      for (const msg of history.slice(-6)) {
        messages.push({
          role: msg.role,
          content: msg.content,
        });
      }
    }

    // Add current message
    messages.push({ role: "user", content: message });

    // Dynamic import OpenAI only when needed
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Use Responses API with web search for richer answers
    const response = await openai.responses.create({
      model: "gpt-4o-mini",
      instructions: systemPrompt,
      input: messages.slice(1).map(m => ({
        role: m.role as "user" | "assistant",
        content: m.content,
      })),
      tools: [{ type: "web_search_preview" as const }],
      temperature: 0.5,
      max_output_tokens: 1000,
    });

    const responseText = response.output_text;
    if (!responseText) {
      throw new Error("No response from AI");
    }

    return NextResponse.json({ response: responseText });
  } catch (error) {
    console.error("Chat error:", error);
    return NextResponse.json(
      { error: "Failed to process message. Please try again." },
      { status: 500 }
    );
  }
}
