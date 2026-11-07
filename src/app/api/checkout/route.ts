import { NextRequest, NextResponse } from "next/server";
import { getStripeClient, PLANS, type PlanKey, isBypassEmail } from "@/lib/stripe";
import { getSupabaseAdmin } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { trackServerJourney } from "@/lib/journey-server";
import { safeAnalyticsId } from "@/lib/journey-events";
import { ORDER_COOKIE, ORDER_ACCESS_SECONDS, signOrderAccess } from "@/lib/order-access";
import { createHash, randomUUID } from "node:crypto";

export async function POST(req: NextRequest) {
  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: "Invalid request" }, { status: 400 }); }
  if (!body || typeof body !== "object") return NextResponse.json({ error: "Invalid request" }, { status: 400 });
  const email = typeof body.email === "string" ? body.email.toLowerCase().trim() : "";
  const planKey = body.plan ?? "report";
  const plan = typeof planKey === "string" && Object.prototype.hasOwnProperty.call(PLANS, planKey) ? PLANS[planKey as PlanKey] : undefined;
  const discount = typeof body.discountCode === "string" ? body.discountCode.trim().slice(0, 100) : "";
  if (typeof planKey !== "string" || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) || email.length > 254 || !plan) {
    return NextResponse.json({ error: "Enter a valid email and plan." }, { status: 400 });
  }
  const distinctId = safeAnalyticsId(body.posthogDistinctId);
  const attempt = typeof body.checkoutAttemptId === "string" && /^[a-f0-9-]{36}$/i.test(body.checkoutAttemptId)
    ? body.checkoutAttemptId : randomUUID();
  // Stable across network retries; email/plan/discount bind the key to its input.
  const idempotencyKey = createHash("sha256").update(JSON.stringify([attempt, email, planKey, discount])).digest("hex");
  try {
    const db = getSupabaseAdmin();
    const signingKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;
    const auth = await getSupabaseServerClient();
    const { data: { user } } = await auth.auth.getUser();
    const authUserId = user && user.email?.toLowerCase() === email ? user.id : null;
    const origin = req.nextUrl.origin; // Never trust a caller-supplied Origin header.
    let sessionId: string;
    let url: string;
    let bypass = false;
    if (authUserId && isBypassEmail(email)) {
      bypass = true;
      sessionId = "bypass_" + idempotencyKey;
      url = origin + "/checkout/success?session_id=" + sessionId;
    } else {
      const stripe = getStripeClient();
      const params: Parameters<typeof stripe.checkout.sessions.create>[0] = {
        mode: plan.mode, customer_email: email,
        line_items: [{ quantity: 1, price_data: {
          currency: "usd", unit_amount: plan.amount,
          product_data: { name: plan.label, description: plan.description },
          ...(plan.recurring ? { recurring: plan.recurring } : {}),
        } }],
        success_url: origin + "/checkout/success?session_id={CHECKOUT_SESSION_ID}",
        cancel_url: origin + "/pricing",
        metadata: { plan: planKey, discountCode: discount, money_back_guarantee: "30_day", posthog_distinct_id: distinctId ?? "", auth_user_id: authUserId ?? "" },
      };
      if (discount) {
        const promos = await stripe.promotionCodes.list({ code: discount, active: true, limit: 1 });
        if (!promos.data.length) return NextResponse.json({ error: "That discount code is not available." }, { status: 400 });
        params.discounts = [{ promotion_code: promos.data[0].id }];
      }
      const session = await stripe.checkout.sessions.create(params, { idempotencyKey });
      if (!session.url) throw new Error("checkout_url_missing");
      sessionId = session.id;
      url = session.url;
    }
    // A retry must not downgrade an already-paid order or discard report linkage.
    const { error } = await db.from("orders").upsert({
      email, stripe_session_id: sessionId, amount_cents: bypass ? 0 : plan.amount,
      status: bypass ? "paid" : "pending", discount_code: bypass ? "TEAM_BYPASS" : discount || null,
      plan_type: planKey, auth_user_id: authUserId,
    }, { onConflict: "stripe_session_id", ignoreDuplicates: true });
    if (error) {
      await trackServerJourney("order_persist_failed", distinctId, { plan: planKey, reason: "insert_failed" });
      // Never expose the live checkout URL if we cannot persist its order.
      return NextResponse.json({ error: "Checkout is temporarily unavailable. Please retry; no payment was taken here." }, { status: 503 });
    }
    const response = NextResponse.json({ url });
    response.cookies.set(ORDER_COOKIE, signOrderAccess(sessionId, signingKey), {
      httpOnly: true, secure: req.nextUrl.protocol === "https:", sameSite: "lax",
      path: "/", maxAge: ORDER_ACCESS_SECONDS,
    });
    await trackServerJourney("checkout_started", distinctId, {
      plan: planKey, amount_cents: bypass ? 0 : plan.amount, currency: "usd", is_test: bypass,
    }, "checkout:" + sessionId);
    return response;
  } catch {
    await trackServerJourney("checkout_failed", distinctId, { plan: planKey, reason: "service_unavailable" });
    return NextResponse.json({ error: "Checkout is temporarily unavailable. Please retry." }, { status: 503 });
  }
}
