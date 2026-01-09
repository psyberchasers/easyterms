import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const supabase = await createClient();

    // Get profile from profiles table
    const { data: profile, error } = await supabase
      .from("profiles")
      .select("full_name, email")
      .eq("id", id)
      .single();

    if (error || !profile) {
      return NextResponse.json(
        { full_name: null, email: null },
        { status: 200 }
      );
    }

    return NextResponse.json(profile);
  } catch (err) {
    console.error("Profile fetch error:", err);
    return NextResponse.json(
      { full_name: null, email: null },
      { status: 200 }
    );
  }
}
