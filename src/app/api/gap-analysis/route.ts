import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

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
      recommendedResource: z.string(),
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
  applicationTips: z.array(z.string()),
});

export type GapAnalysisResult = z.infer<typeof GapAnalysisSchema>;

export async function POST(req: NextRequest) {
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
3. Identify every skill/qualification they're MISSING, rated by importance, with concrete action steps, time estimates, and specific learning resources (name actual courses, certifications, or platforms).
4. Note experience gaps — areas where the JD asks for specific experience the candidate lacks.
5. Assess career pivot fit — how their transferable skills bridge the gap, biggest challenges, and realistic timeline.
6. Give 3-5 concrete application tips for this specific role.

Be specific and actionable. Reference actual skills from both the profile and JD.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate gap analysis. Please try again." },
        { status: 422 }
      );
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
