import type { MarketData } from "./intake";
import { fetchMarketData } from "./market-data";

export interface NegotiationInput {
  role: string;
  location?: string;
  experienceYears: number;
  targetCompany?: string;
  userConstraintFloor?: number;
  offerAmount?: number;
}

export interface NegotiationRange {
  low: number;
  high: number;
}

export interface OfferScorecard {
  salaryVsMarket: { score: number; label: string };
  salaryVsFloor: { score: number; label: string } | null;
  growthPotential: { score: number; label: string };
  overallScore: number;
  verdict: "strong" | "fair" | "below-market" | "below-floor";
}

export interface NegotiationResult {
  marketRange: { p25: number; p50: number; p75: number };
  recommendedAsk: number;
  negotiationRange: NegotiationRange;
  talkingPoints: string[];
  counterOfferEmail: string | null;
  offerScorecard: OfferScorecard | null;
  marketData: MarketData;
}

function experienceMultiplier(years: number): number {
  if (years <= 2) return 0.9;
  if (years <= 5) return 1.0;
  if (years <= 10) return 1.1;
  if (years <= 15) return 1.2;
  return 1.25;
}

function clamp(value: number, min: number, max: number): number {
  return Math.max(min, Math.min(max, value));
}

function buildTalkingPoints(
  market: MarketData,
  recommendedAsk: number,
  input: NegotiationInput
): string[] {
  const points: string[] = [];

  points.push(
    `Market data from ${market.source} shows the median salary for ${market.role} is $${market.salaryMedian.toLocaleString()}, with the 75th percentile at $${market.salaryP75.toLocaleString()}.`
  );

  if (input.experienceYears > 5) {
    points.push(
      `With ${input.experienceYears} years of experience, you're positioned above median — target the 60th–75th percentile range.`
    );
  }

  if (market.growthPercent && market.growthPercent >= 15) {
    points.push(
      `This role is projected to grow ${market.growthPercent}% (${market.growthLabel}), which strengthens your negotiating position — talent demand outpaces supply.`
    );
  }

  if (market.totalEmployment && market.totalEmployment > 500_000) {
    points.push(
      `With ${(market.totalEmployment / 1000).toFixed(0)}K+ employed nationally, the market is large — but specialized experience still commands a premium.`
    );
  }

  points.push(
    `Your recommended ask of $${recommendedAsk.toLocaleString()} is data-backed. Lead with the value you bring, then anchor to market data if pressed.`
  );

  if (input.targetCompany) {
    points.push(
      `When negotiating with ${input.targetCompany}, research their typical compensation bands on Levels.fyi or Glassdoor to calibrate expectations for that specific employer.`
    );
  }

  return points;
}

function scoreOffer(
  offerAmount: number,
  market: MarketData,
  constraintFloor: number | undefined
): OfferScorecard {
  const marketRatio = offerAmount / market.salaryMedian;
  let marketScore: number;
  let marketLabel: string;

  if (marketRatio >= 1.15) {
    marketScore = 95;
    marketLabel = "Well above market median";
  } else if (marketRatio >= 1.0) {
    marketScore = 80;
    marketLabel = "At or above market median";
  } else if (marketRatio >= 0.9) {
    marketScore = 60;
    marketLabel = "Slightly below market median";
  } else {
    marketScore = 35;
    marketLabel = "Significantly below market";
  }

  let floorResult: OfferScorecard["salaryVsFloor"] = null;
  if (constraintFloor) {
    const floorRatio = offerAmount / constraintFloor;
    if (floorRatio >= 1.2) {
      floorResult = { score: 95, label: "Comfortably above your minimum" };
    } else if (floorRatio >= 1.0) {
      floorResult = { score: 70, label: "Above your minimum but with limited cushion" };
    } else {
      floorResult = { score: 20, label: "Below your stated minimum requirement" };
    }
  }

  const growthScore =
    market.growthPercent !== null
      ? clamp(Math.round(50 + market.growthPercent * 1.5), 30, 95)
      : 50;
  const growthLabel =
    market.growthPercent !== null && market.growthPercent >= 15
      ? "Strong demand growth supports future raises"
      : "Moderate growth outlook";

  const weights = floorResult
    ? { market: 0.45, floor: 0.35, growth: 0.2 }
    : { market: 0.6, floor: 0, growth: 0.4 };

  const overallScore = Math.round(
    marketScore * weights.market +
      (floorResult?.score ?? 0) * weights.floor +
      growthScore * weights.growth
  );

  let verdict: OfferScorecard["verdict"];
  if (floorResult && floorResult.score < 50) {
    verdict = "below-floor";
  } else if (marketScore < 50) {
    verdict = "below-market";
  } else if (overallScore >= 75) {
    verdict = "strong";
  } else {
    verdict = "fair";
  }

  return {
    salaryVsMarket: { score: marketScore, label: marketLabel },
    salaryVsFloor: floorResult,
    growthPotential: { score: growthScore, label: growthLabel },
    overallScore,
    verdict,
  };
}

