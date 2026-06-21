import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { getSupabaseClient } from "@/lib/supabase";

const ExtractedKeywordsSchema = z.object({
  required: z
    .array(z.string())
    .describe("Must-have skills/qualifications explicitly stated as required"),
  preferred: z
    .array(z.string())
    .describe("Nice-to-have skills mentioned as preferred or bonus"),
  keywords: z
    .array(z.string())
    .describe("Other important ATS terms: technologies, methodologies, certifications, domain terms"),
  responsibilities: z
    .array(z.string())
    .describe("Key job responsibilities and duties"),
  experience_years: z
    .string()
    .describe("Required years of experience, e.g. '3-5 years' or '5+ years'"),
  tech_stack: z
    .array(z.string())
    .describe("Specific technologies, languages, frameworks, and tools mentioned"),
});

export async function POST(req: NextRequest) {
  const body = await req.json().catch(() => null);
  const { jobId, email, jobDescription } = body ?? {};

  if (!jobDescription || typeof jobDescription !== "string" || jobDescription.trim().length < 20) {
    return NextResponse.json(
      { error: "jobDescription must be at least 20 characters" },
      { status: 400 },
    );
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({ schema: ExtractedKeywordsSchema }),
      messages: [
        {
          role: "user",
          content: `Extract structured information from this job description for resume tailoring. Be thorough — extract every distinct skill, tool, qualification, and responsibility mentioned. Use the exact terms from the JD.

Categorize as:
- required: must-have skills and qualifications explicitly stated as required
- preferred: nice-to-have skills mentioned as preferred, bonus, or "a plus"
- keywords: other important ATS terms like methodologies, certifications, domain terms, soft skills
- responsibilities: key job responsibilities and duties (brief phrases)
- experience_years: required years of experience (e.g. "3-5 years", "5+ years", or "not specified")
- tech_stack: specific technologies, programming languages, frameworks, and tools

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

    if (jobId && email) {
      const supabase = getSupabaseClient();
      await supabase
        .from("tracked_jobs")
        .update({ extracted_keywords: output })
        .eq("id", jobId)
        .eq("user_email", email);
    }

    return NextResponse.json({ extracted_keywords: output });
  } catch (err) {
    console.error("Keyword extraction error:", err);
    return NextResponse.json({ error: "Failed to extract keywords" }, { status: 500 });
  }
}
