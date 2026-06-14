import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const statusFilter = req.nextUrl.searchParams.get("status");
  let query = supabase
    .from("follow_up_reminders")
    .select("*, contacts(id, name, company, role, strength_tier)")
    .eq("user_email", email)
    .order("due_date", { ascending: true });

  if (statusFilter === "pending") {
    query = query.eq("status", "pending");
  } else if (statusFilter === "done") {
    query = query.eq("status", "done");
  } else {
    query = query.in("status", ["pending", "snoozed"]);
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminders: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, contactId, description, due_date } = body;

  if (!email || !contactId || !due_date) {
    return NextResponse.json(
      { error: "email, contactId, and due_date required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();

  const { data: contact } = await supabase
    .from("contacts")
    .select("id")
    .eq("id", contactId)
    .eq("user_email", email)
    .single();

  if (!contact) {
    return NextResponse.json({ error: "contact not found" }, { status: 404 });
  }

  const { data, error } = await supabase
    .from("follow_up_reminders")
    .insert({
      contact_id: contactId,
      user_email: email,
      description: description ?? "",
      due_date,
      status: "pending",
    })
    .select("*, contacts(id, name, company, role, strength_tier)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminder: data }, { status: 201 });
}

export async function PATCH(req: NextRequest) {
  const body = await req.json();
  const { id, email, action } = body;

  if (!id || !email || !action) {
    return NextResponse.json(
      { error: "id, email, and action required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const allowed: Record<string, unknown> = {};

  if (action === "done") {
    allowed.status = "done";
  } else if (action === "snooze") {
    const snoozeDays = typeof body.days === "number" ? body.days : 3;
    const snoozeUntil = new Date();
    snoozeUntil.setDate(snoozeUntil.getDate() + snoozeDays);
    allowed.status = "snoozed";
    allowed.snooze_until = snoozeUntil.toISOString();
    allowed.due_date = snoozeUntil.toISOString();
  } else {
    return NextResponse.json(
      { error: "action must be 'done' or 'snooze'" },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("follow_up_reminders")
    .update(allowed)
    .eq("id", id)
    .eq("user_email", email)
    .select("*, contacts(id, name, company, role, strength_tier)")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ reminder: data });
}
