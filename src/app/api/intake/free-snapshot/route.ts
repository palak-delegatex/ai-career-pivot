import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";
import { sendDripEmail } from "@/lib/email-drip";
import { localeSystemPrompt } from "@/lib/locale";

// Haiku snapshot is fast, but streaming means the first career-path insight can
// render on /free in a few seconds instead of the user staring at a blank
// spinner for the full 10-30s blocking call (AIC-796 time-to-value).
export const maxDuration = 60;

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
    })).describe("The 3 most important skill gaps to close"),
  })).describe("2-3 career pivot paths, ranked by matchScore descending"),
  profileSummary: z.string(),
  topTransferableStrengths: z.array(z.object({
    skill: z.string(),
    confidence: z.number().describe("0-100"),
    aiBoostExplanation: z.string(),
  })).describe("Exactly 3 hidden transferable strengths career changers overlook"),
  estimatedSalaryUplift: z.number().optional(),
});

export type FreeSnapshot = z.infer<typeof FreeSnapshotSchema>;

export async function POST(req: NextRequest) {
  let profile: UserProfile;
  let locale: string | undefined;

  const contentType = req.headers.get("content-type") ?? "";
  if (contentType.includes("multipart/form-data")) {
    const formData = await req.formData();
    const resumeFile = formData.get("resume") as File | null;
    const email = (formData.get("email") as string | null)?.toLowerCase().trim() ?? "";
    locale = (formData.get("locale") as string | null) ?? undefined;

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
    let body: { profile?: UserProfile; locale?: string };
    try {
      body = await req.json();
    } catch {
      return NextResponse.json({ error: "Invalid or empty request body" }, { status: 400 });
    }
    profile = body?.profile as UserProfile;
    locale = body?.locale;
  }

  if (!profile?.skills?.length) {
    return NextResponse.json({ error: "Could not extract skills from resume" }, { status: 400 });
  }

  const result = streamObject({
    model: anthropic("claude-haiku-4-5-20251001"),
    schema: FreeSnapshotSchema,
    // A snapshot that fails silently after headers flush would leave the client
    // with a truncated stream; the client detects that and surfaces a retry.
    onError: ({ error }) => {
      console.error("Free snapshot stream error:", error);
    },
    // Fire the drip email once the full object is available (parity with the old
    // blocking behavior). Only sends if an email was provided — deferred-email
    // uploads (AIC-776) pass no email here, so this is a no-op for /free today.
    onFinish: ({ object: output }) => {
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
          topStrengths: output.topTransferableStrengths.map((s) => s.skill),
        }).catch(() => {});
      }
    },
    prompt: `You are an elite career strategist who specializes in AI-era career pivots. Based on this professional's background, generate 2-3 compelling career pivot paths as a free skill-gap snapshot. Your goal: make the user feel excited about their potential AND aware that a detailed plan would accelerate their transition.

For each path:
- matchScore (0-100): be generous but honest — show them they have real potential. Scores between 55-85 are ideal (high enough to excite, low enough to show room for growth that a full plan addresses).
- rationale: 2 sentences. First sentence: why their specific background makes them a strong candidate. Second sentence: how AI is creating new demand in this role RIGHT NOW (June 2026) and why acting soon matters.
- topSkillGaps: the 3 most important gaps to close. For each, give a transferabilityScore (0-100, how much existing experience carries over). Higher scores show "you're closer than you think"; lower scores show "this is where the full plan helps."

Also provide:
- profileSummary: 1 confident sentence highlighting their strongest positioning angle (e.g. "A data-savvy marketer with 8 years of cross-functional leadership — perfectly positioned for product management roles in AI-first companies")
- topTransferableStrengths: 3 "hidden strengths" — surprising transferable skills that career changers typically overlook. For each, provide:
  - skill: the specific strength (reference their actual background, not generic terms)
  - confidence: 0-100 score for how strongly this skill transfers to their target roles
  - aiBoostExplanation: 1 sentence on how AI tools amplify this existing strength in the new role (e.g. "Your data storytelling pairs with AI visualization tools to produce executive dashboards 3× faster")
- estimatedSalaryUplift: estimated annual salary increase in thousands (e.g. 15 means $15K) for the top path based on market data. Use a conservative but motivating number (10-30 typical range).

USER PROFILE:
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Top skills: ${profile.skills.slice(0, 10).join(", ")}
- Transferable skills: ${(profile.transferableSkills ?? []).slice(0, 8).join(", ") || "Not specified"}
- Education: ${(profile.education ?? []).map(e => `${e.degree} in ${e.field}`).join("; ") || "Not specified"}

Generate paths ranked by matchScore descending. Make them feel personalized and achievable — reference their specific skills and experience by name. Return JSON matching the schema exactly.${localeSystemPrompt(locale)}`,
  });

  // The snapshot object streams in the response body (progressive reveal on
  // /free). The parsed profile is needed client-side for the deferred email
  // capture on /free-results, so it rides along in a base64 header rather than
  // the body — keeping the body a single streamed JSON object the client can
  // parse incrementally, exactly like the paid plan stream.
  const profileHeader = Buffer.from(JSON.stringify(profile), "utf-8").toString("base64");

  return result.toTextStreamResponse({
    headers: {
      "x-free-profile": profileHeader,
    },
  });
}
