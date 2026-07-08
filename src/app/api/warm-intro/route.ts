import { NextRequest, NextResponse } from "next/server";
import { getSupabaseClient } from "@/lib/supabase";
import { hasPaidAccess } from "@/lib/entitlement";

// Warm-Intro / Insider Connections (AIC-769) — surface likely 1-hop connections
// at a tracked job's company, sourced from the user's own networking CRM.
// Free users get only the teaser (count + strongest tier); paid users get the
// contact list. Contact PII is gated SERVER-SIDE so free users never receive it.

const TIER_RANK: Record<string, number> = { strong: 0, warm: 1, new: 2, cold: 3 };

// Tier → default confidence, used when a contact has no explicit strength_score.
const TIER_CONFIDENCE: Record<string, number> = { strong: 90, warm: 75, new: 55, cold: 35 };

// MVP is networking-CRM-only (no LinkedIn people-graph), so every match is a
// contact the user already holds. We still expose a "degree" so the reveal UX
// can render a connection path: direct/strong ties read as 1st-degree, looser
// ties as 2nd-degree. A real people-graph would replace this later.
function connectionDegree(tier: string): number {
  return tier === "strong" || tier === "warm" ? 1 : 2;
}

// Normalize whatever scale strength_score is stored on into a 0–100 confidence.
function confidenceOf(score: number | null | undefined, tier: string): number {
  if (score == null) return TIER_CONFIDENCE[tier] ?? 50;
  const n = score <= 1 ? score * 100 : score;
  return Math.max(0, Math.min(100, Math.round(n)));
}

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
  const top = matches[0];

  // Teaser: role + degree + confidence for the strongest tie, but NEVER the
  // identity (name/linkedin). Safe to send to free tier — it's the exact data
  // the reveal UX blurs behind the paywall. Absent when there are no matches.
  const teaser = top
    ? {
        has_connection: true,
        role_title: top.role ?? null,
        connection_degree: connectionDegree(top.strength_tier),
        confidence_score: confidenceOf(top.strength_score, top.strength_tier),
        top_tier: top.strength_tier,
      }
    : null;

  return NextResponse.json({
    company,
    connectionCount: matches.length,
    topTier: matches[0]?.strength_tier ?? null,
    paid,
    teaser,
    // Teaser gate: only paid callers receive who the contacts actually are.
    contacts: paid
      ? matches.map((c) => ({
          id: c.id,
          name: c.name,
          role: c.role,
          linkedin_url: c.linkedin_url,
          strength_tier: c.strength_tier,
          confidence_score: confidenceOf(c.strength_score, c.strength_tier),
          connection_degree: connectionDegree(c.strength_tier),
          // No people-graph in MVP → no verified mutual. The UX renders a direct
          // path when this is null and a "via {mutual}" path when populated.
          mutual_name: null as string | null,
          mutual_role: null as string | null,
        }))
      : [],
  });
}
