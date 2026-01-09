import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const url = new URL(request.url);
    const versionPath = url.searchParams.get("versionPath");

    const supabase = await createClient();
    // Use admin client for storage to bypass RLS policies
    const adminClient = createAdminClient();
    
    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Get contract to verify ownership and get file path
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("file_url, user_id")
      .eq("id", id)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    // Verify user owns this contract OR has a valid share
    if (contract.user_id !== user.id) {
      // Check if user has a share for this contract
      console.log("User doesn't own contract, checking for share...");
      console.log("User email:", user.email);
      console.log("Contract ID:", id);

      if (!user.email) {
        return NextResponse.json(
          { error: "Unauthorized - no email" },
          { status: 403 }
        );
      }

      const { data: share, error: shareError } = await supabase
        .from("contract_shares")
        .select("id")
        .eq("contract_id", id)
        .eq("shared_with_email", user.email)
        .maybeSingle();

      console.log("Share query result:", { share, shareError });

      if (shareError) {
        console.error("Share check error:", shareError);
        return NextResponse.json(
          { error: "Failed to verify access: " + shareError.message },
          { status: 500 }
        );
      }

      if (!share) {
        console.log("No share found for this user/contract combination");
        return NextResponse.json(
          { error: "Unauthorized - no share found" },
          { status: 403 }
        );
      }

      console.log("Share found, allowing access");
    }

    // Use version path if provided, otherwise use original contract file
    const filePath = versionPath || contract.file_url;
    console.log("Raw file_url from DB:", JSON.stringify(contract.file_url));
    console.log("Version path:", versionPath);
    console.log("File path being used:", filePath);

    if (!filePath) {
      return NextResponse.json(
        { error: "No file associated with this contract" },
        { status: 404 }
      );
    }

    // Clean the file path - remove bucket name if it's prefixed and trim whitespace
    let cleanPath = filePath.trim();
    if (cleanPath.startsWith("contracts/")) {
      cleanPath = cleanPath.replace("contracts/", "");
    }
    console.log("Clean path for storage:", JSON.stringify(cleanPath));

    // Generate signed URL (valid for 1 hour) using admin client to bypass RLS
    const { data: signedUrlData, error: signedUrlError } = await adminClient.storage
      .from("contracts")
      .createSignedUrl(cleanPath, 3600);

    console.log("Signed URL result:", { signedUrlData, signedUrlError });

    if (signedUrlError || !signedUrlData) {
      console.error("Signed URL error:", signedUrlError);

      // Debug: Try to list files in that user's directory
      const userDir = cleanPath.split("/")[0];
      const { data: files, error: listError } = await adminClient.storage
        .from("contracts")
        .list(userDir, { limit: 10 });
      console.log("Files in user directory:", userDir, files, listError);

      return NextResponse.json(
        { error: "Failed to generate file URL: " + (signedUrlError?.message || "unknown") },
        { status: 500 }
      );
    }

    return NextResponse.json({ 
      url: signedUrlData.signedUrl 
    });
  } catch (err) {
    console.error("Server error:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}



