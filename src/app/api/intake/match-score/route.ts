import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { jsonSchema } from "ai";
import type { UserProfile } from "@/lib/intake";

const matchScoreSchema = jsonSchema<MatchScoreResult>({
  type: "object",
  additionalProperties: false,
  properties: {
    overallScore: { type: "number" },
    dimensions: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          name: { type: "string" },
          score: { type: "number" },
        },
        required: ["name", "score"],
      },
    },
    suggestions: {
      type: "array",
      items: { type: "string" },
    },
  },
  required: ["overallScore", "dimensions", "suggestions"],
});

type MatchScoreResult = {
  overallScore: number;
  dimensions: { name: string; score: number }[];
  suggestions: string[];
};

export async function POST(req: NextRequest) {
  const { profile }: { profile: UserProfile } = await req.json();

  if (!profile) {
    return NextResponse.json({ error: "profile required" }, { status: 400 });
  }

  try {
    const { object } = await generateObject({
      model: anthropic("claude-haiku-4-5-20251001"),
      schema: matchScoreSchema,
      prompt: `You are a career market-fit analyst. Evaluate this professional's profile against current market demand for career pivots. Return a fit score and breakdown.

SCORING RULES:
- overallScore: 0-100 overall market fit for career transition readiness
- dimensions: exactly 4 objects with names "Skills", "Experience", "Industry", "Market" — each scored 0-100
  - Skills: how transferable and in-demand their skill set is
  - Experience: depth and relevance of work history for pivoting
  - Industry: how favorable their current industry is for transitions
  - Market: current job market demand for professionals with their background
- suggestions: 2-4 short, actionable suggestions to improve their fit (each under 20 words)

Be calibrated: most professionals score 55-85. Reserve 90+ for exceptional profiles. Below 40 is rare.

PROFILE:
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Skills: ${profile.skills.slice(0, 12).join(", ")}
- Transferable skills: ${profile.transferableSkills.slice(0, 10).join(", ")}
- Work history: ${profile.experience.slice(0, 3).map(e => `${e.title} at ${e.company}`).join("; ")}
- Education: ${profile.education.map(e => `${e.degree} in ${e.field}`).join("; ")}
- Certifications: ${profile.certifications.join(", ") || "None"}
${profile.location ? `- Location: ${[profile.location.city, profile.location.region, profile.location.country].filter(Boolean).join(", ")}` : ""}

Evaluate honestly and specifically. Reference their actual skills and background.`,
    });

    return NextResponse.json(object);
  } catch (err) {
    console.error("Match score error:", err);
    return NextResponse.json(
      { error: "Failed to compute match score" },
      { status: 500 }
    );
  }
}
