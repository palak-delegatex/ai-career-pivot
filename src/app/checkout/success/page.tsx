import { redirect } from "next/navigation";
import { getStripe } from "@/lib/stripe";
import { getPaidSession, recordPayment } from "@/lib/payments";

export const dynamic = "force-dynamic";

interface SuccessSearchParams {
  session_id?: string;
}

export default async function CheckoutSuccessPage({
  searchParams,
}: {
  searchParams: Promise<SuccessSearchParams>;
}) {
  const { session_id: sessionId } = await searchParams;

  if (!sessionId) {
    redirect("/checkout/cancel?reason=missing_session");
  }

  // The webhook is the source of truth, but it can lag a few seconds. Confirm with
  // Stripe directly here so the user is never bounced to the paywall on success.
  let paid = await getPaidSession(sessionId);
  if (!paid) {
    const stripe = getStripe();
    const session = await stripe.checkout.sessions.retrieve(sessionId);

    if (session.payment_status === "paid") {
      const email =
        session.customer_details?.email ??
        session.customer_email ??
        null;

      if (email) {
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
          paid_at: new Date().toISOString(),
        });
        paid = await getPaidSession(sessionId);
      }
    }
  }

  if (!paid) {
    redirect(`/checkout/cancel?reason=not_paid&session_id=${sessionId}`);
  }

  redirect(`/roadmap/${sessionId}`);
}
