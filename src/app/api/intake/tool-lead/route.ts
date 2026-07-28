import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail } from "@/lib/email-drip";
import { getSupabaseClient } from "@/lib/supabase";
import { randomBytes } from "crypto";

/**
 * Standalone free-tool lead capture (AIC-839, pairs with AIC-838 design).
 *
 * The standalone SEO tools (/linkedin-optimizer, /ats-score, /cover-letter,
 * /resume-generator, /gap-analysis, /mock-interview) captured nothing — all
 * that traffic left no lead. This route turns a tool visitor into a nurtured
 * lead by enrolling their email into the SAME waitlist drip machine the
 * homepage waitlist uses (see /api/waitlist), tagged by `source` (the tool
 * slug) for funnel attribution, then firing the welcome email immediately.
 *
 * It deliberately reuses the existing `waitlist` table + `sendDripEmail`
 * pipeline rather than a new table (prod DDL is human-gated): tool leads flow
 * straight into the proven nurture sequence and are segmentable in PostHog /
 * Supabase by `utm_campaign` = the source tool.
 *
 * Modeled on the deferred capture pattern in /api/intake/free-email, but with
 * no snapshot dependency — the tool pages have no FreeSnapshot to send.
 */

function generateReferralCode(): string {
  return randomBytes(4).toString("hex");
}

// Derive a friendly first name from the email local-part when the tool didn't
// collect one (tools capture email only). "jane.doe@x.com" → "Jane". Falls back
// to "there" (the same lenient default the drip templates use).
function nameFromEmail(email: string): string {
  const local = email.split("@")[0] ?? "";
  const first = local.split(/[.\-_+0-9]/).filter(Boolean)[0] ?? "";
  if (!first) return "there";
  return first.charAt(0).toUpperCase() + first.slice(1);
}

export async function POST(req: NextRequest) {
  let body: { email?: string; source?: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body" }, { status: 400 });
  }

  const email = body.email?.toLowerCase().trim() ?? "";
  const source = (body.source ?? "").trim().slice(0, 64) || "free_tool";

  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "A valid email is required" }, { status: 400 });
  }

  const firstName = nameFromEmail(email);
  const referralCode = generateReferralCode();
  // Mirror /api/waitlist: enroll at step 2 with the next drip email due in 3
  // days, and send Email 1 (welcome) immediately below.
  const nextEmailAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();

  const supabase = getSupabaseClient();
  const { error } = await supabase.from("waitlist").insert({
    name: firstName,
    email,
    persona: source,
    utm_source: "free_tool",
    utm_medium: "tool_email_capture",
    utm_campaign: source,
    email_step: 2,
    next_email_at: nextEmailAt,
    referral_code: referralCode,
  });

  if (error) {
    // 23505 = unique_violation: already captured. Idempotent success — never
    // block the visitor's confirmation just because we've seen them before.
    if (error.code === "23505") {
      return NextResponse.json({ ok: true, alreadyCaptured: true });
    }
    console.error(`tool-lead insert error (${source}, ${email}):`, error);
    return NextResponse.json({ error: "Failed to capture email" }, { status: 500 });
  }

  // Fire-and-forget welcome email; never block the confirmation on the provider.
  sendDripEmail(email, firstName, 1, { referralCode }).catch(() => {});

  return NextResponse.json({ ok: true });
}
