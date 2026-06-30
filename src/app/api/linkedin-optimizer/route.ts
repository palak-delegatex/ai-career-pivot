import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { fetchMarketContext } from "@/lib/market-data";

const SectionScoreSchema = z.object({
  section: z.enum([
    "headline",
    "summary",
    "experience",
    "skills",
    "education",
    "recommendations",
  ]),
  score: z.number().min(0).max(100),
  subscores: z.object({
    completeness: z.number().min(0).max(100),
    keywordDensity: z.number().min(0).max(100),
    length: z.number().min(0).max(100),
  }),
  currentContent: z.string(),
  idealLength: z.string(),
  findings: z.array(z.string()),
  improvements: z.array(z.string()),
});

const KeywordGapSchema = z.object({
  keyword: z.string(),
  importance: z.enum(["critical", "important", "nice-to-have"]),
  foundInProfile: z.boolean(),
  foundInSections: z.array(z.string()),
  transferType: z
    .enum(["direct-transfer", "partial-transfer", "new-skill", "none"])
    .nullable(),
  transferFromSkill: z.string().nullable(),
  placementSuggestion: z.string(),
});

const SuggestionSchema = z.object({
  section: z.string(),
  priority: z.enum(["high", "medium", "low"]),
  suggestion: z.string(),
  reason: z.string(),
  skillTransferBasis: z.string().nullable(),
});

const LinkedInAnalysisSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallLabel: z.enum([
    "Excellent",
    "Strong",
    "Needs Improvement",
    "Weak",
    "Incomplete",
  ]),
  sections: z.array(SectionScoreSchema),
  keywordGaps: z.array(KeywordGapSchema),
  suggestions: z.array(SuggestionSchema),
  profileCompleteness: z.number().min(0).max(100),
  pivotReadiness: z.object({
    score: z.number().min(0).max(100),
    narrative: z.string(),
  }),
});

export type LinkedInAnalysisResult = z.infer<typeof LinkedInAnalysisSchema>;

interface ProfileInput {
  headline?: string;
  summary?: string;
  experience?: { title: string; company: string; description: string }[];
  skills?: string[];
  education?: { degree: string; field: string; institution: string }[];
  recommendationsCount?: number;
  currentTitle?: string;
  currentIndustry?: string;
}

interface SkillTransferData {
  skill: string;
  transferType: "direct-transfer" | "partial-transfer" | "new-skill";
  fromSkill?: string;
  explanation?: string;
}

