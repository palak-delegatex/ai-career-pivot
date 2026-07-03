import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  const [eventsRes, checkinRes, funnelRes] = await Promise.all([
    supabase
      .from("outcome_events")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(50),
    supabase
      .from("outcome_checkins")
      .select("*")
      .eq("user_email", email)
      .order("created_at", { ascending: false })
      .limit(1),
    supabase
      .from("outcome_events")
      .select("event_type")
      .eq("user_email", email)
      .in("event_type", [
        "application_submitted",
        "interview_scheduled",
        "offer_received",
        "transition_completed",
      ]),
  ]);

  if (eventsRes.error || checkinRes.error || funnelRes.error) {
    const msg =
      eventsRes.error?.message ??
      checkinRes.error?.message ??
      funnelRes.error?.message;
    return NextResponse.json({ error: msg }, { status: 500 });
  }

  const counts = { applications: 0, interviews: 0, offers: 0, transitions: 0 };
  for (const e of funnelRes.data ?? []) {
    if (e.event_type === "application_submitted") counts.applications++;
    else if (e.event_type === "interview_scheduled") counts.interviews++;
    else if (e.event_type === "offer_received") counts.offers++;
    else if (e.event_type === "transition_completed") counts.transitions++;
  }

  return NextResponse.json({
    data: {
      funnel: counts,
      recentEvents: eventsRes.data ?? [],
      latestCheckin: checkinRes.data?.[0] ?? null,
    },
  });
}
