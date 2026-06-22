import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const CourseSchema = z.object({
  name: z.string(),
  provider: z.string(),
  type: z.enum(["course", "certification", "tutorial", "book", "youtube", "practice", "bootcamp"]),
  url: z.string(),
  cost: z.string(),
  duration: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  reason: z.string(),
});

const SkillGapItemSchema = z.object({
  skill: z.string(),
  category: z.enum(["technical", "soft", "domain", "tool", "certification"]),
  currentLevel: z.enum(["none", "beginner", "intermediate", "advanced"]),
  requiredLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
  importance: z.enum(["critical", "important", "nice-to-have"]),
  priorityRank: z.number(),
  estimatedWeeksToCompetency: z.number(),
  transferability: z.object({
    score: z.number().min(0).max(100),
    note: z.string(),
  }),
  courses: z.array(CourseSchema).min(2).max(4),
});

const SkillsGapAnalysisSchema = z.object({
  targetRole: z.string(),
  targetIndustry: z.string(),
  overallReadinessScore: z.number().min(0).max(100),
  readinessLabel: z.enum(["Ready Now", "Almost Ready", "On Track", "Significant Gaps", "Major Reskilling Needed"]),
  totalEstimatedWeeks: z.number(),
  existingStrengths: z.array(
    z.object({
      skill: z.string(),
      relevance: z.string(),
      strengthLevel: z.enum(["expert", "advanced", "intermediate"]),
    })
  ),
  gaps: z.array(SkillGapItemSchema),
  learningPath: z.object({
    phase1: z.object({
      title: z.string(),
      weeks: z.string(),
      focus: z.array(z.string()),
      milestone: z.string(),
    }),
    phase2: z.object({
      title: z.string(),
      weeks: z.string(),
      focus: z.array(z.string()),
      milestone: z.string(),
    }),
    phase3: z.object({
      title: z.string(),
      weeks: z.string(),
      focus: z.array(z.string()),
      milestone: z.string(),
    }),
  }),
  quickWins: z.array(
    z.object({
      action: z.string(),
      timeframe: z.string(),
      impact: z.string(),
    })
  ),
  competitiveAdvantages: z.array(z.string()),
});

export type SkillsGapAnalysis = z.infer<typeof SkillsGapAnalysisSchema>;
export type SkillGapItem = z.infer<typeof SkillGapItemSchema>;
export type Course = z.infer<typeof CourseSchema>;

export async function POST(req: NextRequest) {
  const {
    targetRole,
    userSkills,
    currentTitle,
    transferableSkills,
    userExperience,
    userEducation,
    certifications,
    yearsExperience,
  }: {
    targetRole: string;
    userSkills: string[];
    currentTitle?: string;
    transferableSkills?: string[];
    userExperience?: { title: string; company: string; description: string }[];
    userEducation?: { degree: string; field: string; institution: string }[];
    certifications?: string[];
    yearsExperience?: number;
  } = await req.json();

  if (!targetRole?.trim() || !userSkills?.length) {
    return NextResponse.json(
      { error: "targetRole and userSkills are required" },
      { status: 400 },
    );
  }

  const profileSummary = [
    currentTitle && `Current role: ${currentTitle}`,
    yearsExperience && `Years of experience: ${yearsExperience}`,
    `Skills: ${userSkills.join(", ")}`,
    transferableSkills?.length && `Transferable skills: ${transferableSkills.join(", ")}`,
    certifications?.length && `Certifications: ${certifications.join(", ")}`,
    userExperience?.length &&
      `Experience:\n${userExperience.map((e) => `- ${e.title} at ${e.company}: ${e.description}`).join("\n")}`,
    userEducation?.length &&
      `Education:\n${userEducation.map((e) => `- ${e.degree} in ${e.field}, ${e.institution}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: SkillsGapAnalysisSchema }),
      prompt: `You are an expert career skills analyst specializing in career transitions and upskilling. Perform a comprehensive skills gap analysis comparing this candidate's current profile against the requirements for their target role.

CANDIDATE PROFILE:
${profileSummary}

TARGET ROLE: ${targetRole.trim()}

Perform a thorough analysis:

1. EXISTING STRENGTHS: Identify skills the candidate already has that are relevant to the target role. Rate each strength level.

2. SKILL GAPS: For each gap, provide:
   - The specific skill name and category (technical, soft, domain, tool, certification)
   - Current level vs required level for the target role
   - Importance (critical skills that are must-haves, important but learnable, or nice-to-have differentiators)
   - Priority rank (1 = most urgent to address first)
   - Estimated weeks to reach competency (be realistic based on current level)
   - Transferability score (0-100) — how much their existing skills help them learn this faster
   - 2-4 SPECIFIC, REAL learning resources:
     * Use actual course names from Coursera, Udemy, LinkedIn Learning, edX, YouTube channels, freeCodeCamp, Kaggle, official docs, books, etc.
     * Include realistic URLs (use platform search URLs if you're unsure of exact course URLs)
     * Mix free and paid options — always include at least one free resource per skill
     * Match the resource level to their current skill level for that gap
     * Explain why each resource is the best fit for bridging their specific gap

3. LEARNING PATH: Create a 3-phase learning roadmap:
   - Phase 1: Foundation/Quick wins (critical gaps + easy wins)
   - Phase 2: Core competency building
   - Phase 3: Advanced skills + differentiation
   Each phase should have a clear milestone that proves progress.

4. QUICK WINS: 3-5 actions they can take in the first 1-2 weeks to build momentum.

5. COMPETITIVE ADVANTAGES: What unique strengths from their background give them an edge over typical candidates for this role?

Be specific and actionable. Use real resources. Prioritize free and open-source learning when possible. Consider the candidate's transferable skills when estimating learning timelines — someone with adjacent experience learns faster.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate skills gap analysis. Please try again." },
        { status: 422 },
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Skills gap analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze skills gap. Please try again." },
      { status: 500 },
    );
  }
}
