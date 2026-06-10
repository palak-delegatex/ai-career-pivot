import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  computeATSMatchBreakdown,
  computeStandaloneFormattingScore,
  parseResumeIntoSections,
  type MatchRateBreakdown,
} from "@/lib/ats-scoring";

// ── Schemas ──────────────────────────────────────────────────────────────────

const SemanticAnalysisSchema = z.object({
  semanticKeywordMatches: z.array(z.string()).describe(
    "Keywords from the JD that are semantically present in the resume but not as exact text matches — e.g. 'team leadership' matching 'managed a team of 8'"
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

const StandaloneAnalysisSchema = z.object({
  inferredRole: z.string(),
  inferredKeywords: z.array(z.string()).describe("Industry-standard keywords this resume should contain for its apparent target role"),
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

// ── Response types ───────────────────────────────────────────────────────────

export interface ATSScoreResult {
  overallScore: number;
  scoreLabel: "Excellent" | "Good" | "Needs Work" | "Poor";
  formattingScore: number;
  keywordScore: number;
  formatIssues: {
    issue: string;
    severity: "critical" | "warning" | "minor";
    fix: string;
    category: string;
  }[];
  keywordAnalysis: {
    foundKeywords: { keyword: string; matchType: "exact" | "variant" | "semantic"; foundIn: string[] }[];
    missingKeywords: {
      keyword: string;
      importance: "critical" | "important" | "helpful";
      suggestion: string;
      suggestedSection: string | null;
    }[];
    keywordDensityScore: number;
    summary: MatchRateBreakdown["summary"];
  };
  sectionAnalysis: {
    section: string;
    present: boolean;
    quality: "strong" | "adequate" | "weak" | "missing";
    keywordsFound: string[];
    keywordsMissing: string[];
    coverage: number;
    suggestion: string;
  }[];
  contentSuggestions: { area: string; current: string; improved: string }[];
  quantificationScore: {
    score: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    suggestions: string[];
  };
  topPriorityFixes: string[];
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function scoreLabel(score: number): "Excellent" | "Good" | "Needs Work" | "Poor" {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

function importanceFromCategory(category: string): "critical" | "important" | "helpful" {
  if (category === "required") return "critical";
  if (category === "preferred") return "important";
  return "helpful";
}

function sectionQuality(coverage: number, present: boolean): "strong" | "adequate" | "weak" | "missing" {
  if (!present) return "missing";
  if (coverage >= 75) return "strong";
  if (coverage >= 40) return "adequate";
  return "weak";
}

function sectionSuggestion(section: string, quality: string, missing: string[]): string {
  if (quality === "missing") return `Add a ${section} section to your resume.`;
  if (quality === "weak" && missing.length > 0) {
    return `Add missing keywords: ${missing.slice(0, 3).join(", ")}`;
  }
  if (quality === "adequate") return `Good section — consider adding more relevant detail.`;
  return "Well-optimized section.";
}

// ── Route handler ────────────────────────────────────────────────────────────

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

  try {
    if (jobDescription?.trim()) {
      return await scoreWithJD(file, base64, bytes, jobDescription);
    } else {
      return await scoreStandalone(file, base64, bytes);
    }
  } catch (err) {
    console.error("ATS scoring error:", err);
    return NextResponse.json(
      { error: "Failed to analyze resume. Please try again." },
      { status: 500 }
    );
  }
}

async function scoreWithJD(
  file: File,
  base64: string,
  bytes: ArrayBuffer,
  jobDescription: string
): Promise<NextResponse> {
  const JDKeywordsSchema = z.object({
    required: z.array(z.string()),
    preferred: z.array(z.string()),
    keywords: z.array(z.string()),
  });

  const resumeText = file.type === "application/pdf"
    ? await extractTextForAnalysis(file.type, base64, bytes)
    : new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");

  const model = anthropic("claude-sonnet-4-6");

  const [jdResult, semanticResult] = await Promise.all([
    generateText({
      model,
      output: Output.object({ schema: JDKeywordsSchema }),
      messages: [{
        role: "user",
        content: `Extract structured keywords from this job description. Categorize as required (must-have skills), preferred (nice-to-have), and keywords (important ATS terms like technologies, methodologies, certifications, domain terms).

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 6000)}
"""`,
      }],
    }),
    (async () => {
      const semanticPrompt = `Analyze this resume for content quality. The formatting and keyword matching has already been done separately.

TARGET JOB DESCRIPTION:
"""
${jobDescription.slice(0, 4000)}
"""

Provide:
1. semanticKeywordMatches: keywords from the JD that are SEMANTICALLY present but not exact text matches (e.g. "team leadership" matching "managed a team of 8", "data visualization" matching "built dashboards and reports")
2. contentSuggestions: 3-5 bullet points that could be improved with better action verbs, specificity, or keyword integration. Show current vs improved.
3. quantificationScore: how many bullet points include measurable results? Score and suggest where to add metrics.
4. topPriorityFixes: the 3-5 most impactful changes, considering both formatting issues and keyword gaps.`;

      if (file.type === "application/pdf") {
        return generateText({
          model,
          output: Output.object({ schema: SemanticAnalysisSchema }),
          messages: [{
            role: "user",
            content: [
              { type: "file", data: base64, mediaType: "application/pdf" },
              { type: "text", text: semanticPrompt },
            ],
          }],
        });
      }

      return generateText({
        model,
        output: Output.object({ schema: SemanticAnalysisSchema }),
        messages: [{
          role: "user",
          content: `${semanticPrompt}\n\nRESUME TEXT:\n"""\n${resumeText.slice(0, 8000)}\n"""`,
        }],
      });
    })(),
  ]);

  if (!jdResult.output) {
    return NextResponse.json({ error: "Could not parse job description" }, { status: 422 });
  }

  const jdKeywords = jdResult.output;
  const semanticMatches = semanticResult.output?.semanticKeywordMatches || [];

  const breakdown = computeATSMatchBreakdown(resumeText, jdKeywords, {
    fileType: file.type,
    semanticMatches,
  });

  const result: ATSScoreResult = {
    overallScore: breakdown.overallScore,
    scoreLabel: scoreLabel(breakdown.overallScore),
    formattingScore: breakdown.formattingScore,
    keywordScore: breakdown.keywordScore,
    formatIssues: breakdown.formattingIssues.map(i => ({
      issue: i.issue,
      severity: i.severity,
      fix: i.fix,
      category: i.category,
    })),
    keywordAnalysis: {
      foundKeywords: breakdown.keywordMatches
        .filter(m => m.matched)
        .map(m => ({
          keyword: m.keyword,
          matchType: m.matchType!,
          foundIn: m.foundIn,
        })),
      missingKeywords: breakdown.keywordMatches
        .filter(m => !m.matched)
        .map(m => ({
          keyword: m.keyword,
          importance: importanceFromCategory(m.category),
          suggestion: m.suggestedSection
            ? `Add "${m.keyword}" to your ${m.suggestedSection} section`
            : `Incorporate "${m.keyword}" naturally into your resume`,
          suggestedSection: m.suggestedSection,
        })),
      keywordDensityScore: breakdown.keywordScore,
      summary: breakdown.summary,
    },
    sectionAnalysis: breakdown.sectionScores.map(s => {
      const quality = sectionQuality(s.coverage, s.present);
      return {
        section: s.section,
        present: s.present,
        quality,
        keywordsFound: s.keywordsFound,
        keywordsMissing: s.keywordsMissing,
        coverage: s.coverage,
        suggestion: sectionSuggestion(s.section, quality, s.keywordsMissing),
      };
    }),
    contentSuggestions: semanticResult.output?.contentSuggestions || [],
    quantificationScore: semanticResult.output?.quantificationScore || {
      score: 0,
      bulletsWithMetrics: 0,
      totalBullets: 0,
      suggestions: [],
    },
    topPriorityFixes: semanticResult.output?.topPriorityFixes || [],
  };

  return NextResponse.json(result);
}

async function scoreStandalone(
  file: File,
  base64: string,
  bytes: ArrayBuffer
): Promise<NextResponse> {
  const resumeText = file.type === "application/pdf"
    ? await extractTextForAnalysis(file.type, base64, bytes)
    : new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");

  const { score: formattingScore, issues: formattingIssues } =
    computeStandaloneFormattingScore(resumeText, file.type);

  const model = anthropic("claude-sonnet-4-6");

  const standalonePrompt = `Analyze this resume. Identify the target role and suggest industry-standard keywords it should contain.

Provide:
1. inferredRole: the apparent target role
2. inferredKeywords: 15-25 industry-standard keywords this resume should contain for ATS matching
3. contentSuggestions: 3-5 bullet points that could be improved
4. quantificationScore: measurable results rating
5. topPriorityFixes: 3-5 most impactful changes`;

  let output: z.infer<typeof StandaloneAnalysisSchema> | undefined;

  if (file.type === "application/pdf") {
    const result = await generateText({
      model,
      output: Output.object({ schema: StandaloneAnalysisSchema }),
      messages: [{
        role: "user",
        content: [
          { type: "file", data: base64, mediaType: "application/pdf" },
          { type: "text", text: standalonePrompt },
        ],
      }],
    });
    output = result.output ?? undefined;
  } else {
    const result = await generateText({
      model,
      output: Output.object({ schema: StandaloneAnalysisSchema }),
      messages: [{
        role: "user",
        content: `${standalonePrompt}\n\nRESUME TEXT:\n"""\n${resumeText.slice(0, 8000)}\n"""`,
      }],
    });
    output = result.output ?? undefined;
  }

  if (!output) {
    return NextResponse.json(
      { error: "Could not analyze the resume. Please try a different file." },
      { status: 422 }
    );
  }

  const jdKeywords = {
    required: output.inferredKeywords.slice(0, 8),
    preferred: output.inferredKeywords.slice(8, 16),
    keywords: output.inferredKeywords.slice(16),
  };

  const sections = parseResumeIntoSections(resumeText);
  const breakdown = computeATSMatchBreakdown(resumeText, jdKeywords, {
    fileType: file.type,
  });

  const overallScore = Math.round(formattingScore * 0.35 + breakdown.keywordScore * 0.65);

  const result: ATSScoreResult = {
    overallScore,
    scoreLabel: scoreLabel(overallScore),
    formattingScore,
    keywordScore: breakdown.keywordScore,
    formatIssues: formattingIssues.map(i => ({
      issue: i.issue,
      severity: i.severity,
      fix: i.fix,
      category: i.category,
    })),
    keywordAnalysis: {
      foundKeywords: breakdown.keywordMatches
        .filter(m => m.matched)
        .map(m => ({
          keyword: m.keyword,
          matchType: m.matchType!,
          foundIn: m.foundIn,
        })),
      missingKeywords: breakdown.keywordMatches
        .filter(m => !m.matched)
        .map(m => ({
          keyword: m.keyword,
          importance: importanceFromCategory(m.category),
          suggestion: m.suggestedSection
            ? `Add "${m.keyword}" to your ${m.suggestedSection} section`
            : `Incorporate "${m.keyword}" naturally into your resume`,
          suggestedSection: m.suggestedSection,
        })),
      keywordDensityScore: breakdown.keywordScore,
      summary: breakdown.summary,
    },
    sectionAnalysis: breakdown.sectionScores.map(s => {
      const quality = sectionQuality(s.coverage, s.present);
      return {
        section: s.section,
        present: s.present,
        quality,
        keywordsFound: s.keywordsFound,
        keywordsMissing: s.keywordsMissing,
        coverage: s.coverage,
        suggestion: sectionSuggestion(s.section, quality, s.keywordsMissing),
      };
    }),
    contentSuggestions: output.contentSuggestions,
    quantificationScore: output.quantificationScore,
    topPriorityFixes: output.topPriorityFixes,
  };

  return NextResponse.json(result);
}

async function extractTextForAnalysis(
  fileType: string,
  base64: string,
  bytes: ArrayBuffer
): Promise<string> {
  if (fileType !== "application/pdf") {
    return new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-haiku-4-5-20251001"),
      output: Output.object({
        schema: z.object({ text: z.string() }),
      }),
      messages: [
        {
          role: "user",
          content: [
            { type: "file", data: base64, mediaType: "application/pdf" },
            {
              type: "text",
              text: "Extract ALL text content from this PDF resume. Preserve section headings, bullet points, and line breaks. Return the complete text.",
            },
          ],
        },
      ],
    });
    return output?.text || "";
  } catch {
    return "";
  }
}
