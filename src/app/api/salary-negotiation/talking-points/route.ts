import { NextRequest } from "next/server";
import { anthropic } from "@ai-sdk/anthropic";
import { streamText } from "ai";
import { fetchMarketData } from "@/lib/market-data";

export async function POST(req: NextRequest) {
  const {
    targetRole,
    currentSalary,
    offerBase,
    offerEquity,
    offerBonus,
    yearsExperience,
    keySkills,
    uniqueValue,
    location,
  }: {
    targetRole: string;
    currentSalary?: number;
    offerBase?: number;
    offerEquity?: number;
    offerBonus?: number;
    yearsExperience?: number;
    keySkills?: string[];
    uniqueValue?: string;
    location?: string;
  } = await req.json();

  if (!targetRole) {
    return new Response(JSON.stringify({ error: "targetRole required" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  const marketData = await fetchMarketData(targetRole);

  const systemPrompt = `You are a salary negotiation expert helping a career-pivoter prepare talking points and a counter-offer strategy.

CANDIDATE PROFILE:
- Target role: ${targetRole}
${yearsExperience ? `- Years of experience: ${yearsExperience}` : ""}
${keySkills?.length ? `- Key skills: ${keySkills.join(", ")}` : ""}
${uniqueValue ? `- Unique value proposition: ${uniqueValue}` : ""}
${location ? `- Location: ${location}` : ""}
${currentSalary ? `- Current salary: $${currentSalary.toLocaleString()}` : ""}

${offerBase ? `CURRENT OFFER:
- Base: $${offerBase.toLocaleString()}
${offerEquity ? `- Equity: $${offerEquity.toLocaleString()}` : ""}
${offerBonus ? `- Bonus: $${offerBonus.toLocaleString()}` : ""}` : ""}

${marketData ? `MARKET DATA (BLS/OEWS):
- 25th percentile: $${marketData.salaryP25.toLocaleString()}
- Median: $${marketData.salaryMedian.toLocaleString()}
- 75th percentile: $${marketData.salaryP75.toLocaleString()}
- 90th percentile: $${marketData.salaryP90.toLocaleString()}` : ""}

Generate a comprehensive negotiation preparation document with these sections:

**Your Market Position**
Analyze where their offer/expectations fall relative to market data. Be specific with numbers.

**5 Strongest Talking Points**
Personalized arguments they can use, drawing from their skills, experience, and market data. Each should be a complete sentence they can say verbatim.

**Counter-Offer Strategy**
${offerBase ? "Specific suggested counter-offer with justification for each component (base, equity, bonus, benefits)." : "Recommended salary range to target with justification."}

**What to Say (Scripts)**
3 word-for-word scripts for key moments:
1. Opening the negotiation conversation
2. Responding to "that's the best we can do"
3. Closing/accepting gracefully while maximizing

**What NOT to Say**
3 common phrases to avoid and why.

**Negotiable Beyond Salary**
5 non-salary items to negotiate (remote work, signing bonus, PTO, title, review timeline) with suggested language.

Be specific, actionable, and data-driven. No generic advice — everything should reference their specific situation.`;

  const result = streamText({
    model: anthropic("claude-sonnet-4-6"),
    system: systemPrompt,
    messages: [{ role: "user", content: "Generate my personalized negotiation talking points and strategy." }],
  });

  return result.toTextStreamResponse();
}
