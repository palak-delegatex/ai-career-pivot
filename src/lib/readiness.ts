// AI Career Pivot Readiness Assessment — scoring model, tier banding, quotable
// copy, and the privacy-safe shareable-result codec (AIC-1233, design AIC-1200).
//
// Pure, isomorphic module (no "use client", no DOM): the interactive client
// component, the page's generateMetadata (server), and the OG image route all
// import from here so scoring/tiers/encoding stay in exactly one place. The
// assessment is free top-of-funnel — no PII is ever collected, so the shareable
// `?r=` payload is only the four 0–100 dimension scores (see encode/decodeResult).

export type QuestionType = "single" | "multi";

export interface QuestionOption {
  id: string;
  label: string;
}

export interface Question {
  id: "stage" | "exposure" | "drivers" | "hours" | "timeline";
  title: string;
  help?: string;
  type: QuestionType;
  maxSelect?: number; // for multi-select
  options: QuestionOption[];
}

// The 5 questions (Miller's Law — stays within working memory). Rendering order
// is this array's order; the client reads option ids back into `Answers`.
export const QUESTIONS: Question[] = [
  {
    id: "stage",
    title: "What's your current career stage?",
    type: "single",
    options: [
      { id: "early", label: "Early career (0–3 yrs)" },
      { id: "mid", label: "Mid-career (4–10 yrs)" },
      { id: "senior", label: "Senior (10+ yrs)" },
      { id: "break", label: "Career break / returning" },
    ],
  },
  {
    id: "exposure",
    title: "How much AI / tech exposure do you have?",
    type: "single",
    options: [
      { id: "none", label: "None — completely new" },
      { id: "some", label: "Some — used AI tools at work" },
      { id: "moderate", label: "Moderate — built with AI / data" },
      { id: "deep", label: "Deep — AI / ML is my field" },
    ],
  },
  {
    id: "drivers",
    title: "What's driving your pivot?",
    help: "Pick up to 2.",
    type: "multi",
    maxSelect: 2,
    options: [
      { id: "automation", label: "Job at risk from automation" },
      { id: "earning", label: "Want higher earning potential" },
      { id: "passion", label: "Passionate about AI" },
      { id: "deadend", label: "Current role is a dead end" },
    ],
  },
  {
    id: "hours",
    title: "How much time can you invest weekly?",
    type: "single",
    options: [
      { id: "lt5", label: "Less than 5 hours" },
      { id: "5to10", label: "5–10 hours" },
      { id: "10to20", label: "10–20 hours" },
      { id: "fulltime", label: "Full-time learner" },
    ],
  },
  {
    id: "timeline",
    title: "When do you want to make the switch?",
    type: "single",
    options: [
      { id: "3mo", label: "Within 3 months" },
      { id: "3to6", label: "3–6 months" },
      { id: "6to12", label: "6–12 months" },
      { id: "exploring", label: "Just exploring" },
    ],
  },
];

export interface Answers {
  stage?: string;
  exposure?: string;
  drivers: string[];
  hours?: string;
  timeline?: string;
}

export const emptyAnswers = (): Answers => ({ drivers: [] });

// Per-option point maps (0–100). Kept next to the questions so the scoring model
// is auditable in one glance.
const STAGE_POINTS: Record<string, number> = { early: 60, mid: 80, senior: 70, break: 50 };
const EXPOSURE_POINTS: Record<string, number> = { none: 20, some: 50, moderate: 75, deep: 100 };
const DRIVER_POINTS: Record<string, number> = { automation: 70, earning: 80, passion: 95, deadend: 75 };
const HOURS_POINTS: Record<string, number> = { lt5: 35, "5to10": 60, "10to20": 85, fulltime: 100 };
const TIMELINE_POINTS: Record<string, number> = { "3mo": 100, "3to6": 80, "6to12": 60, exploring: 35 };

export type DimensionKey = "experience" | "motivation" | "commitment" | "urgency";

export interface Dimensions {
  experience: number;
  motivation: number;
  commitment: number;
  urgency: number;
}

