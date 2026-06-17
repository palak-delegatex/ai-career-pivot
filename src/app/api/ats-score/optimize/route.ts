import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { detectATSPlatform } from "@/lib/ats-platform-detection";
import { getPlatformProfile } from "@/lib/ats-platform-rules";
import {
  computeATSMatchBreakdown,
  parseResumeIntoSections,
} from "@/lib/ats-scoring";

const OptimizedResumeSchema = z.object({
  optimizedContent: z.string().describe("The full optimized resume text"),
  changes: z.array(
    z.object({
      section: z.string(),
      changeType: z.enum(["rewrite", "reorder", "add", "remove", "keyword_insert", "format_fix"]),
      before: z.string(),
      after: z.string(),
      reason: z.string(),
    })
  ),
  expectedScoreImprovement: z.object({
    estimatedNewScore: z.number().min(0).max(100),
    keyChanges: z.array(z.string()),
  }),
});

export async function POST(req: NextRequest) {
  const formData = await req.formData();
  const file = formData.get("resume") as File | null;
  const jobDescription = formData.get("jobDescription") as string | null;
  const jobUrl = formData.get("jobUrl") as string | null;
  const companyName = formData.get("companyName") as string | null;

  if (!file || !jobDescription?.trim()) {
    return NextResponse.json(
      { error: "Resume file and job description are both required for optimization" },
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
    return NextResponse.json({ error: "Only PDF, DOCX, DOC, and TXT files are supported" }, { status: 400 });
  }
  if (file.size > 5 * 1024 * 1024) {
    return NextResponse.json({ error: "File must be under 5MB" }, { status: 400 });
  }

  const bytes = await file.arrayBuffer();
  const base64 = Buffer.from(bytes).toString("base64");

  try {
    const platformDetection = detectATSPlatform({
      jobUrl: jobUrl || undefined,
      jobDescription: jobDescription || undefined,
      companyName: companyName || undefined,
    });

    const profile = getPlatformProfile(platformDetection.platform);

    let resumeText: string;
    if (file.type === "application/pdf") {
      const { output } = await generateText({
        model: anthropic("claude-haiku-4-5-20251001"),
        output: Output.object({ schema: z.object({ text: z.string() }) }),
        messages: [{
          role: "user",
          content: [
            { type: "file", data: base64, mediaType: "application/pdf" },
            { type: "text", text: "Extract ALL text content from this PDF resume. Preserve section headings, bullet points, and line breaks. Return the complete text." },
          ],
        }],
      });
      resumeText = output?.text || "";
    } else {
      resumeText = new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");
    }

    const JDKeywordsSchema = z.object({
      required: z.array(z.string()),
      preferred: z.array(z.string()),
      keywords: z.array(z.string()),
    });

    const jdResult = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: JDKeywordsSchema }),
      messages: [{
        role: "user",
        content: `Extract structured keywords from this job description. Categorize as required (must-have skills), preferred (nice-to-have), and keywords (important ATS terms).\n\nJOB DESCRIPTION:\n"""\n${jobDescription.slice(0, 6000)}\n"""`,
      }],
    });

    if (!jdResult.output) {
      return NextResponse.json({ error: "Could not parse job description" }, { status: 422 });
    }

    const originalBreakdown = computeATSMatchBreakdown(resumeText, jdResult.output, {
      fileType: file.type,
      platformSectionWeights: profile.keywordStrategy.sectionWeightOverrides,
      platformMatchTypeWeights: profile.keywordStrategy.matchTypeWeightOverrides,
    });

    const missingKeywords = originalBreakdown.keywordMatches
      .filter(m => !m.matched)
      .map(m => `${m.keyword} (${m.category})`);

    const formatIssues = originalBreakdown.formattingIssues
      .map(i => `[${i.severity}] ${i.issue}: ${i.fix}`);

    const platformContext = platformDetection.platform !== "unknown"
      ? `
TARGET ATS PLATFORM: ${profile.displayName}
Platform behavior: ${profile.parsingBehavior}
Key rules:
${profile.bestPractices.map(p => `- ${p}`).join("\n")}
AVOID:
${profile.avoidList.map(a => `- ${a}`).join("\n")}
Platform-specific formatting tips:
${profile.formattingTips.map(t => `- [${t.severity}] ${t.tip}: ${t.reason}`).join("\n")}`
      : "";

    const optimizePrompt = `You are an expert ATS resume optimizer. Rewrite this resume to maximize its ATS match score for the given job description.

CURRENT ATS SCORE: ${originalBreakdown.overallScore}/100 (Formatting: ${originalBreakdown.formattingScore}, Keywords: ${originalBreakdown.keywordScore})

MISSING KEYWORDS (must incorporate naturally):
${missingKeywords.join("\n")}

FORMAT ISSUES TO FIX:
${formatIssues.join("\n")}
${platformContext}

RULES:
- Do NOT fabricate experience, skills, or qualifications the candidate doesn't have
- Naturally integrate missing keywords where the candidate's experience supports them
- Fix all formatting issues identified above
- Use strong action verbs and quantify achievements where possible
- Keep the same overall structure but optimize content for ATS parsing
- Match the tone and seniority level of the job description
- Ensure every required keyword appears at least once if the candidate has relevant experience

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 4000)}
"""

CURRENT RESUME:
"""
${resumeText.slice(0, 8000)}
"""`;

    const result = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: OptimizedResumeSchema }),
      messages: [{ role: "user", content: optimizePrompt }],
    });

    if (!result.output) {
      return NextResponse.json({ error: "Optimization failed. Please try again." }, { status: 422 });
    }

    const optimizedBreakdown = computeATSMatchBreakdown(
      result.output.optimizedContent,
      jdResult.output,
      {
        fileType: file.type,
        platformSectionWeights: profile.keywordStrategy.sectionWeightOverrides,
        platformMatchTypeWeights: profile.keywordStrategy.matchTypeWeightOverrides,
      }
    );

    return NextResponse.json({
      originalScore: originalBreakdown.overallScore,
      optimizedScore: optimizedBreakdown.overallScore,
      scoreImprovement: optimizedBreakdown.overallScore - originalBreakdown.overallScore,
      platform: platformDetection.platform !== "unknown"
        ? { name: profile.displayName, confidence: platformDetection.confidence }
        : null,
      optimizedContent: result.output.optimizedContent,
      changes: result.output.changes,
      expectedScoreImprovement: result.output.expectedScoreImprovement,
      breakdown: {
        original: {
          formatting: originalBreakdown.formattingScore,
          keyword: originalBreakdown.keywordScore,
          matched: originalBreakdown.summary.matchedKeywords,
          total: originalBreakdown.summary.totalKeywords,
        },
        optimized: {
          formatting: optimizedBreakdown.formattingScore,
          keyword: optimizedBreakdown.keywordScore,
          matched: optimizedBreakdown.summary.matchedKeywords,
          total: optimizedBreakdown.summary.totalKeywords,
        },
      },
    });
  } catch (err) {
    console.error("ATS optimize error:", err);
    return NextResponse.json(
      { error: "Optimization failed. Please try again." },
      { status: 500 }
    );
  }
}
