import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile, SkillGapAnalysisResult } from "@/lib/intake";
import { fetchMarketContext } from "@/lib/market-data";

const LearningResourceSchema = z.object({
  name: z.string(),
  provider: z.string(),
  type: z.enum([
    "course",
    "certification",
    "project",
    "book",
    "tutorial",
    "bootcamp",
  ]),
  url: z.string(),
  cost: z.enum(["free", "low", "medium", "high"]),
  estimatedHours: z.number(),
  impactScore: z.number().min(1).max(10),
});

const SkillGapItemSchema = z.object({
  skill: z.string(),
  category: z.enum(["technical", "soft", "domain", "certification", "tool"]),
  importance: z.enum(["critical", "important", "nice-to-have"]),
  gapType: z.enum(["transferable", "learnable", "deep-investment"]),
  currentLevel: z.string().nullable(),
  requiredLevel: z.string(),
  adjacentSkill: z.string().nullable(),
  transferExplanation: z.string().nullable(),
  bridgeActions: z.array(z.string()),
  estimatedWeeksToClose: z.number(),
  learningPath: z.array(LearningResourceSchema),
  priorityRank: z.number(),
});

const SkillGapAnalysisSchema = z.object({
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
      proficiency: z.enum([
        "expert",
        "advanced",
        "intermediate",
        "beginner",
      ]),
      yearsUsed: z.number().nullable(),
      source: z.string(),
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
    })
  ),
  matchedSkills: z.array(
    z.object({
      skill: z.string(),
      proficiency: z.string(),
      matchConfidence: z.number().min(0).max(100),
    })
  ),
  gaps: z.object({
    transferable: z.array(SkillGapItemSchema),
    learnable: z.array(SkillGapItemSchema),
    deepInvestment: z.array(SkillGapItemSchema),
  }),
  summary: z.object({
    matchedPercent: z.number().min(0).max(100),
    transferablePercent: z.number().min(0).max(100),
    learnablePercent: z.number().min(0).max(100),
    deepInvestmentPercent: z.number().min(0).max(100),
    readinessScore: z.number().min(0).max(100),
    readinessLabel: z.string(),
    estimatedTransitionWeeks: z.number(),
    topStrength: z.string(),
    biggestGap: z.string(),
    transitionNarrative: z.string(),
  }),
  learningRoadmap: z.array(
    z.object({
      phase: z.enum(["quick-wins", "core-skills", "deep-expertise"]),
      title: z.string(),
      durationWeeks: z.number(),
      skills: z.array(z.string()),
      resources: z.array(LearningResourceSchema),
    })
  ),
});

