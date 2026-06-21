import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: users } = await supabase
    .from("auto_apply_preferences")
    .select("user_email")
    .eq("enabled", true)
    .limit(200);

  if (!users?.length) {
    return NextResponse.json({ sent: 0 });
  }

  const todayStart = new Date();
  todayStart.setUTCHours(0, 0, 0, 0);
  const todayISO = todayStart.toISOString();

  let sent = 0;
  let errors = 0;

  for (const user of users) {
    try {
      const [appliedResult, queuedResult, pendingResult] = await Promise.all([
        supabase
          .from("auto_apply_queue")
          .select("job_title, company, match_score")
          .eq("user_email", user.user_email)
          .eq("status", "applied")
          .gte("applied_at", todayISO),
        supabase
          .from("auto_apply_queue")
          .select("id", { count: "exact", head: true })
          .eq("user_email", user.user_email)
          .gte("created_at", todayISO),
        supabase
          .from("auto_apply_queue")
          .select("id", { count: "exact", head: true })
          .eq("user_email", user.user_email)
          .eq("status", "pending_review"),
      ]);

      const applied = appliedResult.data ?? [];
      const newQueued = queuedResult.count ?? 0;
      const pendingReview = pendingResult.count ?? 0;

      if (applied.length === 0 && newQueued === 0 && pendingReview === 0) continue;

      const { data: profile } = await supabase
        .from("user_profiles")
        .select("name")
        .eq("email", user.user_email)
        .single();

      const firstName = profile?.name?.split(" ")[0] ?? "there";

      const appliedSummary = applied.length > 0
        ? applied.map((a) => `• ${a.job_title} at ${a.company} (${a.match_score}% match)`).join("\n")
        : "No applications submitted today.";

      const ok = await sendDripEmail(user.user_email, firstName, 17, {
        appliedCount: applied.length,
        newQueued,
        pendingReview,
        appliedSummary,
      } as Parameters<typeof sendDripEmail>[3]);

      if (ok) sent++;
    } catch {
      errors++;
    }
  }

  return NextResponse.json({ sent, errors, total: users.length });
}
