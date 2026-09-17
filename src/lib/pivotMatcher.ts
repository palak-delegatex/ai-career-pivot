// AI Career Pivot Matcher — the ranked top-N target-role model (AIC-1240,
// competitive cycle c21). Rivals lead with a "put in your role, get ranked
// AI-adjacent target roles" discovery hook (Job Pivotry, PivotForward.ai, Apt);
// this is our honest, sourced answer to it.
//
// Pure, isomorphic module (no "use client", no DOM): the interactive client
// component, the page's generateMetadata (server), and the OG route all import
// from here so the role dataset + scoring live in exactly one place. This is a
// free top-of-funnel DISCOVERY tool — no PII, no email gate, no paywall. The
// scoring is a transparent, auditable heuristic, NOT a prediction: it ranks how
// well each target role lines up with the strengths and field a visitor picks.

export interface Labeled<Id extends string> {
  id: Id;
  label: string;
}

// ── Inputs ───────────────────────────────────────────────────────────────────
export type FieldId =
  | "teaching"
  | "marketing"
  | "sales"
  | "software"
  | "finance"
  | "design"
  | "project-mgmt"
  | "support"
  | "operations"
  | "healthcare"
  | "writing"
  | "data"
  | "research"
  | "admin"
  | "other";

export const SOURCE_FIELDS: Labeled<FieldId>[] = [
  { id: "teaching", label: "Teaching / education" },
  { id: "marketing", label: "Marketing" },
  { id: "sales", label: "Sales / account management" },
  { id: "software", label: "Software / IT" },
  { id: "finance", label: "Finance / accounting" },
  { id: "design", label: "Design / UX" },
  { id: "project-mgmt", label: "Project / program management" },
  { id: "support", label: "Customer support / success" },
  { id: "operations", label: "Operations" },
  { id: "healthcare", label: "Healthcare" },
  { id: "writing", label: "Writing / content" },
  { id: "data", label: "Data / analytics" },
  { id: "research", label: "Research / science" },
  { id: "admin", label: "Administration / coordination" },
  { id: "other", label: "Something else" },
];

export type SkillId =
  | "analyzing"
  | "coding"
  | "communicating"
  | "designing"
  | "leading"
  | "writing"
  | "problem-solving"
  | "explaining"
  | "researching"
  | "strategy";

export const SKILLS: Labeled<SkillId>[] = [
  { id: "analyzing", label: "Analyzing data & spotting patterns" },
  { id: "coding", label: "Coding / working with software" },
  { id: "communicating", label: "Communicating & persuading" },
  { id: "designing", label: "Designing & visual thinking" },
  { id: "leading", label: "Leading projects & people" },
  { id: "writing", label: "Writing clearly" },
  { id: "problem-solving", label: "Structured problem-solving" },
  { id: "explaining", label: "Teaching & explaining complex ideas" },
  { id: "researching", label: "Researching & synthesizing" },
  { id: "strategy", label: "Strategy & prioritization" },
];

export const MAX_SKILLS = 3;

export interface MatcherInput {
  field?: FieldId;
  skills: SkillId[];
}

export const emptyInput = (): MatcherInput => ({ skills: [] });

// ── Target roles ─────────────────────────────────────────────────────────────
export type DemandBand = "very-high" | "high" | "moderate";
export type DifficultyBand = "faster" | "moderate" | "longer";

// Qualitative earning tier (1–3). Kept honest: we don't invent a precise salary
// for every role. Where a public figure exists (data roles → BLS), it's surfaced
// in `payNote` and linked to our /research page.
export type PayTier = 1 | 2 | 3;

export interface TargetRole {
  id: string;
  name: string;
  blurb: string;
  demand: DemandBand;
  difficulty: DifficultyBand;
  payTier: PayTier;
  payLabel: string;
  payNote?: string;
  /** Skills that carry straight over — rendered as chips. */
  transferable: string[];
  /** 0..1 affinity of each source field for this target role. */
  fieldAffinity: Partial<Record<FieldId, number>>;
  /** 0..1 affinity of each strength for this target role. */
  skillAffinity: Partial<Record<SkillId, number>>;
}

