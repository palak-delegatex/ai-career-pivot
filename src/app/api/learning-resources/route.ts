import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const ResourceSchema = z.object({
  recommendations: z.array(
    z.object({
      skill: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      resources: z.array(
        z.object({
          name: z.string(),
          provider: z.string(),
          type: z.enum(["course", "certification", "tutorial", "book", "youtube", "practice"]),
          url: z.string(),
          cost: z.string(),
          duration: z.string(),
          level: z.enum(["beginner", "intermediate", "advanced"]),
          reason: z.string(),
        })
      ),
    })
  ),
  learningPath: z.object({
    totalEstimatedTime: z.string(),
    suggestedOrder: z.array(z.string()),
    quickWins: z.array(z.string()),
  }),
});

export type LearningResourceResult = z.infer<typeof ResourceSchema>;

export async function POST(req: NextRequest) {
  const {
    skillGaps,
    targetRole,
    currentLevel,
  }: {
    skillGaps: { skill: string; currentLevel: string; requiredLevel: string; priority: string }[];
    targetRole?: string;
    currentLevel?: string;
  } = await req.json();

  if (!skillGaps?.length) {
    return NextResponse.json(
      { error: "skillGaps array is required" },
      { status: 400 }
    );
  }

  const gapsSummary = skillGaps
    .map((g) => `- ${g.skill}: ${g.currentLevel} → ${g.requiredLevel} (${g.priority} priority)`)
    .join("\n");

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: ResourceSchema }),
      prompt: `You are a career learning advisor. Given these skill gaps, recommend specific, real learning resources for each skill.

SKILL GAPS:
${gapsSummary}
${targetRole ? `\nTarget role: ${targetRole}` : ""}
${currentLevel ? `\nCandidate's current experience level: ${currentLevel}` : ""}

For EACH skill gap, recommend 2-3 specific resources:
- Use REAL courses, certifications, and platforms that actually exist (Coursera, Udemy, LinkedIn Learning, YouTube channels, official documentation, books, etc.)
- Include the actual URL if you know it, otherwise use the platform's search URL for that topic
- Estimate realistic completion times
- Match difficulty to the candidate's current level for that skill
- Explain WHY this resource is the best fit for bridging their specific gap

Also provide:
- A suggested learning ORDER (which skills to tackle first for maximum impact)
- Quick wins — skills or resources that can show results within 1-2 weeks
- Total estimated time to close all gaps

Prioritize free and low-cost resources. Include at least one free option per skill when possible.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate recommendations" },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Learning resources error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
