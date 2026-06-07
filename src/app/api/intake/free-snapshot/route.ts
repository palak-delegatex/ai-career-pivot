import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";
import { sendDripEmail } from "@/lib/email-drip";

const FreeSnapshotSchema = z.object({
  paths: z.array(z.object({
    targetRole: z.string(),
    targetIndustry: z.string(),
    matchScore: z.number(),
    rationale: z.string(),
    topSkillGaps: z.array(z.object({
      skill: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      transferabilityScore: z.number(),
    })).max(3),
  })).max(3),
  profileSummary: z.string(),
  topTransferableStrengths: z.array(z.string()).max(3),
  estimatedSalaryUplift: z.number().optional(),
});

export type FreeSnapshot = z.infer<typeof FreeSnapshotSchema>;

export async function POST(req: NextRequest) {
  let profile: UserProfile;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File | null;
    const email = (formData.get("email") as string | null)?.toLowerCase().trim() ?? "";

    if (!resumeFile) {
      return NextResponse.json({ error: "Resume file required" }, { status: 400 });
    }

    const parseRes = await fetch(`${req.nextUrl.origin}/api/intake/resume`, {
      method: "POST",
      body: formData,
    });

    if (!parseRes.ok) {
      const err = await parseRes.json().catch(() => ({}));
      return NextResponse.json({ error: err.error ?? "Resume parsing failed" }, { status: 400 });
    }

    const parsed = await parseRes.json();
    profile = { ...parsed.profile, email: email || parsed.profile.email };
  } else {
    const body = await req.json();
    profile = body.profile;
  }

  if (!profile?.skills?.length) {
    return NextResponse.json({ error: "Could not extract skills from resume" }, { status: 400 });
  }

  const { output } = await generateText({
    model: anthropic("claude-haiku-4-5-20251001"),
    output: Output.object({ schema: FreeSnapshotSchema }),
    prompt: `You are an elite career strategist who specializes in AI-era career pivots. Based on this professional's background, generate 2-3 compelling career pivot paths as a free skill-gap snapshot. Your goal: make the user feel excited about their potential AND aware that a detailed plan would accelerate their transition.

For each path:
- matchScore (0-100): be generous but honest — show them they have real potential. Scores between 55-85 are ideal (high enough to excite, low enough to show room for growth that a full plan addresses).
- rationale: 2 sentences. First sentence: why their specific background makes them a strong candidate. Second sentence: how AI is creating new demand in this role RIGHT NOW (June 2026) and why acting soon matters.
- topSkillGaps: the 3 most important gaps to close. For each, give a transferabilityScore (0-100, how much existing experience carries over). Higher scores show "you're closer than you think"; lower scores show "this is where the full plan helps."

Also provide:
- profileSummary: 1 confident sentence highlighting their strongest positioning angle (e.g. "A data-savvy marketer with 8 years of cross-functional leadership — perfectly positioned for product management roles in AI-first companies")
- topTransferableStrengths: 3 specific strengths from their background that directly apply to career pivots (not generic — reference their actual skills)
- estimatedSalaryUplift: estimated annual salary increase in thousands (e.g. 15 means $15K) for the top path based on market data. Use a conservative but motivating number (10-30 typical range).

USER PROFILE:
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Top skills: ${profile.skills.slice(0, 10).join(", ")}
- Transferable skills: ${profile.transferableSkills.slice(0, 8).join(", ")}
- Education: ${profile.education.map(e => `${e.degree} in ${e.field}`).join("; ") || "Not specified"}

Generate paths ranked by matchScore descending. Make them feel personalized and achievable — reference their specific skills and experience by name. Return JSON matching the schema exactly.`,
  });

  if (profile.email && output?.paths?.length) {
    const firstName = profile.experience?.[0]?.title
      ? profile.currentTitle?.split(" ")[0] ?? "there"
      : "there";
    sendDripEmail(profile.email, firstName, 17, {
      freeSnapshotPaths: output.paths.map((p) => ({
        targetRole: p.targetRole,
        targetIndustry: p.targetIndustry,
        matchScore: p.matchScore,
        rationale: p.rationale,
      })),
      topStrengths: output.topTransferableStrengths,
    }).catch(() => {});
  }

  return NextResponse.json({ snapshot: output, profile });
}
