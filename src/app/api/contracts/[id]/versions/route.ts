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

    // Normalize text for comparison - aggressive normalization to catch duplicates
    const normalizeForComparison = (text: string) =>
      text
        .toLowerCase()
        .replace(/[\r\n\t\f\v]+/g, ' ')  // Replace all newlines/tabs with space
        .replace(/\s+/g, ' ')             // Collapse multiple spaces
        .replace(/[^\w\s]/g, '')          // Remove punctuation
        .replace(/\s+/g, '')              // Remove all spaces for final comparison
        .trim();

    // Calculate similarity between two strings (0-1)
    const calculateSimilarity = (str1: string, str2: string): number => {
      if (str1 === str2) return 1;
      if (!str1 || !str2) return 0;

      const len1 = str1.length;
      const len2 = str2.length;
      const minLen = Math.min(len1, len2);
      const maxLen = Math.max(len1, len2);

      const lengthDiff = Math.abs(len1 - len2) / maxLen;
      console.log(`[Duplicate Check] Length difference: ${(lengthDiff * 100).toFixed(1)}%`);

      // Use multiple comparison methods for robustness

      // Method 1: Compare chunks (handles minor extraction differences)
      const chunkSize = 500;
      const numChunks = Math.min(Math.floor(minLen / chunkSize), 20);
      let chunkMatches = 0;

      for (let i = 0; i < numChunks; i++) {
        const start = Math.floor((minLen - chunkSize) * (i / numChunks));
        const chunk1 = str1.substring(start, start + chunkSize);
        const chunk2 = str2.substring(start, start + chunkSize);
        if (chunk1 === chunk2) chunkMatches++;
      }

      const chunkSimilarity = numChunks > 0 ? chunkMatches / numChunks : 0;
      console.log(`[Duplicate Check] Chunk similarity: ${(chunkSimilarity * 100).toFixed(1)}% (${chunkMatches}/${numChunks} chunks match)`);

      // Method 2: Character-by-character for first N characters
      let matchCount = 0;
      const compareLen = Math.min(minLen, 30000);
      for (let i = 0; i < compareLen; i++) {
        if (str1[i] === str2[i]) matchCount++;
      }
      const charSimilarity = matchCount / compareLen;
      console.log(`[Duplicate Check] Character similarity: ${(charSimilarity * 100).toFixed(1)}%`);

      // Method 3: Check if one contains most of the other (handles extra whitespace/headers)
      const shorter = len1 < len2 ? str1 : str2;
      const longer = len1 < len2 ? str2 : str1;
      const containsCheck = longer.includes(shorter.substring(0, Math.min(shorter.length, 5000)));
      console.log(`[Duplicate Check] Contains check: ${containsCheck}`);

      // High similarity if any method indicates duplicate
      if (chunkSimilarity >= 0.8 || charSimilarity >= 0.9 || containsCheck) {
        const maxSim = Math.max(chunkSimilarity, charSimilarity, containsCheck ? 0.95 : 0);
        console.log(`[Duplicate Check] Final similarity: ${(maxSim * 100).toFixed(1)}%`);
        return maxSim;
      }

      const avgSimilarity = (chunkSimilarity + charSimilarity) / 2;
      console.log(`[Duplicate Check] Final similarity (avg): ${(avgSimilarity * 100).toFixed(1)}%`);
      return avgSimilarity;
    };

    const normalizedNewText = normalizeForComparison(extractedText);
    const normalizedOriginalText = normalizeForComparison(contract.extracted_text || '');

    console.log(`[Duplicate Check] New text length: ${normalizedNewText.length}, Original length: ${normalizedOriginalText.length}`);

    // Quick check: compare first 10k characters directly (catches most duplicates fast)
    const quickCompareLen = Math.min(normalizedNewText.length, normalizedOriginalText.length, 10000);
    const quickMatch = normalizedNewText.substring(0, quickCompareLen) === normalizedOriginalText.substring(0, quickCompareLen);
    console.log(`[Duplicate Check] Quick match (first ${quickCompareLen} chars): ${quickMatch}`);

    if (quickMatch && Math.abs(normalizedNewText.length - normalizedOriginalText.length) < 100) {
      console.log(`[Duplicate Check] Quick match detected - likely duplicate`);
      await supabase.storage.from("contracts").remove([fileName]);
      return NextResponse.json({
        error: "This document is identical to the original contract (Version 1). No changes detected.",
        isDuplicate: true
      }, { status: 400 });
    }

    console.log(`[Duplicate Check] Exact match: ${normalizedNewText === normalizedOriginalText}`);

    // Check if identical or very similar to original (>95% similarity)
    const originalSimilarity = calculateSimilarity(normalizedNewText, normalizedOriginalText);
    console.log(`[Duplicate Check] Original similarity result: ${originalSimilarity}`);

    if (normalizedNewText === normalizedOriginalText || originalSimilarity >= 0.95) {
      // Clean up the uploaded file since we're not using it
      await supabase.storage.from("contracts").remove([fileName]);
      return NextResponse.json({
        error: "This document is identical to the original contract (Version 1). No changes detected.",
        isDuplicate: true
      }, { status: 400 });
    }

    // Check if identical or very similar to any existing version
    const { data: existingVersions } = await supabase
      .from("contract_versions")
      .select("extracted_text, version_number, created_at")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });

    if (existingVersions) {
      for (let i = 0; i < existingVersions.length; i++) {
        const version = existingVersions[i];
        const normalizedVersionText = normalizeForComparison(version.extracted_text || '');
        const similarity = calculateSimilarity(normalizedNewText, normalizedVersionText);

        if (normalizedNewText === normalizedVersionText || similarity >= 0.95) {
          // Clean up the uploaded file since we're not using it
          await supabase.storage.from("contracts").remove([fileName]);
          // Use display version number (1-indexed position in list + 1 for "Version 2", "Version 3", etc.)
          const displayVersionNumber = i + 2; // +2 because original is "Version 1" and versions start at index 0
          return NextResponse.json({
            error: `This document is identical to Version ${displayVersionNumber}. No changes detected.`,
            isDuplicate: true
          }, { status: 400 });
        }
      }
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

    // Compare actual contract text to determine if there are real changes
    const previousText = normalizeForComparison(contract.extracted_text || '');
    const newText = normalizeForComparison(extractedText);
    const textSimilarity = calculateSimilarity(newText, previousText);

    console.log(`[Version Compare] Text similarity with original: ${(textSimilarity * 100).toFixed(1)}%`);

    let comparison;

    // If texts are very similar (>85%), don't ask AI to find differences - it will hallucinate
    if (textSimilarity >= 0.85) {
      console.log(`[Version Compare] High similarity detected - skipping AI comparison to prevent hallucination`);
      comparison = {
        changesSummary: "No significant changes detected between versions.",
        improvements: [],
        regressions: [],
        unchanged: ["All major terms appear unchanged"]
      };
    } else {
      // Now compare with previous version to get changes summary
      const comparisonResponse = await openai.chat.completions.create({
        model: "gpt-4o",
        messages: [
          {
            role: "system",
            content: `You are a legal contract analyst. Compare these two contract analyses and identify what ACTUALLY changed between versions. Focus on changes that affect the individual/artist - better or worse.

IMPORTANT: Only report changes that are REAL and SUBSTANTIVE. If the contracts are essentially the same with minor wording differences, report that there are no significant changes. Do NOT invent or hallucinate differences.

Return JSON with:
{
  "changesSummary": "Human-readable 1-2 sentence summary of key changes. If no real changes, say 'No significant changes detected.'",
  "improvements": ["Specific term/clause that got better for the individual - ONLY if actually changed"],
  "regressions": ["Specific term/clause that got worse for the individual - ONLY if actually changed"],
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

      comparison = JSON.parse(comparisonResponse.choices[0].message.content || "{}");
    }

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

// DELETE - Delete a specific version
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const { searchParams } = new URL(request.url);
  const versionId = searchParams.get("versionId");

  if (!versionId) {
    return NextResponse.json({ error: "Version ID required" }, { status: 400 });
  }

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

  // Get the version to delete (to get the file path)
  const { data: version } = await supabase
    .from("contract_versions")
    .select("*")
    .eq("id", versionId)
    .eq("contract_id", contractId)
    .single();

  if (!version) {
    return NextResponse.json({ error: "Version not found" }, { status: 404 });
  }

  // Delete the file from storage
  if (version.file_url) {
    await supabase.storage.from("contracts").remove([version.file_url]);
  }

  // Delete the version record
  const { error, count } = await supabase
    .from("contract_versions")
    .delete()
    .eq("id", versionId)
    .eq("contract_id", contractId)
    .select();

  console.log(`[Version Delete] Attempted to delete version ${versionId}, error: ${error?.message || 'none'}, deleted count: ${count}`);

  if (error) {
    console.error("[Version Delete] Error:", error);
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Verify the version is actually deleted
  const { data: checkVersion } = await supabase
    .from("contract_versions")
    .select("id")
    .eq("id", versionId)
    .single();

  if (checkVersion) {
    console.error("[Version Delete] Version still exists after delete attempt!");
    return NextResponse.json({
      error: "Delete operation did not complete. Please check database permissions.",
      stillExists: true
    }, { status: 500 });
  }

  console.log(`[Version Delete] Successfully deleted version ${versionId}`);
  return NextResponse.json({ success: true, message: "Version deleted" });
}

