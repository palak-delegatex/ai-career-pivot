// Wire DTO for the gamified ATS surface (AIC-879). Keeps the AIC-874 engine
// (ats-gamified.ts) untouched while giving the /api/ats-gamified route and the
// GamifiedATSScore component one shared shape. The `gamified` field is the pure
// engine output; `categories` are the two REAL sub-scores the engine's score is
// composed from (keyword × 0.70 + formatting × 0.30), surfaced as breakdown bars.

import type { GamifiedAtsScore } from "@/lib/ats-gamified";
import type { AtsBenchmark } from "@/lib/ats-benchmark";

export interface AtsCategoryScore {
  name: string;
  /** 0-100 sub-score straight from the deterministic breakdown. */
  score: number;
}

export interface GamifiedAtsPayload {
  gamified: GamifiedAtsScore;
  categories: AtsCategoryScore[];
  /** Role/title inferred from the target JD, for the "for {role}" header. */
  targetRole: string;
  /**
   * Honest, DB-sourced score benchmark (AIC-884 §4) — the real "average user
   * scores X" anchor, floor-gated. `benchmark.primary` is null when too few
   * real samples exist, in which case the UI shows no anchor. Always present in
   * the shape so the Designer's surface can read it unconditionally.
   */
  benchmark: AtsBenchmark;
}
