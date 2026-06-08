import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const ATSScoreSchema = z.object({
  overallScore: z.number().min(0).max(100),
  scoreLabel: z.enum(["Excellent", "Good", "Needs Work", "Poor"]),
  formatIssues: z.array(
    z.object({
      issue: z.string(),
      severity: z.enum(["critical", "warning", "minor"]),
      fix: z.string(),
    })
  ),
  keywordAnalysis: z.object({
    foundKeywords: z.array(z.string()),
    missingKeywords: z.array(
      z.object({
        keyword: z.string(),
        importance: z.enum(["critical", "important", "helpful"]),
        suggestion: z.string(),
      })
    ),
    keywordDensityScore: z.number().min(0).max(100),
  }),
  sectionAnalysis: z.array(
    z.object({
      section: z.string(),
      present: z.boolean(),
      quality: z.enum(["strong", "adequate", "weak", "missing"]),
      suggestion: z.string(),
    })
  ),
  contentSuggestions: z.array(
    z.object({
      area: z.string(),
      current: z.string(),
      improved: z.string(),
    })
  ),
  quantificationScore: z.object({
    score: z.number().min(0).max(100),
    bulletsWithMetrics: z.number(),
    totalBullets: z.number(),
    suggestions: z.array(z.string()),
  }),
  topPriorityFixes: z.array(z.string()),
});

export type ATSScoreResult = z.infer<typeof ATSScoreSchema>;

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File | null;
  const jobDescription = formData.get("jobDescription") as string | null;

  if (!file) {
    return NextResponse.json(
      { error: "Resume file is required" },
      { status: 400 }
    );
  }

  const allowedTypes = [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
    "application/msword",
    "text/plain",
  ];

  if (!allowedTypes.includes(file.type)) {
    return NextResponse.json(
      { error: "Only PDF, DOCX, DOC, and TXT files are supported" },
      { status: 400 }
    );
  }

  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json(
      { error: "File must be under 5MB" },
      { status: 400 }
    );
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  const jdSection = jobDescription?.trim()
    ? `\n\nTARGET JOB DESCRIPTION (compare keywords against this):\n"""\n${jobDescription.slice(0, 4000)}\n"""`
    : "";

  let messages: Parameters<typeof generateText>[0]["messages"];

  if (file.type === "application/pdf") {
    messages = [
      {
        role: "user",
        content: [
          {
            type: "file",
            data: base64,
            mediaType: "application/pdf",
          },
          {
            type: "text",
            text: `You are an ATS (Applicant Tracking System) compatibility expert. Analyze this resume for ATS readiness.${jdSection}

Score the resume on ATS compatibility (0-100) considering:

1. FORMAT ISSUES: Check for tables, columns, headers/footers, graphics, fancy formatting, non-standard fonts, images — anything ATS parsers struggle with. Flag severity: critical (will break parsing), warning (may cause issues), minor (suboptimal).

2. KEYWORD ANALYSIS: ${jobDescription?.trim() ? "Compare the resume against the target job description." : "Analyze industry-standard keywords for the resume's apparent target role."} Identify found keywords and critical missing ones with specific suggestions for natural incorporation.

3. SECTION ANALYSIS: Check for standard ATS sections (Contact Info, Summary/Objective, Work Experience, Education, Skills, Certifications). Rate each present/missing and quality.

4. CONTENT SUGGESTIONS: Find 3-5 bullet points that could be improved with better action verbs, specificity, or keyword integration. Show current vs improved versions.

5. QUANTIFICATION: How many bullet points include measurable results? Rate and suggest where to add metrics.

6. TOP PRIORITY FIXES: List the 3-5 most impactful changes ranked by expected score improvement.

Be specific and actionable. Reference actual content from the resume.`,
          },
        ],
      },
    ];
  } else {
    const textContent = new TextDecoder()
      .decode(bytes)
      .replace(/[^\x20-\x7E\n\r\t]/g, " ");
    messages = [
      {
        role: "user",
        content: `You are an ATS (Applicant Tracking System) compatibility expert. Analyze this resume text for ATS readiness.${jdSection}

RESUME TEXT:
"""
${textContent.slice(0, 8000)}
"""

Score the resume on ATS compatibility (0-100) considering:

1. FORMAT ISSUES: Check for formatting problems that ATS parsers struggle with. Flag severity: critical (will break parsing), warning (may cause issues), minor (suboptimal).

2. KEYWORD ANALYSIS: ${jobDescription?.trim() ? "Compare the resume against the target job description." : "Analyze industry-standard keywords for the resume's apparent target role."} Identify found keywords and critical missing ones with specific suggestions.

3. SECTION ANALYSIS: Check for standard ATS sections (Contact Info, Summary/Objective, Work Experience, Education, Skills, Certifications). Rate each.

4. CONTENT SUGGESTIONS: Find 3-5 bullet points that could be improved. Show current vs improved.

5. QUANTIFICATION: How many bullet points include measurable results? Rate and suggest metrics.

6. TOP PRIORITY FIXES: List the 3-5 most impactful changes.

Be specific and actionable.`,
      },
    ];
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: ATSScoreSchema }),
      messages,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not analyze the resume. Please try a different file." },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("ATS scoring error:", err);
    return NextResponse.json(
      { error: "Failed to analyze resume. Please try again." },
      { status: 500 }
    );
  }
}
