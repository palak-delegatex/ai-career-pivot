import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, PLANS, type PlanKey, isBypassEmail } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";
import { randomUUID } from "crypto";

export async function POST(req: NextRequest) {
  const { email, discountCode, plan: planKey = "report" } = await req.json();

  if (!email) {
    return NextResponse.json({ error: "email required" }, { status: 400 });
  }

  const plan = PLANS[planKey as PlanKey];
  if (!plan) {
    return NextResponse.json({ error: "invalid plan" }, { status: 400 });
  }

  try {
    const origin = req.headers.get("origin") ?? "https://ai-career-pivot.vercel.app";

    if (isBypassEmail(email)) {
      const bypassSessionId = `bypass_${randomUUID()}`;
      const supabase = getSupabaseClient();
      await supabase.from("orders").insert({
        email,
        stripe_session_id: bypassSessionId,
        amount_cents: 0,
        status: "paid",
        discount_code: "TEAM_BYPASS",
        plan_type: planKey,
      });
      return NextResponse.json({
        url: `${origin}/checkout/success?session_id=${bypassSessionId}`,
      });
    }

    const stripe = getStripeClient();

    const priceData: Record<string, unknown> = {
      currency: "usd",
      unit_amount: plan.amount,
      product_data: {
        name: plan.label,
        description: plan.description,
      },
    };
    if (plan.recurring) {
      priceData.recurring = plan.recurring;
    }

    const sessionParams: Parameters<typeof stripe.checkout.sessions.create>[0] = {
      mode: plan.mode,
      customer_email: email,
      line_items: [{ price_data: priceData as never, quantity: 1 }],
      success_url: `${origin}/checkout/success?session_id={CHECKOUT_SESSION_ID}`,
      cancel_url: `${origin}/pricing`,
      metadata: { email, plan: planKey, discountCode: discountCode ?? "" },
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
      amount_cents: plan.amount,
      status: "pending",
      discount_code: discountCode ?? null,
      plan_type: planKey,
    });

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
