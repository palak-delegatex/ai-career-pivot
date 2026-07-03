import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { enforceFeatureAccess, isGateResponse, trackUsage, getUserPlan } from "@/lib/usage-gating";

const CourseResourceSchema = z.object({
  name: z.string(),
  provider: z.string(),
  type: z.enum(["course", "certification", "tutorial", "book", "youtube", "practice"]),
  url: z.string(),
  cost: z.enum(["free", "low", "medium", "high"]),
  duration: z.string(),
  level: z.enum(["beginner", "intermediate", "advanced"]),
  credentialValue: z.enum(["high", "medium", "low", "none"]),
  reason: z.string(),
});

const GapAnalysisSchema = z.object({
  overallFitScore: z.number().min(0).max(100),
  fitLabel: z.enum(["Strong Match", "Good Match", "Moderate Match", "Stretch Role", "Major Gap"]),
  matchedSkills: z.array(
    z.object({
      skill: z.string(),
      evidence: z.string(),
      strength: z.enum(["strong", "moderate", "basic"]),
    })
  ),
  missingSkills: z.array(
    z.object({
      skill: z.string(),
      importance: z.enum(["must-have", "nice-to-have"]),
      actionStep: z.string(),
      timeToAcquire: z.string(),
      recommendedResources: z.array(CourseResourceSchema).min(1).max(3),
    })
  ),
  experienceGaps: z.array(
    z.object({
      area: z.string(),
      gap: z.string(),
      suggestion: z.string(),
    })
  ),
  careerPivotFit: z.object({
    summary: z.string(),
    transferableHighlights: z.array(z.string()),
    biggestChallenges: z.array(z.string()),
    estimatedReadinessTimeline: z.string(),
  }),
  learningRoadmap: z.array(
    z.object({
      phase: z.enum(["foundation", "core-skills", "advanced"]),
      title: z.string(),
      weeks: z.string(),
      skills: z.array(z.string()),
      resources: z.array(CourseResourceSchema),
      milestone: z.string(),
    })
  ),
  applicationTips: z.array(z.string()),
});

export type GapAnalysisResult = z.infer<typeof GapAnalysisSchema>;

export async function POST(req: NextRequest) {
  const gate = await enforceFeatureAccess("gap_analysis");
  if (isGateResponse(gate)) return gate;

  const {
    jobDescription,
    userSkills,
    userExperience,
    userEducation,
    currentTitle,
    targetRole,
    transferableSkills,
  }: {
    jobDescription: string;
    userSkills: string[];
    userExperience?: { title: string; company: string; description: string }[];
    userEducation?: { degree: string; field: string; institution: string }[];
    currentTitle?: string;
    targetRole?: string;
    transferableSkills?: string[];
  } = await req.json();

  if (!jobDescription || !userSkills?.length) {
    return NextResponse.json(
      { error: "jobDescription and userSkills are required" },
      { status: 400 }
    );
  }

  const profileSummary = [
    currentTitle && `Current role: ${currentTitle}`,
    `Skills: ${userSkills.join(", ")}`,
    transferableSkills?.length && `Transferable skills: ${transferableSkills.join(", ")}`,
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
      output: Output.object({ schema: GapAnalysisSchema }),
      prompt: `You are a career gap analysis expert. Analyze how well this candidate matches a specific job posting.

CANDIDATE PROFILE:
${profileSummary}

JOB POSTING:
"""
${jobDescription.slice(0, 6000)}
"""
${targetRole ? `\nThe candidate is targeting: ${targetRole}` : ""}

Analyze the fit thoroughly:
1. Score overall fit 0-100 based on skills match, experience relevance, and education fit.
2. Identify every skill the candidate HAS that matches requirements (with evidence of strength).
3. Identify every skill/qualification they're MISSING, rated by importance, with concrete action steps and time estimates.
   For EACH missing skill, recommend 1-3 specific learning resources:
   - Use REAL courses from Coursera, Udemy, LinkedIn Learning, edX, Google Certificates, YouTube channels, books, or official docs
   - Include actual URLs (platform search URL for the topic if exact course URL unknown)
   - Rate credentialValue: "high" for industry-recognized certs (Google, AWS, PMP), "medium" for platform certificates, "low" for completion badges, "none" for self-study
   - Prioritize by: relevance to this specific role > credential value > cost-effectiveness > time investment
   - Include at least one free option per skill when possible
4. Note experience gaps — areas where the JD asks for specific experience the candidate lacks.
5. Assess career pivot fit — how their transferable skills bridge the gap, biggest challenges, and realistic timeline.
6. Create a 12-week learning roadmap with 3 phases:
   - "foundation" (Weeks 1-4): Quick wins, free resources, foundational knowledge. Milestone: what the candidate should be able to do/demonstrate.
   - "core-skills" (Weeks 5-8): Core skill acquisition through structured courses. Milestone: tangible project or certification completion.
   - "advanced" (Weeks 9-12): Advanced topics, portfolio projects, interview prep. Milestone: job-ready demonstration.
   Each phase should include specific resources prioritized by credential value and relevance.
7. Give 3-5 concrete application tips for this specific role.

Be specific and actionable. Reference actual skills from both the profile and JD.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate gap analysis. Please try again." },
        { status: 422 }
      );
    }

    await trackUsage(gate.email, "gap_analysis");

    const plan = await getUserPlan(gate.email);
    if (plan === "free") {
      return NextResponse.json({
        overallFitScore: output.overallFitScore,
        fitLabel: output.fitLabel,
        matchedSkills: output.matchedSkills,
        missingSkills: output.missingSkills.slice(0, 3).map((s) => ({
          skill: s.skill,
          importance: s.importance,
          actionStep: s.actionStep,
          timeToAcquire: s.timeToAcquire,
          recommendedResources: [],
        })),
        totalMissingSkills: output.missingSkills.length,
        experienceGaps: output.experienceGaps.slice(0, 2),
        totalExperienceGaps: output.experienceGaps.length,
        careerPivotFit: output.careerPivotFit,
        learningRoadmap: [],
        applicationTips: [],
        _freeTier: true,
      });
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Gap analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze job fit. Please try again." },
      { status: 500 }
    );
  }
}
