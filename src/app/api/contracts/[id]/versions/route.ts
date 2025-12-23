import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPDF, extractTextFromWord } from "@/lib/extractText";
import { getAnalysisPrompt, getOutputSchema } from "@/config/analysis-prompts";
import { IndustryType } from "@/config/industries";
import OpenAI from "openai";

const openai = new OpenAI({ apiKey: process.env.OPENAI_API_KEY });

// GET - Fetch all versions for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns this contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, user_id")
    .eq("id", contractId)
    .single();

  if (!contract || contract.user_id !== user.id) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Fetch versions
  const { data: versions, error } = await supabase
    .from("contract_versions")
    .select("*")
    .eq("contract_id", contractId)
    .order("version_number", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ versions });
}

// POST - Upload a new version
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns this contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();

  if (!contract || contract.user_id !== user.id) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  try {
    const formData = await request.formData();
    const file = formData.get("file") as File;

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 });
    }

    // Get current version count
    const { count } = await supabase
      .from("contract_versions")
      .select("*", { count: "exact", head: true })
      .eq("contract_id", contractId);

    const newVersionNumber = (count || 0) + 1;

    // Upload file to storage
    const fileExt = file.name.split(".").pop();
    const fileName = `${user.id}/${contractId}/v${newVersionNumber}.${fileExt}`;
    const arrayBuffer = await file.arrayBuffer();
    const fileBuffer = Buffer.from(arrayBuffer);

    const { error: uploadError } = await supabase.storage
      .from("contracts")
      .upload(fileName, fileBuffer, {
        contentType: file.type,
        upsert: true,
      });

    if (uploadError) {
      return NextResponse.json({ error: "Failed to upload file" }, { status: 500 });
    }

    // Extract text from file
    let extractedText = "";
    if (file.type === "application/pdf") {
      extractedText = await extractTextFromPDF(fileBuffer);
    } else if (file.type.includes("word") || file.name.endsWith(".docx")) {
      extractedText = await extractTextFromWord(fileBuffer);
    } else {
      extractedText = new TextDecoder().decode(fileBuffer);
    }

    const previousAnalysis = contract.analysis;
    const industry = (contract.industry as IndustryType) || "music";

    // Run FULL analysis on the new version (same as initial upload)
    const analysisPrompt = getAnalysisPrompt(industry);
    const outputSchema = getOutputSchema(industry);
    
    const fullAnalysisPrompt = `${analysisPrompt}

Respond ONLY with valid JSON matching this structure:
${outputSchema}

Important guidelines:
- If certain information is not present in the contract, use null or omit the field
- Be conservative with risk assessments - flag anything that could disadvantage the individual
- The confidenceScore should reflect how complete and clear the contract text was (0-1)
- Always explain legal jargon in plain English
- For originalText and concernSnippets, use EXACT quotes from the contract that can be found via text search

CONTRACT TEXT:
${extractedText.substring(0, 15000)}`;

    const fullAnalysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are an expert contract analyst specializing in the ${industry} industry. Always respond with valid JSON only.`,
        },
        {
          role: "user",
          content: fullAnalysisPrompt,
        },
      ],
      temperature: 0.3,
      max_tokens: 4000,
      response_format: { type: "json_object" },
    });

    const fullAnalysis = JSON.parse(fullAnalysisResponse.choices[0].message.content || "{}");

    // Now compare with previous version to get changes summary
    const comparisonResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a legal contract analyst. Compare these two contract analyses and identify what changed between versions. Focus on changes that affect the individual/artist - better or worse.

Return JSON with:
{
  "changesSummary": "Human-readable 1-2 sentence summary of key changes",
  "improvements": ["Specific term/clause that got better for the individual"],
  "regressions": ["Specific term/clause that got worse for the individual"],
  "unchanged": ["Major terms that stayed the same"]
}`
        },
        {
          role: "user",
          content: `PREVIOUS VERSION ANALYSIS:\n${JSON.stringify(previousAnalysis, null, 2)}\n\nNEW VERSION ANALYSIS:\n${JSON.stringify(fullAnalysis, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const comparison = JSON.parse(comparisonResponse.choices[0].message.content || "{}");

    // Merge full analysis with comparison data
    const analysis = {
      ...fullAnalysis,
      changesSummary: comparison.changesSummary,
      improvements: comparison.improvements,
      regressions: comparison.regressions,
      unchanged: comparison.unchanged,
    };

    // Create version record
    const { data: version, error: versionError } = await supabase
      .from("contract_versions")
      .insert({
        contract_id: contractId,
        version_number: newVersionNumber,
        file_url: fileName,
        extracted_text: extractedText,
        analysis: analysis,
        changes_summary: analysis.changesSummary || "No changes detected",
      })
      .select()
      .single();

    if (versionError) {
      return NextResponse.json({ error: versionError.message }, { status: 500 });
    }

    // Update main contract with new analysis if this is an improvement
    if (analysis.overallRiskAssessment === "low" || 
        (analysis.overallRiskAssessment === "medium" && previousAnalysis?.overallRiskAssessment === "high")) {
      await supabase
        .from("contracts")
        .update({
          status: "negotiating",
          updated_at: new Date().toISOString(),
        })
        .eq("id", contractId);
    }

    return NextResponse.json({ 
      version,
      message: `Version ${newVersionNumber} uploaded successfully`
    });

  } catch (error) {
    console.error("Version upload error:", error);
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "Failed to process version" },
      { status: 500 }
    );
  }
}





