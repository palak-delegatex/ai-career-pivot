// Live gamified ATS score + checklist (AIC-874 §2, parent AIC-871).
//
// Rezi/Enhancv turn the ATS score into an engagement loop: a live 0–100 meter
// plus a checklist where every item shows the exact points you gain by fixing
// it ("+8 → add 'Kubernetes' to Skills"). Ours was one-shot. This module is a
// PURE, DETERMINISTIC transform over the existing `MatchRateBreakdown` produced
// by computeATSMatchBreakdown (AIC-735) — no LLM, no new scoring, no network.
// The Designer (task 7ca7ec44) builds the meter/checklist UI against this
// contract; the engine lives here so the same breakdown drives Live Match and
// the gamified view identically.
//
// Point model — mirrors the real score composition exactly:
//   overallScore = round(formattingScore * 0.30 + keywordScore * 0.70)
// so the keyword items partition 70 points and the formatting items partition
// the 30-point formatting budget. Each item's `pointDelta` is the deterministic
// gain from resolving it; `score` is the real breakdown.overallScore untouched.

import type { MatchRateBreakdown, KeywordMatch, FormattingIssue } from "./ats-scoring";

// Keyword-category weights — identical to computeKeywordScore's weighting so the
// per-keyword point shares sum to the same 70-point keyword budget.
const CATEGORY_WEIGHT: Record<KeywordMatch["category"], number> = {
  required: 3,
  preferred: 2,
  keyword: 1,
};

// Formatting penalties — identical to computeFormattingScore. Resolving an issue
// returns its penalty to the formatting sub-score, worth `penalty * 0.30` of the
// overall score.
const FORMATTING_PENALTY: Record<FormattingIssue["severity"], number> = {
  critical: 15,
  warning: 7,
  minor: 3,
};

const KEYWORD_BUDGET = 70; // overall points controlled by keywordScore (× 0.70)
const FORMATTING_WEIGHT = 0.3; // overall points per formatting point

export type AtsChecklistCategory = "keyword" | "formatting";

export interface AtsChecklistItem {
  /** Stable id for React keys / analytics (PII-free). */
  id: string;
  /** Human-readable, PII-free label, e.g. `Add "Kubernetes"` or `Remove tables`. */
  label: string;
  category: AtsChecklistCategory;
  /** Whether this item is already satisfied (earned) vs. an open opportunity. */
  done: boolean;
  /** Whole points: gain if resolved (open) or points this item represents (done). */
  pointDelta: number;
  importance: "critical" | "high" | "medium";
  /** Optional context for the UI (never contains resume/JD verbatim PII). */
  detail?: string;
  /** Concrete fix copy where the breakdown supplies one. */
  fix?: string | null;
}

export interface GamifiedAtsScore {
  /** Deterministic 0–100 score — exactly breakdown.overallScore. */
  score: number;
  label: "Excellent" | "Good" | "Needs Work" | "Poor";
  /** Alias of `score`, for meters that read "earned / 100". */
  earnedPoints: number;
  /** Points still on the table = Σ open pointDeltas, clamped so score+headroom ≤ 100. */
  headroom: number;
  completedCount: number;
  totalCount: number;
  /** Highest-value open item — the "next best action" that drives the loop. */
  nextBestAction: AtsChecklistItem | null;
  /** Open items first (pointDelta desc), then done items. */
  items: AtsChecklistItem[];
  summary: {
    matchedKeywords: number;
    totalKeywords: number;
    requiredHit: number;
    requiredTotal: number;
    openFormattingIssues: number;
  };
}

