import { createClient } from "@/lib/supabase/server";
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
      const { data: share } = await supabase
        .from("contract_shares")
        .select("id")
        .eq("contract_id", id)
        .eq("shared_with_email", user.email)
        .single();

      if (!share) {
        return NextResponse.json(
          { error: "Unauthorized" },
          { status: 403 }
        );
      }
    }

    // Use version path if provided, otherwise use original contract file
    const filePath = versionPath || contract.file_url;

    if (!filePath) {
      return NextResponse.json(
        { error: "No file associated with this contract" },
        { status: 404 }
      );
    }

    // Generate signed URL (valid for 1 hour)
    const { data: signedUrlData, error: signedUrlError } = await supabase.storage
      .from("contracts")
      .createSignedUrl(filePath, 3600);

    if (signedUrlError || !signedUrlData) {
      console.error("Signed URL error:", signedUrlError);
      return NextResponse.json(
        { error: "Failed to generate file URL" },
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



