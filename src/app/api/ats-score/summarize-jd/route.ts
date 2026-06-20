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
  redFlags: z.array(
    z.object({
      flag: z.string().describe("The red flag identified"),
      severity: z.enum(["high", "medium", "low"]),
      explanation: z.string().describe("Why this is a concern for job seekers"),
    })
  ).describe("Potential warning signs: unrealistic requirements for the level, vague role descriptions, signs of high turnover, excessive responsibilities, underpaying for requirements, 'unicorn' skill combos"),
  salarySignals: z.object({
    estimatedRange: z.string().describe("Estimated salary range based on role level, location, and industry signals even if not explicitly stated"),
    confidence: z.enum(["high", "medium", "low"]).describe("How confident the estimate is"),
    signals: z.array(z.string()).describe("Clues that informed the estimate: seniority title, location, company size, required experience, industry"),
    marketPosition: z.string().describe("Whether the stated/estimated range is below, at, or above market — e.g. 'Below market for a Senior role in SF requiring 7+ years'"),
  }),
  cultureSignals: z.array(
    z.object({
      signal: z.string().describe("The culture indicator found"),
      sentiment: z.enum(["positive", "neutral", "caution"]),
      detail: z.string().describe("What this suggests about the work environment"),
    })
  ).describe("Work-life balance indicators, growth opportunities, team dynamics, management style, DEI signals, startup vs enterprise culture clues"),
  applicationTips: z.array(z.string()).describe("3-5 specific tips for a strong application to this role based on the JD analysis"),
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

Also analyze for:
- RED FLAGS: Unrealistic requirements for the seniority level (e.g. 10 years for a junior role), vague descriptions that hide the actual work, signs of high turnover ("fast-paced" + "wear many hats" + no growth mention), excessive responsibility lists suggesting understaffing, "unicorn" skill combinations that span multiple specialties, unpaid or low-paid work disguised as opportunity.
- SALARY SIGNALS: Even if no salary is listed, estimate a range from title, seniority, location, industry, required experience, and company signals. Note confidence level and what signals you used.
- CULTURE SIGNALS: Work-life balance indicators (unlimited PTO, "hustle culture", flexible hours), growth opportunities (mentorship, learning budget, career paths), team dynamics (collaborative vs independent), DEI signals, startup vs enterprise culture clues.
- APPLICATION TIPS: 3-5 specific tips for crafting a strong application for this exact role.

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
