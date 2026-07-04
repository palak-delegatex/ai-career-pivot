import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendCheckoutRecoveryEmail } from "@/lib/email-drip";

// An order sits in 'pending' from the moment we create the Stripe session until
// the webhook (or verify endpoint) marks it 'paid'. If it's still pending after
// a grace period, the buyer abandoned or hit an error — nudge them once.
//
// Window: older than RECOVER_AFTER_MS (give real payments time to settle) but
// younger than RECOVER_WITHIN_MS (don't cold-email stale rows, e.g. on first
// deploy). recovery_email_sent_at guards against double-sends.
const RECOVER_AFTER_MS = 60 * 60 * 1000; // 1 hour
const RECOVER_WITHIN_MS = 24 * 60 * 60 * 1000; // 24 hours

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Service role: orders is service_role-only under RLS.
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceKey) {
    console.error("checkout-recovery: Supabase service credentials missing");
    return NextResponse.json({ error: "Server not configured" }, { status: 500 });
  }
  const supabase = createClient(url, serviceKey);

  const now = Date.now();
  const olderThan = new Date(now - RECOVER_AFTER_MS).toISOString();
  const newerThan = new Date(now - RECOVER_WITHIN_MS).toISOString();

  const { data: rows, error } = await supabase
    .from("orders")
    .select("id, email, plan_type, created_at")
    .eq("status", "pending")
    .is("recovery_email_sent_at", null)
    .lte("created_at", olderThan)
    .gte("created_at", newerThan)
    .limit(50);

  if (error) {
    console.error("checkout-recovery query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  // Guard against duplicate sends when the same email has multiple pending
  // orders in the window — one nudge per person per run.
  const seen = new Set<string>();

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const email = row.email as string;
      const planType = (row.plan_type as string) ?? "report";

      if (seen.has(email.toLowerCase())) {
        // Still stamp the row so it isn't re-queried next run.
        await supabase
          .from("orders")
          .update({ recovery_email_sent_at: new Date().toISOString() })
          .eq("id", row.id);
        return { email, skipped: true };
      }
      seen.add(email.toLowerCase());

      const sent = await sendCheckoutRecoveryEmail(email, planType);
      if (!sent) throw new Error(`Recovery send failed for ${email}`);

      const { error: updateError } = await supabase
        .from("orders")
        .update({ recovery_email_sent_at: new Date().toISOString() })
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

  if (failed.length) console.error("checkout-recovery failures:", failed);

  return NextResponse.json({ sent, failed: failed.length });
}
