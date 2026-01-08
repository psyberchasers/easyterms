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
    let systemPrompt = `You are EasyTerms, an AI contract analyst assistant built by EasyTerms. You help users understand their contracts in plain English. IMPORTANT: You must NEVER mention GPT, ChatGPT, OpenAI, or any other AI company. If asked who you are or what you're built with, say you are "EasyTerms AI" or "EasyTerms contract assistant". You were created by EasyTerms to help musicians and artists understand their contracts.`;

    if (analysis) {
      systemPrompt += `

You have already analyzed a contract with the following details:

Contract Type: ${analysis.contractType || "Unknown"}
Risk Level: ${analysis.overallRiskAssessment || "Unknown"}
Term Length: ${analysis.termLength || "Not specified"}

Summary: ${analysis.summary || "No summary available"}

${analysis.financialTerms ? `Financial Terms:
- Royalty Rate: ${analysis.financialTerms.royaltyRate || "Not specified"}
- Advance: ${analysis.financialTerms.advanceAmount || "Not specified"}
- Payment Schedule: ${analysis.financialTerms.paymentSchedule || "Not specified"}` : ""}

${analysis.potentialConcerns?.length ? `Key Concerns:
${analysis.potentialConcerns.map((c, i) => `${i + 1}. ${c}`).join("\n")}` : ""}

${analysis.recommendations?.length ? `Recommendations:
${analysis.recommendations.map((r, i) => {
  const advice = typeof r === 'object' ? r.advice : r;
  return `${i + 1}. ${advice}`;
}).join("\n")}` : ""}

${analysis.keyTerms?.length ? `Key Terms Found:
${analysis.keyTerms.slice(0, 5).map(t => `- ${t.title}: ${t.content} (Risk: ${t.riskLevel})`).join("\n")}` : ""}

Answer the user's questions about this specific contract. Be helpful, accurate, and explain things in plain English. If asked about something not in the contract, say so clearly.`;
    } else {
      systemPrompt += `

The user hasn't uploaded a contract yet. Encourage them to drop a contract file so you can analyze it and answer specific questions about it.

You can help with general questions about:
- How contract analysis works
- What types of files you can analyze (PDF, Word, TXT)
- What to look for in music contracts
- General contract terms and their meanings`;
    }

    // Add attached contracts context
    if (attachedContracts && attachedContracts.length > 0) {
      systemPrompt += `

The user has attached ${attachedContracts.length} contract(s) for reference:`;

      for (const contract of attachedContracts) {
        const a = contract.analysis;
        systemPrompt += `

--- CONTRACT: "${contract.title}" ---
Contract Type: ${a.contractType || "Unknown"}
Risk Level: ${a.overallRiskAssessment || "Unknown"}
Term Length: ${a.termLength || "Not specified"}
Summary: ${a.summary || "No summary available"}
${a.financialTerms ? `Financial Terms:
- Royalty Rate: ${a.financialTerms.royaltyRate || "Not specified"}
- Advance: ${a.financialTerms.advanceAmount || "Not specified"}` : ""}
${a.potentialConcerns?.length ? `Key Concerns: ${a.potentialConcerns.slice(0, 3).join("; ")}` : ""}
--- END CONTRACT ---`;
      }

      systemPrompt += `

When the user asks about their contracts, reference the specific contract(s) by name. If they ask to compare contracts, highlight the differences between them.`;
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

    const completion = await openai.chat.completions.create({
      model: "gpt-4o-mini",
      messages,
      temperature: 0.7,
      max_tokens: 500,
    });

    const responseText = completion.choices[0]?.message?.content;
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
