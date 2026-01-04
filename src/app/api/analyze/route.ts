import { NextRequest, NextResponse } from "next/server";
import { ContractAnalysis } from "@/types/contract";
import { IndustryType } from "@/config/industries";
import { getAnalysisPrompt, getOutputSchema } from "@/config/analysis-prompts";

async function extractTextFromPDF(data: Uint8Array): Promise<string> {
  // Use unpdf which works well in Node.js/Next.js environments
  const { extractText } = await import("unpdf");
  
  const { text } = await extractText(data, { mergePages: true });
  return text;
}

async function extractTextFromFile(
  buffer: Buffer,
  mimeType: string
): Promise<string> {
  if (mimeType === "application/pdf") {
    try {
      const uint8Array = new Uint8Array(buffer);
      return await extractTextFromPDF(uint8Array);
    } catch (pdfError) {
      console.error("PDF parsing error:", pdfError);
      throw new Error("Failed to parse PDF. The file may be corrupted, password-protected, or contain only images.");
    }
  } else if (
    mimeType ===
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
    mimeType === "application/msword"
  ) {
    const mammoth = await import("mammoth");
    const result = await mammoth.extractRawText({ buffer });
    return result.value;
  } else if (mimeType === "text/plain") {
    return buffer.toString("utf-8");
  }
  throw new Error("Unsupported file type");
}

const ANALYSIS_PROMPT = `You are an expert music industry contract analyst and entertainment lawyer. Analyze the following music contract and provide a comprehensive breakdown in JSON format.

Your analysis should be thorough, accurate, and helpful for artists who may not have legal expertise. Focus on:
1. Identifying the type of contract (recording agreement, publishing deal, management contract, sync license, etc.)
2. Extracting all financial terms
3. Identifying rights and ownership clauses
4. Spotting potentially problematic clauses
5. Providing actionable recommendations
6. Breaking down each paragraph into plain English

Respond ONLY with valid JSON matching this structure:
{
  "summary": "A 2-3 paragraph executive summary of the contract in plain English",
  "contractType": "The type of music contract",
  "parties": {
    "artist": "Artist/band name if mentioned",
    "label": "Record label if applicable",
    "publisher": "Publisher if applicable",
    "other": ["Any other parties"]
  },
  "effectiveDate": "Contract effective date if mentioned",
  "termLength": "Duration of the contract",
  "keyTerms": [
    {
      "title": "Term name",
      "content": "Exact or paraphrased contract language",
      "importance": "critical|important|standard",
      "riskLevel": "high|medium|low",
      "explanation": "Plain English explanation of what this means for the artist",
      "originalText": "EXACT quote from the contract (10-50 words) that this term refers to - must be verbatim from the contract",
      "actionItems": ["Specific action item 1 for this term", "Specific action item 2", "Specific action item 3"]
    }
  ],
  "financialTerms": {
    "advanceAmount": "Any advance payments mentioned",
    "royaltyRate": "Royalty percentages and structure",
    "recoupment": "What costs are recoupable and how",
    "paymentSchedule": "When and how payments are made",
    "additionalNotes": "Other financial considerations"
  },
  "rightsAndOwnership": {
    "masterOwnership": "Who owns the master recordings",
    "publishingRights": "Publishing rights breakdown",
    "territorialRights": "Geographic scope of the agreement",
    "termLength": "How long rights are retained",
    "exclusivity": "Exclusivity provisions",
    "additionalNotes": "Other rights considerations"
  },
  "obligationsAndDeliverables": {
    "artistObligations": ["List of artist obligations"],
    "labelObligations": ["List of label/publisher obligations"],
    "deliverables": ["Required deliverables"],
    "timeline": "Timeline for deliverables"
  },
  "potentialConcerns": [
    "Short title of a potentially problematic clause"
  ],
  "concernExplanations": [
    "Plain English explanation of why this concern matters and what it means for you - one sentence, easy to understand"
  ],
  "concernSnippets": [
    "EXACT quote from the contract for each concern - must be verbatim text that can be found and highlighted"
  ],
  "recommendations": [
    {
      "advice": "Specific actionable recommendation",
      "rationale": "Why this matters for THIS specific contract, citing industry standards where relevant",
      "priority": "high|medium|low",
      "howToImplement": "Concrete steps to take or language to propose"
    }
  ],
  "overallRiskAssessment": "high|medium|low",
  "confidenceScore": 0.85,
  "paragraphBreakdown": [
    {
      "original": "The exact paragraph text from the contract",
      "plainEnglish": "What this paragraph means in simple everyday language",
      "keyPoints": ["Main point 1", "Main point 2"],
      "riskLevel": "high|medium|low|none"
    }
  ]
}

Important guidelines:
- If certain information is not present in the contract, use null or omit the field
- Be conservative with risk assessments - flag anything that could disadvantage the artist
- The confidenceScore should reflect how complete and clear the contract text was (0-1)
- Always explain legal jargon in plain English
- Focus on music industry-specific concerns (360 deals, perpetual rights, cross-collateralization, etc.)
- For originalText and concernSnippets, use EXACT quotes from the contract that can be found via text search
- For paragraphBreakdown, cover ALL significant paragraphs in the contract, breaking down the legal language

CONTRACT TEXT:
`;

