import { createClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendLaunchEmail, type LaunchSubjectVariant } from "@/lib/email-drip";

const BATCH_SIZE = 50;
const BATCH_DELAY_MS = 1000;

export async function POST(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await req.json().catch(() => ({}));
  const dryRun = body.dryRun === true;
  const abTestEnabled = body.abTest !== false;

  const supabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const { data: rows, error } = await supabase
    .from("waitlist")
    .select("id, name, email")
    .order("created_at", { ascending: true });

  if (error) {
    console.error("Broadcast query error:", error);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!rows || rows.length === 0) {
    return NextResponse.json({ sent: 0, total: 0 });
  }

  if (dryRun) {
    return NextResponse.json({
      dryRun: true,
      total: rows.length,
      sampleRecipients: rows.slice(0, 5).map((r) => ({
        email: r.email,
        name: r.name,
      })),
      abTest: abTestEnabled,
      variants: abTestEnabled ? { A: "50%", B: "25%", C: "25%" } : { A: "100%" },
    });
  }

  function pickVariant(index: number): LaunchSubjectVariant {
    if (!abTestEnabled) return "A";
    // 50% A, 25% B, 25% C
    const bucket = index % 4;
    if (bucket < 2) return "A";
    if (bucket === 2) return "B";
    return "C";
  }

  let sent = 0;
  let failed = 0;
  const variantCounts: Record<string, number> = { A: 0, B: 0, C: 0 };

  for (let i = 0; i < rows.length; i += BATCH_SIZE) {
    const batch = rows.slice(i, i + BATCH_SIZE);
    const results = await Promise.allSettled(
      batch.map(async (row, batchIdx) => {
        const firstName = (row.name as string).split(" ")[0];
        const variant = pickVariant(i + batchIdx);
        const ok = await sendLaunchEmail(row.email, firstName, variant);
        if (!ok) throw new Error(`Failed: ${row.email}`);
        variantCounts[variant]++;
        return row.email;
      })
    );

    sent += results.filter((r) => r.status === "fulfilled").length;
    failed += results.filter((r) => r.status === "rejected").length;

    if (i + BATCH_SIZE < rows.length) {
      await new Promise((resolve) => setTimeout(resolve, BATCH_DELAY_MS));
    }
  }

  await supabase
    .from("waitlist")
    .update({ launch_email_sent: true, launch_email_sent_at: new Date().toISOString() })
    .in("id", rows.map((r) => r.id));

  return NextResponse.json({ sent, failed, total: rows.length, variantCounts });
}
