import { createClient } from "@/lib/supabase/server";
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

    // Fetch comments with user profile info
    const { data: comments, error } = await supabase
      .from("contract_comments")
      .select(`
        id,
        content,
        clause_reference,
        parent_id,
        created_at,
        updated_at,
        user_id,
        user:profiles!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
      .eq("contract_id", contractId)
      .order("created_at", { ascending: true });

    if (error) {
      console.error("Error fetching comments:", error);
      return NextResponse.json(
        { error: "Failed to fetch comments" },
        { status: 500 }
      );
    }

    // Transform the data to handle Supabase's array format for joined relations
    const transformed = (comments || []).map((c: any) => ({
      ...c,
      user: Array.isArray(c.user) ? c.user[0] : c.user,
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
      .select(`
        id,
        content,
        clause_reference,
        parent_id,
        created_at,
        updated_at,
        user_id,
        user:profiles!user_id (
          id,
          full_name,
          email,
          avatar_url
        )
      `)
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

    // Transform user data
    const transformed = {
      ...comment,
      user: Array.isArray(comment.user) ? comment.user[0] : comment.user,
    };

    return NextResponse.json({ comment: transformed });
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
