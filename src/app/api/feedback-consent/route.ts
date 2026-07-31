import { NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";

// Feedback-consent capture (AIC-893). Persists exactly what the user agreed to
// at the post-assessment / post-onboarding prompt so the honest social-proof
// program can later surface REAL, consented feedback (never fabricated).
//
// Degrades gracefully: if the `feedback_consent` table isn't applied yet (prod
// DDL is applied by a human — see migration 024), we still return ok so the UX
// isn't broken; nothing is fabricated, we just haven't persisted.
export const dynamic = "force-dynamic";

const VALID_CONSENT = ["named", "anonymous", "declined"] as const;
type Consent = (typeof VALID_CONSENT)[number];

interface Body {
  email?: string;
  consent?: string;
  firstName?: string;
  role?: string;
  source?: string;
}

export async function POST(req: Request) {
  let body: Body;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const consent = body.consent as Consent | undefined;
  if (!consent || !VALID_CONSENT.includes(consent)) {
    return NextResponse.json(
      { error: `consent must be one of: ${VALID_CONSENT.join(", ")}` },
      { status: 400 }
    );
  }

  const email = body.email?.toLowerCase().trim();
  if (!email) {
    return NextResponse.json({ error: "email is required" }, { status: 400 });
  }

  // Only retain attribution fields for the consent level that permits them.
  const firstName = consent === "named" ? body.firstName?.trim() || null : null;
  const role = consent === "named" ? body.role?.trim() || null : null;

  try {
    const supabase = getSupabaseClient();
    const { error } = await supabase.from("feedback_consent").upsert(
      {
        email,
        consent,
        first_name: firstName,
        role,
        source: body.source?.trim() || null,
      },
      { onConflict: "email" }
    );

    if (error) {
      // 42P01 = undefined_table: migration not applied yet. Not a client error.
      const missingTable = error.code === "42P01";
      if (!missingTable) console.error("feedback_consent upsert error:", error.message);
      return NextResponse.json({ ok: true, persisted: false });
    }

    return NextResponse.json({ ok: true, persisted: true });
  } catch (e) {
    console.error("feedback_consent route error:", e instanceof Error ? e.message : e);
    return NextResponse.json({ ok: true, persisted: false });
  }
}
