/**
 * Shared outcome / social-proof metrics (AIC-748 / AIC-753).
 *
 * Single source of truth for the numeric proof values shown across the
 * landing hero and pricing page so the two surfaces never drift.
 *
 * NOTE: These are the current SuccessMetrics placeholder values. CMO/CEO
 * will source production-truthful numbers; update here and both surfaces
 * stay consistent. Labels are localized in messages/*.json (landing) or
 * inline (pricing, which is not i18n'd on main).
 */
export const PROOF_METRICS = {
  /** Aggregate career pivots delivered — headline outcome badge */
  pivotsDelivered: "847+",
  /** Average star rating (out of 5) */
  avgRating: "4.8",
  /** Share of members who would recommend */
  recommendRate: "92%",
  /** Average salary uplift after a completed pivot */
  salaryUplift: "$15K",
} as const;

export type ProofMetrics = typeof PROOF_METRICS;
