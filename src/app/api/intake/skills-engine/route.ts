import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile, SkillsEngineResult } from "@/lib/intake";

const ExtractedSkillSchema = z.object({
  name: z.string(),
  category: z.enum(["technical", "soft", "domain", "certification", "tool"]),
  proficiency: z.enum(["expert", "advanced", "intermediate", "beginner"]),
  yearsUsed: z.number().nullable(),
  source: z.string(),
});

const TargetRoleSkillSchema = z.object({
  name: z.string(),
  category: z.enum(["technical", "soft", "domain", "certification", "tool"]),
  importance: z.enum(["critical", "important", "nice-to-have"]),
});

const DirectMatchSchema = z.object({
  userSkill: z.string(),
  targetSkill: z.string(),
  proficiency: z.string(),
  matchConfidence: z.number().min(0).max(100),
});

const TransferableMatchSchema = z.object({
  userSkill: z.string(),
  targetSkill: z.string(),
  transferScore: z.number().min(0).max(100),
  explanation: z.string(),
  bridgeActions: z.array(z.string()),
});

const GapSkillSchema = z.object({
  skill: z.string(),
  importance: z.enum(["critical", "important", "nice-to-have"]),
  difficultyToAcquire: z.enum(["low", "medium", "high"]),
  estimatedWeeksToAcquire: z.number(),
  learningResources: z.array(z.string()),
  priorityRank: z.number(),
});

const SkillsEngineSchema = z.object({
  userSkillGraph: z.array(ExtractedSkillSchema),
  targetRoleSkills: z.array(TargetRoleSkillSchema),
  overlapScore: z.number().min(0).max(100),
  directMatches: z.array(DirectMatchSchema),
  transferableMatches: z.array(TransferableMatchSchema),
  gaps: z.array(GapSkillSchema),
  summary: z.object({
    directMatchPercent: z.number().min(0).max(100),
    transferablePercent: z.number().min(0).max(100),
    gapPercent: z.number().min(0).max(100),
    readinessLabel: z.string(),
    topTransferNarrative: z.string(),
  }),
});

function buildProfileContext(profile: UserProfile): string {
  return [
    profile.currentTitle && `Current role: ${profile.currentTitle}`,
    profile.currentIndustry && `Industry: ${profile.currentIndustry}`,
    profile.yearsExperience && `Years of experience: ${profile.yearsExperience}`,
    profile.skills?.length && `Skills: ${profile.skills.join(", ")}`,
    profile.transferableSkills?.length &&
      `Self-reported transferable skills: ${profile.transferableSkills.join(", ")}`,
    profile.experience?.length &&
      `Work experience:\n${profile.experience
        .map(
          (e) =>
            `- ${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "present"}): ${e.description}`
        )
        .join("\n")}`,
    profile.education?.length &&
      `Education:\n${profile.education
        .map((e) => `- ${e.degree} in ${e.field}, ${e.institution}`)
        .join("\n")}`,
    profile.certifications?.length &&
      `Certifications: ${profile.certifications.join(", ")}`,
  ]
    .filter(Boolean)
    .join("\n\n");
}

export async function POST(req: NextRequest) {
  const { profile, targetRole, targetIndustry } = (await req.json()) as {
    profile: UserProfile;
    targetRole: string;
    targetIndustry?: string;
  };

  if (!profile?.skills?.length) {
    return NextResponse.json(
      { error: "User profile with skills is required" },
      { status: 400 }
    );
  }

  if (!targetRole || targetRole.length < 2) {
    return NextResponse.json(
      { error: "Target role is required" },
      { status: 400 }
    );
  }

  const profileContext = buildProfileContext(profile);
  const industryClause = targetIndustry
    ? ` in the ${targetIndustry} industry`
    : "";

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: SkillsEngineSchema }),
      prompt: `You are a career transition skill-mapping expert. Your job is to deeply analyze how a professional's existing skills transfer to a target role.

TARGET ROLE: ${targetRole}${industryClause}

CANDIDATE PROFILE:
${profileContext}

Perform a comprehensive transferable skills analysis:

## 1. USER SKILL GRAPH (userSkillGraph)
Extract ALL skills from the profile — explicit skills listed plus implicit skills inferred from job titles, descriptions, education, and certifications. Categorize each as technical, soft, domain, certification, or tool. Estimate proficiency (expert/advanced/intermediate/beginner) and years used based on work history. In "source", note where you found the skill (e.g. "listed in skills", "inferred from PM role at Acme").

## 2. TARGET ROLE SKILLS (targetRoleSkills)
Generate the complete skill profile a ${targetRole}${industryClause} typically needs. Include 15-25 skills across all categories. Rate each as critical, important, or nice-to-have based on typical job postings and labor market expectations.

## 3. DIRECT MATCHES (directMatches)
Identify user skills that directly match target role requirements — same skill or clearly equivalent (e.g. "Python" matches "Python programming"). matchConfidence 80-100.

## 4. TRANSFERABLE MATCHES (transferableMatches)
This is the KEY differentiator. For skills that don't directly match but DO transfer, explain HOW they transfer with specificity. Examples:
- "Your project management experience in construction directly applies to tech PM roles because both require stakeholder management, timeline tracking, and cross-functional coordination"
- "Your financial modeling skills transfer to data analytics because both involve pattern recognition, quantitative reasoning, and communicating data-driven insights"

transferScore: 40-79 based on how directly the skill transfers. Include 1-3 bridge actions — concrete steps to make the transfer explicit (e.g. "Complete a Google PM certificate to add tech-specific vocabulary to your existing PM skills").

## 5. GAPS (gaps)
Skills the target role requires that the user neither has nor can transfer from existing skills. Rank by priority considering: importance to the role × ease of acquisition. Include specific learning resources (name actual courses, certifications, books, or platforms).

## 6. SUMMARY
- directMatchPercent + transferablePercent + gapPercent must equal 100 (based on proportion of target role skills covered)
- overlapScore: weighted score where direct matches count fully and transferable matches count at their transfer score rate
- readinessLabel: one of "Ready to Apply", "Strong Foundation", "Moderate Pivot", "Significant Reskilling Needed", "Career Reinvention"
- topTransferNarrative: 2-3 sentence narrative highlighting the user's strongest transfer story — the most compelling way to frame their background for this role

Be specific and grounded. Reference actual skills and experiences from the profile. Do not fabricate skills the user doesn't have.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate skills analysis. Please try again." },
        { status: 422 }
      );
    }

    return NextResponse.json(output satisfies SkillsEngineResult);
  } catch (err) {
    console.error("Skills engine error:", err);
    return NextResponse.json(
      { error: "Failed to analyze transferable skills. Please try again." },
      { status: 500 }
    );
  }
}
