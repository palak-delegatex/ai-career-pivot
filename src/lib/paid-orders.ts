import type Stripe from "stripe";
import { getSupabaseAdmin } from "./supabase";
import { getStripeClient } from "./stripe";
import { trackServerJourney } from "./journey-server";
import { safeAnalyticsId } from "./journey-events";

export type PaidOrder = {
  id: string; email: string; status: string; stripe_session_id: string;
  auth_user_id: string | null; report_id: string | null; plan_type: string;
};
export async function findOrder(sessionId: string): Promise<PaidOrder | null> {
  const { data, error } = await getSupabaseAdmin().from("orders")
    .select("id,email,status,stripe_session_id,auth_user_id,report_id,plan_type")
    .eq("stripe_session_id", sessionId).maybeSingle();
  if (error) throw new Error("order_read_failed");
  return data;
}

// Shared by the signed webhook and checkout verification. Never acknowledge
// a paid event before its recoverable order exists.
export async function recordPaidSession(session: Stripe.Checkout.Session): Promise<PaidOrder | null> {
  // Stripe completes a 100%-discounted purchase without a payment intent.
  // Do not grant an unpaid/unfinished checkout just because its amount is zero.
  const freeCompleted = session.payment_status === "no_payment_required" &&
    session.status === "complete" && session.amount_total === 0;
  if (session.payment_status !== "paid" && !freeCompleted) return null;
  const existing = await findOrder(session.id);
  const email = session.customer_email ?? session.customer_details?.email ?? session.metadata?.email;
  if (!email) throw new Error("payment_email_missing");
  if (existing && existing.email.toLowerCase() !== email.toLowerCase()) throw new Error("payment_owner_mismatch");
  const db = getSupabaseAdmin();
  if (!existing) {
    const { error } = await db.from("orders").upsert({
      email: email.toLowerCase(), stripe_session_id: session.id,
      status: "pending", amount_cents: session.amount_total ?? 0,
      currency: session.currency ?? "usd", plan_type: session.metadata?.plan ?? "report",
      auth_user_id: session.metadata?.auth_user_id || null,
    }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
    if (error) throw new Error("order_insert_failed");
  }
  const { data, error } = await db.from("orders").update({
    status: "paid", amount_cents: session.amount_total ?? 0, currency: session.currency ?? "usd",
    stripe_payment_intent: typeof session.payment_intent === "string" ? session.payment_intent : session.payment_intent?.id ?? null,
    stripe_subscription_id: typeof session.subscription === "string" ? session.subscription : session.subscription?.id ?? null,
  }).eq("stripe_session_id", session.id).select("id,email,status,stripe_session_id,auth_user_id,report_id,plan_type").single();
  if (error || !data) throw new Error("order_update_failed");
  await trackServerJourney("payment_verified", safeAnalyticsId(session.metadata?.posthog_distinct_id) ?? "order_" + data.id, {
    order_id: data.id, plan: data.plan_type, amount_cents: session.amount_total ?? 0,
    currency: session.currency ?? "usd",
  }, "payment:" + session.id);
  return data;
}

export async function verifyPaidOrder(sessionId: string): Promise<PaidOrder | null> {
  const order = await findOrder(sessionId);
  if (order?.status === "paid") return order;
  if (sessionId.startsWith("bypass_")) return null;
  return recordPaidSession(await getStripeClient().checkout.sessions.retrieve(sessionId));
}
