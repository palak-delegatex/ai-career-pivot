import { NextRequest, NextResponse } from "next/server";

// Value-before-signup Path B — 30-second career quiz (AIC-833 / AIC-825 Path B).
// A logged-out visitor answers 4 quick questions (current role, years of
// experience, interests, timeline) and gets an instant AI-adjacent role match:
// the role, a 1-sentence rationale, and a public-data salary range. Like Path A
// (the ATS quick-check) the PERSONALIZED match score stays LOCKED behind the
// resume-upload free-snapshot flow — the incomplete "?" motivates the upload.
//
// Deliberately rule-based (no LLM per the design spec): the mapping is a small
// deterministic weighted-scoring model, so it's instant, free, and testable.

// ── Answer vocabulary (kept in sync with the client's option ids) ────────────
export const YEARS_OPTIONS = ["0-2", "3-5", "6-10", "10+"] as const;
export const TIMELINE_OPTIONS = ["asap", "3-6mo", "6-12mo", "exploring"] as const;
export const INTEREST_OPTIONS = [
  "build",
  "data",
  "product",
  "design",
  "writing",
  "customers",
  "ops",
  "research",
] as const;

type Years = (typeof YEARS_OPTIONS)[number];
type Timeline = (typeof TIMELINE_OPTIONS)[number];
type Interest = (typeof INTEREST_OPTIONS)[number];

// Human labels for the interests, used when composing the rationale sentence.
const INTEREST_LABELS: Record<Interest, string> = {
  build: "building and coding",
  data: "data and analytics",
  product: "product and strategy",
  design: "design and UX",
  writing: "writing and content",
  customers: "working with people",
  ops: "operations and process",
  research: "research and experimentation",
};

const TIMELINE_LABELS: Record<Timeline, string> = {
  asap: "as soon as possible",
  "3-6mo": "in the next 3–6 months",
  "6-12mo": "in the next 6–12 months",
  exploring: "while you explore",
};

// ── Role roster ──────────────────────────────────────────────────────────────
// Each AI-adjacent target role scores against the selected interests. Salary
// bands are broad US market ranges from public 2026 compensation data (Levels.fyi
// / BLS-adjacent), shown as an indicator — never a personalized promise.
interface RoleDef {
  id: string;
  title: string;
  hook: string; // short clause completing "…point toward {title} — {hook}."
  salaryLow: number; // in $k
  salaryHigh: number; // in $k
  weights: Partial<Record<Interest, number>>;
  // +1 nudges by seniority band so experience shapes the fit, not just interests.
  seniorLeaning?: boolean; // favored by 6-10 / 10+ years
  entryLeaning?: boolean; // favored by 0-2 years
}

const ROLES: RoleDef[] = [
  {
    id: "ai-pm",
    title: "AI Product Manager",
    hook: "you'd turn business needs into AI-powered products",
    salaryLow: 130,
    salaryHigh: 190,
    weights: { product: 3, customers: 2, ops: 1, data: 1 },
    seniorLeaning: true,
  },
  {
    id: "ml-engineer",
    title: "Machine Learning Engineer",
    hook: "you'd build and ship the models themselves",
    salaryLow: 150,
    salaryHigh: 220,
    weights: { build: 3, research: 3, data: 2 },
  },
  {
    id: "ai-engineer",
    title: "Applied AI Engineer",
    hook: "you'd wire LLMs and AI features into real products",
    salaryLow: 140,
    salaryHigh: 210,
    weights: { build: 3, product: 1, research: 2 },
    entryLeaning: true,
  },
  {
    id: "data-analyst",
    title: "AI Data Analyst",
    hook: "you'd turn messy data into decisions with AI tooling",
    salaryLow: 95,
    salaryHigh: 140,
    weights: { data: 3, research: 1, ops: 1 },
    entryLeaning: true,
  },
  {
    id: "ai-program-manager",
    title: "AI Program Manager",
    hook: "you'd drive AI rollouts across teams end-to-end",
    salaryLow: 115,
    salaryHigh: 165,
    weights: { ops: 3, product: 2, customers: 1 },
    seniorLeaning: true,
  },
  {
    id: "ai-ux",
    title: "AI UX Designer",
    hook: "you'd design how people actually experience AI",
    salaryLow: 110,
    salaryHigh: 160,
    weights: { design: 3, product: 1, research: 1 },
  },
  {
    id: "ai-content",
    title: "AI Content Strategist",
    hook: "you'd shape and scale content with AI in the loop",
    salaryLow: 85,
    salaryHigh: 130,
    weights: { writing: 3, customers: 1, product: 1 },
  },
  {
    id: "ai-consultant",
    title: "AI Solutions Consultant",
    hook: "you'd help companies adopt AI and prove its value",
    salaryLow: 110,
    salaryHigh: 170,
    weights: { customers: 3, product: 1, ops: 1, build: 1 },
    seniorLeaning: true,
  },
];

