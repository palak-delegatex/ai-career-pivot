import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";

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

    await supabase
      .from("orders")
      .update({
        status: "paid",
        stripe_payment_intent:
          typeof session.payment_intent === "string"
            ? session.payment_intent
            : session.payment_intent?.id ?? null,
      })
      .eq("stripe_session_id", session.id);
  }

  return NextResponse.json({ received: true });
}
