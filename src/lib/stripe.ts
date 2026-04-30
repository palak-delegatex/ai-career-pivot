import Stripe from "stripe";

let cached: Stripe | null = null;

export function getStripe(): Stripe {
  if (cached) return cached;
  const key = process.env.STRIPE_SECRET_KEY;
  if (!key) throw new Error("STRIPE_SECRET_KEY is not set");
  cached = new Stripe(key);
  return cached;
}

export const EARLY_ACCESS_PRICE_CENTS = 900;
export const EARLY_ACCESS_ANCHOR_CENTS = 2900;
export const EARLY_ACCESS_CURRENCY = "usd";
export const EARLY_ACCESS_PRODUCT_NAME = "AICareerPivot — Personalized Career Roadmap (Early Access)";
