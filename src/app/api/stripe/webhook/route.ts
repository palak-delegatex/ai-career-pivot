import { NextRequest } from "next/server";
import type Stripe from "stripe";
import { PostHog } from "posthog-node";
import { getStripe } from "@/lib/stripe";
import { recordPayment } from "@/lib/payments";

// Stripe signature verification needs the raw request body, so this route must
// run on the Node.js runtime — the Edge runtime can re-encode the bytes.
export const runtime = "nodejs";
export const dynamic = "force-dynamic";

export async function POST(req: NextRequest) {
  const secret = process.env.STRIPE_WEBHOOK_SECRET;
  if (!secret) {
    return new Response("Webhook secret not configured", { status: 500 });
  }

  const signature = req.headers.get("stripe-signature");
  if (!signature) {
    return new Response("Missing stripe-signature header", { status: 400 });
  }

  const rawBody = await req.text();
  const stripe = getStripe();

  let event: Stripe.Event;
  try {
    event = await stripe.webhooks.constructEventAsync(rawBody, signature, secret);
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    return new Response(`Webhook signature verification failed: ${message}`, { status: 400 });
  }

  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      const session = event.data.object as Stripe.Checkout.Session;

      if (session.payment_status === "paid") {
        const email = session.customer_details?.email ?? session.customer_email ?? null;

        if (!email) {
          return new Response("Session missing customer email", { status: 400 });
        }

        await recordPayment({
          stripe_session_id: session.id,
          stripe_payment_intent:
            typeof session.payment_intent === "string"
              ? session.payment_intent
              : session.payment_intent?.id ?? null,
          customer_email: email.toLowerCase(),
          amount_total: session.amount_total ?? 0,
          currency: session.currency ?? "usd",
          status: "paid",
          paid_at: new Date((event.created ?? Math.floor(Date.now() / 1000)) * 1000).toISOString(),
        });

        const posthogKey = process.env.NEXT_PUBLIC_POSTHOG_KEY;
        if (posthogKey) {
          const ph = new PostHog(posthogKey, {
            host: process.env.NEXT_PUBLIC_POSTHOG_HOST ?? "https://us.i.posthog.com",
          });
          ph.capture({
            distinctId: email.toLowerCase(),
            event: "purchase_completed",
            properties: {
              stripe_session_id: session.id,
              amount_total: session.amount_total ?? 0,
              currency: session.currency ?? "usd",
              source: "stripe_webhook",
            },
          });
          // serverless: must flush before the function returns or events are dropped
          await ph.shutdown();
        }
      }
    }
  } catch (err) {
    const message = err instanceof Error ? err.message : "Unknown error";
    console.error("Webhook handler error:", message);
    // Returning 500 tells Stripe to retry — important for at-least-once delivery.
    return new Response(`Webhook handler error: ${message}`, { status: 500 });
  }

  return new Response(JSON.stringify({ received: true }), {
    status: 200,
    headers: { "Content-Type": "application/json" },
  });
}
