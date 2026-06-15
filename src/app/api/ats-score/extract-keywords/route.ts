import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const JDKeywordsSchema = z.object({
  required: z.array(z.string()).describe("Must-have skills/qualifications explicitly stated as required"),
  preferred: z.array(z.string()).describe("Nice-to-have skills mentioned as preferred or bonus"),
  keywords: z.array(z.string()).describe("Other important ATS terms: technologies, methodologies, certifications, domain terms"),
});

export type ExtractedJDKeywords = z.infer<typeof JDKeywordsSchema>;

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const jobDescription = body?.jobDescription;

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
    return NextResponse.json(
      { error: "Job description must be at least 20 characters" },
      { status: 400 },
    );
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: JDKeywordsSchema }),
      messages: [
        {
          role: "user",
          content: `Extract structured keywords from this job description. Categorize as:
- required: must-have skills and qualifications explicitly stated as required
- preferred: nice-to-have skills mentioned as preferred, bonus, or "a plus"
- keywords: other important ATS terms like technologies, methodologies, certifications, domain terms, soft skills

Be thorough — extract every distinct skill, tool, and qualification mentioned. Use the exact terms from the JD.

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 6000)}
"""`,
        },
      ],
    });

    if (!output) {
      return NextResponse.json({ error: "Could not parse job description" }, { status: 422 });
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("JD keyword extraction error:", err);
    return NextResponse.json({ error: "Failed to extract keywords" }, { status: 500 });
  }
}
