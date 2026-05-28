import { NextRequest, NextResponse } from "next/server";
import { getStripeClient } from "@/lib/stripe";
import { getSupabaseClient } from "@/lib/supabase";

export async function GET(req: NextRequest) {
  const sessionId = req.nextUrl.searchParams.get("session_id");
  if (!sessionId) {
    return NextResponse.json({ error: "session_id required" }, { status: 400 });
  }

  if (sessionId.startsWith("bypass_")) {
    const supabase = getSupabaseClient();
    const { data: order } = await supabase
      .from("orders")
      .select("email, status")
      .eq("stripe_session_id", sessionId)
      .single();

    if (order?.status === "paid") {
      return NextResponse.json({ paid: true, email: order.email });
    }
    return NextResponse.json({ paid: false });
  }

  const stripe = getStripeClient();
  const session = await stripe.checkout.sessions.retrieve(sessionId);

  if (session.payment_status !== "paid") {
    return NextResponse.json({ paid: false });
  }

  const supabase = getSupabaseClient();
  await supabase
    .from("orders")
    .update({ status: "paid" })
    .eq("stripe_session_id", sessionId);

  return NextResponse.json({
    paid: true,
    email: session.customer_email ?? session.customer_details?.email,
  });
}
