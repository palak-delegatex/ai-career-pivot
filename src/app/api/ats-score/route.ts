import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  computeMultiDimensionalScore,
  computeStandaloneFormattingScore,
  parseResumeIntoSections,
  analyzeRecruiterTips,
  analyzeSearchability,
  analyzeKeywordDensity,
  matchKeywordsAgainstResume,
  type MatchRateBreakdown,
  type MultiDimensionalATSResult,
  type CategoryScore,
  type EnrichedJDKeywords,
} from "@/lib/ats-scoring";

// ── Schemas ──────────────────────────────────────────────────────────────────

const EnrichedJDSchema = z.object({
  required: z.array(z.string()).describe("Must-have skills and qualifications from the JD"),
  preferred: z.array(z.string()).describe("Nice-to-have skills and qualifications"),
  keywords: z.array(z.string()).describe("Important ATS terms: technologies, methodologies, certifications, domain terms"),
  hardSkills: z.array(z.string()).describe("Technical/domain-specific skills: programming languages, tools, frameworks, certifications, technical methodologies"),
  softSkills: z.array(z.string()).describe("Interpersonal/behavioral skills: leadership, communication, teamwork, problem-solving, adaptability"),
  jobTitle: z.string().describe("The primary job title from the posting"),
});

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
  topPriorityFixes: z.array(z.string()),
});

const StandaloneAnalysisSchema = z.object({
  inferredRole: z.string(),
  inferredKeywords: z.array(z.string()).describe("Industry-standard keywords this resume should contain for its apparent target role"),
  hardSkills: z.array(z.string()).describe("Technical/domain-specific skills inferred from the resume's target role"),
  softSkills: z.array(z.string()).describe("Interpersonal/behavioral skills expected for this role"),
  contentSuggestions: z.array(
    z.object({
      area: z.string(),
      current: z.string(),
      improved: z.string(),
    })
  ),
  topPriorityFixes: z.array(z.string()),
});

// ── Response types ───────────────────────────────────────────────────────────

