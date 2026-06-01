import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const reportId = req.nextUrl.searchParams.get("reportId");
  const planIndex = req.nextUrl.searchParams.get("planIndex");

  if (!reportId || planIndex === null) {
    return NextResponse.json(
      { error: "Missing reportId or planIndex" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("badges_earned")
    .select("badge_key, earned_at")
    .eq("report_id", reportId)
    .eq("plan_index", Number(planIndex));

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ badges: data ?? [] });
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { reportId, planIndex, badgeKey } = body;

  if (!reportId || planIndex === undefined || !badgeKey) {
    return NextResponse.json(
      { error: "Missing required fields" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("badges_earned").upsert(
    {
      report_id: reportId,
      plan_index: planIndex,
      badge_key: badgeKey,
    },
    { onConflict: "report_id,plan_index,badge_key" }
  );

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  return NextResponse.json({ ok: true });
}
