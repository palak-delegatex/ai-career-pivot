import { NextRequest, NextResponse } from "next/server";
import { sendDripEmail, TIER_THRESHOLDS, MILESTONE_EMAIL_STEP } from "@/lib/email-drip";
import { getSupabaseClient } from "@/lib/supabase";
import { randomBytes } from "crypto";
import { locales, defaultLocale } from "@/i18n/config";

function generateReferralCode(): string {
  return randomBytes(4).toString("hex");
}

function getNextTier(count: number): { name: string; count: number } | null {
  const thresholds = [1, 3, 5, 10];
  for (const t of thresholds) {
    if (count < t) return { name: TIER_THRESHOLDS[t], count: t };
  }
  return null;
}

function detectLocale(req: NextRequest): string {
  const acceptLang = req.headers.get("accept-language");
  if (!acceptLang) return defaultLocale;
  const preferred = acceptLang
    .split(",")
    .map((part) => {
      const [lang, q] = part.trim().split(";q=");
      return { lang: lang.trim().split("-")[0].toLowerCase(), q: q ? parseFloat(q) : 1 };
    })
    .sort((a, b) => b.q - a.q);
  for (const { lang } of preferred) {
    if ((locales as readonly string[]).includes(lang)) return lang;
  }
  return defaultLocale;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    const { name, email, persona, utm_source, utm_medium, utm_campaign } = body;

    // Read ref from query param
    const refCode = req.nextUrl.searchParams.get("ref") ?? null;
    const locale = body.locale && (locales as readonly string[]).includes(body.locale)
      ? body.locale
      : detectLocale(req);

    if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
      return NextResponse.json({ error: "Invalid email address" }, { status: 400 });
    }
    if (!name || name.trim().length === 0) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const trimmedName = name.trim();
    const trimmedEmail = email.toLowerCase().trim();
    const firstName = trimmedName.split(" ")[0];

    // next_email_at = 3 days from now (for Email 2 — Day 3)
    const nextEmailAt = new Date(Date.now() + 3 * 24 * 60 * 60 * 1000).toISOString();
    const referralCode = generateReferralCode();

    const supabase = getSupabaseClient();
    const { error } = await supabase.from("waitlist").insert({
      name: trimmedName,
      email: trimmedEmail,
      persona: persona || null,
      utm_source: utm_source || null,
      utm_medium: utm_medium || null,
      utm_campaign: utm_campaign || null,
      email_step: 2,
      next_email_at: nextEmailAt,
      referral_code: referralCode,
      referred_by: refCode || null,
      locale,
    });

    if (error) {
      if (error.code === "23505") {
        return NextResponse.json(
          { success: true, alreadyOnList: true },
          { status: 200 }
        );
      }
      console.error("Supabase insert error:", error);
      return NextResponse.json({ error: "Failed to join waitlist" }, { status: 500 });
    }

    // Handle referrer side effects (non-blocking)
    if (refCode) {
      handleReferral(refCode, firstName).catch((err) =>
        console.error("Referral handling error (non-fatal):", err)
      );
    }

    // Send Email 1 immediately with referral code (non-blocking)
    sendDripEmail(trimmedEmail, firstName, 1, { referralCode }, locale).catch((err) =>
      console.error("Email 1 send error (non-fatal):", err)
    );

    return NextResponse.json({ success: true, referralCode }, { status: 200 });
  } catch (err) {
    console.error("Waitlist route error:", err);
    return NextResponse.json({ error: "Server error" }, { status: 500 });
  }
}

async function handleReferral(refCode: string, newMemberFirstName: string) {
  const supabase = getSupabaseClient();
  const { data: referrer, error: fetchErr } = await supabase
    .from("waitlist")
    .select("id, name, email, referral_code, referral_count, current_tier, locale")
    .eq("referral_code", refCode)
    .single();

  if (fetchErr || !referrer) return;

  const newCount = (referrer.referral_count ?? 0) + 1;

  // Determine if a tier milestone was just crossed
  const prevTierKey = Object.keys(TIER_THRESHOLDS)
    .map(Number)
    .filter((t) => t <= referrer.referral_count)
    .sort((a, b) => b - a)[0];
  const newTierKey = Object.keys(TIER_THRESHOLDS)
    .map(Number)
    .filter((t) => t <= newCount)
    .sort((a, b) => b - a)[0];

  const newTier = newTierKey ? TIER_THRESHOLDS[newTierKey] : "none";
  const tierCrossed = newTierKey && newTierKey !== prevTierKey;

  // Update referrer count + tier
  await supabase
    .from("waitlist")
    .update({ referral_count: newCount, current_tier: newTier })
    .eq("referral_code", refCode);

  const referrerFirstName = (referrer.name ?? "there").split(" ")[0];
  const referrerLocale = (referrer.locale as string) || "en";
  const nextTier = getNextTier(newCount);

  // Send referral notification email (fires on every increment)
  await sendDripEmail(referrer.email, referrerFirstName, 8, {
    referralCode: referrer.referral_code,
    referralCount: newCount,
    referralName: newMemberFirstName,
    nextTierName: nextTier?.name,
    nextTierCount: nextTier?.count,
  }, referrerLocale);

  // Send milestone email if a new tier was crossed
  if (tierCrossed && MILESTONE_EMAIL_STEP[newTierKey]) {
    await sendDripEmail(referrer.email, referrerFirstName, MILESTONE_EMAIL_STEP[newTierKey], {
      referralCode: referrer.referral_code,
      referralCount: newCount,
    }, referrerLocale);
  }
}