export async function POST(request: NextRequest) {
  try {
    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const industryParam = formData.get("industry") as string | null;
    const industry: IndustryType = (industryParam as IndustryType) || "music";

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Validate file type
    const allowedTypes = [
      "application/pdf",
      "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
      "application/msword",
      "text/plain",
    ];

    if (!allowedTypes.includes(file.type)) {
      return NextResponse.json(
        { error: "Unsupported file type. Please upload a PDF, Word document, or text file." },
        { status: 400 }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400 }
      );
    }

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    let contractText: string;

    try {
      contractText = await extractTextFromFile(buffer, file.type);
    } catch {
      return NextResponse.json(
        { error: "Failed to parse file. Please ensure it's a valid document." },
        { status: 400 }
      );
    }

    if (!contractText || contractText.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from the file. Please ensure the document contains readable text." },
        { status: 400 }
      );
    }

    // Truncate if too long (OpenAI has token limits)
    const maxChars = 50000;
    if (contractText.length > maxChars) {
      contractText = contractText.substring(0, maxChars) + "\n\n[Document truncated due to length...]";
    }

    // Build industry-specific prompt
    const industryPrompt = getAnalysisPrompt(industry);
    const outputSchema = getOutputSchema(industry);
    const fullPrompt = `${industryPrompt}

Respond ONLY with valid JSON matching this structure:
${outputSchema}

Important guidelines:
- If certain information is not present in the contract, use null or omit the field
- Be conservative with risk assessments - flag anything that could disadvantage the individual
- The confidenceScore should reflect how complete and clear the contract text was (0-1)
- Always explain legal jargon in plain English
- For originalText and concernSnippets, use EXACT quotes from the contract that can be found via text search
- Extract numerical values for benchmarking (percentages, dollar amounts, dates, etc.)
- IMPORTANT: Also extract all key dates found in the contract and include them in an "extractedDates" array with format: [{"date": "YYYY-MM-DD", "type": "option_period|termination_window|renewal|expiration|payment", "description": "what this date is for"}]

CONTRACT TEXT:
${contractText}`;

    // Check if API key is configured
    if (!process.env.OPENAI_API_KEY) {
      // Return smart mock data based on actual contract content
      return NextResponse.json({
        analysis: getSmartMockAnalysis(file.name, contractText, industry),
        extractedText: contractText,
        industry,
        isDemo: true,
      });
    }

    // Dynamic import OpenAI only when needed
    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    // Analyze with OpenAI using industry-specific prompt
    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert contract analyst specializing in the ${industry} industry. Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from AI");
    }

    const analysis: ContractAnalysis = JSON.parse(responseText);

    return NextResponse.json({ analysis, extractedText: contractText, industry });
  } catch (error) {
    console.error("Analysis error:", error);
    return NextResponse.json(
      { error: "Failed to analyze contract. Please try again." },
      { status: 500 }
    );
  }
}

