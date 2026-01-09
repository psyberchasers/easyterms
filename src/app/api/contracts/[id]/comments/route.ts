import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

// Get comments for a contract
export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    // Fetch comments
    const { data: comments, error } = await supabase
      .from("contract_comments")
      .select("*")
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Fetch user profiles for all comment authors using admin client to bypass RLS
    const userIds = [...new Set((comments || []).map((c: { user_id: string }) => c.user_id))];
    const adminClient = createAdminClient();

    // Fetch profiles
    const { data: profiles } = await adminClient
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .in("id", userIds);

    // For users without profiles, get their email from auth.users
    type ProfileData = { id: string; full_name: string | null; email: string | null; avatar_url: string | null };
    const profileMap = new Map<string, ProfileData>(
      (profiles || []).map((p: ProfileData) => [p.id, p])
    );

    // Check for missing profiles and fetch from auth.users
    for (const userId of userIds) {
      if (!profileMap.has(userId)) {
        try {
          const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(userId);
          if (authUser) {
            profileMap.set(userId, {
              id: userId,
              full_name: null,
              email: authUser.email || null,
              avatar_url: null,
            });
          }
        } catch (err) {
          console.error("Error fetching auth user:", err);
        }
      }
    }

    // Combine comments with user data
    const transformed = (comments || []).map((c: { user_id: string }) => ({
      ...c,
      user: profileMap.get(c.user_id) || null,
    }));

    return NextResponse.json({ comments: transformed });
  } catch (err) {
    console.error("Server error fetching comments:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Add a comment
export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: contractId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, clauseReference, parentId } = body;

    if (!content?.trim()) {
      return NextResponse.json(
        { error: "Comment content is required" },
        { status: 400 }
      );
    }

    // Insert the comment
    const { data: comment, error } = await supabase
      .from("contract_comments")
      .insert({
        contract_id: contractId,
        user_id: user.id,
        content: content.trim(),
        clause_reference: clauseReference || null,
        parent_id: parentId || null,
      })
      .select("*")
      .single();

    if (error) {
      console.error("Error creating comment:", error);
      // Check if it's a permission error
      if (error.code === "42501") {
        return NextResponse.json(
          { error: "You don't have permission to comment on this contract" },
          { status: 403 }
        );
      }
      return NextResponse.json(
        { error: "Failed to create comment" },
        { status: 500 }
      );
    }

    // Fetch user profile using admin client to bypass RLS
    const adminClient = createAdminClient();
    let profile = null;

    const { data: profileData } = await adminClient
      .from("profiles")
      .select("id, full_name, email, avatar_url")
      .eq("id", user.id)
      .single();

    if (profileData) {
      profile = profileData;
    } else {
      // Fallback to auth.users for email
      try {
        const { data: { user: authUser } } = await adminClient.auth.admin.getUserById(user.id);
        if (authUser) {
          profile = {
            id: user.id,
            full_name: null,
            email: authUser.email || null,
            avatar_url: null,
          };
        }
      } catch (err) {
        console.error("Error fetching auth user:", err);
      }
    }

    // Create notifications for other users involved in this contract
    try {
      // Get contract details including owner
      const { data: contract } = await adminClient
        .from("contracts")
        .select("user_id, title")
        .eq("id", contractId)
        .single();

      // Get all users with share access to this contract
      const { data: shares } = await adminClient
        .from("contract_shares")
        .select("shared_with_user_id")
        .eq("contract_id", contractId);

      // Collect all user IDs to notify (excluding the commenter)
      const usersToNotify = new Set<string>();

      // Add owner if not the commenter
      if (contract?.user_id && contract.user_id !== user.id) {
        usersToNotify.add(contract.user_id);
      }

      // Add shared users if not the commenter
      if (shares) {
        for (const share of shares) {
          if (share.shared_with_user_id && share.shared_with_user_id !== user.id) {
            usersToNotify.add(share.shared_with_user_id);
          }
        }
      }

      // Get commenter display name
      const commenterName = profile?.full_name || profile?.email || "Someone";

      // Create notifications for each user
      const notifications = Array.from(usersToNotify).map((userId) => ({
        user_id: userId,
        type: "comment_added",
        title: "New comment",
        message: `${commenterName} commented on "${contract?.title || "a contract"}"`,
        contract_id: contractId,
        from_user_id: user.id,
        read: false,
      }));

      if (notifications.length > 0) {
        await adminClient.from("notifications").insert(notifications);
      }
    } catch (notifyErr) {
      // Don't fail the comment creation if notifications fail
      console.error("Error creating notifications:", notifyErr);
    }

    return NextResponse.json({
      comment: {
        ...comment,
        user: profile,
      }
    });
  } catch (err) {
    console.error("Server error creating comment:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}

// Delete a comment
export async function DELETE(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
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
    const commentId = searchParams.get("commentId");

    if (!commentId) {
      return NextResponse.json(
        { error: "Comment ID is required" },
        { status: 400 }
      );
    }

    // Delete the comment (RLS will handle permission check)
    const { error } = await supabase
      .from("contract_comments")
      .delete()
      .eq("id", commentId);

    if (error) {
      console.error("Error deleting comment:", error);
      return NextResponse.json(
        { error: "Failed to delete comment" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true });
  } catch (err) {
    console.error("Server error deleting comment:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
