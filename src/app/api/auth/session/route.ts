import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "GET, OPTIONS",
  "Access-Control-Allow-Headers": "Content-Type, Authorization",
  "Access-Control-Allow-Credentials": "true",
};

export async function OPTIONS() {
  return NextResponse.json({}, { headers: corsHeaders });
}

export async function GET() {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ session: null }, { status: 401, headers: corsHeaders });
    }

    // Return minimal session data for the extension
    return NextResponse.json({
      session: {
        access_token: session.access_token,
        refresh_token: session.refresh_token,
        user: {
          id: session.user.id,
          email: session.user.email,
        }
      }
    }, { headers: corsHeaders });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500, headers: corsHeaders });
  }
}
