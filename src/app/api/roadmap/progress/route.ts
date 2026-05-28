import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");
  const planIndex = req.nextUrl.searchParams.get("planIndex");

  if (!reportId || planIndex === null) {
    return NextResponse.json({ error: "Missing reportId or planIndex" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("milestone_progress")
    .select("phase, milestone_index, completed, notes, completed_at")
    .eq("report_id", reportId)
    .eq("plan_index", Number(planIndex));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ progress: data });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reportId, planIndex, phase, milestoneIndex, completed, notes } = body;

  if (!reportId || planIndex === undefined || !phase || milestoneIndex === undefined) {
    return NextResponse.json({ error: "Missing required fields" }, { status: 400 });
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("milestone_progress")
    .upsert(
      {
        report_id: reportId,
        plan_index: planIndex,
        phase,
        milestone_index: milestoneIndex,
        completed: !!completed,
        notes: notes ?? null,
        completed_at: completed ? new Date().toISOString() : null,
      },
      { onConflict: "report_id,plan_index,phase,milestone_index" }
    );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
