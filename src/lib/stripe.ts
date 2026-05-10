import Stripe from "stripe";

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export type PlanKey = "report" | "monthly" | "lifetime";

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
    amount: 2900,
    label: "Career Pivot Report",
    description:
      "Personalized AI career pivot roadmap with 6-month, 1-year, and 2-year milestones",
    mode: "payment",
  },
  monthly: {
    amount: 2900,
    label: "AICareerPivot Pro",
    description:
      "Unlimited report updates, AI certifications roadmap, and ongoing career coaching",
    mode: "subscription",
    recurring: { interval: "month" },
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
