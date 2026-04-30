import { getSupabaseClient } from "@/lib/supabase";

export interface PaymentRecord {
  stripe_session_id: string;
  stripe_payment_intent: string | null;
  customer_email: string;
  amount_total: number;
  currency: string;
  status: string;
  paid_at: string;
}

export async function recordPayment(record: PaymentRecord): Promise<void> {
  const supabase = getSupabaseClient();
  const { error } = await supabase
    .from("payments")
    .upsert(record, { onConflict: "stripe_session_id", ignoreDuplicates: true });
  if (error) {
    throw new Error(`Failed to record payment: ${error.message}`);
  }
}

export async function getPaidSession(sessionId: string): Promise<PaymentRecord | null> {
  const supabase = getSupabaseClient();
  const { data, error } = await supabase
    .from("payments")
    .select("stripe_session_id, stripe_payment_intent, customer_email, amount_total, currency, status, paid_at")
    .eq("stripe_session_id", sessionId)
    .maybeSingle();
  if (error) {
    throw new Error(`Failed to look up payment: ${error.message}`);
  }
  if (!data) return null;
  if (data.status !== "paid" && data.status !== "complete") return null;
  return data as PaymentRecord;
}
