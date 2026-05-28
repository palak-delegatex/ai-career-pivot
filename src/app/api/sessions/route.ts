import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");
  const planIndex = req.nextUrl.searchParams.get("planIndex");

  if (!reportId) {
    return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const query = supabase
    .from("conversation_sessions")
    .select("id, report_id, plan_index, messages, summary, created_at, updated_at")
    .eq("report_id", reportId)
    .order("updated_at", { ascending: false });

  if (planIndex !== null) {
    query.eq("plan_index", Number(planIndex));
  }

  const { data, error } = await query;

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data });
}

export async function POST(req: NextRequest) {
  const { reportId, planIndex, messages, summary } = await req.json();

  if (!reportId) {
    return NextResponse.json({ error: "Missing reportId" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("conversation_sessions")
    .insert({
      report_id: reportId,
      plan_index: planIndex ?? 0,
      messages: messages ?? [],
      summary: summary ?? null,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessionId: data.id });
}

export async function PATCH(req: NextRequest) {
  const { sessionId, messages, summary } = await req.json();

  if (!sessionId) {
    return NextResponse.json({ error: "Missing sessionId" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const update: Record<string, unknown> = {};
  if (messages !== undefined) update.messages = messages;
  if (summary !== undefined) update.summary = summary;

  const { error } = await supabase
    .from("conversation_sessions")
    .update(update)
    .eq("id", sessionId);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
