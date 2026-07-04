import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, PLANS, type PlanKey, isBypassEmail } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { PostHog } from "posthog-node";
import { randomUUID } from "crypto";

// Make order-persistence failures observable in PostHog rather than only in
// server logs, so a missing/rotated-invalid SUPABASE_SERVICE_ROLE_KEY (the
// AIC-436 class of bug) surfaces as a metric, not a silent gap. Best-effort:
// never let telemetry failure affect the checkout response.
async function trackOrderPersistFailed(props: {
  email: string;
  plan: string;
  reason: "missing_service_role_key" | "insert_error";
  error: string;
  stripeSessionId?: string;
}) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return;
  try {
    const ph = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
    });
    ph.capture({
      distinctId: props.email.toLowerCase(),
      event: "order_persist_failed",
      properties: {
        plan: props.plan,
        reason: props.reason,
        error: props.error,
        stripe_session_id: props.stripeSessionId ?? null,
      },
    });
    await ph.shutdown();
  } catch (err) {
    console.error("Failed to capture order_persist_failed event:", err);
  }
}

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
      let supabase;
      try {
        supabase = getSupabaseAdmin();
      } catch {
        console.error("Bypass order blocked: SUPABASE_SERVICE_ROLE_KEY is not configured");
        await trackOrderPersistFailed({
          email,
          plan: planKey,
          reason: "missing_service_role_key",
          error: "SUPABASE_SERVICE_ROLE_KEY is not configured",
        });
        return NextResponse.json(
          { error: "Server configuration error — please contact support" },
          { status: 500 }
        );
      }

      const bypassSessionId = `bypass_${randomUUID()}`;
      const { error: insertError } = await supabase.from("orders").insert({
        email,
        stripe_session_id: bypassSessionId,
        amount_cents: 0,
        status: "paid",
        discount_code: "TEAM_BYPASS",
        plan_type: planKey,
      });
      if (insertError) {
        console.error("Bypass order insert failed:", JSON.stringify(insertError));
        await trackOrderPersistFailed({
          email,
          plan: planKey,
          reason: "insert_error",
          error: JSON.stringify(insertError),
          stripeSessionId: bypassSessionId,
        });
        return NextResponse.json(
          { error: "Failed to create order — please try again or contact support" },
          { status: 500 }
        );
      }
      return NextResponse.json({
        url: `${origin}/checkout/success?session_id=${bypassSessionId}`,
      });
    }

    const stripe = getStripeClient();

    // Acquire the service-role client up front so a missing/invalid
    // SUPABASE_SERVICE_ROLE_KEY fails loud *before* we create a Stripe session
    // (avoids charging a customer whose order — and entitlement — we can't
    // persist). Mirrors the bypass path above.
    let supabase;
    try {
      supabase = getSupabaseAdmin();
    } catch {
      console.error("Paid order blocked: SUPABASE_SERVICE_ROLE_KEY is not configured");
      await trackOrderPersistFailed({
        email,
        plan: planKey,
        reason: "missing_service_role_key",
        error: "SUPABASE_SERVICE_ROLE_KEY is not configured",
      });
      return NextResponse.json(
        { error: "Server configuration error — please contact support" },
        { status: 500 }
      );
    }

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

    const { error: orderError } = await supabase.from("orders").insert({
      email,
      stripe_session_id: session.id,
      amount_cents: plan.amount,
      status: "pending",
      discount_code: discountCode ?? null,
      plan_type: planKey,
    });
    if (orderError) {
      // Don't block the paying customer: the Stripe webhook grants entitlement
      // via the user_plans upsert independently of this pending-order row. But
      // make the failure observable so it can't recur silently.
      console.error("Order insert failed (Stripe session created):", orderError);
      await trackOrderPersistFailed({
        email,
        plan: planKey,
        reason: "insert_error",
        error: JSON.stringify(orderError),
        stripeSessionId: session.id,
      });
    }

    return NextResponse.json({ url: session.url });
  } catch (err) {
    console.error("Checkout session creation failed:", err);
    const message = err instanceof Error ? err.message : "Checkout failed";
    return NextResponse.json({ error: message }, { status: 500 });
  }
}
