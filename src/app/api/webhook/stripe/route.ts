import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { recordPaidSession } from "@/lib/paid-orders";
import { trackServerJourney } from "@/lib/journey-server";

export async function POST(req: NextRequest) {
  const signature = req.headers.get("stripe-signature");
  if (!signature || !process.env.STRIPE_WEBHOOK_KEY) return NextResponse.json({ error: "missing signature" }, { status: 400 });
  let event;
  try {
    event = getStripeClient().webhooks.constructEvent(await req.text(), signature, process.env.STRIPE_WEBHOOK_KEY);
  } catch { return NextResponse.json({ error: "invalid signature" }, { status: 400 }); }
  try {
    if (event.type === "checkout.session.completed" || event.type === "checkout.session.async_payment_succeeded") {
      await recordPaidSession(event.data.object);
    }
    if (event.type === "charge.refunded") {
      const charge = event.data.object;
      await trackServerJourney("payment_refunded", charge.id, {
        amount_refunded_cents: charge.amount_refunded,
      }, "refund:" + event.id);
    }
    return NextResponse.json({ received: true });
  } catch {
    console.error("Payment webhook persistence failed", { event_type: event.type });
    return NextResponse.json({ error: "payment persistence unavailable" }, { status: 503 });
  }
}
