import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";
import { withRetry } from "@/lib/with-retry";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  try {
    if (sessionId.startsWith("bypass_")) {
      const supabase = getSupabaseClient();
      const { data: order } = await withRetry(() =>
        supabase
          .from("orders")
          .select("email, status")
          .eq("stripe_session_id", sessionId)
          .single()
          .then((res) => { if (res.error) throw res.error; return res; })
      );

      if (order?.status === "paid") {
        return NextResponse.json({ paid: true, email: order.email });
      }
      return NextResponse.json({ paid: false });
    }

    const stripe = getStripeClient();
    const session = await withRetry(() => stripe.checkout.sessions.retrieve(sessionId));

    if (session.payment_status !== "paid") {
      return NextResponse.json({ paid: false });
    }

    const supabase = getSupabaseClient();
    const { error: updateError } = await supabase
      .from("orders")
      .update({ status: "paid" })
      .eq("stripe_session_id", sessionId);
    if (updateError) {
      console.error("Order status update failed during verification:", updateError);
    }

    return NextResponse.json({
      paid: true,
      email: session.customer_email ?? session.customer_details?.email,
    });
  } catch (err) {
    console.error("Payment verification failed:", err);
    return NextResponse.json(
      { error: "Unable to verify payment. Please refresh or contact support." },
      { status: 502 }
    );
  }
}
