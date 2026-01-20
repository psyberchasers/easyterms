import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prepareBenchmarkContribution } from "@/lib/benchmarking";
import { IndustryType } from "@/config/industries";
import { convertToPdf } from "@/lib/convertToPdf";
import { getAnalysisPrompt, getOutputSchema } from "@/config/analysis-prompts";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

async function extractTextFromPDF(data: Uint8Array): Promise<string> {
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
    mimeType === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
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

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check for Authorization header (for extension)
    const authHeader = request.headers.get('Authorization');
    let user = null;

    if (authHeader?.startsWith('Bearer ')) {
      const token = authHeader.substring(7);
      const { data: { user: tokenUser }, error: tokenError } = await supabase.auth.getUser(token);
      if (!tokenError && tokenUser) {
        user = tokenUser;
      }
    }

    // Fallback to cookie auth
    if (!user) {
      const { data: { user: cookieUser }, error: authError } = await supabase.auth.getUser();
      if (!authError && cookieUser) {
        user = cookieUser;
      }
    }

    if (!user) {
      console.error("Auth error: No valid authentication");
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401, headers: corsHeaders }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const industryParam = formData.get("industry") as string | null;
    const industry: IndustryType = (industryParam as IndustryType) || "music";

    if (!file) {
      return NextResponse.json(
        { error: "File is required" },
        { status: 400, headers: corsHeaders }
      );
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
        { status: 400, headers: corsHeaders }
      );
    }

    // Validate file size (10MB limit)
    if (file.size > 10 * 1024 * 1024) {
      return NextResponse.json(
        { error: "File too large. Maximum size is 10MB." },
        { status: 400, headers: corsHeaders }
      );
    }

    console.log("Analyzing file for user:", user.id);
    console.log("File:", file.name, file.type, file.size);

    // Extract text from file
    const buffer = Buffer.from(await file.arrayBuffer());
    let contractText: string;

    try {
      contractText = await extractTextFromFile(buffer, file.type);
    } catch (extractError) {
      console.error("Text extraction error:", extractError);
      return NextResponse.json(
        { error: "Failed to parse file. Please ensure it's a valid document." },
        { status: 400, headers: corsHeaders }
      );
    }

    if (!contractText || contractText.trim().length < 100) {
      return NextResponse.json(
        { error: "Could not extract sufficient text from the file." },
        { status: 400, headers: corsHeaders }
      );
    }

    // Truncate if too long
    const maxChars = 400000;
    if (contractText.length > maxChars) {
      contractText = contractText.substring(0, maxChars) + "\n\n[Document truncated due to length...]";
    }

    // Build analysis prompt
    const industryPrompt = getAnalysisPrompt(industry);
    const outputSchema = getOutputSchema(industry);

    const fullPrompt = `${industryPrompt}

ANALYSIS PERSPECTIVE: You are analyzing this contract from the RECIPIENT'S perspective (the party who received this contract to review/sign).
- Focus on risks: What obligations and restrictions is the recipient taking on?
- Identify terms that favor the other party at the recipient's expense
- Flag potentially problematic or one-sided clauses
- Recommendations should focus on negotiation points and protections to request
- Risk assessment reflects risk TO THE RECIPIENT (e.g., "high risk" means bad for the recipient)

Respond ONLY with valid JSON matching this structure:
${outputSchema}

Important guidelines:
- If certain information is not present in the contract, use null or omit the field
- Be conservative with risk assessments based on the recipient's perspective
- The confidenceScore should reflect how complete and clear the contract text was (0-1)
- Always explain legal jargon in plain English
- For originalText and concernSnippets, use EXACT quotes from the contract that can be found via text search
- Extract numerical values for benchmarking (percentages, dollar amounts, dates, etc.)
- IMPORTANT: Also extract all key dates found in the contract and include them in an "extractedDates" array with format: [{"date": "YYYY-MM-DD", "type": "option_period|termination_window|renewal|expiration|payment", "description": "what this date is for"}]

CONTRACT TEXT:
${contractText}`;

    // Analyze with OpenAI
    if (!process.env.OPENAI_API_KEY) {
      return NextResponse.json(
        { error: "AI analysis not configured" },
        { status: 500, headers: corsHeaders }
      );
    }

    const OpenAI = (await import("openai")).default;
    const openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });

    const completion = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert contract analyst specializing in the ${industry} industry, analyzing from the recipient's perspective. Always respond with valid JSON only. Be thorough - analyze ALL sections of the contract.`,
        },
        {
          role: "user",
          content: fullPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 16000,
      response_format: { type: "json_object" },
    });

    const responseText = completion.choices[0]?.message?.content;
    if (!responseText) {
      throw new Error("No response from AI");
    }

    const analysis = JSON.parse(responseText);
    const contractType = analysis.contractType || "Contract";
    const overallRisk = analysis.overallRiskAssessment || "medium";

    // Convert file to PDF for storage if needed
    let fileToUpload: File | Blob = file;
    let uploadFileName = file.name;
    let uploadContentType = file.type;

    const isTextOrDoc = file.type === "text/plain" ||
      file.type === "application/msword" ||
      file.type === "application/vnd.openxmlformats-officedocument.wordprocessingml.document" ||
      file.name.toLowerCase().endsWith(".txt") ||
      file.name.toLowerCase().endsWith(".doc") ||
      file.name.toLowerCase().endsWith(".docx");

    if (isTextOrDoc) {
      try {
        console.log("Converting file to PDF...");
        const { pdfBuffer, originalName } = await convertToPdf(file);
        fileToUpload = new Blob([new Uint8Array(pdfBuffer)], { type: "application/pdf" });
        uploadFileName = originalName;
        uploadContentType = "application/pdf";
      } catch (convertErr) {
        console.warn("PDF conversion failed, uploading original:", convertErr);
      }
    }

    // Upload file to storage
    const fileExt = uploadFileName.split('.').pop();
    const storagePath = `${user.id}/${Date.now()}-${Math.random().toString(36).substring(7)}.${fileExt}`;

    const { data: uploadData, error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(storagePath, fileToUpload, {
        contentType: uploadContentType,
        upsert: false,
      });

    if (uploadError) {
      console.error("Storage upload error:", uploadError);
    }

    const fileUrl = uploadData?.path || null;
    const title = file.name.replace(/\.[^/.]+$/, '');

    // Save to database
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        user_id: user.id,
        title,
        file_name: uploadFileName,
        file_url: fileUrl,
        file_type: uploadContentType,
        extracted_text: contractText,
        analysis,
        contract_type: contractType,
        overall_risk: overallRisk,
        status: "active",
      })
      .select("id")
      .single();

    if (error) {
      console.error("Database insert error:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500, headers: corsHeaders }
      );
    }

    console.log("Contract analyzed and saved:", data.id);

    // Auto-contribute benchmark data
    if (analysis && industry) {
      try {
        const benchmarkData = prepareBenchmarkContribution(
          analysis,
          industry as IndustryType,
          data.id
        );

        const { error: benchmarkError } = await supabase
          .from("benchmark_data")
          .insert(benchmarkData);

        if (benchmarkError) {
          console.warn("Failed to contribute benchmark data:", benchmarkError.message);
        }
      } catch (benchmarkErr) {
        console.warn("Error preparing benchmark data:", benchmarkErr);
      }
    }

    // Auto-extract and save key dates
    if (analysis?.extractedDates && Array.isArray(analysis.extractedDates)) {
      try {
        const validDateTypes = ['option_period', 'termination_window', 'renewal', 'expiration', 'payment'];
        const datesToInsert = analysis.extractedDates
          .filter((d: { date?: string; type?: string }) =>
            d.date && d.type && validDateTypes.includes(d.type)
          )
          .map((d: { date: string; type: string; description?: string }) => ({
            contract_id: data.id,
            date_type: d.type,
            date: d.date,
            description: d.description || `Auto-extracted ${d.type.replace('_', ' ')}`,
            alert_days_before: d.type === 'termination_window' || d.type === 'option_period' ? 60 : 30,
          }));

        if (datesToInsert.length > 0) {
          const { error: datesError } = await supabase
            .from("contract_dates")
            .insert(datesToInsert);

          if (datesError) {
            console.warn("Failed to save extracted dates:", datesError.message);
          }
        }
      } catch (datesErr) {
        console.warn("Error saving extracted dates:", datesErr);
      }
    }

    return NextResponse.json({
      success: true,
      contractId: data.id,
      analysis,
      contractType,
      overallRisk,
      summary: analysis.summary,
    }, { headers: corsHeaders });

  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500, headers: corsHeaders }
    );
  }
}
