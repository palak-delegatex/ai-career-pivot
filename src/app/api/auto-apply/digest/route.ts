import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const { data: pending } = await supabase
    .from("auto_apply_queue")
    .select("*")
    .eq("user_email", email)
    .eq("status", "pending_review")
    .order("match_score", { ascending: false })
    .limit(10);

  const { data: recentlyApplied } = await supabase
    .from("auto_apply_queue")
    .select("*")
    .eq("user_email", email)
    .eq("status", "applied")
    .order("applied_at", { ascending: false })
    .limit(5);

  const { data: stats } = await supabase
    .from("auto_apply_queue")
    .select("status")
    .eq("user_email", email);

  const counts = {
    pending_review: 0,
    approved: 0,
    rejected: 0,
    applied: 0,
    skipped: 0,
  };

  for (const row of stats ?? []) {
    const s = row.status as keyof typeof counts;
    if (s in counts) counts[s]++;
  }

  const { data: feedbackStats } = await supabase
    .from("auto_apply_feedback")
    .select("action")
    .eq("user_email", email);

  const approvalRate =
    feedbackStats && feedbackStats.length > 0
      ? Math.round(
          (feedbackStats.filter(
            (f) => f.action === "approved" || f.action === "applied"
          ).length /
            feedbackStats.length) *
            100
        )
      : 0;

  return NextResponse.json({
    pending: pending ?? [],
    recentlyApplied: recentlyApplied ?? [],
    counts,
    approvalRate,
    totalFeedback: feedbackStats?.length ?? 0,
  });
}