export interface CareerQuizResult {
  matchedRole: string;
  rationale: string;
  salaryLow: number; // $k
  salaryHigh: number; // $k
  salaryDisplay: string; // e.g. "$130k–$190k"
  timelineNote: string;
  adjacentRoles: string[]; // 2 runner-up titles, shown as "also a fit" chips
}

interface QuizAnswers {
  currentRole?: string;
  years?: Years;
  interests?: Interest[];
  timeline?: Timeline;
}

function scoreRoles(answers: QuizAnswers): { role: RoleDef; score: number }[] {
  const interests = (answers.interests ?? []).filter((i): i is Interest =>
    (INTEREST_OPTIONS as readonly string[]).includes(i)
  );
  const years = answers.years;

  const scored = ROLES.map((role, index) => {
    let score = 0;
    for (const interest of interests) {
      score += role.weights[interest] ?? 0;
    }
    // Seniority nudge — experience should steer IC vs. leadership-leaning roles.
    if ((years === "6-10" || years === "10+") && role.seniorLeaning) score += 1;
    if (years === "0-2" && role.entryLeaning) score += 1;
    // Stable, deterministic tie-break by roster order (earlier = higher).
    return { role, score, index };
  });

  scored.sort((a, b) => b.score - a.score || a.index - b.index);
  return scored.map(({ role, score }) => ({ role, score }));
}

function buildRationale(role: RoleDef, answers: QuizAnswers): string {
  const interests = (answers.interests ?? []).filter((i): i is Interest =>
    (INTEREST_OPTIONS as readonly string[]).includes(i)
  );
  const interestPhrase =
    interests.length > 0
      ? interests.slice(0, 2).map((i) => INTEREST_LABELS[i]).join(" and ")
      : "where you want to grow";
  const role_ = answers.currentRole?.trim() || "your background";
  return `Your experience in ${role_} plus a pull toward ${interestPhrase} points toward ${role.title} — ${role.hook}.`;
}

export async function POST(req: NextRequest) {
  let answers: QuizAnswers;
  try {
    answers = (await req.json()) as QuizAnswers;
  } catch {
    return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
  }

  const interests = (answers.interests ?? []).filter((i): i is Interest =>
    (INTEREST_OPTIONS as readonly string[]).includes(i)
  );
  if (interests.length === 0) {
    return NextResponse.json(
      { error: "Pick at least one interest so we can match a role." },
      { status: 400 }
    );
  }

  const ranked = scoreRoles({ ...answers, interests });
  const top = ranked[0].role;
  const timeline = (answers.timeline && (TIMELINE_OPTIONS as readonly string[]).includes(answers.timeline)
    ? answers.timeline
    : "exploring") as Timeline;

  // Only surface runner-ups that actually earned interest signal — otherwise a
  // single-interest answer would show unrelated roles that only ranked via the
  // roster tie-break.
  const adjacentRoles = ranked
    .slice(1)
    .filter((r) => r.score > 0)
    .slice(0, 2)
    .map((r) => r.role.title);

  const result: CareerQuizResult = {
    matchedRole: top.title,
    rationale: buildRationale(top, { ...answers, interests }),
    salaryLow: top.salaryLow,
    salaryHigh: top.salaryHigh,
    salaryDisplay: `$${top.salaryLow}k–$${top.salaryHigh}k`,
    timelineNote: `Pivoting ${TIMELINE_LABELS[timeline]}? Your personalized roadmap sequences the exact skills to close first.`,
    adjacentRoles,
  };

  return NextResponse.json(result);
}
