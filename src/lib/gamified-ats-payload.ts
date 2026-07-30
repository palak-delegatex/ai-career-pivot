// Wire DTO for the gamified ATS surface (AIC-879). Keeps the AIC-874 engine
// (ats-gamified.ts) untouched while giving the /api/ats-gamified route and the
// GamifiedATSScore component one shared shape. The `gamified` field is the pure
// engine output; `categories` are the two REAL sub-scores the engine's score is
// composed from (keyword × 0.70 + formatting × 0.30), surfaced as breakdown bars.

import type { GamifiedAtsScore } from "@/lib/ats-gamified";

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
}
