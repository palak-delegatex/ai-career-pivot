/**
 * Shared social-proof / trust signals (AIC-748 / AIC-753 / AIC-862).
 *
 * Single source of truth for the proof values shown across the landing hero,
 * pricing page, /free-results, and the upgrade surfaces so they never drift.
 *
 * AIC-862: the previous values (847+ pivots, 4.8★, 92% recommend, $15K uplift)
 * were fabricated outcome CLAIMS — the product has no rating/recommend/salary
 * event, and all-time verified payments were single digits, so those numbers
 * could never be sourced. They are replaced here with verifiable OFFER /
 * capability signals that are true today. Do NOT reintroduce outcome metrics
 * (ratings, recommend rate, salary uplift, "N pivots delivered") until a real
 * measurement pipeline exists to back them.
 *
 * These strings are used by the English-only surfaces (pricing, /free-results,
 * upgrade sheets, checkout). The localized homepage sources its equivalents
 * from messages/*.json (home.hero.microProof / home.hero.outcomeBadge /
 * home.stats) so the copy stays translated.
 */
export const PROOF_METRICS = {
  /** Time to the free streaming roadmap snapshot (AIC-796) */
  freeSpeed: "~60 sec",
  /** Anonymous quick-check requires no account (AIC-830) */
  noSignup: "No signup",
  /** AI-adjacent roles mapped in the flagship guide (AIC-768) */
  rolesMapped: "9 roles",
  /** Pivot paths modeled in the /pivot dataset (AIC-697/710) */
  pathsMapped: "30+ paths",
  /** Generation stack */
  builtOn: "Built on Claude",
} as const;

export type ProofMetrics = typeof PROOF_METRICS;
