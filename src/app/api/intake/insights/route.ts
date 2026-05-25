import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import type { UserProfile } from "@/lib/intake";

export async function POST(req: NextRequest) {
  const { profile } = (await req.json()) as { profile: UserProfile };

  if (!profile || !profile.skills?.length) {
    return new Response(JSON.stringify({ error: "profile required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const profileSummary = [
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience && `${profile.yearsExperience} years experience`,
    `Skills: ${profile.skills.slice(0, 15).join(", ")}`,
    profile.transferableSkills?.length &&
      `Transferable skills: ${profile.transferableSkills.slice(0, 10).join(", ")}`,
    profile.interests?.length &&
      `Interests: ${profile.interests.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n");

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    system: `You are a career insights analyst who specializes in how AI is transforming industries and creating new career opportunities. Given a professional profile, generate exactly 5 short, personalized career insights. Each insight should be specific to THIS person's background — not generic advice.

Rules:
- Each insight must be 1-2 sentences max
- Be specific: reference their actual skills, industry, or experience
- At least 2 of the 5 insights MUST focus on AI opportunities: how AI tools can amplify their existing skills, which AI technologies are creating demand in their field, how AI-augmented professionals in their industry earn more, or which AI certifications would give them the biggest career boost
- Mix insight types: AI-powered career opportunities, market demand for AI-augmented skills in their field, surprising AI-enabled career pivots others have made, salary premiums for AI-skilled professionals in their expertise area, unique skill + AI combinations they could leverage
- Frame AI as a career multiplier — their domain expertise + AI fluency = a powerful combination
- Use an encouraging but data-informed tone
- Output ONLY the 5 insights, one per line, numbered 1-5
- No headers, no introductions, no conclusions`,
    prompt: `Generate 5 personalized career insights for this professional:\n\n${profileSummary}`,
    maxOutputTokens: 500,
  });

  return result.toTextStreamResponse();
}
