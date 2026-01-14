import { createClient } from "@/lib/supabase/server";
import { NextRequest, NextResponse } from "next/server";

// Add a message to a conversation
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: conversationId } = await params;
    const supabase = await createClient();

    const { data: { user }, error: authError } = await supabase.auth.getUser();

    if (authError || !user) {
      return NextResponse.json(
        { error: "Not authenticated" },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { content, isFromUser, messageType, fileName, analysis, attachedContractIds } = body;

    if (!content) {
      return NextResponse.json(
        { error: "Content is required" },
        { status: 400 }
      );
    }

    // Insert the message (RLS policy checks conversation ownership)
    const { data, error } = await supabase
      .from("chat_messages")
      .insert({
        conversation_id: conversationId,
        content,
        is_from_user: isFromUser ?? true,
        message_type: messageType || "text",
        file_name: fileName,
        analysis: analysis,
        attached_contract_ids: attachedContractIds,
      })
      .select("id, content, is_from_user, message_type, file_name, analysis, attached_contract_ids, created_at")
      .single();

    if (error) {
      console.error("Error adding message:", error);
      return NextResponse.json(
        { error: error.message },
        { status: 500 }
      );
    }

    return NextResponse.json({ message: data });
  } catch (err) {
    console.error("Server error adding message:", err);
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
