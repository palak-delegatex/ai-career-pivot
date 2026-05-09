import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, PRICES } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";

export async function POST(req: NextRequest) {
  const { email, discountCode } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const stripe = getStripeClient();
  const origin = req.headers.get("origin") ?? "https://ai-career-pivot.vercel.app";

  const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
    mode: "payment",
    customer_email: email,
    line_items: [
      {
        price_data: {
          currency: "usd",
          unit_amount: PRICES.CAREER_REPORT.amount,
          product_data: {
            name: PRICES.CAREER_REPORT.label,
            description: PRICES.CAREER_REPORT.description,
          },
        },
        quantity: 1,
      },
    ],
    success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
    cancel_url: `${origin}/pricing`,
    metadata: { email, discountCode: discountCode ?? "" },
  };

  if (discountCode) {
    try {
      const promos = await stripe.promotionCodes.list({
        code: discountCode,
        active: true,
        limit: 1,
      });
      if (promos.data.length > 0) {
        sessionParams.discounts = [{ promotion_code: promos.data[0].id }];
      }
    } catch {
      // Invalid code — proceed without discount
    }
  }

  const session = await stripe.checkout.sessions.create(sessionParams);

  const supabase = getSupabaseClient();
  await supabase.from("orders").insert({
    email,
    stripe_session_id: session.id,
    amount_cents: PRICES.CAREER_REPORT.amount,
    status: "pending",
    discount_code: discountCode ?? null,
  });

  return NextResponse.json({ url: session.url });
}
