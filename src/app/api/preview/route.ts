import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { localeSystemPrompt } from "@/lib/locale";

export async function POST(req: NextRequest) {
  const { currentRole, targetRole, locale } = await req.json();

  if (!currentRole?.trim() || !targetRole?.trim()) {
    return Response.json(
      { error: "Both current role and target role are required" },
      { status: 400 },
    );
  }

  const result = streamText({
    model: anthropic("claude-haiku-4-5-20251001"),
    prompt: `You are a career strategist. A professional wants to pivot from "${currentRole}" to "${targetRole}".

Analyze their skill gap and return ONLY valid JSON (no markdown, no code fences) matching this exact structure:

{
  "matchScore": <number 0-100 representing overall career match>,
  "summary": "<1 sentence explaining the match>",
  "skillGaps": [
    {
      "skill": "<skill name>",
      "currentLevel": <number 0-100>,
      "requiredLevel": <number 0-100>,
      "priority": "high" | "medium" | "low"
    }
  ],
  "topActions": [
    "<action 1>",
    "<action 2>",
    "<action 3>"
  ],
  "transferableStrengths": [
    "<strength 1>",
    "<strength 2>",
    "<strength 3>"
  ]
}

Generate exactly 5 skill gaps ordered by priority (high first). The matchScore should reflect realistic market alignment. topActions should be specific, actionable next steps. transferableStrengths should highlight what carries over from the current role. Return ONLY the JSON object.${localeSystemPrompt(locale)}`,
  });

  return result.toTextStreamResponse();
}
