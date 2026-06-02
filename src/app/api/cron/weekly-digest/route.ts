import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";

const DIGEST_INTERVAL_DAYS = 7;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = Date.now();
  const digestCutoff = new Date(now - DIGEST_INTERVAL_DAYS * 86400000).toISOString();

  const { data: reports, error } = await supabase
    .from("reports")
    .select("id, email, profile, plans, created_at, last_active_at")
    .gte("created_at", new Date(now - 90 * 86400000).toISOString())
    .limit(200);

  if (error) {
    console.error("Weekly digest query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!reports || reports.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Skip reports that already received a digest this week
  const reportIds = reports.map((r) => r.id);
  const { data: recentDigests } = await supabase
    .from("milestone_emails")
    .select("report_id")
    .in("report_id", reportIds)
    .eq("email_type", "weekly_digest")
    .gte("sent_at", digestCutoff);

  const recentlySentIds = new Set((recentDigests ?? []).map((d) => d.report_id));

  const INACTIVITY_DAYS = 7;
  const inactivityCutoff = new Date(now - INACTIVITY_DAYS * 86400000).toISOString();

  let digestSent = 0;
  let nudgeSent = 0;

  const tasks = reports
    .filter((r) => r.email && !recentlySentIds.has(r.id))
    .map(async (report) => {
      const firstName = (report.profile?.name as string | undefined)?.split(" ")[0] ?? "there";
      const plan = (report.plans as { targetRole?: string; sixMonthMilestones?: string[]; oneYearMilestones?: string[] }[] | undefined)?.[0];
      const targetRole = plan?.targetRole;
      const lastActive = report.last_active_at ?? report.created_at;
      const isInactive = lastActive < inactivityCutoff;

      if (isInactive) {
        const ok = await sendDripEmail(report.email, firstName, 14, {
          reportId: report.id,
          planIndex: 0,
        });
        if (ok) {
          nudgeSent++;
          await supabase.from("milestone_emails").insert({
            report_id: report.id,
            email: report.email,
            first_name: firstName,
            plan_index: 0,
            phase: "nudge",
            milestone_index: 0,
            milestone_text: "inactivity nudge",
            send_at: new Date().toISOString(),
            sent_at: new Date().toISOString(),
            email_type: "weekly_digest",
          });
        }
        return;
      }

      const { data: recentProgress } = await supabase
        .from("milestone_progress")
        .select("milestone_index, completed_at")
        .eq("report_id", report.id)
        .eq("completed", true)
        .gte("completed_at", digestCutoff);

      const completedCount = recentProgress?.length ?? 0;

      const { data: allProgress } = await supabase
        .from("milestone_progress")
        .select("phase, milestone_index, completed")
        .eq("report_id", report.id)
        .eq("plan_index", 0);

      const completedSet = new Set(
        (allProgress ?? []).filter((p) => p.completed).map((p) => `${p.phase}:${p.milestone_index}`)
      );

      const allMilestones = [
        ...(plan?.sixMonthMilestones ?? []).map((m, i) => ({ key: `sixMonth:${i}`, text: m })),
        ...(plan?.oneYearMilestones ?? []).map((m, i) => ({ key: `oneYear:${i}`, text: m })),
      ];

      const nextMilestone = allMilestones.find((m) => !completedSet.has(m.key));

      const ok = await sendDripEmail(report.email, firstName, 16, {
        reportId: report.id,
        planIndex: 0,
        ...(targetRole ? { targetRole } : {}),
        ...(nextMilestone ? { nextAction: nextMilestone.text } : {}),
        ...(completedCount > 0 ? { completedCount } : {}),
      } as Parameters<typeof sendDripEmail>[3]);

      if (ok) {
        digestSent++;
        await supabase.from("milestone_emails").insert({
          report_id: report.id,
          email: report.email,
          first_name: firstName,
          plan_index: 0,
          phase: "digest",
          milestone_index: 0,
          milestone_text: "weekly digest",
          send_at: new Date().toISOString(),
          sent_at: new Date().toISOString(),
          email_type: "weekly_digest",
        });
      }
    });

  await Promise.allSettled(tasks);

  return NextResponse.json({ digest: digestSent, nudges: nudgeSent });
}
