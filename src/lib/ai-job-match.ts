import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

// ── Types ────────────────────────────────────────────────────────────────────

export interface AIMatchBreakdown {
  skills: number;
  experience: number;
  education: number;
  keywords: number;
  location: number;
}

export interface SkillMatchDetail {
  skill: string;
  matchType: "exact" | "transferable" | "partial" | "missing";
  relevance: "critical" | "important" | "nice-to-have";
  resumeEvidence?: string;
}

export interface ImprovementSuggestion {
  action: string;
  keyword: string;
  estimatedImpact: number;
  category: "skills" | "experience" | "education" | "keywords";
  priority: "high" | "medium" | "low";
}

export interface GapIndicator {
  area: string;
  gap: string;
  severity: "critical" | "moderate" | "minor";
  bridgeAction: string;
}

export interface AIMatchResult {
  score: number;
  breakdown: AIMatchBreakdown;
  skillMatches: SkillMatchDetail[];
  improvements: ImprovementSuggestion[];
  gaps: GapIndicator[];
  summary: string;
  recommendation: "strong-match" | "good-match" | "partial-match" | "weak-match";
}

// ── Zod schemas for structured AI output ─────────────────────────────────────

const AIMatchSchema = z.object({
  score: z.number().min(0).max(100).describe("Overall compatibility score 0-100"),
  breakdown: z.object({
    skills: z.number().min(0).max(40).describe("Skills match score (0-40): direct, transferable, and adjacent skill alignment"),
    experience: z.number().min(0).max(25).describe("Experience level score (0-25): years, seniority, domain relevance"),
    education: z.number().min(0).max(10).describe("Education score (0-10): degree, field, certifications"),
    keywords: z.number().min(0).max(15).describe("ATS keyword score (0-15): exact keyword/phrase presence for ATS pass-through"),
    location: z.number().min(0).max(10).describe("Location score (0-10): geographic, remote, timezone fit"),
  }),
  skillMatches: z.array(z.object({
    skill: z.string().describe("The skill or requirement from the job"),
    matchType: z.enum(["exact", "transferable", "partial", "missing"]),
    relevance: z.enum(["critical", "important", "nice-to-have"]),
    resumeEvidence: z.string().optional().describe("Brief note on where/how the candidate demonstrates this"),
  })).describe("Top 15 skill matches/gaps"),
  improvements: z.array(z.object({
    action: z.string().describe("Specific actionable suggestion, e.g. 'Add Docker to your skills section'"),
    keyword: z.string().describe("The keyword or phrase to add"),
    estimatedImpact: z.number().min(1).max(15).describe("Estimated score increase in points"),
    category: z.enum(["skills", "experience", "education", "keywords"]),
    priority: z.enum(["high", "medium", "low"]),
  })).describe("Top 5 score improvement suggestions"),
  gaps: z.array(z.object({
    area: z.string().describe("The gap area, e.g. 'Cloud Infrastructure'"),
    gap: z.string().describe("What's missing"),
    severity: z.enum(["critical", "moderate", "minor"]),
    bridgeAction: z.string().describe("How to bridge this gap (certification, project, etc.)"),
  })).describe("Top 5 gap indicators"),
  summary: z.string().describe("2-sentence match summary for the candidate"),
  recommendation: z.enum(["strong-match", "good-match", "partial-match", "weak-match"]),
});

// ── Deterministic pre-scoring ────────────────────────────────────────────────

const SKILL_VARIANTS: Record<string, string[]> = {
  javascript: ["js", "es6", "es2015", "ecmascript"],
  typescript: ["ts"],
  "react": ["reactjs", "react.js"],
  "node.js": ["nodejs", "node"],
  python: ["py", "python3"],
  "machine learning": ["ml"],
  "artificial intelligence": ["ai"],
  sql: ["mysql", "postgresql", "postgres", "sqlite"],
  aws: ["amazon web services"],
  gcp: ["google cloud", "google cloud platform"],
  azure: ["microsoft azure"],
  docker: ["containerization", "containers"],
  kubernetes: ["k8s"],
  "ci/cd": ["continuous integration", "continuous deployment", "cicd"],
  "data analysis": ["data analytics", "analytics"],
  "project management": ["pm", "pmp"],
  agile: ["scrum", "kanban"],
  "rest api": ["restful", "rest apis"],
  graphql: ["gql"],
};

