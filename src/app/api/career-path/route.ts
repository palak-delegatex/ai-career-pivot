import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const CareerNodeSchema = z.object({
  id: z.string(),
  title: z.string(),
  industry: z.string(),
  salaryMin: z.number(),
  salaryMax: z.number(),
  transitionDifficulty: z.enum(["low", "medium", "high"]),
  timelineMonths: z.number(),
  requiredSkills: z.array(z.string()),
  requiredCertifications: z.array(z.string()),
  skillGaps: z.array(
    z.object({
      skill: z.string(),
      currentLevel: z.enum(["none", "beginner", "intermediate", "advanced"]),
      requiredLevel: z.enum(["beginner", "intermediate", "advanced", "expert"]),
      acquisitionWeeks: z.number(),
      resources: z.array(z.string()),
    })
  ),
  milestones: z.object({
    sixMonth: z.string(),
    oneYear: z.string(),
    twoYear: z.string(),
  }),
  whyGoodFit: z.string(),
  marketDemand: z.enum(["low", "moderate", "high", "very-high"]),
});

const CareerPathSchema = z.object({
  rootTitle: z.string(),
  rootIndustry: z.string(),
  paths: z.array(
    z.object({
      id: z.string(),
      direction: z.string(),
      nodes: z.array(CareerNodeSchema),
    })
  ),
});

export type CareerPathNode = z.infer<typeof CareerNodeSchema>;
export type CareerPathResult = z.infer<typeof CareerPathSchema>;

export async function POST(req: NextRequest) {
  const { profile, circumstances } = await req.json();

  if (!profile?.skills?.length) {
    return NextResponse.json(
      { error: "User profile with skills is required" },
      { status: 400 }
    );
  }

  const profileSummary = [
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Current industry: ${profile.currentIndustry}`,
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
    profile.interests?.length &&
      `Interests: ${profile.interests.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  const constraintsSummary = circumstances
    ? [
        circumstances.salaryFloor && `Minimum salary: ${circumstances.salaryFloor}`,
        circumstances.dependents && `Dependents: ${circumstances.dependents}`,
        circumstances.timeline && `Preferred timeline: ${circumstances.timeline}`,
        circumstances.riskTolerance && `Risk tolerance: ${circumstances.riskTolerance}`,
        circumstances.willingnessToRelocate && `Relocation: ${circumstances.willingnessToRelocate}`,
      ]
        .filter(Boolean)
        .join("\n")
    : "No specific constraints provided.";

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: CareerPathSchema }),
      prompt: `You are a career transition expert. Generate a career path visualization tree showing possible career transitions for this person.

CANDIDATE PROFILE:
${profileSummary}

CONSTRAINTS & CIRCUMSTANCES:
${constraintsSummary}

Generate 3-4 distinct career DIRECTIONS (e.g. "Technical Leadership", "Adjacent Industry Pivot", "Entrepreneurial Path", "Specialist Deepening"). Each direction should have 2-3 progressive nodes representing increasingly ambitious transitions along that path.

For each career node:
- Give a specific, real job title (not generic)
- Provide realistic salary ranges for the US market
- Rate transition difficulty based on skill gaps and market barriers
- List concrete required skills and certifications
- Identify specific skill gaps with current vs required levels, weeks to acquire, and learning resources
- Set milestones at 6 months, 1 year, and 2 years showing concrete progress markers
- Explain why this is a good fit given their background
- Rate current market demand

IDs should be like "path-1-node-1", "path-2-node-2" etc.

Consider the person's constraints seriously:
- If they have a salary floor, don't suggest roles below it
- If they have dependents, factor in stability needs
- If risk tolerance is conservative, prioritize lower-difficulty transitions
- Timeline preferences should inform how many steps are in each path

Be specific and realistic. Reference actual skills from the profile. Use real certifications, real course names, real salary data.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate career paths. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Career path generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate career paths. Please try again." },
      { status: 500 }
    );
  }
}
