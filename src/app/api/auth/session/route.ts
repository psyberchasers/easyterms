import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

const ALLOWED_ORIGINS = [
  process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000",
  "https://easyterms.app",
  "https://www.easyterms.app",
];

function getCorsHeaders(request?: Request) {
  const origin = request?.headers.get("origin") || "";
  const isAllowed = ALLOWED_ORIGINS.includes(origin) || origin.startsWith("chrome-extension://");
  return {
    "Access-Control-Allow-Origin": isAllowed ? origin : ALLOWED_ORIGINS[0],
    "Access-Control-Allow-Methods": "GET, OPTIONS",
    "Access-Control-Allow-Headers": "Content-Type, Authorization",
    "Access-Control-Allow-Credentials": "true",
  };
}

export async function OPTIONS(request: Request) {
  return NextResponse.json({}, { headers: getCorsHeaders(request) });
}

export async function GET(request: Request) {
  try {
    const supabase = await createClient();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session) {
      return NextResponse.json({ session: null }, { status: 401, headers: getCorsHeaders(request) });
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
    }, { headers: getCorsHeaders(request) });
  } catch (error) {
    console.error("Session API error:", error);
    return NextResponse.json({ error: "Failed to get session" }, { status: 500, headers: getCorsHeaders(request) });
  }
}
