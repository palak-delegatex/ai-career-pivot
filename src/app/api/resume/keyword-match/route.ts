import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  computeATSMatchBreakdown,
  type JDKeywords,
} from "@/lib/ats-scoring";

const JDAnalysisSchema = z.object({
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string(),
  industry: z.string(),
  roleTitle: z.string(),
});

const SemanticMatchesSchema = z.object({
  semanticMatches: z.array(z.string()),
});

const RewriteSuggestionsSchema = z.object({
  suggestions: z.array(
    z.object({
      section: z.string(),
      originalBullet: z.string(),
      rewrittenBullet: z.string(),
      keywordsAdded: z.array(z.string()),
      reason: z.string(),
    })
  ),
});

export type JDKeywordAnalysis = z.infer<typeof JDAnalysisSchema>;

export interface KeywordMatchResult {
  jdAnalysis: JDKeywordAnalysis;
  matchScore: number;
  matchedKeywords: string[];
  missingKeywords: string[];
  breakdown: {
    requiredHit: number;
    requiredTotal: number;
    preferredHit: number;
    preferredTotal: number;
  };
  suggestions: RewriteSuggestion[];
  projectedScore: number;
}

export interface RewriteSuggestion {
  section: string;
  originalBullet: string;
  rewrittenBullet: string;
  keywordsAdded: string[];
  reason: string;
}

const model = anthropic("claude-sonnet-4-6");

async function extractKeywords(jd: string): Promise<JDKeywordAnalysis> {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: JDAnalysisSchema }),
    messages: [
      {
        role: "user",
        content: `Analyze this job description and extract structured requirements for ATS keyword matching.

JOB DESCRIPTION:
"""
${jd.slice(0, 6000)}
"""

Extract:
- requiredSkills: hard requirements explicitly stated
- preferredSkills: nice-to-haves or preferred qualifications
- keywords: important terms an ATS would look for (technologies, methodologies, certifications, domain terms)
- seniorityLevel: entry/mid/senior/lead/director/VP/C-level
- industry: the industry this role is in
- roleTitle: the job title`,
      },
    ],
  });

  if (!output) throw new Error("Failed to parse job description");
  return output;
}

function scoreResume(
  resumeContent: string,
  jdAnalysis: JDKeywordAnalysis,
  semanticMatches?: string[]
) {
  const jdKeywords: JDKeywords = {
    required: jdAnalysis.requiredSkills,
    preferred: jdAnalysis.preferredSkills,
    keywords: jdAnalysis.keywords,
  };

  const breakdown = computeATSMatchBreakdown(resumeContent, jdKeywords, {
    semanticMatches,
  });

  const requiredKws = breakdown.keywordMatches.filter(
    (m) => m.category === "required"
  );
  const preferredKws = breakdown.keywordMatches.filter(
    (m) => m.category === "preferred"
  );

  return {
    score: breakdown.overallScore,
    matchedKeywords: breakdown.keywordMatches
      .filter((m) => m.matched)
      .map((m) => m.keyword),
    missingKeywords: breakdown.keywordMatches
      .filter((m) => !m.matched)
      .map((m) => m.keyword),
    breakdown: {
      requiredHit: requiredKws.filter((m) => m.matched).length,
      requiredTotal: requiredKws.length,
      preferredHit: preferredKws.filter((m) => m.matched).length,
      preferredTotal: preferredKws.length,
    },
  };
}

async function findSemanticMatches(
  resumeContent: string,
  jdAnalysis: JDKeywordAnalysis
): Promise<string[]> {
  const allKeywords = [
    ...jdAnalysis.requiredSkills,
    ...jdAnalysis.preferredSkills,
    ...jdAnalysis.keywords,
  ];

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: SemanticMatchesSchema }),
      messages: [
        {
          role: "user",
          content: `Given this resume and target keywords, identify keywords that are SEMANTICALLY present but not as exact text matches.

RESUME:
"""
${resumeContent.slice(0, 8000)}
"""

KEYWORDS TO CHECK: ${allKeywords.join(", ")}

Return only keywords where the resume demonstrates the skill/concept through different wording.`,
        },
      ],
    });
    return output?.semanticMatches || [];
  } catch {
    return [];
  }
}

