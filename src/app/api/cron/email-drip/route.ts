import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";

// Step → days until the NEXT email after this one
const NEXT_DELAY_DAYS: Record<number, number> = {
  2: 4, // Email 2 sent (Day 3) → Email 3 in 4 days (Day 7)
  3: 7, // Email 3 sent (Day 7) → Email 4 in 7 days (Day 14)
  4: 7, // Email 4 sent (Day 14) → Email 5 in 7 days (Day 21)
};

export async function GET(req: NextRequest) {
  // Verify Vercel cron secret
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  // Fetch up to 50 subscribers due for their next email
  const now = new Date().toISOString();
  const { data: rows, error } = await supabase
    .from("waitlist")
    .select("id, name, email, email_step")
    .gte("email_step", 2)
    .lte("email_step", 5)
    .lte("next_email_at", now)
    .limit(50);

  if (error) {
    console.error("Drip query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ sent: 0 });
  }

  const results = await Promise.allSettled(
    rows.map(async (row) => {
      const firstName = (row.name as string).split(" ")[0];
      const step = row.email_step as number;

      const sent = await sendDripEmail(row.email, firstName, step);
      if (!sent) throw new Error(`Send failed for ${row.email} step ${step}`);

      // Determine next state
      const nextStep = step + 1;
      const delayDays = NEXT_DELAY_DAYS[step];
      const nextEmailAt = delayDays
        ? new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: updateError } = await supabase
        .from("waitlist")
        .update({ email_step: nextStep, next_email_at: nextEmailAt })
        .eq("id", row.id);

      if (updateError) throw new Error(`Update failed for ${row.id}: ${updateError.message}`);
      return { email: row.email, step };
    })
  );

  const sent = results.filter((r) => r.status === "fulfilled").length;
  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => (r as PromiseRejectedResult).reason?.message);

  if (failed.length) console.error("Drip failures:", failed);

  return NextResponse.json({ sent, failed: failed.length });
}
