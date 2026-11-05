import { cookies } from "next/headers";
import { getSupabaseServerClient } from "./supabase-server";
import { getSupabaseAdmin } from "./supabase";
import { ORDER_COOKIE, readOrderAccess } from "./order-access";

export async function canAccessReport(report: { id: string; email?: string; auth_user_id?: string | null }) {
  const store = await cookies();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  const session = key ? readOrderAccess(store.get(ORDER_COOKIE)?.value, key) : null;
  if (session) {
    const { data: order, error } = await getSupabaseAdmin().from("orders")
      .select("report_id,status").eq("stripe_session_id", session).maybeSingle();
    if (!error && order?.status === "paid" && order.report_id === report.id) return true;
  }
  const client = await getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  return report.auth_user_id ? report.auth_user_id === user.id :
    !!user.email && report.email?.toLowerCase() === user.email.toLowerCase();
}