function getSmartMockAnalysis(fileName: string, contractText: string, industry: IndustryType = "music"): ContractAnalysis {
  // Try to detect contract type and extract basic info from the actual text
  const lowerText = contractText.toLowerCase();
  
  // Industry-specific contract type detection
  const industryContractTypes: Record<IndustryType, string[]> = {
    music: ["recording", "publishing", "management", "sync", "distribution", "producer"],
    nil: ["endorsement", "sponsorship", "appearance", "nil", "name image", "likeness"],
    creator: ["brand", "sponsorship", "affiliate", "ugc", "whitelisting", "mcn"],
    esports: ["player", "team", "streaming", "tournament", "esports", "gaming"],
    freelance: ["consulting", "contractor", "work for hire", "retainer", "nda", "msa"],
    "real-estate": ["lease", "rental", "tenant", "landlord", "property", "apartment"],
  };
  
  const relevantTypes = industryContractTypes[industry] || industryContractTypes.music;
  
  // Detect contract type
  let contractType = "Music Agreement";
  if (lowerText.includes("songwriter") || lowerText.includes("co-publishing") || lowerText.includes("publishing agreement")) {
    contractType = "Songwriter/Publishing Agreement";
  } else if (lowerText.includes("recording agreement") || lowerText.includes("record label")) {
    contractType = "Recording Agreement";
  } else if (lowerText.includes("management agreement") || lowerText.includes("personal manager")) {
    contractType = "Artist Management Agreement";
  } else if (lowerText.includes("sync") || lowerText.includes("synchronization")) {
    contractType = "Sync License Agreement";
  } else if (lowerText.includes("session agreement") || lowerText.includes("session")) {
    contractType = "Session/Collaboration Agreement";
  }

  // Try to extract party names
  const publisherMatch = contractText.match(/[""]?Publisher[""]?\s*[):]\s*([A-Z][^(""\n]+(?:LLC|Inc|Corp)?)/i);
  const writerMatch = contractText.match(/[""]?Writer[""]?\s*[):]\s*([A-Z][^(""\n]+)/i);
  const artistMatch = contractText.match(/[""]?Artist[""]?\s*[):]\s*([A-Z][^(""\n]+)/i);
  
  const publisher = publisherMatch ? publisherMatch[1].trim() : null;
  const writer = writerMatch ? writerMatch[1].trim() : null;
  const artist = artistMatch ? artistMatch[1].trim() : null;

  // Try to extract term length
  let termLength = "See contract for details";
  const termMatch = contractText.match(/(\d+)\s*(?:\(\d+\))?\s*years?/i);
  if (termMatch) {
    termLength = `${termMatch[1]} year(s) initial term`;
  }
  const fiveYearMatch = contractText.match(/five\s*\(5\)\s*years?/i);
  if (fiveYearMatch) {
    termLength = "5 years initial term";
  }

  // Try to extract percentage splits
  const percentMatches = contractText.match(/(\d+)%/g) || [];
  const percentages = percentMatches.map(p => parseInt(p)).filter(p => p > 0 && p <= 100);

  // Extract key terms based on what's in the contract
  const keyTerms: ContractAnalysis["keyTerms"] = [];
  
  // Helper to find actual text snippets for highlighting
  const findSnippet = (keywords: string[], maxLen: number = 100): string | undefined => {
    for (const kw of keywords) {
      const idx = lowerText.indexOf(kw.toLowerCase());
      if (idx !== -1) {
        const start = Math.max(0, idx);
        const end = Math.min(contractText.length, idx + maxLen);
        // Find sentence boundaries
        let snippet = contractText.substring(start, end);
        const periodIdx = snippet.indexOf('.');
        if (periodIdx > 20) snippet = snippet.substring(0, periodIdx + 1);
        return snippet.trim();
      }
    }
    return undefined;
  };

  if (lowerText.includes("100% ownership") || lowerText.includes("100% of") && lowerText.includes("publishing")) {
    keyTerms.push({
      title: "Publishing Rights Assignment",
      content: "100% ownership/administration of publishing rights transferred to Publisher",
      importance: "critical",
      riskLevel: "high",
      explanation: "You're giving up all publishing administration rights. While you retain writer share, the publisher controls all licensing and collection.",
      originalText: findSnippet(["100% ownership", "100% of"]),
    });
  }

  if (lowerText.includes("writer share") || lowerText.includes("writer's share")) {
    keyTerms.push({
      title: "Writer Share Retained",
      content: "Writer retains writer's share of royalties and authorship",
      importance: "important",
      riskLevel: "low",
      explanation: "Good news - you keep your writer's share which typically means 50% of performance royalties through your PRO.",
      originalText: findSnippet(["writer share", "writer's share"]),
    });
  }

  if (lowerText.includes("automatically extend") || lowerText.includes("auto-renew")) {
    keyTerms.push({
      title: "Auto-Renewal Clause",
      content: "Term automatically extends unless terminated with written notice",
      importance: "critical",
      riskLevel: "high",
      explanation: "The contract renews automatically. You must actively send written notice to terminate - mark your calendar!",
      originalText: findSnippet(["automatically extend", "auto-renew"]),
    });
  }

  if (lowerText.includes("post-term") || lowerText.includes("post term") || lowerText.includes("after termination")) {
    keyTerms.push({
      title: "Post-Term Collection Rights",
      content: "Publisher retains rights to collect on pitches made during term even after expiration",
      importance: "critical",
      riskLevel: "medium",
      explanation: "Even after the contract ends, the publisher can continue collecting on any placements that resulted from their pitches during the term.",
      originalText: findSnippet(["post-term", "post term", "after termination"]),
    });
  }

  if (lowerText.includes("50%") && lowerText.includes("net")) {
    keyTerms.push({
      title: "Revenue Split",
      content: "50% of net sums from exploitation",
      importance: "important",
      riskLevel: "medium",
      explanation: "You receive 50% of NET (not gross) revenue. 'Net' means after the publisher deducts expenses, which can significantly reduce your share.",
      originalText: findSnippet(["50%", "net sums"]),
    });
  }

  if (lowerText.includes("indemnif")) {
    keyTerms.push({
      title: "Indemnification Clause",
      content: "Writer must indemnify Publisher for any breach or resulting damages",
      importance: "important",
      riskLevel: "medium",
      explanation: "You're legally responsible if any of your work causes legal problems. Make sure you have the rights to everything you contribute.",
      originalText: findSnippet(["indemnify", "indemnification"]),
    });
  }

  if (lowerText.includes("assign") && (lowerText.includes("right to assign") || lowerText.includes("shall have the right"))) {
    keyTerms.push({
      title: "Assignment Rights",
      content: "Publisher can assign/transfer this agreement to other parties",
      importance: "important",
      riskLevel: "medium",
      explanation: "The publisher can sell or transfer your contract to another company without your consent. You could end up working with someone you didn't choose.",
      originalText: findSnippet(["right to assign", "assign this agreement"]),
    });
  }

  // Add default terms if we didn't find many
  if (keyTerms.length < 3) {
    keyTerms.push({
      title: "Audit Rights",
      content: "Writer has right to audit Publisher's books",
      importance: "important",
      riskLevel: "low",
      explanation: "You can verify the publisher's accounting. This is an important protection - use it if numbers seem off.",
    });
  }

  // Determine risk level based on findings
  let overallRisk: "high" | "medium" | "low" = "medium";
  const highRiskTerms = keyTerms.filter(t => t.riskLevel === "high").length;
  if (highRiskTerms >= 3) overallRisk = "high";
  if (highRiskTerms === 0) overallRisk = "low";

  // Generate concerns based on detected content
  const concerns: string[] = [];
  const concernExplanations: string[] = [];
  const concernSnippets: string[] = [];

  if (lowerText.includes("100%") && lowerText.includes("publishing")) {
    concerns.push("100% publishing administration");
    concernExplanations.push("You're giving up all control over how your songs are licensed and collected - a co-pub deal (50/50) is more standard.");
    concernSnippets.push(findSnippet(["100%"]) || "");
  }
  if (lowerText.includes("automatically extend")) {
    concerns.push("Auto-renewal clause");
    concernExplanations.push("The contract keeps going unless you actively cancel - set a reminder before the notice deadline.");
    concernSnippets.push(findSnippet(["automatically extend"]) || "");
  }
  if (lowerText.includes("post-term") || lowerText.includes("2 years post")) {
    concerns.push("Post-term collection rights");
    concernExplanations.push("They can keep collecting money on your behalf even after the contract ends.");
    concernSnippets.push(findSnippet(["post-term", "post term"]) || "");
  }
  if (lowerText.includes("net sums") || lowerText.includes("net receipts")) {
    concerns.push("Payment based on 'net' not 'gross'");
    concernExplanations.push("They deduct expenses before paying you - ask what exactly gets deducted and set a cap.");
    concernSnippets.push(findSnippet(["net sums", "net receipts"]) || "");
  }
  if (lowerText.includes("indemnif")) {
    concerns.push("Indemnification clause");
    concernExplanations.push("You could be legally responsible if something goes wrong - consider getting insurance or limiting the scope.");
    concernSnippets.push(findSnippet(["indemnify"]) || "");
  }
  if (!lowerText.includes("audit")) {
    concerns.push("No audit rights mentioned");
    concernExplanations.push("You should be able to check their books to make sure you're being paid correctly.");
  }
  if (lowerText.includes("assign")) {
    concerns.push("Contract assignment allowed");
    concernExplanations.push("They can transfer this contract to another company without asking you first.");
    concernSnippets.push(findSnippet(["assign"]) || "");
  }

  if (concerns.length === 0) {
    concerns.push("⚠️ DEMO MODE: Add your OpenAI API key for real contract analysis");
    concernExplanations.push("This is demo mode - add your API key for full analysis.");
  }

  // Generate paragraph breakdown
  const paragraphBreakdown: ContractAnalysis["paragraphBreakdown"] = [];
  const paragraphs = contractText.split(/\n\n+/).filter(p => p.trim().length > 50);
  
  for (const para of paragraphs.slice(0, 10)) { // Limit to first 10 paragraphs for demo
    const paraLower = para.toLowerCase();
    let riskLevel: "high" | "medium" | "low" | "none" = "none";
    let plainEnglish = "This section contains standard contract language.";
    const keyPoints: string[] = [];

    if (paraLower.includes("grant") || paraLower.includes("assign")) {
      plainEnglish = "This paragraph defines what rights you're giving to the other party.";
      keyPoints.push("Rights are being transferred");
      riskLevel = "medium";
    }
    if (paraLower.includes("100%")) {
      plainEnglish = "This gives the publisher full control over administration. You keep your writer credit and PRO royalties.";
      keyPoints.push("Full administration rights transferred");
      riskLevel = "high";
    }
    if (paraLower.includes("term") && (paraLower.includes("year") || paraLower.includes("extend"))) {
      plainEnglish = "This defines how long the contract lasts and any renewal options.";
      keyPoints.push("Contract duration specified");
      if (paraLower.includes("automatically")) {
        keyPoints.push("Auto-renewal clause present");
        riskLevel = "high";
      }
    }
    if (paraLower.includes("payment") || paraLower.includes("royalt") || paraLower.includes("%")) {
      plainEnglish = "This explains how you get paid and what percentage you receive.";
      keyPoints.push("Payment terms defined");
      riskLevel = "medium";
    }
    if (paraLower.includes("indemnif")) {
      plainEnglish = "You agree to protect the other party from legal claims related to your work.";
      keyPoints.push("You take on legal liability");
      riskLevel = "medium";
    }
    if (paraLower.includes("terminat")) {
      plainEnglish = "This explains how either party can end the agreement.";
      keyPoints.push("Exit conditions defined");
    }

    paragraphBreakdown.push({
      original: para.trim().substring(0, 500),
      plainEnglish,
      keyPoints: keyPoints.length > 0 ? keyPoints : undefined,
      riskLevel,
    });
  }

  // Generate recommendations
  const recommendations: string[] = [
    "⚠️ This is a DEMO analysis - add your OpenAI API key to .env.local for real AI-powered analysis",
  ];
  
  if (lowerText.includes("100%") && lowerText.includes("publishing")) {
    recommendations.push("Try to negotiate a co-publishing deal where you retain 50% of publishing rights");
  }
  if (lowerText.includes("automatically extend")) {
    recommendations.push("Request a shorter initial term or remove auto-renewal in favor of mutual option");
  }
  recommendations.push("Have an entertainment attorney review before signing");
  recommendations.push("Get clarity on exactly what expenses can be deducted from your share");
  recommendations.push("Request quarterly (not semi-annual) accounting statements");

  return {
    summary: `⚠️ DEMO MODE - This analysis is based on keyword detection only. For accurate AI-powered analysis, add your OpenAI API key.\n\nThis appears to be a ${contractType} between ${writer || artist || "the creative party"} and ${publisher || "the company"}. The contract involves the creation and exploitation of musical works, with the publisher handling administration and pitching for sync licensing opportunities.\n\nKey areas identified include: rights assignment, revenue splits, term length with auto-renewal provisions, and post-termination collection rights. Several clauses warrant careful review before signing.`,
    contractType,
    parties: {
      artist: writer || artist || undefined,
      label: undefined,
      publisher: publisher || undefined,
      other: [],
    },
    effectiveDate: "See contract",
    termLength,
    keyTerms,
    financialTerms: {
      advanceAmount: lowerText.includes("advance") ? "See contract for advance terms" : "No advance mentioned",
      royaltyRate: percentages.length > 0 ? `Splits mentioned: ${percentages.join("%, ")}%` : "See contract for splits",
      recoupment: lowerText.includes("recoup") ? "Recoupment provisions apply" : "Not clearly specified",
      paymentSchedule: lowerText.includes("september") || lowerText.includes("march") ? "Semi-annual (September 30 and March 31)" : "See contract",
      additionalNotes: "Payment threshold of $100 minimum before payout (if mentioned in contract)",
    },
    rightsAndOwnership: {
      masterOwnership: lowerText.includes("master") ? "See contract for master rights" : "Not addressed",
      publishingRights: lowerText.includes("100%") ? "100% administration to Publisher, writer share retained" : "See contract",
      territorialRights: lowerText.includes("worldwide") ? "Worldwide" : "See contract",
      termLength: termLength,
      exclusivity: lowerText.includes("exclusive") ? "Exclusive arrangement" : "See contract",
      additionalNotes: "Post-term rights may extend beyond contract end",
    },
    obligationsAndDeliverables: {
      artistObligations: [
        "Participate in Sessions set up by Publisher",
        "Deliver Works and Masters in standard formats",
        "Sign split sheets with collaborators",
        "Warrant originality of contributions",
      ],
      labelObligations: [
        "Use best efforts to pitch Works for sync licensing",
        "Collect and distribute revenue per agreement",
        "Provide accounting statements",
      ],
      deliverables: [
        "Works (compositions) created at Sessions",
        "Masters (recordings) from Sessions",
        "Executed split sheets",
      ],
      timeline: "Prompt delivery after each Session",
    },
    potentialConcerns: concerns,
    concernExplanations,
    concernSnippets: concernSnippets.filter(s => s.length > 0),
    recommendations,
    overallRiskAssessment: overallRisk,
    confidenceScore: 0.45, // Lower confidence for demo mode
    paragraphBreakdown,
  };
}