function scoreLabel(score: number): GamifiedAtsScore["label"] {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

function keywordImportance(category: KeywordMatch["category"]): AtsChecklistItem["importance"] {
  if (category === "required") return "critical";
  if (category === "preferred") return "high";
  return "medium";
}

function severityImportance(severity: FormattingIssue["severity"]): AtsChecklistItem["importance"] {
  if (severity === "critical") return "critical";
  if (severity === "warning") return "high";
  return "medium";
}

/**
 * Turn a deterministic ATS breakdown into a gamified score + checklist.
 *
 * Pure and side-effect-free. Safe to run client-side (like
 * computeATSMatchBreakdown) so the meter can update live as the user edits,
 * with no server round-trip.
 */
export function buildGamifiedAtsScore(breakdown: MatchRateBreakdown): GamifiedAtsScore {
  const score = breakdown.overallScore;
  const items: AtsChecklistItem[] = [];

  // ── Keyword items: partition the 70-point keyword budget by category weight ──
  const totalWeight = breakdown.keywordMatches.reduce(
    (sum, m) => sum + CATEGORY_WEIGHT[m.category],
    0
  );

  // De-dupe by keyword (JD extraction can repeat a term across required/keyword),
  // keeping the highest-weight occurrence so a matched instance wins over a miss.
  const bestByKeyword = new Map<string, KeywordMatch>();
  for (const m of breakdown.keywordMatches) {
    const key = m.keyword.trim().toLowerCase();
    const existing = bestByKeyword.get(key);
    if (!existing || (m.matched && !existing.matched) || CATEGORY_WEIGHT[m.category] > CATEGORY_WEIGHT[existing.category]) {
      bestByKeyword.set(key, m);
    }
  }

  for (const [key, m] of bestByKeyword) {
    // Each keyword's fair share of the keyword budget. Assumes a clean match on
    // resolution — a deterministic, defensible estimate of the gain.
    const share = totalWeight > 0 ? (CATEGORY_WEIGHT[m.category] / totalWeight) * KEYWORD_BUDGET : 0;
    const pointDelta = Math.max(m.matched ? 0 : 1, Math.round(share));
    items.push({
      id: `kw:${key}`,
      label: m.matched ? `“${m.keyword}” present` : `Add “${m.keyword}”`,
      category: "keyword",
      done: m.matched,
      pointDelta,
      importance: keywordImportance(m.category),
      detail: m.matched
        ? `Matched (${m.matchType})${m.foundIn.length ? ` in ${m.foundIn[0]}` : ""}`
        : `${m.category === "required" ? "Required" : m.category === "preferred" ? "Preferred" : "Relevant"} keyword not found`,
      fix: m.matched
        ? null
        : m.suggestedSection
          ? `Add “${m.keyword}” to your ${m.suggestedSection} section`
          : `Work “${m.keyword}” naturally into your resume`,
    });
  }

  // ── Formatting items: each open issue is worth penalty × 0.30 overall points ─
  for (let i = 0; i < breakdown.formattingIssues.length; i++) {
    const issue = breakdown.formattingIssues[i];
    const pointDelta = Math.max(1, Math.round(FORMATTING_PENALTY[issue.severity] * FORMATTING_WEIGHT));
    items.push({
      id: `fmt:${issue.category}:${i}`,
      label: issue.issue,
      category: "formatting",
      done: false,
      pointDelta,
      importance: severityImportance(issue.severity),
      detail: `${issue.severity} formatting issue`,
      fix: issue.fix,
    });
  }

  // Open items ranked by value (biggest win first → the engagement hook), then
  // completed items so the meter can show earned checkmarks below the fold.
  const openItems = items.filter(i => !i.done).sort((a, b) => b.pointDelta - a.pointDelta);
  const doneItems = items.filter(i => i.done).sort((a, b) => b.pointDelta - a.pointDelta);
  const ordered = [...openItems, ...doneItems];

  const rawHeadroom = openItems.reduce((sum, i) => sum + i.pointDelta, 0);
  const headroom = Math.max(0, Math.min(100 - score, rawHeadroom));

  const requiredMatches = breakdown.keywordMatches.filter(m => m.category === "required");

  return {
    score,
    label: scoreLabel(score),
    earnedPoints: score,
    headroom,
    completedCount: doneItems.length,
    totalCount: ordered.length,
    nextBestAction: openItems[0] ?? null,
    items: ordered,
    summary: {
      matchedKeywords: breakdown.summary.matchedKeywords,
      totalKeywords: breakdown.summary.totalKeywords,
      requiredHit: requiredMatches.filter(m => m.matched).length,
      requiredTotal: requiredMatches.length,
      openFormattingIssues: breakdown.formattingIssues.length,
    },
  };
}
