import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";
import { prepareBenchmarkContribution } from "@/lib/benchmarking";
import { IndustryType } from "@/config/industries";
import { convertToPdf } from "@/lib/convertToPdf";

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
        { status: 401 }
      );
    }

    const formData = await request.formData();
    const file = formData.get("file") as File | null;
    const contractDataStr = formData.get("contractData") as string | null;

    if (!file || !contractDataStr) {
      return NextResponse.json(
        { error: "File and contract data are required" },
        { status: 400 }
      );
    }

    const contractData = JSON.parse(contractDataStr);
    const { title, extractedText, analysis, contractType, overallRisk, industry } = contractData;

    console.log("Uploading file for user:", user.id);
    console.log("File:", file.name, file.type, file.size);

    // Convert TXT/DOCX files to PDF for consistent viewing
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
        console.log("File converted to PDF:", uploadFileName);
      } catch (convertErr) {
        console.warn("PDF conversion failed, uploading original:", convertErr);
        // Continue with original file if conversion fails
      }
    }

    // Upload file to Supabase Storage
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
      // Continue without file URL - we can still save the text
    }

    // Store the file path (not public URL - we'll use signed URLs)
    const fileUrl = uploadData?.path || null;

    // Save contract to database
    const { data, error } = await supabase
      .from("contracts")
      .insert({
        user_id: user.id,
        title,
        file_name: uploadFileName,
        file_url: fileUrl,
        file_type: uploadContentType,
        extracted_text: extractedText,
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
        { error: error.message, details: error },
        { status: 500 }
      );
    }

    console.log("Contract saved successfully:", data.id);

    // Auto-contribute anonymized benchmark data
    if (analysis && industry) {
      try {
        const benchmarkData = prepareBenchmarkContribution(
          analysis,
          industry as IndustryType,
          data.id // Link to contract for potential later removal
        );
        
        const { error: benchmarkError } = await supabase
          .from("benchmark_data")
          .insert(benchmarkData);
        
        if (benchmarkError) {
          // Non-fatal - log but don't fail the request
          console.warn("Failed to contribute benchmark data:", benchmarkError.message);
        } else {
          console.log("Benchmark data contributed for contract:", data.id);
        }
      } catch (benchmarkErr) {
        console.warn("Error preparing benchmark data:", benchmarkErr);
      }
    }

    // Auto-extract and save key dates from analysis
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
          } else {
            console.log(`Saved ${datesToInsert.length} extracted dates for contract:`, data.id);
          }
        }
      } catch (datesErr) {
        console.warn("Error saving extracted dates:", datesErr);
      }
    }

    return NextResponse.json({ 
      success: true, 
      contractId: data.id,
      fileUrl,
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

