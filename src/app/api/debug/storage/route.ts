import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

export async function GET(request: Request) {
  try {
    const url = new URL(request.url);
    const folder = url.searchParams.get("folder") || "";

    const supabase = await createClient();

    // List files in the contracts bucket
    const { data, error } = await supabase.storage
      .from("contracts")
      .list(folder, { limit: 100 });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({
      folder,
      files: data
    });
  } catch (err) {
    return NextResponse.json(
      { error: err instanceof Error ? err.message : "Unknown error" },
      { status: 500 }
    );
  }
}
