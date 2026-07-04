import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import {
  computeATSMatchBreakdown,
  type MatchRateBreakdown,
  type JDKeywords,
} from "@/lib/ats-scoring";
import { localeSystemPrompt } from "@/lib/locale";

// ── Schemas ──────────────────────────────────────────────────────────────────

const JDAnalysisSchema = z.object({
  requiredSkills: z.array(z.string()),
  preferredSkills: z.array(z.string()),
  keywords: z.array(z.string()),
  seniorityLevel: z.string(),
  industry: z.string(),
  companyContext: z.string(),
  roleTitle: z.string(),
  responsibilities: z.array(z.string()),
});

const SemanticMatchesSchema = z.object({
  semanticMatches: z.array(z.string()).describe(
    "JD keywords that are semantically present in the resume but not as exact text"
  ),
});

const TailoredResumeSchema = z.object({
  tailoredContent: z.string(),
  changes: z.array(
    z.object({
      section: z.string(),
      changeType: z.enum(["rewrite", "reorder", "add", "keyword"]),
      original: z.string(),
      tailored: z.string(),
      reason: z.string(),
    })
  ),
});

export type JDAnalysis = z.infer<typeof JDAnalysisSchema>;
export type TailoredResume = z.infer<typeof TailoredResumeSchema>;

export interface ATSMatch {
  score: number;
  keywordMatches: string[];
  missingKeywords: string[];
  sectionScores: { section: string; score: number; note: string }[];
  breakdown: MatchRateBreakdown["summary"];
}

export interface TailorResponse {
  jdAnalysis: JDAnalysis;
  originalScore: ATSMatch;
  tailoredScore: ATSMatch;
  changes: TailoredResume["changes"];
  tailoredContent: string;
}

// ── Input types ──────────────────────────────────────────────────────────────

interface ResumeProfile {
  name?: string;
  email?: string;
  currentTitle?: string;
  skills: string[];
  transferableSkills?: string[];
  experience?: {
    title: string;
    company: string;
    startYear: number;
    endYear: number | null;
    description: string;
  }[];
  education?: {
    degree: string;
    field: string;
    institution: string;
    year: number | null;
  }[];
  certifications?: string[];
}

interface TailorInput {
  resumeContent: string;
  jobDescription: string;
  profile: ResumeProfile;
  locale?: string;
}

// ── Helpers ──────────────────────────────────────────────────────────────────

function formatProfile(profile: ResumeProfile): string {
  return [
    profile.name && `Name: ${profile.name}`,
    profile.email && `Email: ${profile.email}`,
    profile.currentTitle && `Current title: ${profile.currentTitle}`,
    `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length &&
      `Transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Work experience:\n${profile.experience
        .map(
          (e) =>
            `- ${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "Present"}): ${e.description}`
        )
        .join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education
        .map(
          (e) =>
            `- ${e.degree} in ${e.field}, ${e.institution}${e.year ? ` (${e.year})` : ""}`
        )
        .join("\n")}`,
    profile.certifications?.length &&
      `Certifications: ${profile.certifications.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

const model = anthropic("claude-sonnet-4-6");

async function parseJobDescription(jd: string): Promise<JDAnalysis> {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: JDAnalysisSchema }),
    messages: [
      {
        role: "user",
        content: `Analyze this job description and extract structured requirements.

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
- companyContext: brief note about the company if mentioned
- roleTitle: the job title
- responsibilities: key responsibilities listed`,
      },
    ],
  });

  if (!output) throw new Error("Failed to parse job description");
  return output;
}

function scoreResumeWithEngine(
  resumeContent: string,
  jdAnalysis: JDAnalysis,
  semanticMatches?: string[]
): ATSMatch {
  const jdKeywords: JDKeywords = {
    required: jdAnalysis.requiredSkills,
    preferred: jdAnalysis.preferredSkills,
    keywords: jdAnalysis.keywords,
  };

  const breakdown = computeATSMatchBreakdown(resumeContent, jdKeywords, {
    semanticMatches,
  });

  return {
    score: breakdown.overallScore,
    keywordMatches: breakdown.keywordMatches
      .filter(m => m.matched)
      .map(m => m.keyword),
    missingKeywords: breakdown.keywordMatches
      .filter(m => !m.matched)
      .map(m => m.keyword),
    sectionScores: breakdown.sectionScores.map(s => ({
      section: s.section,
      score: s.coverage,
      note: s.present
        ? `${s.keywordsFound.length} keywords found${s.keywordsMissing.length > 0 ? `, ${s.keywordsMissing.length} missing` : ""}`
        : "Section not found in resume",
    })),
    breakdown: breakdown.summary,
  };
}