function generateCounterOfferEmail(
  offerAmount: number,
  recommendedAsk: number,
  market: MarketData,
  input: NegotiationInput
): string {
  const company = input.targetCompany || "[Company]";
  const gap = recommendedAsk - offerAmount;
  const gapPercent = Math.round((gap / offerAmount) * 100);

  return `Subject: Re: Offer for ${input.role} Position

Dear [Hiring Manager],

Thank you for extending the offer for the ${input.role} position at ${company}. I'm genuinely excited about the opportunity and confident I can make a strong impact on the team.

After reviewing the offer and researching current market compensation, I'd like to discuss the base salary. The offer of $${offerAmount.toLocaleString()} is below the market median of $${market.salaryMedian.toLocaleString()} for this role, based on Bureau of Labor Statistics data.

Given my ${input.experienceYears} years of relevant experience${market.growthPercent && market.growthPercent >= 15 ? ` and the strong demand growth (${market.growthPercent}%) in this field` : ""}, I believe a base salary of $${recommendedAsk.toLocaleString()} would be more aligned with the value I'll bring — approximately ${gapPercent}% above the current offer.

I'm open to discussing the full compensation package, including any flexibility on benefits, equity, signing bonus, or other components. My goal is to find a number that reflects the market and sets us up for a productive long-term relationship.

I look forward to discussing this further.

Best regards,
[Your Name]`;
}

export async function analyzeSalaryNegotiation(
  input: NegotiationInput
): Promise<NegotiationResult | null> {
  const market = await fetchMarketData(input.role);
  if (!market) return null;

  const multiplier = experienceMultiplier(input.experienceYears);
  const adjustedMedian = Math.round(market.salaryMedian * multiplier);

  const recommendedAsk = Math.round(
    clamp(adjustedMedian * 1.05, market.salaryP25, market.salaryP90)
  );

  const constraintFloor = input.userConstraintFloor;
  const rangeLow = Math.max(
    Math.round(adjustedMedian * 0.95),
    constraintFloor ?? 0
  );
  const rangeHigh = Math.round(
    clamp(adjustedMedian * 1.15, market.salaryP75 * 0.95, market.salaryP90)
  );

  const talkingPoints = buildTalkingPoints(market, recommendedAsk, input);

  let counterOfferEmail: string | null = null;
  let offerScorecard: OfferScorecard | null = null;

  if (input.offerAmount) {
    offerScorecard = scoreOffer(input.offerAmount, market, constraintFloor);

    if (input.offerAmount < recommendedAsk) {
      counterOfferEmail = generateCounterOfferEmail(
        input.offerAmount,
        recommendedAsk,
        market,
        input
      );
    }
  }

  return {
    marketRange: {
      p25: market.salaryP25,
      p50: market.salaryMedian,
      p75: market.salaryP75,
    },
    recommendedAsk,
    negotiationRange: { low: rangeLow, high: rangeHigh },
    talkingPoints,
    counterOfferEmail,
    offerScorecard,
    marketData: market,
  };
}
