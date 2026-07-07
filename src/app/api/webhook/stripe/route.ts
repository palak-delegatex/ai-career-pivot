import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";
import { PostHog } from "posthog-node";

// Emit the terminal revenue event server-side, from the one place a payment is
// authoritatively known to have completed (checkout.session.completed). The
// client-side payment_verified on /checkout/success is best-effort and drops
// silently on adblock, redirect failure, or tab-close-after-pay — which is why
// the funnel showed 0 payment_verified for the app's entire history (AIC-739).
// distinctId prefers the browser's PostHog id (threaded via session metadata)
// so this stitches onto the same person who fired checkout_started; it falls
// back to email, then the session id. Best-effort: never let telemetry failure
// affect the webhook 200 (Stripe would otherwise retry the whole webhook).
async function trackPaymentVerified(props: {
  distinctId: string;
  sessionId: string;
  plan: string;
  amountCents: number | null;
  email: string | null;
  paymentIntent: string | null;
  subscriptionId: string | null;
}) {
  const token = process.env.NEXT_PUBLIC_POSTHOG_PROJECT_TOKEN;
  if (!token) return;
  try {
    const ph = new PostHog(token, {
      host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
      flushAt: 1,
    });
    ph.capture({
      distinctId: props.distinctId,
      event: "payment_verified",
      properties: {
        session_id: props.sessionId,
        plan: props.plan,
        amount_cents: props.amountCents,
        email: props.email,
        stripe_payment_intent: props.paymentIntent,
        stripe_subscription_id: props.subscriptionId,
        source: "stripe_webhook",
      },
    });
    await ph.shutdown();
  } catch (err) {
    console.error("Failed to capture payment_verified event:", err);
  }
}

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

    const meta = (session.metadata ?? {}) as Record<string, string>;
    const email = session.customer_email ?? meta.email ?? null;
    const distinctId =
      (meta.posthog_distinct_id && meta.posthog_distinct_id.length > 0
        ? meta.posthog_distinct_id
        : null) ??
      email ??
      session.id;

    await trackPaymentVerified({
      distinctId,
      sessionId: session.id,
      plan: meta.plan ?? "unknown",
      amountCents: session.amount_total ?? null,
      email,
      paymentIntent,
      subscriptionId,
    });
  }

  return NextResponse.json({ received: true });
}