function normalizeForMatch(s: string): string {
  return s.toLowerCase().replace(/[^a-z0-9+#. ]/g, " ").replace(/\s+/g, " ").trim();
}

function getVariants(skill: string): string[] {
  const norm = normalizeForMatch(skill);
  const variants = [norm];
  for (const [key, alts] of Object.entries(SKILL_VARIANTS)) {
    if (norm === key || alts.includes(norm)) {
      variants.push(key, ...alts);
    }
  }
  return [...new Set(variants)];
}

export function computeQuickMatchBreakdown(
  resumeSkills: string[],
  jobText: string,
  opts?: {
    yearsExperience?: number;
    education?: Array<{ degree: string; field: string }>;
    location?: string;
    jobLocation?: string;
    isRemote?: boolean;
    remotePreferred?: boolean;
  }
): { score: number; breakdown: AIMatchBreakdown; matchedSkills: string[]; missingFromJd: string[] } {
  const jobLower = normalizeForMatch(jobText);
  const jobTokens = new Set(jobLower.split(/\s+/).filter(w => w.length > 1));

  const matchedSkills: string[] = [];
  for (const skill of resumeSkills) {
    const variants = getVariants(skill);
    if (variants.some(v => jobLower.includes(v) || (v.length > 2 && jobTokens.has(v)))) {
      matchedSkills.push(skill);
    }
  }

  const skillRatio = resumeSkills.length > 0
    ? matchedSkills.length / Math.min(resumeSkills.length, 15)
    : 0;
  const skillsScore = Math.min(40, Math.round(skillRatio * 40));

  let expScore = 0;
  if (opts?.yearsExperience !== undefined) {
    const jl = jobLower;
    const seniorMatch = /\b(senior|sr\.?|lead|principal|staff)\b/.test(jl);
    const juniorMatch = /\b(junior|jr\.?|entry[- ]level)\b/.test(jl);
    const midMatch = /\b(mid[- ]?level)\b/.test(jl);

    if (seniorMatch && opts.yearsExperience >= 5) expScore = 25;
    else if (seniorMatch && opts.yearsExperience >= 3) expScore = 15;
    else if (midMatch && opts.yearsExperience >= 3) expScore = 25;
    else if (juniorMatch && opts.yearsExperience <= 3) expScore = 25;
    else if (!seniorMatch && !juniorMatch && !midMatch) expScore = 15;
    else expScore = 8;
  }

  let eduScore = 0;
  if (opts?.education?.length) {
    eduScore = 5;
    const hasMasters = opts.education.some(e =>
      /master|mba|m\.s\.|ms /i.test(e.degree)
    );
    const hasPhd = opts.education.some(e => /ph\.?d|doctorate/i.test(e.degree));
    if (/\b(master|mba|m\.s\.)\b/i.test(jobLower) && hasMasters) eduScore = 10;
    if (/\b(ph\.?d|doctorate)\b/i.test(jobLower) && hasPhd) eduScore = 10;
    if (!/\b(master|mba|ph\.?d|doctorate)\b/i.test(jobLower)) eduScore = 8;
  }

  const keywordsScore = Math.min(15, Math.round(skillRatio * 15));

  let locScore = 0;
  if (opts?.isRemote && opts?.remotePreferred) locScore = 10;
  else if (opts?.isRemote) locScore = 8;
  else if (opts?.location && opts?.jobLocation) {
    if (normalizeForMatch(opts.jobLocation).includes(normalizeForMatch(opts.location))) {
      locScore = 10;
    } else {
      locScore = 3;
    }
  }

  const breakdown: AIMatchBreakdown = {
    skills: skillsScore,
    experience: expScore,
    education: eduScore,
    keywords: keywordsScore,
    location: locScore,
  };

  const score = Math.min(100, skillsScore + expScore + eduScore + keywordsScore + locScore);

  const jdWords = jobLower.split(/\s+/).filter(w => w.length > 3);
  const matchedLower = new Set(matchedSkills.map(s => normalizeForMatch(s)));
  const techTerms = new Set<string>();
  const techPatterns = /\b(python|java|react|node|sql|aws|docker|kubernetes|typescript|javascript|angular|vue|go|rust|swift|kotlin|terraform|jenkins|git|linux|api|rest|graphql|mongodb|redis|kafka|spark|hadoop|tableau|power\s?bi|figma|sketch|jira|confluence|agile|scrum|devops|ci\/cd|machine\s?learning|deep\s?learning|nlp|computer\s?vision|data\s?science|cloud|microservices|serverless)\b/gi;
  let match;
  while ((match = techPatterns.exec(jobLower)) !== null) {
    const term = match[0].trim();
    if (!matchedLower.has(term) && !matchedLower.has(normalizeForMatch(term))) {
      techTerms.add(term);
    }
  }

  return {
    score,
    breakdown,
    matchedSkills,
    missingFromJd: [...techTerms].slice(0, 10),
  };
}

// ── AI-powered deep match scoring ────────────────────────────────────────────

export async function computeAIMatchScore(
  resumeText: string,
  jobDescription: string,
  profile?: {
    skills?: string[];
    yearsExperience?: number;
    education?: Array<{ degree: string; field: string }>;
    currentTitle?: string;
    location?: string;
  }
): Promise<AIMatchResult> {
  const skillsList = profile?.skills?.join(", ") || "Not specified";
  const experience = profile?.yearsExperience
    ? `${profile.yearsExperience} years`
    : "Not specified";
  const education = profile?.education?.length
    ? profile.education.map(e => `${e.degree} in ${e.field}`).join("; ")
    : "Not specified";

  const { output } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    output: Output.object({ schema: AIMatchSchema }),
    messages: [{ role: "user", content: `You are a job matching AI. Analyze how well this candidate matches the job posting. Be calibrated: 80+ means strong match on most requirements, 50-79 means decent with some gaps, below 50 means significant misalignment.

CANDIDATE PROFILE:
- Current Title: ${profile?.currentTitle || "Not specified"}
- Experience: ${experience}
- Skills: ${skillsList}
- Education: ${education}
- Location: ${profile?.location || "Not specified"}

RESUME EXCERPT:
"""
${resumeText.slice(0, 3000)}
"""

JOB POSTING:
"""
${jobDescription.slice(0, 4000)}
"""

Score this candidate against the job. The breakdown must sum to the overall score.
Focus improvements on the highest-impact, most actionable changes.
For skillMatches, prioritize the job's most critical requirements.
For gaps, focus on dealbreaker-level misses the candidate should address before applying.` }],
  });

  if (!output) {
    throw new Error("AI match scoring returned no result");
  }

  const clamped = Math.min(100, Math.max(0, output.score));
  const rec: AIMatchResult["recommendation"] =
    clamped >= 80 ? "strong-match" :
    clamped >= 60 ? "good-match" :
    clamped >= 40 ? "partial-match" :
    "weak-match";

  return {
    ...output,
    score: clamped,
    recommendation: rec,
    skillMatches: output.skillMatches.slice(0, 15),
    improvements: output.improvements.slice(0, 5),
    gaps: output.gaps.slice(0, 5),
  };
}

