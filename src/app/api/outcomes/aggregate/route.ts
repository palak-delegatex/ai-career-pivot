import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET() {
  const supabase = getSupabaseClient();

  const [eventsRes, usersRes] = await Promise.all([
    supabase
      .from("outcome_events")
      .select("event_type, user_email")
      .in("event_type", [
        "application_submitted",
        "interview_scheduled",
        "offer_received",
        "transition_completed",
      ]),
    supabase
      .from("outcome_events")
      .select("user_email")
      .limit(10000),
  ]);

  if (eventsRes.error || usersRes.error) {
    const msg = eventsRes.error?.message ?? usersRes.error?.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const uniqueUsers = new Set(
    (usersRes.data ?? []).map((r) => r.user_email)
  ).size;

  const counts = { applications: 0, interviews: 0, offers: 0, transitions: 0 };
  for (const e of eventsRes.data ?? []) {
    if (e.event_type === "application_submitted") counts.applications++;
    else if (e.event_type === "interview_scheduled") counts.interviews++;
    else if (e.event_type === "offer_received") counts.offers++;
    else if (e.event_type === "transition_completed") counts.transitions++;
  }

  const interviewRate =
    counts.applications > 0 ? counts.interviews / counts.applications : 0;
  const offerRate =
    counts.interviews > 0 ? counts.offers / counts.interviews : 0;
  const transitionRate =
    counts.offers > 0 ? counts.transitions / counts.offers : 0;

  return NextResponse.json({
    data: {
      totalUsers: uniqueUsers,
      funnel: counts,
      rates: {
        interviewRate: Math.round(interviewRate * 1000) / 1000,
        offerRate: Math.round(offerRate * 1000) / 1000,
        transitionRate: Math.round(transitionRate * 1000) / 1000,
      },
    },
  });
}
