import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import { localeSystemPrompt } from "@/lib/locale";

const SectionRewriteSchema = z.object({
  section: z.enum([
    "Headline",
    "Summary",
    "Experience",
    "Skills",
    "Education",
  ]),
  score: z.number().min(0).max(100),
  scoreLabel: z.enum(["Excellent", "Good", "Needs Work", "Weak", "Missing"]),
  current: z.string(),
  suggested: z.string(),
  reasoning: z.string(),
  pivotNarrative: z.string(),
});

const LinkedInOptimizeSchema = z.object({
  overallScore: z.number().min(0).max(100),
  overallLabel: z.enum([
    "Pivot-Ready",
    "Almost There",
    "Needs Reframing",
    "Major Rewrite Needed",
  ]),
  bridgeStorySummary: z.string(),
  sectionScores: z.array(SectionRewriteSchema),
  missingKeywords: z.array(
    z.object({
      keyword: z.string(),
      relevance: z.enum(["critical", "important", "nice-to-have"]),
      whereToAdd: z.string(),
    })
  ),
  recruiterSearchTerms: z.array(z.string()),
  quickWins: z.array(z.string()),
});

export type LinkedInOptimizeResult = z.infer<typeof LinkedInOptimizeSchema>;

export async function POST(req: NextRequest) {
  const {
    profileData,
    linkedinUrl,
    targetRole,
    targetIndustry,
    locale,
  }: {
    profileData?: {
      headline?: string;
      summary?: string;
      experience?: { title: string; company: string; description: string }[];
      skills?: string[];
      education?: { degree: string; field: string; institution: string }[];
      currentTitle?: string;
      currentIndustry?: string;
    };
    linkedinUrl?: string;
    targetRole: string;
    targetIndustry?: string;
    locale?: string;
  } = await req.json();

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
            "That doesn't look like a LinkedIn profile URL. It should look like linkedin.com/in/yourname.",
        },
        { status: 400 }
      );
    }

    const proxycurlKey = process.env.PROXYCURL_API_KEY;
    if (!proxycurlKey) {
      return NextResponse.json(
        {
          error:
            "LinkedIn import is not yet configured. Please provide profileData directly.",
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
          { error: "LinkedIn profile not found. Double-check the URL." },
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
        { error: "Could not fetch LinkedIn profile. Try again later." },
        { status: 502 }
      );
    }

    const raw = await proxycurlRes.json();
    profile = {
      headline: raw.headline,
      summary: raw.summary,
      currentTitle: raw.occupation,
      currentIndustry: raw.industry,
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

  if (!profile) {
    return NextResponse.json(
      { error: "Either profileData or linkedinUrl is required" },
      { status: 400 }
    );
  }

  const profileSnapshot = [
    profile.headline && `Headline: "${profile.headline}"`,
    profile.summary && `Summary: "${profile.summary}"`,
    profile.currentTitle && `Current Title: ${profile.currentTitle}`,
    profile.currentIndustry && `Current Industry: ${profile.currentIndustry}`,
    profile.experience?.length &&
      `Experience:\n${profile.experience.map((e) => `- ${e.title} at ${e.company}: ${e.description}`).join("\n")}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.education?.length &&
      `Education:\n${profile.education.map((e) => `- ${e.degree} in ${e.field}, ${e.institution}`).join("\n")}`,
  ]
    .filter(Boolean)
    .join("\n\n");

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: LinkedInOptimizeSchema }),
      prompt: `You are an expert LinkedIn profile optimizer specializing in career pivots. A career pivoter's LinkedIn needs to tell a "bridge story" — connecting their past experience to their target role, not just listing what they did before.

CURRENT LINKEDIN PROFILE:
${profileSnapshot}

TARGET ROLE: ${targetRole}
${targetIndustry ? `TARGET INDUSTRY: ${targetIndustry}` : ""}

Analyze and optimize this LinkedIn profile for the career pivot. For each section:

1. **Score each section 0-100** on how well it positions the person for their target role:
   - Headline: Does it signal the pivot? Does it include target-role keywords?
   - Summary: Does it tell a bridge story connecting past experience to the target? Is it compelling?
   - Experience: Are past roles reframed to highlight transferable value for the target role?
   - Skills: Are the right skills listed and prioritized for the target role?
   - Education: Is relevant education/training highlighted for the target?

2. **Write pivot-aware rewrites** for each section:
   - Reframe experience using the language of the target industry
   - Lead with transferable impact, not just past duties
   - Weave in keywords recruiters search for in the target role
   - For the Summary, write a compelling bridge narrative that connects their journey
   - For Experience, show how each role built skills relevant to the target

3. **Identify missing keywords** that recruiters search for when hiring for ${targetRole}. Specify where each keyword should be added.

4. **List recruiter search terms** — the exact phrases recruiters type into LinkedIn when sourcing for this role.

5. **Provide 3-5 quick wins** — the highest-impact changes they can make in under 10 minutes.

If a section has no content in the current profile, mark it as "Missing" and write what it should say.

Be specific, actionable, and grounded in real recruiter behavior. Every suggestion should help this person show up in recruiter searches and tell a convincing pivot story.${localeSystemPrompt(locale)}`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate optimization. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("LinkedIn optimize error:", err);
    return NextResponse.json(
      { error: "Failed to optimize profile. Please try again." },
      { status: 500 }
    );
  }
}
