import { NextRequest, NextResponse } from "next/server";
import { gateway } from "@ai-sdk/gateway";
import { generateText, Output } from "ai";
import { z } from "zod";
import type { UserProfile } from "@/lib/intake";
import { getSupabaseClient } from "@/lib/supabase";

const PivotPlanSchema = z.object({
  plans: z.array(z.object({
    targetRole: z.string(),
    targetIndustry: z.string(),
    rationale: z.string(),
    sixMonthMilestones: z.array(z.string()),
    oneYearMilestones: z.array(z.string()),
    twoYearMilestones: z.array(z.string()),
    skillGaps: z.array(z.string()),
    keyActions: z.array(z.string()),
    estimatedTimeToTransition: z.string(),
    financialConsiderations: z.string(),
  })).min(1).max(3),
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
      return NextResponse.json({ error: "payment not verified" }, { status: 402 });
    }
  }

  const { output: object } = await generateText({
    model: gateway("anthropic/claude-sonnet-4.6"),
    output: Output.object({ schema: PivotPlanSchema }),
    prompt: `You are an elite career strategist who has helped 500+ professionals execute mid-career pivots. You combine deep labor-market knowledge with practical transition planning.

Generate 2-3 career pivot plans for this professional, ranked by fit and feasibility. Each plan must feel like it was written by a personal advisor who studied their background — never generic.

RULES FOR EVERY FIELD:
1. Milestones must be measurable (not "learn Python" but "complete 3 portfolio projects demonstrating data analysis with Python and publish on GitHub").
2. keyActions must include specific resources: named courses, certifications with provider names, communities, job boards, and example companies hiring for this role.
3. skillGaps must name the exact gap-closing path — specific courses, books, or projects — not just the skill name.
4. estimatedTimeToTransition must reflect realistic timelines for a working professional, not someone studying full-time.
5. financialConsiderations must include estimated transition costs (courses, certs, potential income dip period) and timeline to salary recovery. Include expected salary range for the target role.
6. rationale must reference current market conditions or industry trends that make this pivot timely, and explain why THIS person's specific background gives them an edge.
7. Favor paths that leverage existing domain expertise over starting from scratch.
8. Account for financial obligations — minimize income gap, prefer moonlight-first strategies when possible.
9. Include at least one "start this week" action in keyActions — something concrete they can do TODAY (sign up for X, email Y, read Z).
10. Address the biggest risk with a concrete fallback in financialConsiderations.

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
}
