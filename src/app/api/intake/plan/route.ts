import { NextRequest, NextResponse } from "next/server";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";

const PivotPlanSchema = z.object({
  plans: z.array(z.object({
    targetRole: z.string(),
    targetIndustry: z.string(),
    rationale: z.string(),
    sixMonthMilestones: z.array(z.string()),
    oneYearMilestones: z.array(z.string()),
    twoYearMilestones: z.array(z.string()),
    skillGaps: z.array(z.string()),
    keyActions: z.array(z.string()),
    estimatedTimeToTransition: z.string(),
    financialConsiderations: z.string(),
  })).min(1).max(3),
});

export async function POST(req: NextRequest) {
  const { profile }: { profile: UserProfile } = await req.json();

  if (!profile) {
    return NextResponse.json({ error: "profile required" }, { status: 400 });
  }

  const { output: object } = await generateText({
    model: "anthropic/claude-sonnet-4.6",
    output: Output.object({ schema: PivotPlanSchema }),
    prompt: `You are an expert career strategist specializing in mid-career pivots for professionals with real financial obligations.

Based on this user's career profile, generate 2-3 realistic career pivot plans ranked by fit and feasibility. Each plan must include concrete 6-month, 1-year, and 2-year milestones.

IMPORTANT: Be constraint-aware. Account for the fact that this person has an established career and likely financial obligations. Favor paths that:
1. Leverage existing domain expertise rather than starting from scratch
2. Minimize income gap during transition
3. Are achievable within 6-18 months for a working professional

User profile:
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Top skills: ${profile.skills.slice(0, 10).join(", ")}
- Transferable skills: ${profile.transferableSkills.slice(0, 8).join(", ")}
- Experience: ${profile.experience.map(e => `${e.title} at ${e.company}`).join("; ")}
- Education: ${profile.education.map(e => `${e.degree} in ${e.field}`).join("; ")}
- Certifications: ${profile.certifications.join(", ")}
- Interests: ${profile.interests.join(", ")}

Generate personalized, actionable plans — not generic advice.`,
  });

  return NextResponse.json(object);
}
