import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateObject } from "ai";
import { jsonSchema } from "ai";
import type { UserProfile } from "@/lib/intake";
import { getSupabaseClient } from "@/lib/supabase";
import { getStripeClient } from "@/lib/stripe";

const pivotPlanJsonSchema = jsonSchema<{ plans: PivotPlan[] }>({
  type: "object",
  additionalProperties: false,
  properties: {
    plans: {
      type: "array",
      items: {
        type: "object",
        additionalProperties: false,
        properties: {
          targetRole: { type: "string" },
          targetIndustry: { type: "string" },
          rationale: { type: "string" },
          matchScore: { type: "number" },
          skillMatchPercent: { type: "number" },
          sixMonthMilestones: { type: "array", items: { type: "string" } },
          oneYearMilestones: { type: "array", items: { type: "string" } },
          twoYearMilestones: { type: "array", items: { type: "string" } },
          skillGaps: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                skill: { type: "string" },
                currentLevel: { type: "string" },
                requiredLevel: { type: "string" },
                priority: { type: "string", enum: ["high", "medium", "low"] },
                resource: { type: "string" },
              },
              required: ["skill", "currentLevel", "requiredLevel", "priority", "resource"],
            },
          },
          weekOneActions: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                title: { type: "string" },
                instruction: { type: "string" },
                timeEstimate: { type: "string" },
                difficulty: { type: "string", enum: ["easy", "medium", "hard"] },
              },
              required: ["title", "instruction", "timeEstimate", "difficulty"],
            },
          },
          estimatedTimeToTransition: { type: "string" },
          financialSummary: {
            type: "object",
            additionalProperties: false,
            properties: {
              currentSalaryRange: { type: "string" },
              targetSalaryRange: { type: "string" },
              salaryUpliftPercent: { type: "number" },
              transitionCosts: { type: "array", items: { type: "string" } },
              roiTimeframe: { type: "string" },
            },
            required: ["currentSalaryRange", "targetSalaryRange", "salaryUpliftPercent", "transitionCosts", "roiTimeframe"],
          },
          recommendedResources: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                name: { type: "string" },
                provider: { type: "string" },
                type: { type: "string" },
                url: { type: "string" },
                cost: { type: "string" },
                timeEstimate: { type: "string" },
              },
              required: ["name", "provider", "type", "url", "cost", "timeEstimate"],
            },
          },
          aiToolkit: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                tool: { type: "string" },
                category: { type: "string" },
                useCase: { type: "string" },
                proficiencyNeeded: { type: "string", enum: ["beginner", "intermediate", "advanced"] },
              },
              required: ["tool", "category", "useCase", "proficiencyNeeded"],
            },
          },
          tradeoffs: {
            type: "object",
            additionalProperties: false,
            properties: {
              difficulty: { type: "string", enum: ["low", "medium", "high"] },
              riskLevel: { type: "string", enum: ["low", "medium", "high"] },
              timeToFirstRole: { type: "string" },
              incomeImpactNear: { type: "string" },
              incomePotentialLong: { type: "string" },
              pros: { type: "array", items: { type: "string" } },
              cons: { type: "array", items: { type: "string" } },
            },
            required: ["difficulty", "riskLevel", "timeToFirstRole", "incomeImpactNear", "incomePotentialLong", "pros", "cons"],
          },
        },
        required: ["targetRole", "targetIndustry", "rationale", "matchScore", "skillMatchPercent",
          "sixMonthMilestones", "oneYearMilestones", "twoYearMilestones", "skillGaps",
          "weekOneActions", "estimatedTimeToTransition", "financialSummary",
          "recommendedResources", "aiToolkit", "tradeoffs"],
      },
    },
  },
  required: ["plans"],
});

