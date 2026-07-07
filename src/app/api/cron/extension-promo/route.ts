import { createClient, type SupabaseClient } from "@supabase/supabase-js";
import { NextRequest, NextResponse } from "next/server";
import { sendExtensionPromoEmail } from "@/lib/email-drip";

// Extension-adoption email drip (AIC-758 / AIC-389 §3).
//
// Each daily run does two things:
//   1. ENROLL new eligible users — existing authenticated users (people who have
//      generated a report) who don't already have the extension and aren't yet
//      enrolled — into the `extension_promo_emails` sequence at step 1.
//   2. SEND due emails — rows with step 1..3 whose next_email_at has passed and
//      who still aren't installed. Day 0 → Day 3 → Day 7 cadence.
//
// "Has the extension" = at least one tracked_jobs row with source_type
// 'extension_clip' (the AIC-747 extension-sourced signal). That check gates both
// enrollment and every send, so the sequence self-suppresses the moment a user
// installs.

// step just sent → days until the next email
const NEXT_DELAY_DAYS: Record<number, number> = {
  1: 3, // Email 1 (Day 0) → Email 2 in 3 days (Day 3)
  2: 4, // Email 2 (Day 3) → Email 3 in 4 days (Day 7)
};

const ENROLL_SCAN_LIMIT = 200; // report rows scanned per run for new enrollees
const SEND_LIMIT = 50; // emails sent per run

function firstNameFrom(profile: unknown): string {
  const name = (profile as { name?: unknown })?.name;
  if (typeof name !== "string") return "there";
  return name.trim().split(" ")[0] || "there";
}

// Loosely-typed client (no generated Database types in this project).
type SupaClient = SupabaseClient;

// Which of the given emails already have an extension-sourced tracked job.
async function installedEmails(
  supabase: SupaClient,
  emails: string[]
): Promise<Set<string>> {
  if (emails.length === 0) return new Set();
  const { data } = await supabase
    .from("tracked_jobs")
    .select("user_email")
    .eq("source_type", "extension_clip")
    .in("user_email", emails);
  return new Set(
    ((data ?? []) as { user_email: string }[]).map((r) => r.user_email.toLowerCase())
  );
}

export async function GET(req: NextRequest) {
  const auth = req.headers.get("authorization");
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase: SupaClient = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY ?? process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
  );

  const now = new Date().toISOString();

  // ---- 1. Enroll new eligible users -------------------------------------
  let enrolled = 0;
  const { data: reportRows } = await supabase
    .from("reports")
    .select("email, profile")
    .order("created_at", { ascending: false })
    .limit(ENROLL_SCAN_LIMIT);

  if (reportRows && reportRows.length > 0) {
    // Dedupe by lowercased email, keeping the newest profile (rows are DESC).
    const byEmail = new Map<string, { email: string; profile: unknown }>();
    for (const row of reportRows) {
      const email = (row.email as string | null)?.toLowerCase().trim();
      if (!email) continue;
      if (!byEmail.has(email)) byEmail.set(email, { email, profile: row.profile });
    }
    const candidateEmails = [...byEmail.keys()];

    // Exclude anyone already enrolled...
    const { data: existing } = await supabase
      .from("extension_promo_emails")
      .select("email")
      .in("email", candidateEmails);
    const enrolledSet = new Set((existing ?? []).map((r) => (r.email as string).toLowerCase()));

    // ...and anyone who already has the extension.
    const installed = await installedEmails(supabase, candidateEmails);

    const toInsert = [...byEmail.values()]
      .filter(({ email }) => !enrolledSet.has(email) && !installed.has(email))
      .map(({ email, profile }) => ({
        email,
        first_name: firstNameFrom(profile),
        step: 1,
        next_email_at: now,
      }));

    if (toInsert.length > 0) {
      // Ignore duplicates in case of a concurrent run (unique email constraint).
      const { error: insertError } = await supabase
        .from("extension_promo_emails")
        .upsert(toInsert, { onConflict: "email", ignoreDuplicates: true });
      if (insertError) console.error("Extension-promo enroll error:", insertError.message);
      else enrolled = toInsert.length;
    }
  }

  // ---- 2. Send due emails ------------------------------------------------
  const { data: due, error: dueError } = await supabase
    .from("extension_promo_emails")
    .select("id, email, first_name, step")
    .eq("installed", false)
    .gte("step", 1)
    .lte("step", 3)
    .lte("next_email_at", now)
    .limit(SEND_LIMIT);

  if (dueError) {
    console.error("Extension-promo due query error:", dueError.message);
    return NextResponse.json({ error: "DB error" }, { status: 500 });
  }

  if (!due || due.length === 0) {
    return NextResponse.json({ enrolled, sent: 0 });
  }

  // Suppress anyone who installed since enrollment (re-check right before send).
  const nowInstalled = await installedEmails(
    supabase,
    due.map((r) => (r.email as string).toLowerCase())
  );

  const results = await Promise.allSettled(
    due.map(async (row) => {
      const email = row.email as string;
      const step = row.step as number;

      if (nowInstalled.has(email.toLowerCase())) {
        await supabase
          .from("extension_promo_emails")
          .update({ installed: true, updated_at: new Date().toISOString() })
          .eq("id", row.id);
        return { email, suppressed: true };
      }

      const sent = await sendExtensionPromoEmail(email, row.first_name as string, step);
      if (!sent) throw new Error(`Send failed for ${email} step ${step}`);

      const delayDays = NEXT_DELAY_DAYS[step];
      const nextEmailAt = delayDays
        ? new Date(Date.now() + delayDays * 24 * 60 * 60 * 1000).toISOString()
        : null;

      const { error: updateError } = await supabase
        .from("extension_promo_emails")
        .update({
          step: step + 1, // 4 = done
          next_email_at: nextEmailAt ?? now, // step 4 never re-selected (step>3)
          updated_at: new Date().toISOString(),
        })
        .eq("id", row.id);

      if (updateError) throw new Error(`Update failed for ${row.id}: ${updateError.message}`);
      return { email, step };
    })
  );

  const sent = results.filter(
    (r) => r.status === "fulfilled" && !(r.value as { suppressed?: boolean }).suppressed
  ).length;
  const suppressed = results.filter(
    (r) => r.status === "fulfilled" && (r.value as { suppressed?: boolean }).suppressed
  ).length;
  const failed = results
    .filter((r) => r.status === "rejected")
    .map((r) => (r as PromiseRejectedResult).reason?.message);

  if (failed.length) console.error("Extension-promo failures:", failed);

  return NextResponse.json({ enrolled, sent, suppressed, failed: failed.length });
}
