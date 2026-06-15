import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const JDSummarySchema = z.object({
  roleTitle: z.string().describe("The job title"),
  company: z.string().describe("Company name if mentioned, otherwise 'Not specified'"),
  seniorityLevel: z.string().describe("Junior, Mid, Senior, Lead, Manager, Director, VP, or Not specified"),
  mustHaves: z.array(z.string()).describe("Non-negotiable requirements — skills, years of experience, certifications, education"),
  niceToHaves: z.array(z.string()).describe("Preferred qualifications that would strengthen the application"),
  keyResponsibilities: z.array(z.string()).describe("Top 5-7 core responsibilities, condensed to one line each"),
  extractedKeywords: z.object({
    technicalSkills: z.array(z.string()),
    softSkills: z.array(z.string()),
    tools: z.array(z.string()),
    certifications: z.array(z.string()),
    industryTerms: z.array(z.string()),
  }),
  salaryRange: z.string().describe("Salary range if mentioned, otherwise 'Not specified'"),
  remotePolicy: z.string().describe("Remote, Hybrid, On-site, or Not specified"),
});

export type JDSummary = z.infer<typeof JDSummarySchema>;

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
      output: Output.object({ schema: JDSummarySchema }),
      messages: [
        {
          role: "user",
          content: `Analyze and summarize this job description. Extract structured information about what the role requires.

Be thorough with keyword extraction — these will be used for ATS resume optimization. Include every distinct skill, tool, certification, and industry term mentioned.

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 8000)}
"""`,
        },
      ],
    });

    if (!output) {
      return NextResponse.json({ error: "Could not summarize job description" }, { status: 422 });
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("JD summarize error:", err);
    return NextResponse.json({ error: "Failed to summarize job description" }, { status: 500 });
  }
}
