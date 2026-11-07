import { NextRequest, NextResponse } from "next/server";
import { getSupabaseAdmin } from "@/lib/supabase";
import { canAccessOrder } from "@/lib/order-access";
import { findOrder, verifyPaidOrder } from "@/lib/paid-orders";

export async function GET(req: NextRequest) {
  const id = req.nextUrl.searchParams.get("session_id");
  if (!id || id.length > 255) return NextResponse.json({ error: "session_id required" }, { status: 400 });
  try {
    const existing = await findOrder(id);
    if (!existing || !await canAccessOrder(existing)) {
      return NextResponse.json({ error: "Open this checkout in the browser where you paid, or sign in with your purchase email." }, { status: 403 });
    }
    const order = await verifyPaidOrder(id);
    let reportReady = false;
    if (order?.report_id) {
      const { data, error } = await getSupabaseAdmin().from("reports").select("plans").eq("id", order.report_id).maybeSingle();
      if (error) throw new Error("report_read_failed");
      reportReady = Array.isArray(data?.plans) && data.plans.length > 0;
    }
    return NextResponse.json(order ? { paid: true, email: order.email, reportId: reportReady ? order.report_id : null } : { paid: false }, {
      headers: { "Cache-Control": "no-store" },
    });
  } catch {
    return NextResponse.json({ error: "Payment verification is temporarily unavailable. Retry without paying again." }, { status: 503 });
  }
}
