import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { extractTextFromPDF, extractTextFromWord } from "@/lib/extractText";
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

    // Analyze the new version and compare with previous
    const previousAnalysis = contract.analysis;
    
    const analysisResponse = await openai.chat.completions.create({
      model: "gpt-4o",
      messages: [
        {
          role: "system",
          content: `You are a legal contract analyst. Analyze this new version of a contract and compare it to the previous version's analysis. Focus on what changed - better or worse for the artist/creator.

Return JSON with:
{
  "summary": "Brief summary of this version",
  "overallRiskAssessment": "high" | "medium" | "low",
  "confidenceScore": 0.0-1.0,
  "changesSummary": "Human-readable summary of key changes from previous version",
  "improvements": ["List of terms that got better"],
  "regressions": ["List of terms that got worse"],
  "unchanged": ["Major terms that stayed the same"]
}`
        },
        {
          role: "user",
          content: `NEW CONTRACT VERSION:\n${extractedText.substring(0, 15000)}\n\nPREVIOUS VERSION ANALYSIS:\n${JSON.stringify(previousAnalysis, null, 2)}`
        }
      ],
      response_format: { type: "json_object" },
      temperature: 0.3,
    });

    const analysis = JSON.parse(analysisResponse.choices[0].message.content || "{}");

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

