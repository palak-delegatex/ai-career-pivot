import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

// ── Types ────────────────────────────────────────────────────────────────────

export interface ParsedResponsibility {
  text: string;
  category: "core" | "secondary" | "nice-to-have";
  requiredSkills: string[];
}

export interface ParsedQualification {
  text: string;
  required: boolean;
  type: "education" | "experience" | "certification" | "skill" | "other";
}

export interface StructuredJD {
  jobTitle: string;
  department: string | null;
  seniority: "entry" | "mid" | "senior" | "lead" | "executive";
  responsibilities: ParsedResponsibility[];
  qualifications: ParsedQualification[];
  technicalSkills: string[];
  softSkills: string[];
  industryTerms: string[];
}

export interface ResponsibilityMatch {
  responsibility: ParsedResponsibility;
  matchLevel: "full" | "partial" | "transferable" | "none";
  matchScore: number;
  matchedContent: string | null;
  transferableExplanation: string | null;
}

export interface QualificationMatch {
  qualification: ParsedQualification;
  met: boolean;
  evidence: string | null;
}

export interface ResponsibilityMatchResult {
  overallScore: number;
  scoreLabel: "Strong Match" | "Good Match" | "Partial Match" | "Weak Match";
  responsibilityMatches: ResponsibilityMatch[];
  qualificationMatches: QualificationMatch[];
  transferableHighlights: string[];
  gapSummary: string[];
}

// ── Schemas ──────────────────────────────────────────────────────────────────

const StructuredJDSchema = z.object({
  jobTitle: z.string(),
  department: z.string().nullable(),
  seniority: z.enum(["entry", "mid", "senior", "lead", "executive"]),
  responsibilities: z.array(z.object({
    text: z.string().describe("The responsibility as stated or paraphrased from the JD"),
    category: z.enum(["core", "secondary", "nice-to-have"]),
    requiredSkills: z.array(z.string()),
  })),
  qualifications: z.array(z.object({
    text: z.string(),
    required: z.boolean(),
    type: z.enum(["education", "experience", "certification", "skill", "other"]),
  })),
  technicalSkills: z.array(z.string()),
  softSkills: z.array(z.string()),
  industryTerms: z.array(z.string()),
});

const ResponsibilityMatchSchema = z.object({
  responsibilityMatches: z.array(z.object({
    responsibilityIndex: z.number(),
    matchLevel: z.enum(["full", "partial", "transferable", "none"]),
    matchScore: z.number().min(0).max(100),
    matchedContent: z.string().nullable().describe("The specific resume content that matches this responsibility"),
    transferableExplanation: z.string().nullable().describe("If transferable, explain how the candidate's different experience maps to this requirement"),
  })),
  qualificationMatches: z.array(z.object({
    qualificationIndex: z.number(),
    met: z.boolean(),
    evidence: z.string().nullable(),
  })),
  transferableHighlights: z.array(z.string()).describe("Top 3-5 examples of transferable experience that strongly maps to requirements despite different terminology"),
  gapSummary: z.array(z.string()).describe("Top 3-5 gaps where the candidate needs development"),
});

// ── JD Parser ────────────────────────────────────────────────────────────────

export async function parseJobDescription(jobDescription: string): Promise<StructuredJD> {
  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema: StructuredJDSchema }),
    messages: [{
      role: "user",
      content: `Parse this job description into structured components. For each responsibility, classify whether it's core (must-do daily), secondary (important but not primary), or nice-to-have. Extract the skills each responsibility requires.

For qualifications, identify whether each is required or preferred, and classify the type.

JOB DESCRIPTION:
"""
${jobDescription.slice(0, 8000)}
"""`,
    }],
  });

  if (!output) {
    throw new Error("Failed to parse job description");
  }

  return output as StructuredJD;
}

// ── Responsibility Matching ──────────────────────────────────────────────────

export async function matchResponsibilities(
  structuredJD: StructuredJD,
  resumeText: string,
): Promise<ResponsibilityMatchResult> {
  const responsibilitySummary = structuredJD.responsibilities
    .map((r, i) => `[${i}] (${r.category}) ${r.text}`)
    .join("\n");

  const qualificationSummary = structuredJD.qualifications
    .map((q, i) => `[${i}] (${q.required ? "required" : "preferred"}, ${q.type}) ${q.text}`)
    .join("\n");

  const { output } = await generateText({
    model: anthropic("claude-sonnet-4-6"),
    output: Output.object({ schema: ResponsibilityMatchSchema }),
    messages: [{
      role: "user",
      content: `You are an expert career coach analyzing how well a resume matches a job's responsibilities and qualifications.

For EACH responsibility, determine:
- matchLevel: "full" if the resume directly demonstrates this capability with evidence, "partial" if some relevant experience exists, "transferable" if different experience maps to this requirement through transferable skills, "none" if no relevant experience
- matchScore: 0-100 representing match strength
- matchedContent: quote or paraphrase the specific resume content that matches
- transferableExplanation: if transferable, explain HOW the different experience maps (e.g., "Managing cross-functional engineering teams directly transfers to coordinating product launches across departments")

For EACH qualification, determine if the resume meets it and cite evidence.

Be generous with "transferable" — career pivoters often have relevant experience expressed differently. Look for underlying competencies, not just matching job titles.

TARGET ROLE: ${structuredJD.jobTitle}
SENIORITY: ${structuredJD.seniority}

RESPONSIBILITIES:
${responsibilitySummary}

QUALIFICATIONS:
${qualificationSummary}

RESUME:
"""
${resumeText.slice(0, 8000)}
"""`,
    }],
  });

  if (!output) {
    throw new Error("Failed to match responsibilities");
  }

  const responsibilityMatches: ResponsibilityMatch[] = output.responsibilityMatches.map(m => ({
    responsibility: structuredJD.responsibilities[m.responsibilityIndex],
    matchLevel: m.matchLevel,
    matchScore: m.matchScore,
    matchedContent: m.matchedContent,
    transferableExplanation: m.transferableExplanation,
  }));

  const qualificationMatches: QualificationMatch[] = output.qualificationMatches.map(m => ({
    qualification: structuredJD.qualifications[m.qualificationIndex],
    met: m.met,
    evidence: m.evidence,
  }));

  const coreMatches = responsibilityMatches.filter(m => m.responsibility.category === "core");
  const secondaryMatches = responsibilityMatches.filter(m => m.responsibility.category === "secondary");

  const coreScore = coreMatches.length > 0
    ? coreMatches.reduce((sum, m) => sum + m.matchScore, 0) / coreMatches.length
    : 0;
  const secondaryScore = secondaryMatches.length > 0
    ? secondaryMatches.reduce((sum, m) => sum + m.matchScore, 0) / secondaryMatches.length
    : 0;

  const requiredQuals = qualificationMatches.filter(m => m.qualification.required);
  const qualScore = requiredQuals.length > 0
    ? (requiredQuals.filter(m => m.met).length / requiredQuals.length) * 100
    : 100;

  const overallScore = Math.round(
    coreScore * 0.50 +
    secondaryScore * 0.25 +
    qualScore * 0.25
  );

  const label = overallScore >= 75 ? "Strong Match"
    : overallScore >= 55 ? "Good Match"
    : overallScore >= 35 ? "Partial Match"
    : "Weak Match";

  return {
    overallScore,
    scoreLabel: label,
    responsibilityMatches,
    qualificationMatches,
    transferableHighlights: output.transferableHighlights,
    gapSummary: output.gapSummary,
  };
}