// ── Hybrid scoring: fast deterministic + optional AI deep dive ───────────────

export async function computeHybridMatchScore(
  jobDescription: string,
  profile: {
    skills: string[];
    resumeText?: string;
    yearsExperience?: number;
    education?: Array<{ degree: string; field: string }>;
    currentTitle?: string;
    location?: string;
    jobLocation?: string;
    isRemote?: boolean;
    remotePreferred?: boolean;
  },
  options?: { deepAnalysis?: boolean }
): Promise<AIMatchResult> {
  const quick = computeQuickMatchBreakdown(
    profile.skills,
    jobDescription,
    {
      yearsExperience: profile.yearsExperience,
      education: profile.education,
      location: profile.location,
      jobLocation: profile.jobLocation,
      isRemote: profile.isRemote,
      remotePreferred: profile.remotePreferred,
    }
  );

  if (!options?.deepAnalysis || !profile.resumeText) {
    const improvements: ImprovementSuggestion[] = quick.missingFromJd
      .slice(0, 5)
      .map((kw, i) => ({
        action: `Add "${kw}" to your skills or experience section`,
        keyword: kw,
        estimatedImpact: Math.max(2, 8 - i * 2),
        category: "keywords" as const,
        priority: (i < 2 ? "high" : i < 4 ? "medium" : "low") as "high" | "medium" | "low",
      }));

    const gaps: GapIndicator[] = quick.missingFromJd
      .slice(0, 3)
      .map(kw => ({
        area: kw.charAt(0).toUpperCase() + kw.slice(1),
        gap: `Job requires ${kw} but not found in your profile`,
        severity: "moderate" as const,
        bridgeAction: `Gain experience with ${kw} through projects or certifications`,
      }));

    const rec: AIMatchResult["recommendation"] =
      quick.score >= 80 ? "strong-match" :
      quick.score >= 60 ? "good-match" :
      quick.score >= 40 ? "partial-match" :
      "weak-match";

    return {
      score: quick.score,
      breakdown: quick.breakdown,
      skillMatches: quick.matchedSkills.map(s => ({
        skill: s,
        matchType: "exact" as const,
        relevance: "important" as const,
      })),
      improvements,
      gaps,
      summary: quick.score >= 70
        ? `Strong skill alignment with ${quick.matchedSkills.length} matching skills. ${quick.missingFromJd.length > 0 ? `Consider adding ${quick.missingFromJd.slice(0, 2).join(" and ")} to strengthen your application.` : "Well-positioned for this role."}`
        : `${quick.matchedSkills.length} skills match this role. Focus on bridging gaps in ${quick.missingFromJd.slice(0, 2).join(" and ")} to improve your candidacy.`,
      recommendation: rec,
    };
  }

  return computeAIMatchScore(profile.resumeText, jobDescription, profile);
}
