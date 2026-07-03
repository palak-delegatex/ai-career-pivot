import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

const VALID_STATUSES = [
  "actively_searching",
  "interviewing",
  "negotiating",
  "transitioned",
  "paused",
];

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("outcome_checkins")
    .select("*")
    .eq("user_email", email)
    .order("created_at", { ascending: false })
    .limit(12);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ data: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, status, current_role, transitioned, new_role, new_company, satisfaction, notes } = body;

  if (!email || !status) {
    return NextResponse.json({ error: "email and status required" }, { status: 400 });
  }

  if (!VALID_STATUSES.includes(status)) {
    return NextResponse.json({ error: "invalid status" }, { status: 400 });
  }

  if (satisfaction !== undefined && satisfaction !== null) {
    if (typeof satisfaction !== "number" || satisfaction < 1 || satisfaction > 5) {
      return NextResponse.json({ error: "satisfaction must be 1-5" }, { status: 400 });
    }
  }

  const supabase = getSupabaseClient();

  const { data, error } = await supabase
    .from("outcome_checkins")
    .insert({
      user_email: email,
      status,
      current_role: current_role ?? null,
      transitioned: transitioned ?? false,
      new_role: new_role ?? null,
      new_company: new_company ?? null,
      satisfaction: satisfaction ?? null,
      notes: notes ?? null,
    })
    .select()
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (transitioned && new_role) {
    await supabase.from("outcome_events").insert({
      user_email: email,
      event_type: "transition_completed",
      metadata: { new_role, new_company, source: "checkin" },
    });
  }

  return NextResponse.json({ data }, { status: 201 });
}
