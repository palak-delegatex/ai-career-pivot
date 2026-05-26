import Stripe from "stripe";

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export type PlanKey = "report" | "lifetime";

export const PLANS: Record<
  PlanKey,
  {
    amount: number;
    label: string;
    description: string;
    mode: "payment" | "subscription";
    recurring?: { interval: "month" };
  }
> = {
  report: {
    amount: 500,
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
};

export const PRICES = {
  CAREER_REPORT: {
    amount: PLANS.report.amount,
    label: PLANS.report.label,
    description: PLANS.report.description,
  },
} as const;
