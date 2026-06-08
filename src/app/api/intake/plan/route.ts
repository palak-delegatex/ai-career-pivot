import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamObject } from "ai";
import { jsonSchema } from "ai";
import type { UserProfile, ValuesAssessment } from "@/lib/intake";
import { getSupabaseClient } from "@/lib/supabase";
import { getStripeClient } from "@/lib/stripe";
import { scheduleMilestoneEmails } from "@/lib/milestone-emails";

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
                transferabilityScore: { type: "number" },
                transferCategory: { type: "string", enum: ["direct-transfer", "partial-transfer", "new-skill"] },
                transferNote: { type: "string" },
              },
              required: ["skill", "currentLevel", "requiredLevel", "priority", "resource", "transferabilityScore", "transferCategory", "transferNote"],
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
              milestoneSalaries: {
                type: "array",
                items: {
                  type: "object",
                  additionalProperties: false,
                  properties: {
                    phase: { type: "string", enum: ["6-month", "1-year", "2-year"] },
                    expectedSalaryRange: { type: "string" },
                    marketDemandLevel: { type: "string", enum: ["low", "moderate", "high", "very-high"] },
                    demandTrend: { type: "string" },
                  },
                  required: ["phase", "expectedSalaryRange", "marketDemandLevel", "demandTrend"],
                },
              },
            },
            required: ["currentSalaryRange", "targetSalaryRange", "salaryUpliftPercent", "transitionCosts", "roiTimeframe", "milestoneSalaries"],
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
          riskAssessments: {
            type: "array",
            items: {
              type: "object",
              additionalProperties: false,
              properties: {
                obstacle: { type: "string" },
                likelihood: { type: "number" },
                impact: { type: "string", enum: ["high", "medium", "low"] },
                timeframe: { type: "string" },
                category: { type: "string", enum: ["market", "skill", "financial", "personal", "industry"] },
                mitigationSteps: { type: "array", items: { type: "string" } },
              },
              required: ["obstacle", "likelihood", "impact", "timeframe", "category", "mitigationSteps"],
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
          "recommendedResources", "aiToolkit", "riskAssessments", "tradeoffs"],
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
  skillGaps: { skill: string; currentLevel: string; requiredLevel: string; priority: "high" | "medium" | "low"; resource?: string; transferabilityScore: number; transferCategory: "direct-transfer" | "partial-transfer" | "new-skill"; transferNote: string }[];
  weekOneActions: { title: string; instruction: string; timeEstimate: string; difficulty: "easy" | "medium" | "hard" }[];
  estimatedTimeToTransition: string;
  financialSummary: { currentSalaryRange: string; targetSalaryRange: string; salaryUpliftPercent: number; transitionCosts: string[]; roiTimeframe: string; milestoneSalaries: { phase: "6-month" | "1-year" | "2-year"; expectedSalaryRange: string; marketDemandLevel: "low" | "moderate" | "high" | "very-high"; demandTrend: string }[] };
  recommendedResources: { name: string; provider: string; type: string; url: string; cost: string; timeEstimate: string }[];
  aiToolkit: { tool: string; category: string; useCase: string; proficiencyNeeded: "beginner" | "intermediate" | "advanced" }[];
  riskAssessments: { obstacle: string; likelihood: number; impact: "high" | "medium" | "low"; timeframe: string; category: "market" | "skill" | "financial" | "personal" | "industry"; mitigationSteps: string[] }[];
  tradeoffs: { difficulty: "low" | "medium" | "high"; riskLevel: "low" | "medium" | "high"; timeToFirstRole: string; incomeImpactNear: string; incomePotentialLong: string; pros: string[]; cons: string[] };
};