export const DIMENSION_LABELS: Record<DimensionKey, string> = {
  experience: "Experience Foundation",
  motivation: "Motivation Alignment",
  commitment: "Time Commitment",
  urgency: "Timeline Readiness",
};

const clamp = (n: number) => Math.max(0, Math.min(100, Math.round(n)));

// Experience 30% · Motivation 25% · Commitment 25% · Urgency 20%.
const WEIGHTS: Record<DimensionKey, number> = {
  experience: 0.3,
  motivation: 0.25,
  commitment: 0.25,
  urgency: 0.2,
};

export function scoreDimensions(a: Answers): Dimensions {
  const stage = STAGE_POINTS[a.stage ?? ""] ?? 0;
  const exposure = EXPOSURE_POINTS[a.exposure ?? ""] ?? 0;
  // AI exposure weighted slightly above tenure — it's the bigger readiness lever.
  const experience = clamp(0.45 * stage + 0.55 * exposure);

  const driverVals = a.drivers.map((d) => DRIVER_POINTS[d] ?? 0).filter((v) => v > 0);
  const motivation = clamp(
    driverVals.length ? driverVals.reduce((s, v) => s + v, 0) / driverVals.length : 0,
  );

  const commitment = clamp(HOURS_POINTS[a.hours ?? ""] ?? 0);

  const timeline = TIMELINE_POINTS[a.timeline ?? ""] ?? 0;
  // Timeline readiness = target date, reinforced by the weekly time available to
  // actually hit it.
  const urgency = clamp(0.6 * timeline + 0.4 * commitment);

  return { experience, motivation, commitment, urgency };
}

export function overallScore(d: Dimensions): number {
  return clamp(
    (Object.keys(WEIGHTS) as DimensionKey[]).reduce((sum, k) => sum + d[k] * WEIGHTS[k], 0),
  );
}

export type TierSlug = "ready-to-pivot" | "strong-foundation" | "building-momentum" | "exploring";

export interface Tier {
  slug: TierSlug;
  /** Long tier name shown as the headline label. */
  name: string;
  /** Short encouragement badge. */
  badge: string;
  /** Tailwind text-color class for the tier name/badge (per spec §1.4 table). */
  textClass: string;
}

// Tier bands (spec §1.4). The ScoreRing arc uses its own emerald/teal/amber/red
// banding (80/60/40) which matches these thresholds for the top three tiers.
export function tierFor(score: number): Tier {
  if (score >= 80)
    return { slug: "ready-to-pivot", name: "Ready to Pivot", badge: "You're ready", textClass: "text-emerald-400" };
  if (score >= 60)
    return { slug: "strong-foundation", name: "Strong Foundation", badge: "Almost there", textClass: "text-teal-400" };
  if (score >= 40)
    return { slug: "building-momentum", name: "Building Momentum", badge: "Getting started", textClass: "text-amber-400" };
  return { slug: "exploring", name: "Exploring", badge: "Early days", textClass: "text-slate-300" };
}

export const TIER_BY_SLUG: Record<TierSlug, string> = {
  "ready-to-pivot": "Ready to Pivot",
  "strong-foundation": "Strong Foundation",
  "building-momentum": "Building Momentum",
  exploring: "Exploring",
};

// ── Quotable one-liner (the text AI engines + social shares quote) ───────────
// Keyed on tier + strongest dimension so it's fully reconstructable from the
// shareable `?r=` payload (no dependence on raw answers).
const STRENGTH_PHRASE: Record<DimensionKey, string> = {
  experience: "your professional experience is a genuine asset",
  motivation: "your motivation to switch is crystal clear",
  commitment: "you're ready to put in the weekly hours",
  urgency: "you have a concrete timeline to aim for",
};

const GROWTH_PHRASE: Record<DimensionKey, string> = {
  experience: "deepening your hands-on AI exposure",
  motivation: "getting specific about why you're pivoting",
  commitment: "carving out more weekly learning time",
  urgency: "setting a firm target date",
};

