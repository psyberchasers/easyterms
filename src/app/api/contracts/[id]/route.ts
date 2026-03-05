import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { maybeDecryptText } from "@/lib/encryption";

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { data: contract, error } = await supabase
    .from("contracts")
    .select("*")
    .eq("id", contractId)
    .single();

  if (error || !contract) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  if (contract.user_id !== user.id) {
    return NextResponse.json({ error: "Forbidden" }, { status: 403 });
  }

  // Decrypt extracted_text before returning
  contract.extracted_text = maybeDecryptText(contract.extracted_text);

  return NextResponse.json({ contract });
}
