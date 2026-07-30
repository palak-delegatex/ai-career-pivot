// Honest, DB-sourced social-proof signal (AIC-874 secondary; fills the gap
// AIC-860/862 correctly opened by removing fabricated outcome numbers).
//
// The one hard rule (the exact defect AIC-862 fixed): NEVER a hardcoded or
// invented number. This reads REAL counts from `plan_leads` — one row per
// distinct person who generated a free pivot plan (upserted by email, so no
// double-counting and returning users don't inflate it). Every value is a live
// query result. And because low real traffic could make a raw count *weaken*
// trust, each candidate must clear a floor before it is offered to the UI;
// below the floor the surface falls back to the capability signals in
// proof-metrics.ts. We surface momentum only when it is genuinely non-trivial.

import type { SupabaseClient } from "@supabase/supabase-js";

// A weekly count reads as momentum; a total reads as adoption. Each needs enough
// mass to be persuasive rather than deflating — tuned conservatively so we never
// show "2 people this week".
const WEEKLY_FLOOR = 5;
const TOTAL_FLOOR = 25;

const WEEK_MS = 7 * 24 * 60 * 60 * 1000;

export interface HonestProofSignal {
  /** Real count of people whose first free plan was in the last 7 days. */
  plansThisWeek: number;
  /** Real all-time count of distinct free-plan generators. */
  plansTotal: number;
  /**
   * The signal the UI should render, or null when nothing clears its floor (UI
   * then falls back to capability signals). Prefers weekly momentum, then total.
   */
  primary: { value: number; label: string; kind: "weekly" | "total" } | null;
}

async function countRows(
  supabase: SupabaseClient,
  sinceIso?: string
): Promise<number> {
  let query = supabase
    .from("plan_leads")
    .select("id", { count: "exact", head: true });
  if (sinceIso) query = query.gte("created_at", sinceIso);
  const { count, error } = await query;
  if (error) throw new Error(error.message);
  return count ?? 0;
}

/**
 * Compute the honest proof signal from live `plan_leads` counts.
 *
 * `now` is injectable for deterministic tests. On any query error we degrade to
 * the null/zero signal rather than surfacing a wrong number — a missing signal
 * is always safer than a fabricated one.
 */
export async function getHonestProofSignal(
  supabase: SupabaseClient,
  now: Date = new Date()
): Promise<HonestProofSignal> {
  const weekAgoIso = new Date(now.getTime() - WEEK_MS).toISOString();

  let plansThisWeek = 0;
  let plansTotal = 0;
  try {
    [plansThisWeek, plansTotal] = await Promise.all([
      countRows(supabase, weekAgoIso),
      countRows(supabase),
    ]);
  } catch {
    return { plansThisWeek: 0, plansTotal: 0, primary: null };
  }

  let primary: HonestProofSignal["primary"] = null;
  if (plansThisWeek >= WEEKLY_FLOOR) {
    primary = {
      value: plansThisWeek,
      label: "people started their pivot plan this week",
      kind: "weekly",
    };
  } else if (plansTotal >= TOTAL_FLOOR) {
    primary = {
      value: plansTotal,
      label: "pivot plans generated so far",
      kind: "total",
    };
  }

  return { plansThisWeek, plansTotal, primary };
}