// Nine AI-adjacent target roles. Affinities encode which backgrounds and
// strengths transfer well — they drive the ranking and the plain-English
// "why this fits you" reasons. Demand/pay bands are directional; only the
// data-science figures are hard-sourced (see /research/ai-career-pivots-2026).
export const TARGET_ROLES: TargetRole[] = [
  {
    id: "data-scientist",
    name: "Data Scientist / Analyst",
    blurb:
      "Turn messy data into decisions — the archetypal AI-adjacent role and one of the fastest-growing occupations in the U.S. labor projections.",
    demand: "very-high",
    difficulty: "moderate",
    payTier: 3,
    payLabel: "Higher earning potential",
    payNote: "$108,020 median U.S. pay, +36% projected growth 2023–33 (BLS)",
    transferable: ["Analytical thinking", "SQL / spreadsheets", "Storytelling with data"],
    fieldAffinity: {
      data: 1, finance: 0.85, research: 0.85, software: 0.7, operations: 0.6,
      marketing: 0.55, healthcare: 0.55, teaching: 0.4, admin: 0.4,
    },
    skillAffinity: {
      analyzing: 1, "problem-solving": 0.8, coding: 0.6, researching: 0.7, strategy: 0.5,
    },
  },
  {
    id: "ai-product-manager",
    name: "AI Product Manager",
    blurb:
      "Own what gets built and why — translate user problems into AI-powered features and steer a cross-functional team to ship them.",
    demand: "high",
    difficulty: "moderate",
    payTier: 3,
    payLabel: "Higher earning potential",
    transferable: ["Prioritization", "Stakeholder communication", "Roadmapping"],
    fieldAffinity: {
      "project-mgmt": 1, marketing: 0.75, teaching: 0.65, sales: 0.65, software: 0.75,
      operations: 0.7, design: 0.65, support: 0.6, healthcare: 0.5,
    },
    skillAffinity: {
      strategy: 1, leading: 0.9, communicating: 0.8, "problem-solving": 0.7, analyzing: 0.5,
    },
  },
  {
    id: "ml-engineer",
    name: "Machine Learning Engineer",
    blurb:
      "Build and ship the models themselves — the most technical target, and the highest ceiling if you enjoy coding.",
    demand: "high",
    difficulty: "longer",
    payTier: 3,
    payLabel: "Higher earning potential",
    transferable: ["Programming", "Systems thinking", "Experimentation"],
    fieldAffinity: {
      software: 1, data: 0.8, research: 0.75, finance: 0.5, operations: 0.4,
    },
    skillAffinity: {
      coding: 1, "problem-solving": 0.85, analyzing: 0.7, researching: 0.6,
    },
  },
  {
    id: "ai-program-manager",
    name: "AI Program / Project Manager",
    blurb:
      "Keep AI initiatives on track across teams — scope, timeline, risk, and delivery for the models and tools an org is rolling out.",
    demand: "high",
    difficulty: "faster",
    payTier: 2,
    payLabel: "Strong earning potential",
    transferable: ["Coordination", "Risk management", "Cross-team communication"],
    fieldAffinity: {
      "project-mgmt": 1, operations: 0.85, admin: 0.7, support: 0.65, teaching: 0.55,
      marketing: 0.5, healthcare: 0.55, finance: 0.55,
    },
    skillAffinity: {
      leading: 1, communicating: 0.8, strategy: 0.7, "problem-solving": 0.6,
    },
  },
  {
    id: "ai-content-specialist",
    name: "AI Content & Prompt Specialist",
    blurb:
      "Design the prompts, guardrails, and content workflows that make AI tools useful — a fast on-ramp for strong writers and communicators.",
    demand: "moderate",
    difficulty: "faster",
    payTier: 2,
    payLabel: "Strong earning potential",
    transferable: ["Clear writing", "Editing", "Attention to nuance"],
    fieldAffinity: {
      writing: 1, marketing: 0.8, teaching: 0.7, support: 0.6, design: 0.55, research: 0.5,
    },
    skillAffinity: {
      writing: 1, communicating: 0.75, explaining: 0.7, researching: 0.55, strategy: 0.4,
    },
  },
  {
    id: "analytics-engineer",
    name: "Data / Analytics Engineer",
    blurb:
      "Build the pipelines and clean datasets everything else depends on — a pragmatic, in-demand path that rewards structured thinkers.",
    demand: "high",
    difficulty: "moderate",
    payTier: 3,
    payLabel: "Higher earning potential",
    transferable: ["SQL", "Process design", "Data modeling"],
    fieldAffinity: {
      data: 1, software: 0.8, finance: 0.65, operations: 0.6, research: 0.6,
    },
    skillAffinity: {
      analyzing: 0.9, coding: 0.85, "problem-solving": 0.8, strategy: 0.4,
    },
  },
  {
    id: "ai-solutions-engineer",
    name: "AI Solutions / Sales Engineer",
    blurb:
      "Bridge the gap between AI products and the customers who buy them — part technical, part relationship, high leverage for strong communicators.",
    demand: "high",
    difficulty: "moderate",
    payTier: 3,
    payLabel: "Higher earning potential",
    transferable: ["Technical explanation", "Relationship-building", "Demos"],
    fieldAffinity: {
      sales: 1, support: 0.8, software: 0.7, marketing: 0.6, teaching: 0.6, operations: 0.45,
    },
    skillAffinity: {
      communicating: 1, explaining: 0.85, "problem-solving": 0.6, coding: 0.5, strategy: 0.5,
    },
  },
  {
    id: "ux-researcher-ai",
    name: "UX Researcher (AI Products)",
    blurb:
      "Figure out what people actually need from AI features and feed it back to the team — ideal if you love talking to users and synthesizing.",
    demand: "moderate",
    difficulty: "moderate",
    payTier: 2,
    payLabel: "Strong earning potential",
    transferable: ["User interviews", "Synthesis", "Empathy"],
    fieldAffinity: {
      design: 1, research: 0.8, teaching: 0.6, marketing: 0.55, support: 0.6, healthcare: 0.5,
    },
    skillAffinity: {
      researching: 1, communicating: 0.7, analyzing: 0.6, explaining: 0.6, designing: 0.6,
    },
  },
  {
    id: "ai-governance-analyst",
    name: "AI Governance / Policy Analyst",
    blurb:
      "Help organizations use AI responsibly — risk, compliance, and policy for models and data, a growing need as adoption outpaces the rulebook.",
    demand: "moderate",
    difficulty: "moderate",
    payTier: 2,
    payLabel: "Strong earning potential",
    transferable: ["Research", "Writing", "Attention to detail"],
    fieldAffinity: {
      research: 1, finance: 0.7, admin: 0.6, healthcare: 0.6, teaching: 0.55, operations: 0.5,
    },
    skillAffinity: {
      researching: 1, writing: 0.75, analyzing: 0.6, "problem-solving": 0.6, strategy: 0.6,
    },
  },
];

