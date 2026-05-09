import Stripe from "stripe";

export function getStripeClient() {
  return new Stripe(process.env.STRIPE_SECRET_KEY!);
}

export const PRICES = {
  CAREER_REPORT: {
    amount: 2900,
    label: "Career Pivot Report",
    description:
      "Personalized AI career pivot roadmap with 6-month, 1-year, and 2-year milestones",
  },
} as const;
