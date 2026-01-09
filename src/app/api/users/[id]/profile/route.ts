import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();
    const adminClient = createAdminClient();

    // Get profile from profiles table
    const { data: profile } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", id)
      .single();

    // If we have profile data with email, return it
    if (profile?.email || profile?.full_name) {
      return NextResponse.json(profile);
    }

    // Fallback: get email from auth.users using admin client
    const { data: { user } } = await adminClient.auth.admin.getUserById(id);

    if (user?.email) {
      return NextResponse.json({
        full_name: profile?.full_name || null,
        email: user.email
      });
    }

    return NextResponse.json(
      { full_name: null, email: null },
      { status: 200 }
    );
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json(
      { full_name: null, email: null },
      { status: 200 }
    );
  }
}