function buildProfileContext(profile: UserProfile): string {
  return [
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience && `Years of experience: ${profile.yearsExperience}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length &&
      `Self-reported transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Work experience:\n${profile.experience
        .map(
          (e) =>
            `- ${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "present"}): ${e.description}`
        )
        .join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education
        .map((e) => `- ${e.degree} in ${e.field}, ${e.institution}`)
        .join("\n")}`,
    profile.certifications?.length &&
      `Certifications: ${profile.certifications.join(", ")}`,
    profile.circumstances?.timeline &&
      `Transition timeline: ${profile.circumstances.timeline}`,
    profile.circumstances?.riskTolerance &&
      `Risk tolerance: ${profile.circumstances.riskTolerance}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  const { profile, targetRole, targetIndustry } = (await req.json()) as {
    profile: UserProfile;
    targetRole: string;
    targetIndustry?: string;
  };

  if (!profile?.skills?.length && !profile?.experience?.length) {
    return NextResponse.json(
      { error: "User profile with skills or experience is required" },
      { status: 400 }
    );
  }

  if (!targetRole || targetRole.length < 2) {
    return NextResponse.json(
      { error: "Target role is required" },
      { status: 400 }
    );
  }

  const profileContext = buildProfileContext(profile);
  const industryClause = targetIndustry
    ? ` in the ${targetIndustry} industry`
    : "";

  const marketCtx = await fetchMarketContext(targetRole);
  let marketBlock = "";
  if (marketCtx) {
    const topSkillsList = marketCtx.topSkills
      .slice(0, 8)
      .map((s) => `${s.skill} (${s.frequencyPercent}% of postings${s.trending ? ", trending" : ""})`)
      .join(", ");
    marketBlock = `

REAL MARKET DATA for ${targetRole} (BLS/O*NET — use to ground your analysis):
- Salary range: P25=$${marketCtx.salary.p25.toLocaleString()} | Median=$${marketCtx.salary.p50.toLocaleString()} | P75=$${marketCtx.salary.p75.toLocaleString()}
- Demand: ${marketCtx.demand.trend} (${marketCtx.demand.trendStrength}), ${marketCtx.demand.growthPercent}% projected growth
- Top skills in job postings: ${topSkillsList}
- Employment: ${marketCtx.demand.totalEmployment.toLocaleString()} workers nationally

IMPORTANT: Prioritize skills that appear most frequently in job postings (listed above). Skills marked "trending" should be weighted higher in importance. Use this data to set targetRoleSkills importance levels and gap priorityRank values.`;
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: SkillGapAnalysisSchema }),
      prompt: `You are a career transition expert specializing in skill gap analysis for professionals pivoting to new roles. Your analysis must be specific, actionable, and grounded in the candidate's actual background.

TARGET ROLE: ${targetRole}${industryClause}
${marketBlock}

CANDIDATE PROFILE:
${profileContext}

Perform a comprehensive career-transition skill gap analysis:

## 1. USER SKILLS (userSkills)
Extract ALL skills — both explicit (listed) and implicit (inferred from job titles, descriptions, education, certifications). Categorize each as technical, soft, domain, certification, or tool. Estimate proficiency and years used. In "source", note where you found the skill.

## 2. TARGET ROLE SKILLS (targetRoleSkills)
Generate the complete skill profile for ${targetRole}${industryClause}. Include 15-25 skills across all categories. Rate importance as critical, important, or nice-to-have based on current job market expectations${marketCtx ? " and the real market data above" : ""}.

## 3. MATCHED SKILLS (matchedSkills)
Skills the candidate already has that directly match target role requirements. matchConfidence 80-100.

## 4. SKILL GAPS — Categorize every unmatched skill into EXACTLY ONE of three buckets:

### TRANSFERABLE gaps (gapType: "transferable")
The candidate has an adjacent/related skill that transfers. They don't need to learn from scratch — they need to bridge from what they know.
- Set adjacentSkill to the user's existing skill that transfers
- Set transferExplanation describing HOW it transfers with specificity
- Set bridgeActions: 1-3 concrete steps to bridge the gap
- estimatedWeeksToClose: typically 2-8 weeks
- Example: A project manager pivoting to product management — their stakeholder management skill transfers directly; they need to learn product-specific frameworks like PRDs and user story mapping.

### LEARNABLE gaps (gapType: "learnable")
New skills that can be acquired in under 12 weeks through courses, tutorials, or projects. No prior adjacent skill, but the learning curve is manageable.
- adjacentSkill: null
- bridgeActions: 1-3 specific learning actions
- estimatedWeeksToClose: 1-12 weeks
- Example: A marketer learning SQL — no adjacent skill, but achievable in 6-8 weeks with a structured course.

### DEEP INVESTMENT gaps (gapType: "deep-investment")
Skills requiring significant upskilling — formal certification programs, bootcamps, or 3+ months of dedicated study. Often foundational technical skills or regulated credentials.
- adjacentSkill: null
- bridgeActions: 1-3 high-level steps for the learning journey
- estimatedWeeksToClose: 13-52+ weeks
- Example: A teacher pivoting to data science needing to learn machine learning fundamentals — requires a bootcamp or multi-month study program.

For ALL gap types, include learningPath with 1-3 specific resources:
- Use real, well-known learning platforms and courses (Coursera, Udemy, LinkedIn Learning, edX, freeCodeCamp, etc.)
- Include realistic URLs (use the platform's base URL + course path pattern)
- Rank by impactScore (1-10): how much this resource moves the needle for this specific career transition
- Include estimated hours and cost tier

## 5. SUMMARY
- matchedPercent + transferablePercent + learnablePercent + deepInvestmentPercent = 100 (proportion of target skills)
- readinessScore: 0-100 weighted score (direct matches count fully, transferable at 70%, learnable at 30%, deep investment at 10%)
- readinessLabel: "Ready to Apply" (80+), "Strong Foundation" (60-79), "Moderate Pivot" (40-59), "Significant Reskilling" (20-39), "Career Reinvention" (<20)
- estimatedTransitionWeeks: realistic estimate accounting for parallel learning
- topStrength: the candidate's single most compelling transferable advantage
- biggestGap: the most critical skill gap to address first
- transitionNarrative: 2-3 sentence compelling narrative of why this person CAN make this pivot, framed positively around their transferable strengths

## 6. LEARNING ROADMAP (learningRoadmap)
Organize all gap-closing work into three sequential phases:
- "quick-wins" (weeks 1-4): transferable gaps that can be bridged fast + easy learnable skills. Build confidence and resume items quickly.
- "core-skills" (weeks 5-12): remaining learnable gaps, especially critical ones. The bulk of new skill acquisition.
- "deep-expertise" (weeks 13+): deep investment skills. Ongoing certification work and advanced study.

Each phase includes the specific skills to focus on and the best resources to use.

Be specific and grounded. Reference actual skills and experiences from the profile. Do not fabricate skills the user doesn't have.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate skill gap analysis. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output satisfies SkillGapAnalysisResult);
  } catch (err) {
    console.error("Skill gap analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze skill gaps. Please try again." },
      { status: 500 }
    );
  }
}