async function getSemanticMatches(
  resumeContent: string,
  jdAnalysis: JDAnalysis
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
      messages: [{
        role: "user",
        content: `Given this resume and target keywords, identify keywords that are SEMANTICALLY present but not as exact text matches.

RESUME:
"""
${resumeContent.slice(0, 8000)}
"""

KEYWORDS TO CHECK: ${allKeywords.join(", ")}

Return only keywords where the resume demonstrates the skill/concept through different wording (e.g. "team leadership" matching "managed a team of 8").`,
      }],
    });
    return output?.semanticMatches || [];
  } catch {
    return [];
  }
}

async function tailorResume(
  resumeContent: string,
  profileStr: string,
  jdAnalysis: JDAnalysis,
  originalScore: ATSMatch,
  locale?: string
): Promise<TailoredResume> {
  const { output } = await generateText({
    model,
    output: Output.object({ schema: TailoredResumeSchema }),
    messages: [
      {
        role: "user",
        content: `You are an expert resume writer specializing in ATS optimization and career pivots. Tailor the existing resume for this specific job.

CURRENT RESUME:
"""
${resumeContent.slice(0, 8000)}
"""

FULL CANDIDATE PROFILE (may include experience not in current resume):
"""
${profileStr}
"""

TARGET JOB:
- Role: ${jdAnalysis.roleTitle} (${jdAnalysis.seniorityLevel})
- Industry: ${jdAnalysis.industry}
- Company: ${jdAnalysis.companyContext}
- Required skills: ${jdAnalysis.requiredSkills.join(", ")}
- Preferred skills: ${jdAnalysis.preferredSkills.join(", ")}
- ATS keywords: ${jdAnalysis.keywords.join(", ")}
- Responsibilities: ${jdAnalysis.responsibilities.join("; ")}

CURRENT ATS GAPS:
- Missing keywords: ${originalScore.missingKeywords.join(", ")}
- Current score: ${originalScore.score}/100
- Match breakdown: ${originalScore.breakdown.requiredHit}/${originalScore.breakdown.requiredTotal} required, ${originalScore.breakdown.preferredHit}/${originalScore.breakdown.preferredTotal} preferred

INSTRUCTIONS:
1. Rewrite the complete resume in Markdown, optimized for this specific JD.
2. Rewrite bullet points to emphasize relevant experience — use the JD's language and keywords naturally.
3. Add missing keywords where they fit organically — never keyword-stuff.
4. Reorder sections and bullets by relevance to the target role.
5. If the candidate's broader profile has relevant experience not in the current resume, suggest new bullets.
6. Keep the resume honest — reframe, don't fabricate.
7. Use strong action verbs and quantifiable metrics.
8. Maintain ATS-friendly formatting: standard section headings, no tables/columns/graphics.

Return:
- tailoredContent: the full rewritten resume in Markdown
- changes: an array of every change made, with section, changeType (rewrite/reorder/add/keyword), original text, tailored text, and reason for the change.

Be thorough — capture every meaningful change in the diff.${localeSystemPrompt(locale)}`,
      },
    ],
  });

  if (!output) throw new Error("Failed to tailor resume");
  return output;
}

// ── Route handler ────────────────────────────────────────────────────────────

export async function POST(req: NextRequest) {
  let body: TailorInput;
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON body" }, { status: 400 });
  }

  const { resumeContent, jobDescription, profile, locale } = body;

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
  if (!profile?.skills?.length) {
    return NextResponse.json(
      { error: "profile with skills is required" },
      { status: 400 }
    );
  }

  try {
    const jdAnalysis = await parseJobDescription(jobDescription);

    const semanticMatches = await getSemanticMatches(resumeContent, jdAnalysis);
    const originalScore = scoreResumeWithEngine(resumeContent, jdAnalysis, semanticMatches);

    const profileStr = formatProfile(profile);
    const tailored = await tailorResume(
      resumeContent,
      profileStr,
      jdAnalysis,
      originalScore,
      locale
    );

    const tailoredSemanticMatches = await getSemanticMatches(
      tailored.tailoredContent,
      jdAnalysis
    );
    const tailoredScore = scoreResumeWithEngine(
      tailored.tailoredContent,
      jdAnalysis,
      tailoredSemanticMatches
    );

    const response: TailorResponse = {
      jdAnalysis,
      originalScore,
      tailoredScore,
      changes: tailored.changes,
      tailoredContent: tailored.tailoredContent,
    };

    return NextResponse.json(response);
  } catch (err) {
    console.error("Resume tailoring error:", err);
    return NextResponse.json(
      { error: "Failed to tailor resume. Please try again." },
      { status: 500 }
    );
  }
}
