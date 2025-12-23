import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET - Fetch all dates for a contract
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns this contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, user_id")
    .eq("id", contractId)
    .single();

  if (!contract || contract.user_id !== user.id) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  // Fetch dates
  const { data: dates, error } = await supabase
    .from("contract_dates")
    .select("*")
    .eq("contract_id", contractId)
    .order("date", { ascending: true });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ dates });
}

// POST - Add a new date
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Verify user owns this contract
  const { data: contract } = await supabase
    .from("contracts")
    .select("id, user_id")
    .eq("id", contractId)
    .single();

  if (!contract || contract.user_id !== user.id) {
    return NextResponse.json({ error: "Contract not found" }, { status: 404 });
  }

  const body = await request.json();
  const { date_type, date, description, alert_days_before } = body;

  if (!date_type || !date) {
    return NextResponse.json({ error: "date_type and date are required" }, { status: 400 });
  }

  const { data: newDate, error } = await supabase
    .from("contract_dates")
    .insert({
      contract_id: contractId,
      date_type,
      date,
      description,
      alert_days_before: alert_days_before || 30,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ date: newDate });
}

// DELETE - Remove a date
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id: contractId } = await params;
  const supabase = await createClient();

  const { data: { user } } = await supabase.auth.getUser();
  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const dateId = searchParams.get("dateId");

  if (!dateId) {
    return NextResponse.json({ error: "dateId is required" }, { status: 400 });
  }

  // Verify user owns this contract through the date
  const { error } = await supabase
    .from("contract_dates")
    .delete()
    .eq("id", dateId)
    .eq("contract_id", contractId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ success: true });
}





