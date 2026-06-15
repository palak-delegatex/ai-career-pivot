import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";

const QuickPivotSchema = z.object({
  pivotPaths: z.array(z.object({
    targetRole: z.string(),
    targetIndustry: z.string(),
    matchScore: z.number().min(0).max(100),
    rationale: z.string(),
    topTransferableSkills: z.array(z.string()),
    keyGaps: z.array(z.string()),
    timeToTransition: z.string(),
  })),
  profileStrengths: z.array(z.string()),
  skillGapPreview: z.object({
    strongSkills: z.array(z.string()),
    growthAreas: z.array(z.string()),
    uniqueAdvantages: z.array(z.string()),
  }),
});

export type QuickPivotResult = z.infer<typeof QuickPivotSchema>;

function buildProfileSummary(profile: UserProfile): string {
  return [
    profile.name && `Name: ${profile.name}`,
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience && `Years of experience: ${profile.yearsExperience}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length && `Transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length && `Work history:\n${profile.experience.slice(0, 10).map(e =>
      `- ${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "present"}): ${e.description}`
    ).join("\n")}`,
    profile.education?.length && `Education:\n${profile.education.map(e =>
      `- ${e.degree} in ${e.field}, ${e.institution}`
    ).join("\n")}`,
    profile.certifications?.length && `Certifications: ${profile.certifications.join(", ")}`,
  ].filter(Boolean).join("\n\n");
}

export async function POST(req: NextRequest) {
  const { profile } = (await req.json()) as { profile: UserProfile };

  if (!profile?.skills?.length && !profile?.experience?.length) {
    return NextResponse.json(
      { error: "Profile with skills or experience is required" },
      { status: 400 }
    );
  }

  const summary = buildProfileSummary(profile);

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: QuickPivotSchema }),
      prompt: `You are a career pivot strategist. Based on this professional's background, suggest the top 3 most promising career pivot paths. Focus on paths that leverage their existing strengths and minimize reskilling time.

CANDIDATE PROFILE:
${summary}

For each pivot path:
1. Choose a specific target role (not vague like "consultant" — be specific like "Product Manager at a SaaS company")
2. Score the match 0-100 based on skill transferability and market demand
3. Explain WHY this pivot makes sense for THIS person specifically
4. List the top 3 skills that transfer directly
5. List the 2-3 key gaps they'd need to close
6. Estimate realistic time to transition

Also provide:
- profileStrengths: their 3-5 standout professional strengths based on the data
- skillGapPreview: categorize their skills into strongSkills (market-ready), growthAreas (need development), and uniqueAdvantages (rare combinations that give them an edge)

Be realistic and specific. Reference actual data from their profile. Rank pivots by feasibility, not ambition.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate pivot suggestions. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Quick pivot error:", err);
    return NextResponse.json(
      { error: "Failed to generate pivot suggestions. Please try again." },
      { status: 500 }
    );
  }
}
