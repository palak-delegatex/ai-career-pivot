import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { localeSystemPrompt } from "@/lib/locale";

const GapAnalysisSchema = z.object({
  overallFitScore: z.number().describe("0-100"),
  fitLabel: z.enum([
    "Strong Match",
    "Good Match",
    "Moderate Match",
    "Stretch Role",
    "Major Gap",
  ]),
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
  weeklyActionPlan: z.array(
    z.object({
      week: z.number(),
      focus: z.string(),
      tasks: z.array(z.string()),
      hoursPerWeek: z.number(),
    })
  ),
  applicationTips: z.array(z.string()),
});

export type JobGapAnalysisResult = z.infer<typeof GapAnalysisSchema>;

export async function POST(req: NextRequest) {
  const { jobDescription, profile, locale } = await req.json();

  if (!jobDescription || jobDescription.length < 50) {
    return NextResponse.json(
      { error: "Job description must be at least 50 characters" },
      { status: 400 }
    );
  }

  if (!profile?.skills?.length) {
    return NextResponse.json(
      { error: "User profile with skills is required" },
      { status: 400 }
    );
  }

  const profileSummary = [
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience && `Years of experience: ${profile.yearsExperience}`,
    `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length &&
      `Transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Experience:\n${profile.experience.map((e: { title: string; company: string; description: string }) => `- ${e.title} at ${e.company}: ${e.description}`).join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education.map((e: { degree: string; field: string; institution: string }) => `- ${e.degree} in ${e.field}, ${e.institution}`).join("\n")}`,
    profile.certifications?.length &&
      `Certifications: ${profile.certifications.join(", ")}`,
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

Analyze the fit thoroughly:
1. Score overall fit 0-100 based on skills match, experience relevance, and education fit.
2. Identify every skill the candidate HAS that matches requirements (with evidence of strength).
3. Identify every skill/qualification they're MISSING, rated by importance (must-have vs nice-to-have), with concrete action steps, time estimates, and specific learning resources.
4. Note experience gaps where the JD asks for specific experience the candidate lacks.
5. Create a 4-week action plan to close the most critical gaps, with specific tasks and estimated hours per week.
6. Give 3-5 concrete application tips for this specific role.

Be specific and actionable. Reference actual skills from both the profile and JD.${localeSystemPrompt(locale)}`,
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