export async function POST(req: NextRequest) {
  const body = await req.json();
  const {
    profileData,
    profileText,
    linkedinUrl,
    targetRole,
    targetIndustry,
    skillTransfers,
  }: {
    profileData?: ProfileInput;
    profileText?: string;
    linkedinUrl?: string;
    targetRole: string;
    targetIndustry?: string;
    skillTransfers?: SkillTransferData[];
  } = body;

  if (!targetRole) {
    return NextResponse.json(
      { error: "targetRole is required" },
      { status: 400 }
    );
  }

  let profile = profileData;

  if (!profile && linkedinUrl) {
    if (!/linkedin\.com\/(in|pub)\/[^/]+/i.test(linkedinUrl)) {
      return NextResponse.json(
        {
          error:
            "Invalid LinkedIn URL. Expected format: linkedin.com/in/yourname",
        },
        { status: 400 }
      );
    }

    const proxycurlKey = process.env.PROXYCURL_API_KEY;
    if (!proxycurlKey) {
      return NextResponse.json(
        {
          error:
            "LinkedIn import is not configured. Please provide profileData or profileText instead.",
        },
        { status: 503 }
      );
    }

    const proxycurlRes = await fetch(
      `https://nubela.co/proxycurl/api/v2/linkedin?url=${encodeURIComponent(linkedinUrl)}&fallback_to_cache=on-error&use_cache=if-recent`,
      { headers: { Authorization: `Bearer ${proxycurlKey}` } }
    );

    if (!proxycurlRes.ok) {
      const status = proxycurlRes.status;
      if (status === 404) {
        return NextResponse.json(
          { error: "LinkedIn profile not found." },
          { status: 404 }
        );
      }
      if (status === 429) {
        return NextResponse.json(
          { error: "High demand — please try again in a minute." },
          { status: 429 }
        );
      }
      return NextResponse.json(
        { error: "Could not fetch LinkedIn profile." },
        { status: 502 }
      );
    }

    const raw = await proxycurlRes.json();
    profile = {
      headline: raw.headline,
      summary: raw.summary,
      currentTitle: raw.occupation,
      currentIndustry: raw.industry,
      recommendationsCount: raw.recommendations?.length ?? 0,
      skills: (raw.skills ?? []).map((s: string | { name: string }) =>
        typeof s === "string" ? s : s.name
      ),
      experience: (raw.experiences ?? []).map(
        (e: {
          title?: string;
          company_name?: string;
          description?: string;
        }) => ({
          title: e.title ?? "",
          company: e.company_name ?? "",
          description: e.description ?? "",
        })
      ),
      education: (raw.education ?? []).map(
        (e: {
          degree_name?: string;
          field_of_study?: string;
          school?: string;
        }) => ({
          degree: e.degree_name ?? "",
          field: e.field_of_study ?? "",
          institution: e.school ?? "",
        })
      ),
    };
  }

  if (!profile && !profileText) {
    return NextResponse.json(
      { error: "One of profileData, profileText, or linkedinUrl is required" },
      { status: 400 }
    );
  }

  let profileSnapshot: string;
  if (profile) {
    profileSnapshot = [
      profile.headline ? `Headline: "${profile.headline}"` : "Headline: [EMPTY]",
      profile.summary ? `Summary/About: "${profile.summary}"` : "Summary/About: [EMPTY]",
      profile.currentTitle && `Current Title: ${profile.currentTitle}`,
      profile.currentIndustry && `Current Industry: ${profile.currentIndustry}`,
      profile.experience?.length
        ? `Experience (${profile.experience.length} entries):\n${profile.experience.map((e) => `- ${e.title} at ${e.company}: ${e.description}`).join("\n")}`
        : "Experience: [EMPTY]",
      profile.skills?.length
        ? `Skills (${profile.skills.length}): ${profile.skills.join(", ")}`
        : "Skills: [EMPTY]",
      profile.education?.length
        ? `Education:\n${profile.education.map((e) => `- ${e.degree} in ${e.field}, ${e.institution}`).join("\n")}`
        : "Education: [EMPTY]",
      `Recommendations count: ${profile.recommendationsCount ?? 0}`,
    ]
      .filter(Boolean)
      .join("\n\n");
  } else {
    profileSnapshot = `Pasted profile text:\n${profileText}`;
  }

  const marketCtx = await fetchMarketContext(targetRole);
  let marketBlock = "";
  if (marketCtx) {
    const topSkillsList = marketCtx.topSkills
      .slice(0, 12)
      .map(
        (s) =>
          `${s.skill} (${s.frequencyPercent}% of postings${s.trending ? ", trending" : ""})`
      )
      .join(", ");
    marketBlock = `

MARKET DATA for ${targetRole} (use to identify keyword gaps):
- Top skills in job postings: ${topSkillsList}
- Demand: ${marketCtx.demand.trend} (${marketCtx.demand.trendStrength}), ${marketCtx.demand.growthPercent}% projected growth`;
  }

  let skillTransferBlock = "";
  if (skillTransfers?.length) {
    const directTransfers = skillTransfers.filter(
      (s) => s.transferType === "direct-transfer"
    );
    const partialTransfers = skillTransfers.filter(
      (s) => s.transferType === "partial-transfer"
    );
    skillTransferBlock = `

SKILL TRANSFER DATA (from user's gap analysis — use to inform keyword placement):
${directTransfers.length ? `Direct transfers (should be PROMINENTLY placed in headline/about/skills): ${directTransfers.map((s) => `${s.skill}${s.fromSkill ? ` (from ${s.fromSkill})` : ""}`).join(", ")}` : ""}
${partialTransfers.length ? `Partial transfers (should be mentioned in experience/skills): ${partialTransfers.map((s) => `${s.skill}${s.fromSkill ? ` (from ${s.fromSkill})` : ""}`).join(", ")}` : ""}

IMPORTANT: Skills marked as "direct-transfer" are the user's strongest bridge to the target role. Suggest placing them in the headline and first paragraph of the summary. Tag keyword gaps with their transfer type so the user knows which ones they can claim based on existing experience.`;
  }

  const industryClause = targetIndustry
    ? ` in the ${targetIndustry} industry`
    : "";

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: LinkedInAnalysisSchema }),
      prompt: `You are a LinkedIn profile analyst specializing in career pivots. Analyze this profile for someone targeting ${targetRole}${industryClause}.

LINKEDIN PROFILE:
${profileSnapshot}
${marketBlock}
${skillTransferBlock}

Perform a deep analysis with per-section scoring and keyword gap detection.

## 1. SECTION SCORING (sections)
Score each of these 6 sections from 0-100 with three subscores:

**completeness** (0-100): How fully the section is filled out vs best practices.
- headline: 120+ chars using target keywords, current value prop = 100. Empty = 0.
- summary: 2000+ chars with bridge narrative, CTA, keywords = 100. Empty = 0. Under 300 chars = 30.
- experience: 3+ roles with quantified bullet points (numbers, metrics, outcomes) = 100. No descriptions = 20.
- skills: 30+ skills listed with top 3 endorsed for target role = 100. Under 5 = 20.
- education: All degrees, relevant certs listed = 100. Empty = 0.
- recommendations: 5+ relevant recommendations = 100. 0 = 0, 1-2 = 30, 3-4 = 60.

**keywordDensity** (0-100): How many target-role keywords appear naturally in the section.
- Compare against the top skills from market data.
- 80%+ of critical keywords present = 90-100. Under 20% = 0-20.

**length** (0-100): Whether the section length follows LinkedIn best practices.
- headline: 120-200 chars optimal. Too short (<50) or too long (>220) loses points.
- summary: 1500-2000 chars optimal. Under 300 = 20. Over 2600 = 80.
- experience: 3-5 bullet points per role, 150-300 chars each.
- skills: 25-50 skills listed.

For each section, provide:
- currentContent: brief summary of what's there (or "[EMPTY]")
- idealLength: what the ideal length/count is
- findings: 2-4 specific observations about the current state
- improvements: 2-4 specific, actionable improvements

## 2. KEYWORD GAP ANALYSIS (keywordGaps)
Compare the profile's keywords against target role keywords${marketCtx ? " from the market data" : ""}.

For EACH target-role keyword:
- foundInProfile: whether it appears anywhere in the profile
- foundInSections: which sections it appears in (empty array if not found)
- transferType: if the user has skill transfer data, set to "direct-transfer", "partial-transfer", or "new-skill". If no transfer data, set to "none".
- transferFromSkill: if transfer type is direct or partial, which existing skill it transfers from
- placementSuggestion: exactly WHERE and HOW to add this keyword (e.g., "Add to headline after current title" or "Include in summary paragraph 2 as part of your bridge narrative")

List at least 10-15 keywords. Include ALL critical ones even if already present.

## 3. IMPROVEMENT SUGGESTIONS (suggestions)
Generate 8-15 specific, actionable suggestions ordered by priority.

For each suggestion:
- section: which section it applies to
- priority: high/medium/low
- suggestion: the specific change to make (be concrete, not vague)
- reason: why this matters for the career pivot
- skillTransferBasis: if this suggestion leverages a direct-transfer or partial-transfer skill, name it. Otherwise null.

${skillTransfers?.length ? "CRITICAL: Suggestions that leverage direct-transfer skills should be marked as HIGH priority. The user's strongest pivot story comes from skills that transfer directly." : ""}

## 4. OVERALL METRICS
- overallScore: weighted average (headline 20%, summary 25%, experience 25%, skills 15%, education 5%, recommendations 10%)
- overallLabel: Excellent (85+), Strong (70-84), Needs Improvement (50-69), Weak (30-49), Incomplete (<30)
- profileCompleteness: percentage of sections that have meaningful content
- pivotReadiness: how well the profile currently positions the user for the target role, with a 2-3 sentence narrative

Be specific and grounded. Reference actual content from the profile. Every suggestion should be immediately actionable.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate analysis. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("LinkedIn analysis error:", err);
    return NextResponse.json(
      { error: "Failed to analyze profile. Please try again." },
      { status: 500 }
    );
  }
}
