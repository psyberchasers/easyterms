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

    // Determine if user owns this contract or has shared access
    const isOwner = contract.user_id === user.id;
    let hasSharedAccess = false;

    if (!isOwner) {
      // Check if user has a share for this contract
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

      if (shareError) {
        console.error("Share check error:", shareError);
        return NextResponse.json(
          { error: "Failed to verify access: " + shareError.message },
          { status: 500 }
        );
      }

      if (!share) {
        return NextResponse.json(
          { error: "Unauthorized - no access" },
          { status: 403 }
        );
      }

      hasSharedAccess = true;
    }

    // Use version path if provided, otherwise use original contract file
    const filePath = versionPath || contract.file_url;

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

    // For owners, use regular client (RLS allows access to own files)
    // For shared access, try admin client first, fall back to regular client
    let signedUrlData;
    let signedUrlError;

    if (isOwner) {
      // Owner can use regular client - RLS allows access
      const result = await supabase.storage
        .from("contracts")
        .createSignedUrl(cleanPath, 3600);
      signedUrlData = result.data;
      signedUrlError = result.error;
    } else {
      // Shared user needs admin client to bypass storage RLS
      const adminClient = createAdminClient();
      const result = await adminClient.storage
        .from("contracts")
        .createSignedUrl(cleanPath, 3600);
      signedUrlData = result.data;
      signedUrlError = result.error;

      // If admin client failed (maybe no service role key), try regular client as fallback
      if (signedUrlError) {
        console.warn("Admin client failed, trying regular client:", signedUrlError.message);
        const fallbackResult = await supabase.storage
          .from("contracts")
          .createSignedUrl(cleanPath, 3600);
        signedUrlData = fallbackResult.data;
        signedUrlError = fallbackResult.error;
      }
    }

    if (signedUrlError || !signedUrlData) {
      console.error("Signed URL error:", signedUrlError);
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



