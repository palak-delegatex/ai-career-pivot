import { NextRequest, NextResponse } from "next/server";
import {
  getStripe,
  EARLY_ACCESS_PRICE_CENTS,
  EARLY_ACCESS_CURRENCY,
  EARLY_ACCESS_PRODUCT_NAME,
} from "@/lib/stripe";

export const runtime = "nodejs";

function getOrigin(req: NextRequest): string {
  const envOrigin = process.env.NEXT_PUBLIC_SITE_URL;
  if (envOrigin) return envOrigin.replace(/\/$/, "");
  const proto = req.headers.get("x-forwarded-proto") ?? "https";
  const host = req.headers.get("x-forwarded-host") ?? req.headers.get("host");
  return `${proto}://${host}`;
}

export async function POST(req: NextRequest) {
  let body: { email?: unknown; intakeId?: unknown };
  try {
    body = await req.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const email = typeof body.email === "string" ? body.email.trim().toLowerCase() : "";
  if (!email || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    return NextResponse.json({ error: "Valid email is required" }, { status: 400 });
  }

  const intakeId = typeof body.intakeId === "string" ? body.intakeId : undefined;
  const origin = getOrigin(req);

  const stripe = getStripe();
  const session = await stripe.checkout.sessions.create({
    mode: "payment",
    payment_method_types: ["card"],
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: EARLY_ACCESS_CURRENCY,
          unit_amount: EARLY_ACCESS_PRICE_CENTS,
          product_data: {
            name: EARLY_ACCESS_PRODUCT_NAME,
            description: "Personalized 6-month, 1-year, and 2-year career pivot roadmap.",
          },
        },
        quantity: 1,
      },
    ],
    // Stripe emails the receipt to this address on successful payment (also requires
    // "Successful payments" to be enabled under Customer emails in the Stripe dashboard).
    payment_intent_data: { receipt_email: email },
    metadata: intakeId ? { intake_id: intakeId } : undefined,
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/checkout/cancel`,
  });

  if (!session.url) {
    return NextResponse.json({ error: "Stripe did not return a checkout URL" }, { status: 500 });
  }

  return NextResponse.json({ url: session.url, id: session.id });
}
