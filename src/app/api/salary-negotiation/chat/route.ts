import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { fetchMarketData } from "@/lib/market-data";

export async function POST(req: NextRequest) {
  const {
    targetRole,
    scenario = "initial_offer",
    currentSalary,
    offerDetails,
    messages,
  }: {
    targetRole: string;
    scenario?: "initial_offer" | "counter_offer" | "competing_offers" | "equity_negotiation";
    currentSalary?: number;
    offerDetails?: {
      base?: number;
      equity?: number;
      bonus?: number;
      benefits?: string;
    };
    messages: { role: "user" | "assistant"; content: string }[];
  } = await req.json();

  if (!targetRole || !messages) {
    return new Response(JSON.stringify({ error: "targetRole and messages required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const marketData = await fetchMarketData(targetRole);

  const systemPrompt = buildNegotiationPrompt(
    targetRole,
    scenario,
    currentSalary,
    offerDetails,
    marketData
  );

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages,
  });

  return result.toTextStreamResponse();
}

function buildNegotiationPrompt(
  targetRole: string,
  scenario: string,
  currentSalary?: number,
  offerDetails?: { base?: number; equity?: number; bonus?: number; benefits?: string },
  marketData?: { salaryMedian?: number; salaryP25?: number; salaryP75?: number; salaryP90?: number } | null
): string {
  const scenarioDescriptions: Record<string, string> = {
    initial_offer: "The candidate just received an initial job offer and needs to respond strategically.",
    counter_offer: "The candidate wants to make a counter-offer after receiving a job offer.",
    competing_offers: "The candidate has multiple offers and wants to leverage them in negotiation.",
    equity_negotiation: "The candidate wants to negotiate equity/stock compensation specifically.",
  };

  const marketContext = marketData
    ? `\nMARKET SALARY DATA (BLS/OEWS for ${targetRole}):
- 25th percentile: $${marketData.salaryP25?.toLocaleString()}
- Median: $${marketData.salaryMedian?.toLocaleString()}
- 75th percentile: $${marketData.salaryP75?.toLocaleString()}
- 90th percentile: $${marketData.salaryP90?.toLocaleString()}
Use these numbers to ground your responses in real data.`
    : "";

  const offerContext = offerDetails
    ? `\nCANDIDATE'S CURRENT OFFER:
${offerDetails.base ? `- Base salary: $${offerDetails.base.toLocaleString()}` : ""}
${offerDetails.equity ? `- Equity: $${offerDetails.equity.toLocaleString()}` : ""}
${offerDetails.bonus ? `- Bonus: $${offerDetails.bonus.toLocaleString()}` : ""}
${offerDetails.benefits ? `- Benefits: ${offerDetails.benefits}` : ""}`
    : "";

  const currentSalaryContext = currentSalary
    ? `\nCandidate's current salary: $${currentSalary.toLocaleString()}`
    : "";

  return `You are a hiring manager at a top company conducting a realistic salary negotiation role-play for a ${targetRole} position. You should simulate how a real hiring manager would respond during compensation negotiations.

SCENARIO: ${scenarioDescriptions[scenario] || scenarioDescriptions.initial_offer}
${marketContext}${offerContext}${currentSalaryContext}

YOUR BEHAVIOR AS THE HIRING MANAGER:
- Be realistic — not a pushover, but not unreasonable. Real hiring managers have budget constraints.
- Start with a reasonable offer based on market data (if this is the beginning), or respond to the candidate's counter.
- Push back on unreasonable requests but be open to justified ones.
- Use phrases real hiring managers use: "Let me see what I can do", "The budget for this role is...", "I can't move on base but maybe on signing bonus..."
- When the candidate makes a strong argument backed by data or unique value, acknowledge it and adjust.
- If the candidate is too passive or accepts immediately, gently note they could have negotiated better.

COACHING EMBEDDED IN THE ROLE-PLAY:
- After each exchange (in parentheses or after a line break), give a brief 1-2 sentence coach's note on what they did well or could improve.
- Flag common mistakes: accepting too quickly, apologizing for negotiating, failing to quantify their value, not having a walkaway number.
- Reference market data when relevant to help them understand their position.

IMPORTANT:
- Stay in character as the hiring manager for the dialogue portions.
- Keep responses concise — one hiring manager response + one coach's note per turn.
- If the candidate asks for advice directly (breaking the role-play), switch to coach mode and give strategic advice, then offer to resume the role-play.`;
}
