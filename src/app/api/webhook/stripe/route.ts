import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient, getSupabaseAdmin } from "@/lib/supabase";
import { PostHog } from "posthog-node";

export async function POST(req: NextRequest) {
  const stripe = getStripeClient();
  const body = await req.text();
  const sig = req.headers.get("stripe-signature");

  if (!sig || !process.env.STRIPE_WEBHOOK_KEY) {
    return NextResponse.json({ error: "missing signature or secret" }, { status: 400 });
  }

  let event;
  try {
    event = stripe.webhooks.constructEvent(body, sig, process.env.STRIPE_WEBHOOK_KEY);
  } catch {
    return NextResponse.json({ error: "invalid signature" }, { status: 400 });
  }

  if (event.type === "checkout.session.completed") {
    const session = event.data.object;
    const supabase = getSupabaseClient();

    const paymentIntent =
      typeof session.payment_intent === "string"
        ? session.payment_intent
        : session.payment_intent?.id ?? null;

    const subscriptionId =
      typeof session.subscription === "string"
        ? session.subscription
        : session.subscription?.id ?? null;

    await supabase
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent: paymentIntent,
        stripe_subscription_id: subscriptionId,
      })
      .eq("stripe_session_id", session.id);

    const email = session.customer_email ?? session.metadata?.email;
    const planType = session.metadata?.plan ?? "report";
    if (email) {
      try {
        const admin = getSupabaseAdmin();

        const { data: existingPlan } = await admin
          .from("user_plans")
          .select("plan")
          .eq("email", email.toLowerCase())
          .single();

        const wasFreeTier = !existingPlan || existingPlan.plan === "free";

        await admin.from("user_plans").upsert(
          {
            email: email.toLowerCase(),
            plan: planType,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "email" }
        );

        if (wasFreeTier && process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN) {
          const ph = new PostHog(process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
            flushAt: 1,
          });
          ph.capture({
            distinctId: email.toLowerCase(),
            event: "free_to_paid_conversion",
            properties: {
              plan: planType,
              amount_cents: session.amount_total,
              source_feature: session.metadata?.source_feature ?? null,
            },
          });
          await ph.shutdown();
        }
      } catch (err) {
        console.error("Failed to update user_plans:", err);
      }
    }
  }

  return NextResponse.json({ received: true });
}
