import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { fetchMarketContext } from "@/lib/market-data";
import {
  enforceFeatureAccess,
  isGateResponse,
  trackUsage,
  getUserPlan,
} from "@/lib/usage-gating";

const LearningResourceSchema = z.object({
  name: z.string(),
  provider: z.string(),
  type: z.enum([
    "course",
    "certification",
    "tutorial",
    "book",
    "youtube",
    "practice",
  ]),
  url: z.string(),
  cost: z.enum(["free", "low", "medium", "high"]),
  estimatedHours: z.number(),
  credentialValue: z.enum(["high", "medium", "low", "none"]),
  reason: z.string(),
});

const SkillGapItemSchema = z.object({
  skill: z.string(),
  category: z.enum(["technical", "soft", "domain", "certification", "tool"]),
  importance: z.enum(["critical", "important", "nice-to-have"]),
  gapType: z.enum(["transferable", "learnable", "deep-investment"]),
  currentLevel: z.string().nullable(),
  requiredLevel: z.string(),
  marketDemandPercent: z.number().min(0).max(100),
  trending: z.boolean(),
  adjacentSkill: z.string().nullable(),
  transferExplanation: z.string().nullable(),
  bridgeActions: z.array(z.string()),
  estimatedWeeksToClose: z.number(),
  learningPath: z.array(LearningResourceSchema),
  priorityRank: z.number(),
});

const SkillsEngineSchema = z.object({
  userSkills: z.array(
    z.object({
      name: z.string(),
      category: z.enum([
        "technical",
        "soft",
        "domain",
        "certification",
        "tool",
      ]),
      proficiency: z.enum(["expert", "advanced", "intermediate", "beginner"]),
      yearsUsed: z.number().nullable(),
    })
  ),
  targetRoleSkills: z.array(
    z.object({
      name: z.string(),
      category: z.enum([
        "technical",
        "soft",
        "domain",
        "certification",
        "tool",
      ]),
      importance: z.enum(["critical", "important", "nice-to-have"]),
      marketDemandPercent: z.number(),
      trending: z.boolean(),
    })
  ),
  matchedSkills: z.array(
    z.object({
      userSkill: z.string(),
      targetSkill: z.string(),
      matchType: z.enum(["direct", "transferable"]),
      confidence: z.number().min(0).max(100),
      transferNote: z.string().nullable(),
    })
  ),
  gaps: z.object({
    transferable: z.array(SkillGapItemSchema),
    learnable: z.array(SkillGapItemSchema),
    deepInvestment: z.array(SkillGapItemSchema),
  }),
  summary: z.object({
    readinessScore: z.number().min(0).max(100),
    readinessLabel: z.enum([
      "Ready to Apply",
      "Nearly Ready",
      "Moderate Gap",
      "Significant Gap",
      "Major Transition",
    ]),
    matchedPercent: z.number(),
    transferablePercent: z.number(),
    gapPercent: z.number(),
    estimatedTransitionWeeks: z.number(),
    topStrength: z.string(),
    biggestGap: z.string(),
    quickWins: z.array(z.string()),
    transitionNarrative: z.string(),
  }),
  marketContext: z.object({
    salaryRange: z.object({
      p25: z.number(),
      p50: z.number(),
      p75: z.number(),
    }),
    demandTrend: z.enum(["growing", "stable", "declining"]),
    demandStrength: z.enum(["strong", "moderate", "weak"]),
    growthPercent: z.number(),
    postingVolume: z.enum(["very-high", "high", "moderate", "low"]),
  }),
  learningRoadmap: z.array(
    z.object({
      phase: z.enum(["quick-wins", "core-skills", "deep-expertise"]),
      title: z.string(),
      durationWeeks: z.number(),
      skills: z.array(z.string()),
      resources: z.array(LearningResourceSchema),
      milestone: z.string(),
    })
  ),
});

export type SkillsEngineResponse = z.infer<typeof SkillsEngineSchema>;

