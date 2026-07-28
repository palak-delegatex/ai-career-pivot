import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// AIC-828: persist + list mock-interview delivery scorecards so the mock becomes
// a saved, comparable report. Email-keyed through the service-role client, same
// as /api/job-tracker — the browser never touches the table directly.

// Cap the trend history we return so the query stays cheap as sessions pile up.
const HISTORY_LIMIT = 50;

const SESSION_COLUMNS =
  "id, target_role, interview_type, input_mode, questions_answered, filler_count, filler_pct, wpm, duration_seconds, overall_score, jd_fit_score, created_at";

function toIntOrNull(value: unknown, min: number, max: number): number | null {
  if (typeof value !== "number" || !Number.isFinite(value)) return null;
  return Math.min(max, Math.max(min, Math.round(value)));
}

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .select(SESSION_COLUMNS)
    .eq("user_email", email)
    .order("created_at", { ascending: false })
    .limit(HISTORY_LIMIT);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ sessions: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { email, targetRole, interviewType } = body;

  if (!email || !targetRole) {
    return NextResponse.json({ error: "email and targetRole required" }, { status: 400 });
  }

  const inputMode = body.inputMode === "voice" ? "voice" : "text";

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("interview_sessions")
    .insert({
      user_email: email,
      target_role: String(targetRole).slice(0, 200),
      interview_type: typeof interviewType === "string" ? interviewType : null,
      input_mode: inputMode,
      questions_answered: toIntOrNull(body.questionsAnswered, 0, 50),
      filler_count: toIntOrNull(body.fillerCount, 0, 100000),
      filler_pct: toIntOrNull(body.fillerPct, 0, 100),
      wpm: toIntOrNull(body.wpm, 0, 100000),
      duration_seconds: toIntOrNull(body.durationSeconds, 0, 100000),
      overall_score: toIntOrNull(body.overallScore, 0, 100),
      jd_fit_score: toIntOrNull(body.jdFitScore, 0, 10),
    })
    .select(SESSION_COLUMNS)
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ session: data });
}