const TIER_STEM: Record<TierSlug, string> = {
  "ready-to-pivot": "You're ready to pivot into an AI career",
  "strong-foundation": "You have a strong foundation for an AI career pivot",
  "building-momentum": "You're building real momentum toward an AI career",
  exploring: "You're early in exploring an AI career pivot",
};

export function strongestDimension(d: Dimensions): DimensionKey {
  return (Object.keys(d) as DimensionKey[]).reduce((a, b) => (d[b] > d[a] ? b : a));
}

export function weakestDimension(d: Dimensions): DimensionKey {
  return (Object.keys(d) as DimensionKey[]).reduce((a, b) => (d[b] < d[a] ? b : a));
}

export function quoteFor(d: Dimensions): string {
  const tier = tierFor(overallScore(d));
  const strong = strongestDimension(d);
  const weak = weakestDimension(d);
  return `${TIER_STEM[tier.slug]} — ${STRENGTH_PHRASE[strong]}. Focus next on ${GROWTH_PHRASE[weak]}.`;
}

export interface Insight {
  kind: "strength" | "growth";
  text: string;
}

// Max 2 strengths (≥60) + max 2 growth areas (<60). If everything is ≥60, show
// the top 2 as strengths and the single lowest as "refine further" (spec §1.5).
const STRENGTH_INSIGHT: Record<DimensionKey, string> = {
  experience: "Your career experience translates well into an AI path",
  motivation: "High motivation — you have clear reasons to pivot",
  commitment: "Strong weekly commitment to learning",
  urgency: "A clear timeline keeps your pivot on track",
};

const GROWTH_INSIGHT: Record<DimensionKey, string> = {
  experience: "Build more hands-on AI exposure to close the gap",
  motivation: "Pin down a specific, motivating reason to pivot",
  commitment: "Increase weekly learning time for faster results",
  urgency: "Set a concrete target date to maintain momentum",
};

export function insightsFor(d: Dimensions): Insight[] {
  const keys = Object.keys(d) as DimensionKey[];
  const ranked = [...keys].sort((a, b) => d[b] - d[a]);
  const strong = ranked.filter((k) => d[k] >= 60);
  const weak = ranked.filter((k) => d[k] < 60).reverse(); // lowest first

  const out: Insight[] = [];
  for (const k of strong.slice(0, 2)) out.push({ kind: "strength", text: STRENGTH_INSIGHT[k] });

  if (weak.length === 0) {
    // Everything is strong — nudge on the (relatively) lowest as a refine area.
    const lowest = ranked[ranked.length - 1];
    out.push({ kind: "growth", text: GROWTH_INSIGHT[lowest] });
  } else {
    for (const k of weak.slice(0, 2)) out.push({ kind: "growth", text: GROWTH_INSIGHT[k] });
  }
  return out;
}

// ── Shareable-result codec ───────────────────────────────────────────────────
// Encodes the four 0–100 dimension scores as one URL-safe base64 token (4 bytes
// → ~6 chars, no padding). Privacy-safe by construction: only numeric scores,
// never any answer text or PII. Isomorphic — btoa/atob exist in both the browser
// and the Node 18+ runtime this app targets.
const DIM_ORDER: DimensionKey[] = ["experience", "motivation", "commitment", "urgency"];

export function encodeResult(d: Dimensions): string {
  const bytes = DIM_ORDER.map((k) => clamp(d[k]));
  const bin = String.fromCharCode(...bytes);
  return btoa(bin).replace(/\+/g, "-").replace(/\//g, "_").replace(/=+$/, "");
}

export function decodeResult(token: string): Dimensions | null {
  try {
    const b64 = token.replace(/-/g, "+").replace(/_/g, "/");
    const bin = atob(b64);
    if (bin.length !== 4) return null;
    const vals = Array.from(bin, (c) => c.charCodeAt(0));
    if (vals.some((v) => v < 0 || v > 100 || Number.isNaN(v))) return null;
    return {
      experience: vals[0],
      motivation: vals[1],
      commitment: vals[2],
      urgency: vals[3],
    };
  } catch {
    return null;
  }
}
