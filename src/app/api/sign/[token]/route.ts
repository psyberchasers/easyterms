import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// GET: Fetch signing info (public - no auth required)
export async function GET(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;

    if (!token) {
      return NextResponse.json({ error: "Token is required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find share by signing token
    const { data: share, error: shareError } = await supabase
      .from("contract_shares")
      .select("id, contract_id, owner_id, shared_with_email, permission, status, message, created_at, signing_token")
      .eq("signing_token", token)
      .eq("permission", "sign")
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: "Invalid or expired signing link" }, { status: 404 });
    }

    // Get contract
    const { data: contract } = await supabase
      .from("contracts")
      .select("id, title, file_url")
      .eq("id", share.contract_id)
      .single();

    if (!contract) {
      return NextResponse.json({ error: "Contract not found" }, { status: 404 });
    }

    // Get owner profile
    const { data: owner } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", share.owner_id)
      .single();

    // Get signed PDF URL
    let pdfUrl = null;
    if (contract.file_url) {
      const filePath = contract.file_url.replace(/^.*\/contracts\//, "");
      const { data: urlData } = await supabase.storage
        .from("contracts")
        .createSignedUrl(filePath, 3600); // 1 hour
      pdfUrl = urlData?.signedUrl;
    }

    return NextResponse.json({
      contractId: contract.id,
      contractTitle: contract.title,
      ownerName: owner?.full_name,
      ownerEmail: owner?.email,
      signerEmail: share.shared_with_email,
      message: share.message,
      status: share.status,
      createdAt: share.created_at,
      pdfUrl,
    });
  } catch (err) {
    console.error("Error fetching signing info:", err);
    return NextResponse.json({ error: "Failed to fetch signing info" }, { status: 500 });
  }
}

// POST: Submit signature (public - no auth required)
export async function POST(
  request: Request,
  { params }: { params: Promise<{ token: string }> }
) {
  try {
    const { token } = await params;
    const { signature } = await request.json();

    if (!token || !signature) {
      return NextResponse.json({ error: "Token and signature required" }, { status: 400 });
    }

    const supabase = createAdminClient();

    // Find and validate share
    const { data: share, error: shareError } = await supabase
      .from("contract_shares")
      .select("id, contract_id, owner_id, shared_with_email, status")
      .eq("signing_token", token)
      .eq("permission", "sign")
      .single();

    if (shareError || !share) {
      return NextResponse.json({ error: "Invalid signing link" }, { status: 404 });
    }

    if (share.status === "signed") {
      return NextResponse.json({ error: "Document already signed" }, { status: 400 });
    }

    // Update share status to signed
    const signedAt = new Date().toISOString();
    await supabase
      .from("contract_shares")
      .update({
        status: "signed",
        signed_at: signedAt,
        signature_data: signature, // Store base64 signature
      })
      .eq("id", share.id);

    // Get contract for notification
    const { data: contract } = await supabase
      .from("contracts")
      .select("title")
      .eq("id", share.contract_id)
      .single();

    // Notify contract owner
    await supabase.from("notifications").insert({
      user_id: share.owner_id,
      type: "contract_signed",
      title: "Contract Signed",
      message: `${share.shared_with_email} has signed "${contract?.title}"`,
      contract_id: share.contract_id,
    });

    return NextResponse.json({
      success: true,
      signedAt,
    });
  } catch (err) {
    console.error("Error signing document:", err);
    return NextResponse.json({ error: "Failed to sign document" }, { status: 500 });
  }
}
