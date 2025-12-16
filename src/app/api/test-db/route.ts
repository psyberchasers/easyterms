import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET() {
  try {
    const supabase = await createClient();
    
    // Check auth
    const { data: { user }, error: authError } = await supabase.auth.getUser();
    
    if (authError) {
      return NextResponse.json({
        status: "auth_error",
        error: authError.message,
        user: null
      });
    }
    
    if (!user) {
      return NextResponse.json({
        status: "not_authenticated",
        user: null
      });
    }

    // Try to query contracts
    const { data: contracts, error: queryError } = await supabase
      .from("contracts")
      .select("id, title")
      .limit(5);

    if (queryError) {
      return NextResponse.json({
        status: "query_error",
        error: queryError.message,
        user: { id: user.id, email: user.email }
      });
    }

    // Try a simple insert and delete (test write)
    const testId = crypto.randomUUID();
    const { error: insertError } = await supabase
      .from("contracts")
      .insert({
        id: testId,
        user_id: user.id,
        title: "TEST - DELETE ME",
        status: "active"
      });

    if (insertError) {
      return NextResponse.json({
        status: "insert_error",
        error: insertError.message,
        details: insertError,
        user: { id: user.id, email: user.email }
      });
    }

    // Delete the test record
    await supabase.from("contracts").delete().eq("id", testId);

    return NextResponse.json({
      status: "ok",
      user: { id: user.id, email: user.email },
      contractCount: contracts?.length || 0,
      message: "Database connection working!"
    });
  } catch (err) {
    return NextResponse.json({
      status: "error",
      error: err instanceof Error ? err.message : "Unknown error"
    }, { status: 500 });
  }
}