// ── Scoring ──────────────────────────────────────────────────────────────────
const clamp = (n: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, n));

const DEMAND_WEIGHT: Record<DemandBand, number> = {
  "very-high": 1,
  high: 0.82,
  moderate: 0.62,
};

export const DEMAND_LABEL: Record<DemandBand, string> = {
  "very-high": "Very high demand",
  high: "High demand",
  moderate: "Growing demand",
};

export const DIFFICULTY_LABEL: Record<DifficultyBand, string> = {
  faster: "Faster transition",
  moderate: "Moderate transition",
  longer: "Longer runway",
};

export interface RankedRole {
  role: TargetRole;
  /** 0–100 alignment score (a transparent heuristic, not a prediction). */
  fit: number;
  /** Plain-English reasons the role ranked where it did (max 3). */
  reasons: string[];
}

function skillMatchScore(role: TargetRole, skills: SkillId[]): number {
  if (skills.length === 0) return 0.45; // neutral prior when nothing is picked
  const vals = skills.map((s) => role.skillAffinity[s] ?? 0.15);
  return vals.reduce((a, b) => a + b, 0) / vals.length;
}

function fieldMatchScore(role: TargetRole, field?: FieldId): number {
  if (!field || field === "other") return 0.4; // baseline for unspecified/other
  return role.fieldAffinity[field] ?? 0.3;
}

function reasonsFor(role: TargetRole, input: MatcherInput): string[] {
  const reasons: string[] = [];

  // Strongest matched strength.
  const matched = input.skills
    .map((s) => ({ s, w: role.skillAffinity[s] ?? 0 }))
    .filter((x) => x.w >= 0.6)
    .sort((a, b) => b.w - a.w);
  if (matched.length) {
    const label = SKILLS.find((k) => k.id === matched[0].s)?.label.toLowerCase();
    if (label) reasons.push(`Your strength in ${label} maps directly to this role`);
  }

  // Field carryover.
  const fieldW = input.field ? role.fieldAffinity[input.field] ?? 0 : 0;
  if (input.field && input.field !== "other" && fieldW >= 0.6) {
    const fLabel = SOURCE_FIELDS.find((f) => f.id === input.field)?.label.toLowerCase();
    if (fLabel) reasons.push(`Skills from ${fLabel} transfer well here`);
  }

  // Demand / speed signal.
  if (role.demand === "very-high") {
    reasons.push("One of the fastest-growing roles in the labor data");
  } else if (role.difficulty === "faster") {
    reasons.push("A relatively fast on-ramp from an adjacent background");
  }

  return reasons.slice(0, 3);
}

export function rankRoles(input: MatcherInput): RankedRole[] {
  const scored = TARGET_ROLES.map((role) => {
    const skill = skillMatchScore(role, input.skills);
    const field = fieldMatchScore(role, input.field);
    const demand = DEMAND_WEIGHT[role.demand];
    const raw = 0.46 * skill + 0.34 * field + 0.2 * demand;
    // Map the 0..1 raw score into a legible 54–97 band so nothing reads as a
    // hopeless 12% — this is an alignment signal, not a probability.
    const fit = clamp(Math.round(54 + raw * 44), 54, 97);
    return { role, fit, reasons: reasonsFor(role, input) };
  });

  return scored.sort(
    (a, b) =>
      b.fit - a.fit ||
      DEMAND_WEIGHT[b.role.demand] - DEMAND_WEIGHT[a.role.demand] ||
      b.role.payTier - a.role.payTier,
  );
}