export async function POST(req: NextRequest) {
  const { profile, paymentSessionId, valuesAssessment }: { profile: UserProfile; paymentSessionId?: string; valuesAssessment?: ValuesAssessment } = await req.json();

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

  let reportId: string | undefined;
  if (paymentSessionId) {
    const { data: report } = await supabase
      .from("reports")
      .insert({
        email: profile.email,
        profile,
        plans: [],
        ...(valuesAssessment ? { values_assessment: valuesAssessment } : {}),
      })
      .select("id")
      .single();

    if (report) {
      reportId = report.id;
      await supabase
        .from("orders")
        .update({ report_id: report.id })
        .eq("stripe_session_id", paymentSessionId);
    }
  }

  try {
  const result = streamObject({
    model: anthropic("claude-sonnet-4-6"),
    schema: pivotPlanJsonSchema,
    onFinish: async ({ object }) => {
      if (reportId && object) {
        await supabase
          .from("reports")
          .update({ plans: object.plans })
          .eq("id", reportId);

        const firstName = (profile.name ?? "").split(" ")[0] || "there";
        scheduleMilestoneEmails(
          supabase,
          reportId,
          profile.email,
          firstName,
          object.plans
        ).catch((err) => console.error("Milestone email scheduling error:", err));
      }
    },
    prompt: `You are an elite career strategist who has helped 500+ professionals execute mid-career pivots in the age of AI. You combine deep labor-market knowledge with practical transition planning, and you are obsessed with how AI is transforming every industry. Your core belief: professionals who master AI tools for their new role will out-earn and out-perform those who don't by 2-3x.

MARKET CONTEXT (June 2026): AI adoption is accelerating across all industries. Companies are actively hiring for AI-augmented roles. The window for early-mover advantage in AI-native positions is 12-18 months before saturation. Professionals who can demonstrate AI fluency alongside domain expertise are commanding 20-40% salary premiums.

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

RISK ASSESSMENT — REQUIRED FOR EVERY PLAN:
Each plan MUST include a riskAssessments array with 4-6 realistic obstacles this person will face during their pivot. For each risk:
- obstacle: a specific, concrete risk statement (not generic — reference their situation)
- likelihood: 0-100 probability of occurring
- impact: "high", "medium", or "low" — how severely it would derail the transition
- timeframe: when this risk is most relevant (e.g. "First 3 months", "Month 6-12", "Ongoing")
- category: one of "market" (job market/demand shifts), "skill" (capability gaps), "financial" (income/cost risks), "personal" (burnout, family, motivation), "industry" (sector-specific disruptions)
- mitigationSteps: 2-4 specific, actionable steps to reduce or eliminate the risk
Aim for variety across categories. Include at least one high-impact and one low-impact risk. Tailor risks to the user's specific circumstances (dependents, salary floor, risk tolerance, location).

RULES FOR EVERY FIELD:
1. matchScore (0-100): overall fit score considering skills, experience, market demand, AI-readiness, and transition difficulty. skillMatchPercent (0-100): percentage of required skills the user already has. Boost matchScore for paths where AI tools significantly lower the barrier to entry.
2. Each milestone string must start with a timing prefix and be specific + measurable. Format: "Week 1-2: [action]" for 6-month milestones, "Month 7-8: [action]" for 1-year milestones, "Month 13-15: [action]" for 2-year milestones. Each must be ≤18 words total. Include a clear deliverable or outcome (e.g. "Week 3-4: Complete Google Data Analytics Certificate Module 1-3" not "Learn data analytics"). At least 30% of milestones should involve AI tool adoption.
3. skillGaps: for each gap, specify the skill name, currentLevel (e.g. "none", "beginner", "intermediate"), requiredLevel (e.g. "intermediate", "advanced"), priority ("high"/"medium"/"low"), and optionally a resource (specific course or book name with provider). Include AI-specific skill gaps. TRANSFERABILITY SCORING: For every skill gap, also provide: transferabilityScore (0-100, how much of their existing experience applies), transferCategory ("direct-transfer" if the skill maps directly from their background, "partial-transfer" if related experience helps but retraining is needed, "new-skill" if they must learn from scratch), and transferNote (1 sentence explaining what from their background transfers and what's new). Example: a project manager pivoting to product management might have "Stakeholder Management" as direct-transfer (score: 90, "Your cross-functional PM experience maps directly"), "SQL/Data Analysis" as new-skill (score: 10, "Technical querying is new but your reporting instincts help"), "User Research" as partial-transfer (score: 55, "Your customer feedback loops translate; learn formal UX research methods").
4. weekOneActions: exactly 3 actions the user can start TODAY — not "this week", TODAY. Each has a short title, a detailed step-by-step instruction (be hyper-specific: include exact URLs, exact course names, exact tool names), a timeEstimate (e.g. "45 minutes", "2 hours"), and difficulty ("easy"/"medium"/"hard"). The FIRST action must be difficulty "easy" and completable in under 30 minutes — this is critical for momentum. At least one action must involve setting up an AI tool for their target role.
5. financialSummary: provide currentSalaryRange and targetSalaryRange as formatted ranges (e.g. "$85,000-$105,000"), salaryUpliftPercent as a number, transitionCosts as an array of line items (e.g. ["Google Data Analytics Certificate: $49/mo x 6 = $294", "Career coaching: $500"]), and roiTimeframe (e.g. "6-9 months after transition"). Note that many AI certifications and tools are free or low-cost, which reduces transition costs. MILESTONE SALARY FORECASTING: Also provide milestoneSalaries — an array of 3 objects (one per phase: "6-month", "1-year", "2-year") with: expectedSalaryRange (realistic range at that career stage, e.g. "$70,000-$85,000" during transition, growing toward target), marketDemandLevel ("low"/"moderate"/"high"/"very-high" for the role at that experience level), and demandTrend (1 sentence on market outlook, e.g. "AI product managers are seeing 25% YoY demand growth"). This creates a salary trajectory showing progression from current to target.
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
${valuesAssessment ? `
VALUES & PERSONALITY PROFILE:
- Work style preference: ${valuesAssessment.workStyle}
- Top values (ranked): ${valuesAssessment.topValues.join(", ")}
- Energy profile: ${Object.entries(valuesAssessment.energyProfile).map(([k, v]) => `${k}: ${v}/100`).join(", ")}
- Dealbreakers: ${valuesAssessment.dealbreakers.length > 0 ? valuesAssessment.dealbreakers.join(", ") : "None specified"}

VALUES-AWARE PLANNING: Factor the user's values, work style, and energy profile into every plan. Prioritize career paths that align with their top values. Avoid recommending roles that conflict with their dealbreakers. Match work environments to their energy profile (e.g. introvert-leaning users should see remote-friendly or small-team roles). Reference their specific values in rationale.` : ""}
Generate deeply personalized, immediately actionable plans. Reference their specific companies, skills, and experience by name. No filler.`,
  });

  return result.toTextStreamResponse({
    headers: {
      ...(reportId ? { "x-report-id": reportId } : {}),
    },
  });
  } catch (err) {
    console.error("Plan generation error:", err);
    return NextResponse.json(
      { error: "Failed to generate pivot plans. Please try again." },
      { status: 500 }
    );
  }
}
