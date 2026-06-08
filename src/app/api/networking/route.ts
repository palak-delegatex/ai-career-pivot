import { NextRequest, NextResponse } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { generateText, Output } from "ai";
import { z } from "zod";

const NetworkingSchema = z.object({
  communities: z.array(
    z.object({
      name: z.string(),
      platform: z.string(),
      url: z.string(),
      memberCount: z.string(),
      relevance: z.string(),
      freeOrPaid: z.enum(["free", "paid", "freemium"]),
    })
  ),
  events: z.array(
    z.object({
      name: z.string(),
      type: z.enum(["conference", "meetup", "webinar", "workshop", "hackathon"]),
      frequency: z.string(),
      url: z.string(),
      cost: z.string(),
      relevance: z.string(),
    })
  ),
  mentorship: z.array(
    z.object({
      platform: z.string(),
      url: z.string(),
      cost: z.string(),
      description: z.string(),
    })
  ),
  professionalAssociations: z.array(
    z.object({
      name: z.string(),
      url: z.string(),
      membershipCost: z.string(),
      benefits: z.string(),
    })
  ),
  actionPlan: z.object({
    weekOne: z.array(z.string()),
    monthOne: z.array(z.string()),
    quarterOne: z.array(z.string()),
  }),
});

export type NetworkingResult = z.infer<typeof NetworkingSchema>;

export async function POST(req: NextRequest) {
  const {
    targetRole,
    targetIndustry,
    location,
    currentRole,
  }: {
    targetRole: string;
    targetIndustry?: string;
    location?: string;
    currentRole?: string;
  } = await req.json();

  if (!targetRole) {
    return NextResponse.json(
      { error: "targetRole is required" },
      { status: 400 }
    );
  }

  try {
    const { output } = await generateText({
      model: anthropic("claude-sonnet-4-6"),
      output: Output.object({ schema: NetworkingSchema }),
      prompt: `You are a career networking advisor specializing in career pivots. Recommend specific networking resources for someone transitioning into a ${targetRole} role.

${targetIndustry ? `Target industry: ${targetIndustry}` : ""}
${currentRole ? `Current role: ${currentRole} (career pivoter)` : ""}
${location ? `Location: ${location}` : ""}

Provide REAL, specific recommendations:

1. COMMUNITIES (5-8): LinkedIn groups, Slack communities, Discord servers, Reddit communities, and professional forums relevant to ${targetRole}. Use actual community names and URLs.

2. EVENTS (4-6): Conferences, meetups, webinars, and workshops relevant to the target role. Include both virtual and in-person options.

3. MENTORSHIP (3-4): Platforms where they can find mentors in their target field (ADPList, MentorCruise, Plato, industry-specific platforms).

4. PROFESSIONAL ASSOCIATIONS (3-4): Industry associations and professional organizations relevant to ${targetRole}.

5. ACTION PLAN: Specific networking actions for week 1 (quick wins), month 1 (building presence), and quarter 1 (establishing credibility).

Focus on resources that are particularly valuable for CAREER PIVOTERS — communities that welcome newcomers, events with learning tracks, mentors who specialize in transitions.`,
    });

    if (!output) {
      return NextResponse.json(
        { error: "Could not generate recommendations" },
        { status: 422 }
      );
    }

    return NextResponse.json(output);
  } catch (err) {
    console.error("Networking recommendations error:", err);
    return NextResponse.json(
      { error: "Failed to generate recommendations" },
      { status: 500 }
    );
  }
}
