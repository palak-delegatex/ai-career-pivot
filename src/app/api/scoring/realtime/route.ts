import { NextRequest } from "next/server";
import {
  parseResumeIntoSections,
  detectFormattingIssues,
  matchKeywordsAgainstResume,
  analyzeKeywordDensity,
  analyzeSearchability,
  analyzeRecruiterTips,
  computeStandaloneFormattingScore,
  type JDKeywords,
  type EnrichedJDKeywords,
  type CategoryScore,
} from "@/lib/ats-scoring";

const CATEGORY_WEIGHTS = {
  hard_skills: 0.25,
  soft_skills: 0.10,
  keyword_density: 0.15,
  searchability: 0.20,
  formatting: 0.15,
  recruiter_tips: 0.15,
};

function scoreLabel(score: number): string {
  if (score >= 80) return "Excellent";
  if (score >= 60) return "Good";
  if (score >= 40) return "Needs Work";
  return "Poor";
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const { resumeText, jdKeywords, enriched } = body as {
    resumeText: string;
    jdKeywords?: JDKeywords;
    enriched?: EnrichedJDKeywords;
  };

  if (!resumeText || resumeText.trim().length < 20) {
    return new Response(JSON.stringify({ error: "Resume text too short" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    start(controller) {
      function send(event: string, data: unknown) {
        controller.enqueue(
          encoder.encode(`event: ${event}\ndata: ${JSON.stringify(data)}\n\n`)
        );
      }

      try {
        const sections = parseResumeIntoSections(resumeText);

        // Phase 1: Formatting (fastest — no JD needed)
        const formattingIssues = detectFormattingIssues(resumeText);
        const formattingScore = computeStandaloneFormattingScore(resumeText).score;
        send("formatting", {
          score: formattingScore,
          issueCount: formattingIssues.length,
          criticalCount: formattingIssues.filter(i => i.severity === "critical").length,
          issues: formattingIssues.slice(0, 5),
        });

        // Phase 2: Searchability (no JD needed)
        const searchability = analyzeSearchability(
          resumeText,
          sections,
          enriched?.jobTitle
        );
        send("searchability", {
          score: searchability.score,
          contactFields: searchability.contactFields,
          jobTitleMatch: searchability.jobTitleMatch,
          standardHeadings: searchability.standardHeadings,
        });

        // Phase 3: Recruiter tips (no JD needed)
        const recruiterTips = analyzeRecruiterTips(resumeText, sections);
        send("recruiter_tips", {
          score: recruiterTips.score,
          actionVerbRate: recruiterTips.actionVerbRate,
          measurableResultRate: recruiterTips.measurableResultRate,
          bulletsWithMetrics: recruiterTips.bulletsWithMetrics,
          totalBullets: recruiterTips.totalBullets,
          estimatedPages: recruiterTips.estimatedPages,
        });

        // Phase 4: Keyword matching (requires JD keywords)
        let keywordScore = 0;
        let hardSkillScore = 0;
        let softSkillScore = 0;
        let keywordDensityScore = 0;

        if (jdKeywords) {
          const keywordMatches = matchKeywordsAgainstResume(
            jdKeywords,
            sections,
            undefined,
            enriched
          );

          const matched = keywordMatches.filter(m => m.matched);
          const missing = keywordMatches.filter(m => !m.matched);

          const hardMatches = keywordMatches.filter(m => m.skillType === "hard");
          const softMatches = keywordMatches.filter(m => m.skillType === "soft");

          hardSkillScore = hardMatches.length > 0
            ? Math.round(hardMatches.filter(m => m.matched).length / hardMatches.length * 100)
            : 100;
          softSkillScore = softMatches.length > 0
            ? Math.round(softMatches.filter(m => m.matched).length / softMatches.length * 100)
            : 100;

          send("keywords", {
            hardSkillScore,
            softSkillScore,
            matched: matched.length,
            missing: missing.length,
            total: keywordMatches.length,
            topMissing: missing.slice(0, 5).map(m => ({
              keyword: m.keyword,
              category: m.category,
              skillType: m.skillType,
            })),
            topMatched: matched.slice(0, 5).map(m => ({
              keyword: m.keyword,
              matchType: m.matchType,
              skillType: m.skillType,
            })),
          });

          const density = analyzeKeywordDensity(keywordMatches, resumeText);
          keywordDensityScore = density.score;
          send("keyword_density", {
            score: density.score,
            overused: density.keywordFrequencies
              .filter(k => k.count > 8)
              .map(k => ({ keyword: k.keyword, count: k.count })),
          });

          keywordScore = Math.round(
            (hardMatches.filter(m => m.matched).length +
             softMatches.filter(m => m.matched).length) /
            Math.max(1, hardMatches.length + softMatches.length) * 100
          );
        }

        // Phase 5: Overall score
        const overallScore = jdKeywords
          ? Math.round(
              hardSkillScore * CATEGORY_WEIGHTS.hard_skills +
              softSkillScore * CATEGORY_WEIGHTS.soft_skills +
              keywordDensityScore * CATEGORY_WEIGHTS.keyword_density +
              searchability.score * CATEGORY_WEIGHTS.searchability +
              formattingScore * CATEGORY_WEIGHTS.formatting +
              recruiterTips.score * CATEGORY_WEIGHTS.recruiter_tips
            )
          : Math.round(
              searchability.score * 0.35 +
              formattingScore * 0.30 +
              recruiterTips.score * 0.35
            );

        send("overall", {
          score: overallScore,
          label: scoreLabel(overallScore),
          hasJD: !!jdKeywords,
        });

        send("done", { complete: true });
      } catch (err) {
        send("error", { message: "Scoring failed" });
      }

      controller.close();
    },
  });

  return new Response(stream, {
    headers: {
      "Content-Type": "text/event-stream",
      "Cache-Control": "no-cache",
      Connection: "keep-alive",
    },
  });
}
