import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";

const NUDGE_DELAY_DAYS = 14;
const CHECKIN_EMAIL_STEP = 13;
const NUDGE_EMAIL_STEP = 14;

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date().toISOString();

  // 1. Send due check-in emails
  const { data: dueEmails, error: fetchError } = await supabase
    .from("milestone_emails")
    .select("*")
    .is("sent_at", null)
    .eq("email_type", "checkin")
    .lte("send_at", now)
    .limit(50);

  if (fetchError) {
    console.error("Milestone email query error:", fetchError);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  let sentCount = 0;
  let failedCount = 0;

  if (dueEmails && dueEmails.length > 0) {
    const results = await Promise.allSettled(
      dueEmails.map(async (row) => {
        const locale = (row.locale as string) || "en";
        const sent = await sendDripEmail(row.email, row.first_name, CHECKIN_EMAIL_STEP, {
          milestoneName: row.milestone_text,
          reportId: row.report_id,
          planIndex: row.plan_index,
        }, locale);

        if (!sent) throw new Error(`Send failed for ${row.email}`);

        // Mark as sent and schedule a nudge in 14 days
        const nudgeSendAt = new Date(
          Date.now() + NUDGE_DELAY_DAYS * 24 * 60 * 60 * 1000
        ).toISOString();

        await supabase
          .from("milestone_emails")
          .update({ sent_at: new Date().toISOString() })
          .eq("id", row.id);

        await supabase.from("milestone_emails").insert({
          report_id: row.report_id,
          email: row.email,
          first_name: row.first_name,
          plan_index: row.plan_index,
          phase: row.phase,
          milestone_index: row.milestone_index,
          milestone_text: row.milestone_text,
          send_at: nudgeSendAt,
          email_type: "nudge",
          locale: row.locale || "en",
        });
      })
    );

    sentCount = results.filter((r) => r.status === "fulfilled").length;
    failedCount = results.filter((r) => r.status === "rejected").length;
  }

  // 2. Send due nudge emails (only if user hasn't marked progress)
  const { data: dueNudges, error: nudgeError } = await supabase
    .from("milestone_emails")
    .select("*")
    .is("sent_at", null)
    .eq("email_type", "nudge")
    .lte("send_at", now)
    .limit(50);

  if (nudgeError) {
    console.error("Nudge query error:", nudgeError);
  }

  let nudgeSent = 0;

  if (dueNudges && dueNudges.length > 0) {
    const nudgeResults = await Promise.allSettled(
      dueNudges.map(async (row) => {
        // Check if user has marked this milestone complete — skip nudge if so
        const { data: progress } = await supabase
          .from("milestone_progress")
          .select("completed")
          .eq("report_id", row.report_id)
          .eq("plan_index", row.plan_index)
          .eq("phase", row.phase)
          .eq("milestone_index", row.milestone_index)
          .single();

        if (progress?.completed) {
          await supabase
            .from("milestone_emails")
            .update({ sent_at: new Date().toISOString() })
            .eq("id", row.id);
          return;
        }

        const nudgeLocale = (row.locale as string) || "en";
        const sent = await sendDripEmail(row.email, row.first_name, NUDGE_EMAIL_STEP, {
          reportId: row.report_id,
          planIndex: row.plan_index,
        }, nudgeLocale);

        if (!sent) throw new Error(`Nudge send failed for ${row.email}`);

        await supabase
          .from("milestone_emails")
          .update({
            sent_at: new Date().toISOString(),
            nudge_count: (row.nudge_count ?? 0) + 1,
          })
          .eq("id", row.id);
      })
    );

    nudgeSent = nudgeResults.filter((r) => r.status === "fulfilled").length;
  }

  return NextResponse.json({
    checkins: { sent: sentCount, failed: failedCount },
    nudges: { sent: nudgeSent },
  });
}