async function generateRewriteSuggestions(
  resumeContent: string,
  missingKeywords: string[],
  jdAnalysis: JDKeywordAnalysis
): Promise<RewriteSuggestion[]> {
  if (missingKeywords.length === 0) return [];

  const prioritizedMissing = missingKeywords.slice(0, 15);

  try {
    const { output } = await generateText({
      model,
      output: Output.object({ schema: RewriteSuggestionsSchema }),
      messages: [
        {
          role: "user",
          content: `You are an expert resume writer. Suggest bullet point rewrites that naturally incorporate missing keywords from a job description.

CURRENT RESUME:
"""
${resumeContent.slice(0, 6000)}
"""

TARGET ROLE: ${jdAnalysis.roleTitle} (${jdAnalysis.seniorityLevel}) in ${jdAnalysis.industry}

MISSING KEYWORDS TO INCORPORATE:
${prioritizedMissing.join(", ")}

INSTRUCTIONS:
1. Find existing bullet points that could be rewritten to include missing keywords
2. Rewrite each bullet to naturally weave in 1-3 missing keywords
3. Keep rewrites honest — reframe, don't fabricate experience
4. Use strong action verbs and quantifiable metrics
5. Each rewrite should read naturally, not feel keyword-stuffed
6. Prioritize required skills over preferred ones
7. Suggest 3-8 rewrites total, focusing on the highest-impact changes

For each suggestion, specify the section, the original bullet, the rewritten version, which keywords were added, and why.`,
        },
      ],
    });
    return output?.suggestions || [];
  } catch {
    return [];
  }
}

export async function POST(req: NextRequest) {
  let body: { resumeContent: string; jobDescription: string };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeContent, jobDescription } = body;

  if (!resumeContent?.trim()) {
    return NextResponse.json(
      { error: "resumeContent is required" },
      { status: 400 }
    );
  }
  if (!jobDescription?.trim()) {
    return NextResponse.json(
      { error: "jobDescription is required" },
      { status: 400 }
    );
  }

  try {
    const jdAnalysis = await extractKeywords(jobDescription);

    const semanticMatches = await findSemanticMatches(
      resumeContent,
      jdAnalysis
    );
    const scored = scoreResume(resumeContent, jdAnalysis, semanticMatches);

    const suggestions = await generateRewriteSuggestions(
      resumeContent,
      scored.missingKeywords,
      jdAnalysis
    );

    // Project the improved score by simulating that suggested keywords land
    const addedKeywords = new Set(
      suggestions.flatMap((s) => s.keywordsAdded.map((k) => k.toLowerCase()))
    );
    const projectedMissing = scored.missingKeywords.filter(
      (kw) => !addedKeywords.has(kw.toLowerCase())
    );
    const projectedMatchCount =
      scored.matchedKeywords.length +
      (scored.missingKeywords.length - projectedMissing.length);
    const totalKeywords =
      scored.matchedKeywords.length + scored.missingKeywords.length;
    const projectedKeywordRate =
      totalKeywords > 0 ? projectedMatchCount / totalKeywords : 1;
    const projectedScore = Math.min(
      100,
      Math.round(scored.score + (1 - scored.score / 100) * projectedKeywordRate * 25)
    );

    const result: KeywordMatchResult = {
      jdAnalysis,
      matchScore: scored.score,
      matchedKeywords: scored.matchedKeywords,
      missingKeywords: scored.missingKeywords,
      breakdown: scored.breakdown,
      suggestions,
      projectedScore,
    };

    return NextResponse.json(result);
  } catch (err) {
    console.error("Keyword match error:", err);
    return NextResponse.json(
      { error: "Failed to analyze keywords. Please try again." },
      { status: 500 }
    );
  }
}
