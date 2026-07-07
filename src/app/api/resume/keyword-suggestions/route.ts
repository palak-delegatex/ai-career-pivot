import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { localeSystemPrompt } from "@/lib/locale";

// One Sonnet call produces a polished, resume-ready gap-fill line for each
// missing JD keyword so the client can offer instant one-click "insert".
const model = anthropic("claude-sonnet-4-6");

const SuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      keyword: z.string(),
      // A single, natural resume bullet or skill phrasing that surfaces the
      // keyword truthfully in context — never keyword-stuffing.
      bullet: z.string(),
      // Where this line best belongs so the client can insert under the right
      // heading: "skills" | "experience" | "summary".
      section: z.enum(["skills", "experience", "summary"]),
    })
  ),
});

interface SuggestInput {
  jobDescription?: string;
  resumeText?: string;
  keywords?: string[];
  locale?: string;
}

export async function POST(req: NextRequest) {
  let body: SuggestInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const keywords = (body.keywords || [])
    .map((k) => (typeof k === "string" ? k.trim() : ""))
    .filter(Boolean)
    .slice(0, 30);

  if (keywords.length === 0) {
    return NextResponse.json({ suggestions: [] });
  }

  const resumeText = (body.resumeText || "").slice(0, 6000);
  const jobDescription = (body.jobDescription || "").slice(0, 4000);

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: SuggestionsSchema }),
      system: localeSystemPrompt(body.locale),
      messages: [
        {
          role: "user",
          content: `A candidate's resume is missing these keywords that the target job wants: ${keywords.join(", ")}.

For EACH keyword, write ONE concise, truthful resume line the candidate could add to close the gap — phrased naturally in the candidate's own voice, grounded in their existing experience below. Do NOT invent employers, titles, metrics, or credentials the resume doesn't support. If a keyword can only be surfaced as a skill, phrase it as a skills-list entry. Never keyword-stuff.

Return one suggestion per keyword with the section it best fits ("skills", "experience", or "summary").

TARGET JOB (context):
"""
${jobDescription}
"""

CANDIDATE RESUME:
"""
${resumeText}
"""`,
        },
      ],
    });

    if (!output) {
      return NextResponse.json({ suggestions: [] });
    }

    return NextResponse.json({ suggestions: output.suggestions });
  } catch (err) {
    const message = err instanceof Error ? err.message : "Suggestion generation failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