type PivotPlan = {
  targetRole: string;
  targetIndustry: string;
  rationale: string;
  matchScore: number;
  skillMatchPercent: number;
  sixMonthMilestones: string[];
  oneYearMilestones: string[];
  twoYearMilestones: string[];
  skillGaps: { skill: string; currentLevel: string; requiredLevel: string; priority: "high" | "medium" | "low"; resource?: string }[];
  weekOneActions: { title: string; instruction: string; timeEstimate: string; difficulty: "easy" | "medium" | "hard" }[];
  estimatedTimeToTransition: string;
  financialSummary: { currentSalaryRange: string; targetSalaryRange: string; salaryUpliftPercent: number; transitionCosts: string[]; roiTimeframe: string };
  recommendedResources: { name: string; provider: string; type: string; url: string; cost: string; timeEstimate: string }[];
  aiToolkit: { tool: string; category: string; useCase: string; proficiencyNeeded: "beginner" | "intermediate" | "advanced" }[];
  tradeoffs: { difficulty: "low" | "medium" | "high"; riskLevel: "low" | "medium" | "high"; timeToFirstRole: string; incomeImpactNear: string; incomePotentialLong: string; pros: string[]; cons: string[] };
};

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
      if (paymentSessionId.startsWith("bypass_")) {
        return NextResponse.json({ error: "payment not verified" }, { status: 402 });
      }
      // Webhook may not have fired yet. Fall back to checking Stripe directly.
      try {
        const stripe = getStripeClient();
        const session = await stripe.checkout.sessions.retrieve(paymentSessionId);
        if (session.payment_status !== "paid") {
          return NextResponse.json({ error: "payment not verified" }, { status: 402 });
        }
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
  const { object } = await generateObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: pivotPlanJsonSchema,
    prompt: `You are an elite career strategist who has helped 500+ professionals execute mid-career pivots in the age of AI. You combine deep labor-market knowledge with practical transition planning, and you are obsessed with how AI is transforming every industry. Your core belief: professionals who master AI tools for their new role will out-earn and out-perform those who don't by 2-3x.

Generate 2-3 career pivot plans for this professional, ranked by matchScore (0-100, how well their background fits the target). Each plan must feel like it was written by a personal advisor who studied their background — never generic. Each plan MUST include a tradeoffs object with: difficulty ("low"/"medium"/"high"), riskLevel ("low"/"medium"/"high"), timeToFirstRole (e.g. "8-12 months"), incomeImpactNear (e.g. "-10% for 6 months"), incomePotentialLong (e.g. "+40% within 2 years"), pros (3-5 specific advantages for this person), cons (2-4 honest drawbacks). Make tradeoffs comparison-ready so the user can pick the best path for their situation.

CRITICAL — AI-NATIVE STRATEGY:
Every plan must be AI-native. This means:
- The rationale MUST explain how AI is reshaping the target role/industry and why pivoting NOW gives a first-mover advantage before the market catches up.
- Milestones MUST include specific AI tool adoption and AI skill-building steps (e.g. "Build first AI-assisted workflow using Claude for [specific task]", "Complete Anthropic AI Fluency certification", "Ship internal AI agent that automates [process]").
- skillGaps MUST include at least 1-2 AI-specific skills relevant to the target role (e.g. "AI prompt engineering", "AI workflow automation", "LLM integration", "AI-assisted data analysis", "AI content generation", "AI agent development"). Set appropriate currentLevel/requiredLevel based on the user's background.
- weekOneActions MUST include at least one AI-related action (e.g. "Set up Claude/ChatGPT workspace for [target role] tasks", "Complete Anthropic AI Fluency course (free, 3-4 hours)").
- recommendedResources MUST include at least 2 AI-specific resources. Prioritize: Anthropic AI Fluency (free), Google AI Essentials, AWS AI Practitioner, relevant AI certifications for the target industry.
- aiToolkit: provide 4-6 specific AI tools the user should master for the target role. For each tool, specify: the tool name (e.g. "Claude", "ChatGPT", "Midjourney", "GitHub Copilot", "Cursor", "v0", "Jasper", "Notion AI", "Runway", "Descript", "HubSpot AI", "Salesforce Einstein"), category (e.g. "AI coding assistant", "AI writing & analysis", "AI design", "AI video", "AI sales intelligence"), useCase describing exactly how they'd use it daily in the target role, and proficiencyNeeded ("beginner"/"intermediate"/"advanced").

Frame AI as a career multiplier, not a threat. The narrative should be: "You + AI tools = a professional who delivers 3x the output of someone who doesn't use AI."

RULES FOR EVERY FIELD:
1. matchScore (0-100): overall fit score considering skills, experience, market demand, AI-readiness, and transition difficulty. skillMatchPercent (0-100): percentage of required skills the user already has. Boost matchScore for paths where AI tools significantly lower the barrier to entry.
2. Each milestone string must be ≤15 words. Make them measurable and specific. At least 30% of milestones across all timeframes should involve AI tool adoption or AI skill development.
3. skillGaps: for each gap, specify the skill name, currentLevel (e.g. "none", "beginner", "intermediate"), requiredLevel (e.g. "intermediate", "advanced"), priority ("high"/"medium"/"low"), and optionally a resource (specific course or book name with provider). Include AI-specific skill gaps.
4. weekOneActions: exactly 3 actions the user can start THIS WEEK. Each has a short title, a detailed instruction, a timeEstimate (e.g. "2 hours", "30 minutes"), and difficulty ("easy"/"medium"/"hard"). Prioritize easy wins first. At least one action must involve trying an AI tool relevant to the target career.
5. financialSummary: provide currentSalaryRange and targetSalaryRange as formatted ranges (e.g. "$85,000-$105,000"), salaryUpliftPercent as a number, transitionCosts as an array of line items (e.g. ["Google Data Analytics Certificate: $49/mo x 6 = $294", "Career coaching: $500"]), and roiTimeframe (e.g. "6-9 months after transition"). Note that many AI certifications and tools are free or low-cost, which reduces transition costs.
6. recommendedResources: 3-5 specific resources with name, provider, type (e.g. "course", "certification", "book", "community"), url, cost (e.g. "$49/mo", "Free"), and timeEstimate (e.g. "40 hours", "6 weeks"). At least 2 must be AI-related.
7. rationale must reference how AI is transforming the target industry, current market conditions, and explain why THIS person's specific background combined with AI tools gives them a unique edge.
8. Favor paths that leverage existing domain expertise combined with AI tools over starting from scratch.
9. Account for financial obligations — minimize income gap, prefer moonlight-first strategies when possible. Highlight that AI tools can accelerate the transition by automating ramp-up tasks.
10. estimatedTimeToTransition must reflect realistic timelines for a working professional using AI tools to accelerate learning, not someone studying full-time.

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
${profile.location ? `- Location: ${[profile.location.city, profile.location.region, profile.location.country].filter(Boolean).join(", ")}` : ""}
${profile.circumstances?.salaryFloor ? `- Minimum salary requirement: ${profile.circumstances.salaryFloor}` : ""}
${profile.circumstances?.dependents ? `- Dependents: ${profile.circumstances.dependents}` : ""}
${profile.circumstances?.timeline ? `- Desired transition timeline: ${profile.circumstances.timeline}` : ""}
${profile.circumstances?.riskTolerance ? `- Risk tolerance: ${profile.circumstances.riskTolerance}` : ""}
${profile.circumstances?.willingnessToRelocate ? `- Relocation: ${profile.circumstances.willingnessToRelocate}` : ""}

${profile.location || profile.circumstances ? `CONSTRAINT-AWARE PLANNING: If the user provided location, salary, timeline, dependents, risk tolerance, or relocation preferences, you MUST factor these into every plan. Salary ranges must respect the salary floor. Timelines must match their preferred pace. Risk-averse users need moonlight-first strategies. Location-bound users need local or remote job market data. Reference their specific constraints in rationale and milestones.` : ""}
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
