import { createHmac, timingSafeEqual } from "node:crypto";
import { cookies } from "next/headers";
import { getSupabaseServerClient } from "./supabase-server";

export const ORDER_COOKIE = "aic_order_access";
export const ORDER_ACCESS_SECONDS = 60 * 60 * 24 * 30;

// Purpose-separated signature using the existing server-only key. No new
// secret, database permission, or auth-provider setting is required.
function signature(payload: string, key: string) {
  return createHmac("sha256", key).update(`order-access:v1:${payload}`).digest("base64url");
}
export function signOrderAccess(sessionId: string, key: string, now = Date.now()) {
  const payload = Buffer.from(JSON.stringify({ sessionId, expires: now + ORDER_ACCESS_SECONDS * 1000 })).toString("base64url");
  return `${payload}.${signature(payload, key)}`;
}
export function readOrderAccess(value: string | undefined, key: string, now = Date.now()): string | null {
  if (!value || value.length > 1024) return null;
  const [payload, mac, extra] = value.split(".");
  if (!payload || !mac || extra || !/^[A-Za-z0-9_-]{43}$/.test(mac)) return null;
  const expected = signature(payload, key);
  if (mac.length !== expected.length || !timingSafeEqual(Buffer.from(mac), Buffer.from(expected))) return null;
  try {
    const data = JSON.parse(Buffer.from(payload, "base64url").toString());
    return typeof data.sessionId === "string" && data.expires > now ? data.sessionId : null;
  } catch { return null; }
}
export type OrderOwner = { email: string; auth_user_id?: string | null; stripe_session_id: string };
export async function canAccessOrder(order: OrderOwner): Promise<boolean> {
  const store = await cookies();
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (key && readOrderAccess(store.get(ORDER_COOKIE)?.value, key) === order.stripe_session_id) return true;
  const client = await getSupabaseServerClient();
  const { data: { user } } = await client.auth.getUser();
  if (!user) return false;
  // An explicitly linked owner cannot be overridden by an email match.
  return order.auth_user_id ? order.auth_user_id === user.id :
    !!user.email && user.email.toLowerCase() === order.email.toLowerCase();
}
