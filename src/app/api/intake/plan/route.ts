import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";
import { getSupabaseClient } from "@/lib/supabase";
import { getStripeClient } from "@/lib/stripe";

const PivotPlanSchema = z.object({
  plans: z.array(z.object({
    targetRole: z.string(),
    targetIndustry: z.string(),
    rationale: z.string(),
    matchScore: z.number().min(0).max(100),
    skillMatchPercent: z.number().min(0).max(100),
    sixMonthMilestones: z.array(z.string()),
    oneYearMilestones: z.array(z.string()),
    twoYearMilestones: z.array(z.string()),
    skillGaps: z.array(z.object({
      skill: z.string(),
      currentLevel: z.string(),
      requiredLevel: z.string(),
      priority: z.enum(["high", "medium", "low"]),
      resource: z.string().optional(),
    })),
    weekOneActions: z.array(z.object({
      title: z.string(),
      instruction: z.string(),
      timeEstimate: z.string(),
      difficulty: z.enum(["easy", "medium", "hard"]),
    })).max(3),
    estimatedTimeToTransition: z.string(),
    financialSummary: z.object({
      currentSalaryRange: z.string(),
      targetSalaryRange: z.string(),
      salaryUpliftPercent: z.number(),
      transitionCosts: z.array(z.string()),
      roiTimeframe: z.string(),
    }),
    recommendedResources: z.array(z.object({
      name: z.string(),
      provider: z.string(),
      type: z.string(),
      url: z.string(),
      cost: z.string(),
      timeEstimate: z.string(),
    })),
  })),
});

export async function POST(req: NextRequest) {
  const { profile, paymentSessionId }: { profile: UserProfile; paymentSessionId?: string } = await req.json();

  if (!profile) {
    return NextResponse.json({ error: "profile required" }, { status: 400 });
  }

  const supabase = getSupabaseClient();

  if (paymentSessionId) {
    const { data: order } = await supabase
      .from("orders")
      .select("id, status")
      .eq("stripe_session_id", paymentSessionId)
      .single();

    if (!order || order.status !== "paid") {
      // Webhook may not have fired yet (common in sandbox/test mode).
      // Fall back to checking Stripe directly and heal the order if paid.
      try {
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(paymentSessionId);
        if (session.payment_status !== "paid") {
          return NextResponse.json({ error: "payment not verified" }, { status: 402 });
        }
        // Heal the order so future requests don't need this fallback
        await supabase
          .from("orders")
          .update({ status: "paid" })
          .eq("stripe_session_id", paymentSessionId);
      } catch {
        return NextResponse.json({ error: "payment not verified" }, { status: 402 });
      }
    }
  }

  try {
  const { output: object } = await generateText({
    model: anthropic("claude-sonnet-4.6"),
    output: Output.object({ schema: PivotPlanSchema }),
    prompt: `You are an elite career strategist who has helped 500+ professionals execute mid-career pivots. You combine deep labor-market knowledge with practical transition planning.

Generate 2-3 career pivot plans for this professional, ranked by matchScore (0-100, how well their background fits the target). Each plan must feel like it was written by a personal advisor who studied their background — never generic.

RULES FOR EVERY FIELD:
1. matchScore (0-100): overall fit score considering skills, experience, market demand, and transition difficulty. skillMatchPercent (0-100): percentage of required skills the user already has.
2. Each milestone string must be ≤15 words. Make them measurable and specific.
3. skillGaps: for each gap, specify the skill name, currentLevel (e.g. "none", "beginner", "intermediate"), requiredLevel (e.g. "intermediate", "advanced"), priority ("high"/"medium"/"low"), and optionally a resource (specific course or book name with provider).
4. weekOneActions: exactly 3 actions the user can start THIS WEEK. Each has a short title, a detailed instruction, a timeEstimate (e.g. "2 hours", "30 minutes"), and difficulty ("easy"/"medium"/"hard"). Prioritize easy wins first.
5. financialSummary: provide currentSalaryRange and targetSalaryRange as formatted ranges (e.g. "$85,000-$105,000"), salaryUpliftPercent as a number, transitionCosts as an array of line items (e.g. ["Google Data Analytics Certificate: $49/mo x 6 = $294", "Career coaching: $500"]), and roiTimeframe (e.g. "6-9 months after transition").
6. recommendedResources: 3-5 specific resources with name, provider, type (e.g. "course", "certification", "book", "community"), url, cost (e.g. "$49/mo", "Free"), and timeEstimate (e.g. "40 hours", "6 weeks").
7. rationale must reference current market conditions or industry trends that make this pivot timely, and explain why THIS person's specific background gives them an edge.
8. Favor paths that leverage existing domain expertise over starting from scratch.
9. Account for financial obligations — minimize income gap, prefer moonlight-first strategies when possible.
10. estimatedTimeToTransition must reflect realistic timelines for a working professional, not someone studying full-time.

USER PROFILE:
- Name: ${profile.name ?? "Not specified"}
- Current title: ${profile.currentTitle ?? "Not specified"}
- Industry: ${profile.currentIndustry ?? "Not specified"}
- Years experience: ${profile.yearsExperience ?? "Not specified"}
- Top skills: ${profile.skills.slice(0, 12).join(", ")}
- Transferable skills: ${profile.transferableSkills.slice(0, 10).join(", ")}
- Work history: ${profile.experience.map(e => `${e.title} at ${e.company} (${e.startYear}–${e.endYear ?? "present"}): ${e.description}`).join(" | ")}
- Education: ${profile.education.map(e => `${e.degree} in ${e.field} from ${e.institution}`).join("; ")}
- Certifications: ${profile.certifications.join(", ") || "None listed"}
- Interests: ${profile.interests.join(", ") || "None listed"}
${profile.rawSummary ? `- Additional context: ${profile.rawSummary.slice(0, 500)}` : ""}

Generate deeply personalized, immediately actionable plans. Reference their specific companies, skills, and experience by name. No filler.`,
  });

  if (paymentSessionId && object) {
    const { data: report } = await supabase
      .from("reports")
      .insert({
        email: profile.email,
        profile,
        plans: object.plans,
      })
      .select("id")
      .single();

    if (report) {
      await supabase
        .from("orders")
        .update({ report_id: report.id })
        .eq("stripe_session_id", paymentSessionId);

      return NextResponse.json({ ...object, reportId: report.id });
    }
  }

  return NextResponse.json(object);
  } catch (err) {
    console.error("Plan generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate pivot plans. Please try again." },
      { status: 500 }
    );
  }
}