export interface ATSScoreResult {
  overallScore: number;
  scoreLabel: "Excellent" | "Good" | "Needs Work" | "Poor";
  formattingScore: number;
  keywordScore: number;
  categoryScores: {
    name: string;
    key: string;
    score: number;
    weight: number;
    checks: {
      name: string;
      passed: boolean;
      score: number;
      maxScore: number;
      detail: string;
      fix: string | null;
    }[];
  }[];
  formatIssues: {
    issue: string;
    severity: "critical" | "warning" | "minor";
    fix: string;
    category: string;
  }[];
  keywordAnalysis: {
    foundKeywords: { keyword: string; matchType: "exact" | "variant" | "semantic"; foundIn: string[]; frequency: number; skillType: "hard" | "soft" | "other" }[];
    missingKeywords: {
      keyword: string;
      importance: "critical" | "important" | "helpful";
      suggestion: string;
      suggestedSection: string | null;
      skillType: "hard" | "soft" | "other";
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
  searchability: {
    score: number;
    contactFields: { email: boolean; phone: boolean; location: boolean; linkedin: boolean; name: boolean };
    jobTitleMatch: boolean;
  };
  recruiterTips: {
    score: number;
    actionVerbRate: number;
    measurableResultRate: number;
    bulletsWithMetrics: number;
    totalBullets: number;
    estimatedPages: number;
  };
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
  const resumeText = file.type === "application/pdf"
    ? await extractTextForAnalysis(file.type, base64, bytes)
    : new TextDecoder().decode(bytes).replace(/[^\x20-\x7E\n\r\t]/g, " ");

  const model = anthropic("claude-sonnet-4-6");

  const [jdResult, semanticResult] = await Promise.all([
    generateText({
      model,
      output: Output.object({ schema: EnrichedJDSchema }),
      messages: [{
        role: "user",
        content: `Extract structured keywords from this job description. Separate into:
- required: must-have skills and qualifications
- preferred: nice-to-have skills
- keywords: important ATS terms (technologies, methodologies, certifications, domain terms)
- hardSkills: technical/domain-specific skills (programming languages, tools, frameworks, certifications, technical methodologies)
- softSkills: interpersonal/behavioral skills (leadership, communication, teamwork, problem-solving, collaboration, adaptability)
- jobTitle: the primary job title from the posting

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
3. topPriorityFixes: the 3-5 most impactful changes, considering both formatting issues and keyword gaps.`;

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

  const enriched = jdResult.output as EnrichedJDKeywords;
  const semanticMatches = semanticResult.output?.semanticKeywordMatches || [];

  const multiResult = computeMultiDimensionalScore(resumeText, enriched, {
    fileType: file.type,
    semanticMatches,
    enriched,
  });

  const result: ATSScoreResult = buildATSResponse(multiResult, semanticResult.output, enriched);
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

  const model = anthropic("claude-sonnet-4-6");

  const standalonePrompt = `Analyze this resume. Identify the target role and suggest industry-standard keywords it should contain.

Provide:
1. inferredRole: the apparent target role
2. inferredKeywords: 15-25 industry-standard keywords this resume should contain for ATS matching
3. hardSkills: technical/domain-specific skills expected for this role
4. softSkills: interpersonal/behavioral skills expected for this role
5. contentSuggestions: 3-5 bullet points that could be improved
6. topPriorityFixes: 3-5 most impactful changes`;

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

  const enriched: EnrichedJDKeywords = {
    required: output.inferredKeywords.slice(0, 8),
    preferred: output.inferredKeywords.slice(8, 16),
    keywords: output.inferredKeywords.slice(16),
    hardSkills: output.hardSkills,
    softSkills: output.softSkills,
    jobTitle: output.inferredRole,
  };

  const multiResult = computeMultiDimensionalScore(resumeText, enriched, {
    fileType: file.type,
    enriched,
  });

  const result: ATSScoreResult = buildATSResponse(multiResult, output, enriched);
  return NextResponse.json(result);
}

function buildATSResponse(
  multi: MultiDimensionalATSResult,
  semanticOutput: { contentSuggestions: { area: string; current: string; improved: string }[]; topPriorityFixes: string[] } | null | undefined,
  _enriched: EnrichedJDKeywords
): ATSScoreResult {
  const hardSkillsCat = multi.categoryScores.find(c => c.key === "hard_skills");
  const keywordDensityCat = multi.categoryScores.find(c => c.key === "keyword_density");

  return {
    overallScore: multi.overallScore,
    scoreLabel: multi.scoreLabel,
    formattingScore: multi.formatting.score,
    keywordScore: hardSkillsCat?.score ?? 0,
    categoryScores: multi.categoryScores.map(c => ({
      name: c.name,
      key: c.key,
      score: c.score,
      weight: c.weight,
      checks: c.checks,
    })),
    formatIssues: multi.formatting.issues.map(i => ({
      issue: i.issue,
      severity: i.severity,
      fix: i.fix,
      category: i.category,
    })),
    keywordAnalysis: {
      foundKeywords: multi.keywordMatches
        .filter(m => m.matched)
        .map(m => ({
          keyword: m.keyword,
          matchType: m.matchType!,
          foundIn: m.foundIn,
          frequency: m.frequency,
          skillType: m.skillType,
        })),
      missingKeywords: multi.keywordMatches
        .filter(m => !m.matched)
        .map(m => ({
          keyword: m.keyword,
          importance: importanceFromCategory(m.category),
          suggestion: m.suggestedSection
            ? `Add "${m.keyword}" to your ${m.suggestedSection} section`
            : `Incorporate "${m.keyword}" naturally into your resume`,
          suggestedSection: m.suggestedSection,
          skillType: m.skillType,
        })),
      keywordDensityScore: keywordDensityCat?.score ?? 0,
      summary: multi.summary,
    },
    sectionAnalysis: multi.sectionScores.map(s => {
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
    searchability: {
      score: multi.searchability.score,
      contactFields: multi.searchability.contactFields,
      jobTitleMatch: multi.searchability.jobTitleMatch,
    },
    recruiterTips: {
      score: multi.recruiterTips.score,
      actionVerbRate: multi.recruiterTips.actionVerbRate,
      measurableResultRate: multi.recruiterTips.measurableResultRate,
      bulletsWithMetrics: multi.recruiterTips.bulletsWithMetrics,
      totalBullets: multi.recruiterTips.totalBullets,
      estimatedPages: multi.recruiterTips.estimatedPages,
    },
    contentSuggestions: semanticOutput?.contentSuggestions || [],
    quantificationScore: {
      score: multi.recruiterTips.score,
      bulletsWithMetrics: multi.recruiterTips.bulletsWithMetrics,
      totalBullets: multi.recruiterTips.totalBullets,
      suggestions: multi.recruiterTips.checks
        .filter(c => !c.passed && c.fix)
        .map(c => c.fix!),
    },
    topPriorityFixes: semanticOutput?.topPriorityFixes || generateTopFixes(multi),
  };
}

function generateTopFixes(multi: MultiDimensionalATSResult): string[] {
  const fixes: string[] = [];
  const sortedCategories = [...multi.categoryScores].sort((a, b) => a.score - b.score);

  for (const cat of sortedCategories) {
    for (const check of cat.checks) {
      if (!check.passed && check.fix && fixes.length < 5) {
        fixes.push(check.fix);
      }
    }
    if (fixes.length >= 5) break;
  }

  return fixes;
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
