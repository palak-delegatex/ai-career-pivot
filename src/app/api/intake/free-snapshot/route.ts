import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";

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
    prompt: `You are a career strategist. Based on this professional's background, generate 2-3 career pivot paths as a free skill-gap snapshot. Be specific and insightful.

For each path: give a matchScore (0-100), a 2-sentence rationale explaining why this person is a good fit, and the top 3 skill gaps they'd need to close. For each skill gap, give a transferabilityScore (0-100, higher means they have more existing skills that carry over).

Also provide a 1-sentence profileSummary and 3 topTransferableStrengths from their background.

USER PROFILE:
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Top skills: ${profile.skills.slice(0, 10).join(", ")}
- Transferable skills: ${profile.transferableSkills.slice(0, 8).join(", ")}
- Education: ${profile.education.map(e => `${e.degree} in ${e.field}`).join("; ") || "Not specified"}

Generate paths ranked by matchScore descending. Return JSON matching the schema exactly.`,
  });

  return NextResponse.json({ snapshot: output, profile });
}
