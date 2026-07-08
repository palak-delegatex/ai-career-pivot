import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendPlanRecoveryEmail } from "@/lib/email-drip";
import { isSchemaDriftError } from "@/lib/schema-drift";

// A plan_lead is created the moment someone generates a free career plan. If
// they never start checkout (no order row at all) within the window, nudge them
// once. AIC-691, follow-up to AIC-437: 66.7% generate a plan but never check out.
//
// Window: older than RECOVER_AFTER_MS (give them time to come back on their own)
// but younger than RECOVER_WITHIN_MS (don't cold-email stale leads). The
// recovery_email_sent_at / converted_at columns guard against re-sends.
const RECOVER_AFTER_MS = 60 * 60 * 1000; // 1 hour
const RECOVER_WITHIN_MS = 72 * 60 * 60 * 1000; // 3 days

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role: plan_leads is service_role-only under RLS.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("plan-recovery: Supabase service credentials missing");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const supabase = createClient(url, serviceKey);

  const now = Date.now();
  const olderThan = new Date(now - RECOVER_AFTER_MS).toISOString();
  const newerThan = new Date(now - RECOVER_WITHIN_MS).toISOString();

  const { data: rows, error } = await supabase
    .from("plan_leads")
    .select("id, email, name, created_at")
    .is("recovery_email_sent_at", null)
    .is("converted_at", null)
    .lte("created_at", olderThan)
    .gte("created_at", newerThan)
    .limit(50);

  if (error) {
    // plan_leads table not present until the migration is applied in prod.
    // Skip cleanly; the cron self-heals once the DDL lands.
    if (isSchemaDriftError(error)) {
      console.warn("plan-recovery: schema drift, skipping run:", error.message);
      return NextResponse.json({ sent: 0, skipped: "schema_drift" });
    }
    console.error("plan-recovery query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Anyone who reached checkout has an order row (pending or paid) — the
  // checkout-recovery cron owns those. Exclude them here and mark converted so
  // we never double-nudge across the two recovery paths.
  const emails = rows.map((r) => (r.email as string).toLowerCase());
  const { data: orders } = await supabase
    .from("orders")
    .select("email")
    .in("email", emails);
  const inCheckout = new Set(
    (orders ?? []).map((o) => (o.email as string).toLowerCase())
  );

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const email = row.email as string;
      const nowIso = new Date().toISOString();

      if (inCheckout.has(email.toLowerCase())) {
        await supabase
          .from("plan_leads")
          .update({ converted_at: nowIso })
          .eq("id", row.id);
        return { email, skipped: true };
      }

      const sent = await sendPlanRecoveryEmail(email, (row.name as string) ?? undefined);
      if (!sent) throw new Error(`Plan recovery send failed for ${email}`);

      const { error: updateError } = await supabase
        .from("plan_leads")
        .update({ recovery_email_sent_at: nowIso })
        .eq("id", row.id);
      if (updateError) throw new Error(`Update failed for ${row.id}: ${updateError.message}`);

      return { email };
    })
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && !(r.value as { skipped?: boolean }).skipped
  ).length;
  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => (r as PromiseRejectedResult).reason?.message);

  if (failed.length) console.error("plan-recovery failures:", failed);

  return NextResponse.json({ sent, failed: failed.length });
}
