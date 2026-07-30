// Locked paid-report teaser + personalized specifics (AIC-874 §1 + secondary).
//
// MyPassion.AI's convert mechanic: a free result plus a blurred/locked preview
// of the specific sections the $19 report adds, then one-click unlock. This
// module builds the PII-FREE teaser payload — section titles, honest counts, and
// short descriptors only. It contains NO locked content, so it is always safe to
// send to the free (unauthenticated) client; the Designer (task 7ca7ec44) blurs
// it. Entitlement (orders.status='paid') is checked in the teaser route, exactly
// like the warm-intro paywall (AIC-769/772) — the server contract, not the
// client, decides lock state, and no report body ever crosses the wire here.
//
// It also derives the two personalized specifics the snapshot lacked: a
// defensible salary-uplift range and a "pivot in ~X weeks" estimate. Both are
// RULE-BASED and deterministic — derived only from data already in the snapshot,
// so nothing is fabricated (cf. AIC-862, which removed invented outcome numbers).

import type { FreeSnapshot } from "@/app/api/intake/free-snapshot/route";

// ── Locked-report teaser ─────────────────────────────────────────────────────

export interface TeaserSection {
  /** Stable id for React keys / analytics. */
  id: string;
  /** PII-free section title as shown on the locked card. */
  title: string;
  /** One-line, PII-free description of what the section delivers. */
  blurb: string;
  /**
   * Honest count derived from the snapshot, or null for sections whose size is
   * only known once the report is generated (we never invent a number). When
   * present it is a real quantity — e.g. paths mapped, or skill gaps found.
   */
  count: number | null;
  /** Optional unit label for the count, e.g. "paths", "skill gaps". */
  countLabel?: string;
}

export interface ReportTeaser {
  /** True $19-report price point, surfaced so the UI needn't hardcode it. */
  priceUsd: number;
  sections: TeaserSection[];
  /** Personalized specifics for the free snapshot surface (see below). */
  salary: SalaryRangeEstimate;
  timeline: PivotEstimate;
}

/** Count distinct skill gaps across all snapshot paths (case-insensitive). */
function distinctGapCount(snapshot: FreeSnapshot): number {
  const seen = new Set<string>();
  for (const p of snapshot.paths ?? []) {
    for (const g of p.topSkillGaps ?? []) {
      const k = g.skill?.trim().toLowerCase();
      if (k) seen.add(k);
    }
  }
  return seen.size;
}

/**
 * Build the PII-free locked-report teaser from a free snapshot.
 *
 * Deterministic and side-effect-free. Counts are sourced from the snapshot only
 * where a real basis exists; structural sections carry `count: null` rather than
 * a made-up number.
 */
export function buildReportTeaser(snapshot: FreeSnapshot): ReportTeaser {
  const pathCount = snapshot.paths?.length ?? 0;
  const gapCount = distinctGapCount(snapshot);

  // Every section maps to a real field on the generated PivotPlan report
  // (src/app/api/intake/plan/route.ts). We deliberately do NOT list anything the
  // $19 report doesn't actually produce (e.g. "job match scores" — that's the
  // extension's Live Match, AIC-735, not this report), so the locked preview
  // can never over-promise (cf. AIC-862).
  const sections: TeaserSection[] = [
    {
      id: "path-analysis",
      title: "Full career-path analysis",
      blurb: "Every path ranked, with the match score and why your background fits.",
      count: pathCount || null,
      countLabel: "paths",
    },
    {
      id: "skill-plan",
      title: "Complete skill-gap map",
      blurb: "A week-by-week plan to close each gap, with the resource for each.",
      count: gapCount || null,
      countLabel: "skill gaps",
    },
    {
      id: "roadmap",
      title: "6 / 12 / 24-month roadmap",
      blurb: "Phased milestones — what to do first, next, and by year two.",
      count: null,
    },
    {
      id: "salary-roi",
      title: "Salary trajectory & ROI",
      blurb: "Target salary bands per milestone, transition costs, and payback timeframe.",
      count: null,
    },
    {
      id: "week-one",
      title: "Week-by-week action plan",
      blurb: "Concrete, time-boxed actions you can start the day you get the report.",
      count: null,
    },
    {
      id: "ai-toolkit",
      title: "AI toolkit & certifications",
      blurb: "The specific AI tools and certs to learn for your path, with cost and time.",
      count: null,
    },
    {
      id: "risks",
      title: "Risk assessment & mitigation",
      blurb: "The obstacles most likely to derail your pivot — and how to get ahead of them.",
      count: null,
    },
  ];

  return {
    priceUsd: 19,
    sections,
    salary: estimateSalaryRange(snapshot),
    timeline: estimatePivotTimeline(snapshot),
  };
}

