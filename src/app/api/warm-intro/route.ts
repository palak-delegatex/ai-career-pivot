import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { hasPaidAccess } from "@/lib/entitlement";

// Warm-Intro / Insider Connections (AIC-769) — surface likely 1-hop connections
// at a tracked job's company, sourced from the user's own networking CRM.
// Free users get only the teaser (count + strongest tier); paid users get the
// contact list. Contact PII is gated SERVER-SIDE so free users never receive it.

const TIER_RANK: Record<string, number> = { strong: 0, warm: 1, new: 2, cold: 3 };

export async function GET(req: NextRequest) {
  const email = req.nextUrl.searchParams.get("email");
  const company = req.nextUrl.searchParams.get("company");
  if (!email || !company) {
    return NextResponse.json(
      { error: "email and company required" },
      { status: 400 }
    );
  }

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("contacts")
    .select("id, name, role, company, linkedin_url, strength_tier, strength_score")
    .eq("user_email", email)
    .ilike("company", company);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const target = company.trim().toLowerCase();
  const matches = (data ?? [])
    // ilike can over-match on short/substring company names — require an exact
    // (case-insensitive) company match, then surface strongest ties first.
    .filter((c) => c.company?.trim().toLowerCase() === target)
    .sort(
      (a, b) =>
        (TIER_RANK[a.strength_tier] ?? 9) - (TIER_RANK[b.strength_tier] ?? 9) ||
        (b.strength_score ?? 0) - (a.strength_score ?? 0)
    );

  const paid = await hasPaidAccess(email);

  return NextResponse.json({
    company,
    connectionCount: matches.length,
    topTier: matches[0]?.strength_tier ?? null,
    paid,
    // Teaser gate: only paid callers receive who the contacts actually are.
    contacts: paid
      ? matches.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          linkedin_url: c.linkedin_url,
          strength_tier: c.strength_tier,
        }))
      : [],
  });
}
