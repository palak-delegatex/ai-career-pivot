import { getSupabaseClient } from "@/lib/supabase";
import { isBypassEmail } from "@/lib/stripe";

/**
 * Server-side paid-access check by email.
 *
 * A user has paid access if they own a paid order (one-time "report" or
 * "lifetime") or are on the bypass list. This is the same signal the Stripe
 * webhook and the intake/plan gate already rely on (`orders.status === "paid"`),
 * so entitlement stays consistent across the app.
 *
 * Never trust a client-supplied "paid" flag — always gate on this server-side.
 */
export async function hasPaidAccess(email: string): Promise<boolean> {
  const normalized = email?.trim();
  if (!normalized) return false;
  if (isBypassEmail(normalized)) return true;

  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("orders")
    .select("id")
    // ilike (no wildcards) = case-insensitive exact match; order emails are not
    // guaranteed to be stored in the same case as the auth email.
    .ilike("email", normalized)
    .eq("status", "paid")
    .limit(1);

  if (error) return false;
  return (data?.length ?? 0) > 0;
}