export async function POST(req: NextRequest) {
  const gate = await enforceFeatureAccess("skills_assessment");
  if (isGateResponse(gate)) return gate;

  const {
    profile,
    targetRole,
  }: {
    profile: {
      currentTitle?: string;
      currentIndustry?: string;
      yearsExperience?: number;
      skills: string[];
      transferableSkills?: string[];
      experience?: { title: string; company: string; description: string }[];
      education?: { degree: string; field: string; institution: string }[];
      certifications?: string[];
    };
    targetRole: string;
  } = await req.json();

  if (!targetRole || !profile?.skills?.length) {
    return NextResponse.json(
      { error: "targetRole and profile with skills are required" },
      { status: 400 }
    );
  }

  const marketContext = await fetchMarketContext(targetRole);

  const marketSkillsSection = marketContext?.topSkills?.length
    ? `\nMARKET-VALIDATED SKILL REQUIREMENTS for "${targetRole}" (from job posting analysis):
${marketContext.topSkills
  .map(
    (s) =>
      `- ${s.skill}: ${s.frequencyPercent}% of postings require this (${s.category}, ${s.trending ? "TRENDING" : "stable"})`
  )
  .join("\n")}

SALARY DATA: P25=$${marketContext.salary.p25.toLocaleString()}, Median=$${marketContext.salary.p50.toLocaleString()}, P75=$${marketContext.salary.p75.toLocaleString()}
DEMAND: ${marketContext.demand.trend} (${marketContext.demand.trendStrength}), ${marketContext.demand.growthPercent}% projected growth, posting volume: ${marketContext.demand.postingVolume}
Source: ${marketContext.source}`
    : `\nNote: No specific market data available for "${targetRole}". Use your knowledge of typical requirements.`;

  const profileSummary = [
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience &&
      `Years of experience: ${profile.yearsExperience}`,
    `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length &&
      `Transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Experience:\n${profile.experience.map((e) => `- ${e.title} at ${e.company}: ${e.description}`).join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education.map((e) => `- ${e.degree} in ${e.field}, ${e.institution}`).join("\n")}`,
    profile.certifications?.length &&
      `Certifications: ${profile.certifications.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: SkillsEngineSchema }),
      prompt: `You are an expert career skills analyst. Perform a comprehensive skills gap analysis comparing a candidate's profile against market-validated requirements for their target role.

CANDIDATE PROFILE:
${profileSummary}

TARGET ROLE: ${targetRole}
${marketSkillsSection}

INSTRUCTIONS:
1. Extract and categorize ALL user skills with proficiency estimates based on their experience depth.

2. Build the target role skill requirements. ${marketContext?.topSkills?.length ? "Use the MARKET DATA above as the primary source — it reflects real job posting frequency. Add any additional skills you know are commonly required but not in the data." : "Use your knowledge of typical requirements for this role."}
   - Set marketDemandPercent from the posting frequency data when available.
   - Mark trending skills from the market data.

3. Match user skills against target requirements:
   - "direct" match: user has the exact or equivalent skill.
   - "transferable" match: user has a related skill that partially transfers (explain how).

4. Categorize gaps into three tiers:
   - "transferable": user has an adjacent skill that can be bridged (1-4 weeks).
   - "learnable": new skill that can be acquired through courses (4-12 weeks).
   - "deep-investment": requires significant time or formal education (12+ weeks).
   For EACH gap, provide:
   - Concrete bridge actions (what to do, not vague advice).
   - 1-3 REAL learning resources (Coursera, Udemy, YouTube, official docs, Google Certs, etc.)
   - Accurate time estimates.
   - priorityRank based on: importance × marketDemandPercent × trending bonus.

5. Create a 3-phase learning roadmap:
   - "quick-wins" (Weeks 1-3): Transferable gaps + easy wins. Milestone: demonstrable skill.
   - "core-skills" (Weeks 4-8): Critical learnable gaps. Milestone: certification or project.
   - "deep-expertise" (Weeks 9-16): Deep investment areas. Milestone: portfolio-ready work.

6. Summary must include:
   - readinessScore: 0-100 weighted by skill importance and market demand.
   - quickWins: 2-3 things the user can do THIS WEEK to strengthen their profile.
   - transitionNarrative: 2-3 sentence story of their transition path.

7. marketContext: ${marketContext ? `Use the real salary and demand data provided.` : `Estimate based on your knowledge.`}

Be specific, actionable, and grounded in real market data. Reference actual skills from the profile.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate skills analysis. Please try again." },
        { status: 422 }
      );
    }

    await trackUsage(gate.email, "skills_assessment");

    const plan = await getUserPlan(gate.email);
    if (plan === "free") {
      return NextResponse.json({
        ...output,
        gaps: {
          transferable: output.gaps.transferable.map((g) => ({
            ...g,
            learningPath: [],
          })),
          learnable: output.gaps.learnable.map((g) => ({
            ...g,
            learningPath: [],
          })),
          deepInvestment: output.gaps.deepInvestment.map((g) => ({
            ...g,
            learningPath: [],
          })),
        },
        learningRoadmap: [],
        _freeTier: true,
      });
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Skills engine error:", err);
    return NextResponse.json(
      { error: "Failed to analyze skills. Please try again." },
      { status: 500 }
    );
  }
}
