import Stripe from "stripe";

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export type PlanKey = "report" | "lifetime" | "report_monthly" | "report_annual";

export const PLANS: Record<
  PlanKey,
  {
    amount: number;
    label: string;
    description: string;
    mode: "payment" | "subscription";
    recurring?: { interval: "month" | "year" };
    // Displayed on the pricing page when this plan is the annual anchor
    effectiveMonthly?: number;
  }
> = {
  report: {
    amount: 1900,
    label: "Career Pivot Report — Intro Pricing",
    description:
      "Personalized AI career pivot roadmap with certifications, 6-month, 1-year, and 2-year milestones",
    mode: "payment",
  },
  lifetime: {
    amount: 14900,
    label: "AICareerPivot Lifetime",
    description:
      "Lifetime access to all current and future features — one-time payment",
    mode: "payment",
  },
  // Pricing-cadence experiment variants (AIC-884 item 3). Uses inline price_data
  // so no Stripe dashboard objects needed. Flag: pricing-cadence → annual_anchored.
  report_monthly: {
    amount: 999,
    label: "AICareerPivot — Monthly",
    description:
      "Full AI career pivot roadmap, coaching, resume builder, and job board — billed monthly",
    mode: "subscription",
    recurring: { interval: "month" },
  },
  report_annual: {
    amount: 7900,
    label: "AICareerPivot — Annual (best value)",
    description:
      "Full AI career pivot roadmap, coaching, resume builder, and job board — billed annually",
    mode: "subscription",
    recurring: { interval: "year" },
    effectiveMonthly: 658,
  },
};

export const PRICES = {
  CAREER_REPORT: {
    amount: PLANS.report.amount,
    label: PLANS.report.label,
    description: PLANS.report.description,
  },
} as const;

export function isBypassEmail(email: string): boolean {
  const list = process.env.BYPASS_PAYMENT_EMAILS ?? "";
  if (!list) return false;
  const allowed = list.split(",").map((e) => e.trim().toLowerCase());
  return allowed.includes(email.trim().toLowerCase());
}
