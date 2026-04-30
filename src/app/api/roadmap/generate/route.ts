import { NextRequest, NextResponse } from "next/server";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { RoadmapIntake } from "@/lib/intake";
import { getSupabaseClient } from "@/lib/supabase";

export const runtime = "nodejs";
export const maxDuration = 60;

const PhaseSchema = z.object({
  title: z.string(),
  summary: z.string(),
  skillsToLearn: z.array(z.string()),
  certificationsToPursue: z.array(z.string()),
  networkingTargets: z.array(z.string()),
  milestones: z.array(z.string()),
  incomeBridgeStrategies: z.array(z.string()).optional(),
  targetRole: z.string().optional(),
  expectedSalaryRange: z.string().optional(),
  growthTrajectory: z.string().optional(),
});

const RoadmapSchema = z.object({
  executiveSummary: z.string(),
  headlineTargetRole: z.string(),
  headlineTargetIndustry: z.string(),
  overallTimeframe: z.string(),
  riskAssessment: z.string(),
  sixMonth: PhaseSchema,
  oneYear: PhaseSchema,
  twoYear: PhaseSchema,
  contingencyNotes: z.string(),
});

const OBLIGATIONS_LABEL: Record<string, string> = {
  under_2k: "Under $2k/month",
  "2k_4k": "$2k–$4k/month",
  "4k_7k": "$4k–$7k/month",
  "7k_10k": "$7k–$10k/month",
  "10k_15k": "$10k–$15k/month",
  over_15k: "Over $15k/month",
};

const RISK_LABEL: Record<string, string> = {
  conservative: "Conservative — keep current income while transitioning",
  moderate: "Moderate — willing to accept short-term income dip for faster transition",
  aggressive: "Aggressive — prioritize speed of pivot, accept significant income risk",
};

function partnerIncomeLabel(p: RoadmapIntake["family"]["partnerIncome"]): string {
  switch (p) {
    case "none": return "No partner income — solo earner";
    case "partial": return "Partner contributes partially";
    case "primary": return "Partner is primary earner";
    case "equal": return "Roughly equal partner income";
  }
}

const RoadmapIntakeSchema = z.object({
  email: z.string().email(),
  currentTitle: z.string().min(1),
  currentIndustry: z.string().min(1),
  yearsExperience: z.number().min(0).max(60),
  topSkills: z.array(z.string()).min(1).max(10),
  targetRole: z.string().min(1),
  targetIndustry: z.string().min(1),
  monthlyObligations: z.enum([
    "under_2k", "2k_4k", "4k_7k", "7k_10k", "10k_15k", "over_15k",
  ]),
  family: z.object({
    hasKids: z.boolean(),
    numberOfKids: z.number().optional(),
    partnerIncome: z.enum(["none", "partial", "primary", "equal"]),
    locationLocked: z.boolean(),
    locationReason: z.string().optional(),
  }),
  riskTolerance: z.enum(["conservative", "moderate", "aggressive"]),
  transferableSkills: z.array(z.string()).optional(),
  experienceSummary: z.string().optional(),
});

export async function POST(req: NextRequest) {
  let body: unknown;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const parsed = RoadmapIntakeSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: "Missing or invalid required fields", details: parsed.error.flatten() },
      { status: 400 }
    );
  }
  const intake: RoadmapIntake = parsed.data;

  const familyDescription = [
    intake.family.hasKids
      ? `${intake.family.numberOfKids ?? "Some"} kid(s) at home`
      : "No kids",
    partnerIncomeLabel(intake.family.partnerIncome),
    intake.family.locationLocked
      ? `Location-locked${intake.family.locationReason ? ` (${intake.family.locationReason})` : ""}`
      : "Geographically flexible",
  ].join("; ");

  const prompt = `You are a senior career strategist writing a personalized career-pivot roadmap for a working professional with real financial and family obligations. Output must be specific, actionable, and grounded in this person's actual situation — not generic templates.

==== USER PROFILE ====
- Name/email: ${intake.email}
- Current role: ${intake.currentTitle} (${intake.currentIndustry})
- Years of experience: ${intake.yearsExperience}
- Top skills: ${intake.topSkills.join(", ")}
${intake.transferableSkills?.length ? `- Transferable skills: ${intake.transferableSkills.join(", ")}` : ""}
${intake.experienceSummary ? `- Background summary: ${intake.experienceSummary}` : ""}

==== TARGET ====
- Target role: ${intake.targetRole}
- Target industry: ${intake.targetIndustry}

==== CONSTRAINTS ====
- Monthly financial obligations: ${OBLIGATIONS_LABEL[intake.monthlyObligations]}
- Family situation: ${familyDescription}
- Risk tolerance: ${RISK_LABEL[intake.riskTolerance]}

==== INSTRUCTIONS ====
Generate a single integrated roadmap with three phases (6-month, 1-year, 2-year). For each phase include:
- A short title and summary that names the phase outcome
- 3–6 specific skills to learn (named technologies, frameworks, methodologies — not vague areas)
- 1–4 certifications to pursue (real, named credentials — say "skip certs" if none are worth it)
- 3–5 concrete networking targets (specific roles, communities, conference names, Slack groups, LinkedIn outreach categories — not "network more")
- 3–6 measurable milestones (something the user can check off)

For 6-month and 1-year phases, also include income bridge strategies (freelance avenues, hybrid roles, side income that uses existing skills) appropriate to their financial obligations and risk tolerance.

For the 2-year phase, include the specific target role title, an expected salary range (US dollars, realistic for the target role/industry, give a range), and the growth trajectory beyond year 2.

Also produce:
- An executive summary (3–5 sentences) that states the pivot thesis and why it works for this person
- A risk assessment paragraph that honestly addresses the financial/family risk given their constraints
- Contingency notes (2–3 sentences) explaining what to do if the pivot stalls at the 6-month or 1-year mark

Be specific. Reference their actual current title, industry, skills, and target where natural. If the target seems unrealistic given constraints, say so in the risk assessment and propose a more conservative interim role for the 6-month or 1-year phase.`;

  let output: z.infer<typeof RoadmapSchema>;
  try {
    const result = await generateText({
      model: gateway("anthropic/claude-sonnet-4.6"),
      output: Output.object({ schema: RoadmapSchema }),
      prompt,
    });
    output = result.output;
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown generation error";
    const isRateLimit = /rate.?limit|429/i.test(message);
    return NextResponse.json(
      {
        error: isRateLimit
          ? "We're getting a lot of requests right now. Please try again in a minute."
          : "We couldn't generate your roadmap right now. Please try again.",
        detail: message,
      },
      { status: isRateLimit ? 429 : 502 }
    );
  }

  const roadmap = { ...output, generatedAt: new Date().toISOString() };

  // Best-effort persistence — don't block the response if Supabase isn't configured
  if (process.env.NEXT_PUBLIC_SUPABASE_URL && process.env.SUPABASE_SERVICE_ROLE_KEY) {
    try {
      const supabase = getSupabaseClient();
      await supabase.from("user_profiles").upsert(
        {
          email: intake.email,
          current_title: intake.currentTitle,
          current_industry: intake.currentIndustry,
          years_experience: intake.yearsExperience,
          skills: intake.topSkills,
          pivot_plans: [roadmap],
        },
        { onConflict: "email" }
      );
    } catch {
      // Persistence is best-effort; the user still gets their roadmap
    }
  }

  return NextResponse.json({ roadmap });
}
