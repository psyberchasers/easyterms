import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function POST(request: Request) {
  try {
    const supabase = await createClient();

    // Check if user is authenticated
    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { contractId, email, permission, message } = body;

    if (!contractId || !email) {
      return NextResponse.json(
        { error: "Contract ID and email are required" },
        { status: 400 }
      );
    }

    // Validate email format
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    if (!emailRegex.test(email)) {
      return NextResponse.json(
        { error: "Invalid email address" },
        { status: 400 }
      );
    }

    // Verify the user owns this contract
    const { data: contract, error: contractError } = await supabase
      .from("contracts")
      .select("id, user_id")
      .eq("id", contractId)
      .single();

    if (contractError || !contract) {
      return NextResponse.json(
        { error: "Contract not found" },
        { status: 404 }
      );
    }

    if (contract.user_id !== user.id) {
      return NextResponse.json(
        { error: "You don't have permission to share this contract" },
        { status: 403 }
      );
    }

    // Check if already shared with this email
    const { data: existingShare } = await supabase
      .from("contract_shares")
      .select("id")
      .eq("contract_id", contractId)
      .eq("shared_with_email", email.toLowerCase())
      .single();

    if (existingShare) {
      return NextResponse.json(
        { error: "This contract is already shared with this email" },
        { status: 400 }
      );
    }

    // Create the share record
    // The database trigger will automatically:
    // 1. Link to existing user if they have an account
    // 2. Create an in-app notification if user exists
    // 3. Send an email invitation
    const { data: share, error: shareError } = await supabase
      .from("contract_shares")
      .insert({
        contract_id: contractId,
        owner_id: user.id,
        shared_with_email: email.toLowerCase(),
        permission: permission || "view",
        message: message || null,
      })
      .select("id")
      .single();

    if (shareError) {
      console.error("Error creating share:", shareError);
      return NextResponse.json(
        { error: "Failed to share contract" },
        { status: 500 }
      );
    }

    return NextResponse.json({
      success: true,
      shareId: share.id
    });
  } catch (err) {
    console.error("Server error sharing contract:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Get shares for a contract (owner only)
export async function GET(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const contractId = searchParams.get("contractId");

    if (!contractId) {
      return NextResponse.json(
        { error: "Contract ID is required" },
        { status: 400 }
      );
    }

    // Get shares for contracts owned by this user
    const { data: shares, error } = await supabase
      .from("contract_shares")
      .select(`
        id,
        shared_with_email,
        permission,
        status,
        message,
        created_at,
        shared_with_user_id,
        profiles:shared_with_user_id (
          full_name,
          avatar_url
        )
      `)
      .eq("contract_id", contractId)
      .eq("owner_id", user.id)
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Error fetching shares:", error);
      return NextResponse.json(
        { error: "Failed to fetch shares" },
        { status: 500 }
      );
    }

    return NextResponse.json({ shares });
  } catch (err) {
    console.error("Server error fetching shares:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Delete a share
export async function DELETE(request: Request) {
  try {
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const shareId = searchParams.get("shareId");

    if (!shareId) {
      return NextResponse.json(
        { error: "Share ID is required" },
        { status: 400 }
      );
    }

    // Delete share (RLS will ensure only owner can delete)
    const { error } = await supabase
      .from("contract_shares")
      .delete()
      .eq("id", shareId)
      .eq("owner_id", user.id);

    if (error) {
      console.error("Error deleting share:", error);
      return NextResponse.json(
        { error: "Failed to delete share" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error deleting share:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