// ── Personalized salary-uplift range ─────────────────────────────────────────

export interface SalaryRangeEstimate {
  /** Low / high annual uplift in whole $thousands. */
  upliftLowK: number;
  upliftHighK: number;
  /** Ready-to-render label, e.g. "+$12K–$20K/yr". */
  display: string;
  /** PII-free basis line so the number is defensible, not magic. */
  basis: string;
}

/**
 * Turn the snapshot's point estimate of annual uplift into a defensible RANGE.
 *
 * We present the model's `estimatedSalaryUplift` as the midpoint of a
 * conservative band (−20% / +25%) rather than a false-precision single figure.
 * We deliberately frame it as *uplift* (annual increase), not an absolute
 * salary, because the snapshot doesn't know the user's current pay.
 */
export function estimateSalaryRange(snapshot: FreeSnapshot): SalaryRangeEstimate {
  // Fallback to a conservative 12 (matches the snapshot prompt's 10–30 band
  // floor) when the model omitted the optional field.
  const mid = clamp(Math.round(snapshot.estimatedSalaryUplift ?? 12), 8, 60);
  const low = clamp(Math.round(mid * 0.8), 6, mid);
  const high = clamp(Math.round(mid * 1.25), mid, 75);
  return {
    upliftLowK: low,
    upliftHighK: high,
    display: `+$${low}K–$${high}K/yr`,
    basis: "Estimated annual salary uplift for your top path, based on market rates for the role.",
  };
}

// ── "Pivot in ~X weeks" estimate ─────────────────────────────────────────────

export interface PivotEstimate {
  weeksLow: number;
  weeksHigh: number;
  /** Ready-to-render label, e.g. "~14–18 weeks". */
  display: string;
  basis: string;
}

// Weeks to close one gap, by priority × how much existing experience transfers.
// Higher transferability ⇒ fewer weeks. Deterministic lookup, no magic constants
// beyond a documented study-effort assumption (~6 focused hrs/week).
function gapWeeks(priority: "high" | "medium" | "low", transferabilityScore: number): number {
  const base = priority === "high" ? 6 : priority === "medium" ? 4 : 2;
  // Transferability 0 → full base; 100 → ~1/3 of base (you're most of the way).
  const transferFactor = 1 - clamp(transferabilityScore, 0, 100) / 150;
  return base * transferFactor;
}

/**
 * Estimate how long the pivot takes by summing the effort to close the TOP
 * path's headline skill gaps. Rule-based and defensible: it scales with the
 * user's actual gap count, priorities, and transferability — the same signals
 * the snapshot already shows them.
 */
export function estimatePivotTimeline(snapshot: FreeSnapshot): PivotEstimate {
  const top = snapshot.paths?.[0];
  const gaps = top?.topSkillGaps ?? [];

  // A short ramp even with no explicit gaps (portfolio, applications, network).
  const raw = 4 + gaps.reduce((sum, g) => sum + gapWeeks(g.priority, g.transferabilityScore), 0);

  const mid = clamp(Math.round(raw), 6, 52);
  const low = clamp(Math.round(mid * 0.85), 4, mid);
  const high = clamp(Math.round(mid * 1.15), mid, 60);
  return {
    weeksLow: low,
    weeksHigh: high,
    display: `~${low}–${high} weeks`,
    basis: "Estimated time to close your top path's key skill gaps at a steady, part-time pace.",
  };
}

function clamp(n: number, min: number, max: number): number {
  if (Number.isNaN(n)) return min;
  return Math.max(min, Math.min(max, n));
}
