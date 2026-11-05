import { getSupabaseAdmin } from "./supabase";
import type { PaidOrder } from "./paid-orders";
import type { UserProfile, ValuesAssessment, PivotPlan } from "./intake";

export class ReportBusyError extends Error {}
export type PreparedReport = { id: string; plans: PivotPlan[] | null; createdAt?: string };
const LEASE_MS = 5 * 60 * 1000;

// Use the order UUID as the new report UUID: the existing reports primary key
// prevents concurrent duplicate reports without a schema migration.
export async function preparePaidReport(order: PaidOrder, profile: UserProfile, values?: ValuesAssessment): Promise<PreparedReport> {
  const db = getSupabaseAdmin();
  const id = order.report_id ?? order.id;
  const { data: existing, error: readError } = await db.from("reports")
    .select("id,order_id,plans,created_at").eq("id", id).maybeSingle();
  if (readError) throw new Error("report_read_failed");
  if (existing) {
    if (existing.order_id && existing.order_id !== order.id) throw new Error("report_order_mismatch");
    if (Array.isArray(existing.plans) && existing.plans.length) return { id, plans: existing.plans };
    if (Date.now() - Date.parse(existing.created_at) < LEASE_MS) throw new ReportBusyError("Report is still being prepared. Retry shortly without paying again.");
    // Recover a killed worker only after its lease (longer than the AI timeout).
    // Compare creation time to avoid deleting a newer concurrent claim.
    const { error } = await db.from("reports").delete().eq("id", id).eq("created_at", existing.created_at).filter("plans", "eq", "[]");
    if (error) throw new Error("report_retry_failed");
  }
  const createdAt = new Date().toISOString();
  const { error: insertError } = await db.from("reports").insert({
    id, order_id: order.id, email: order.email, auth_user_id: order.auth_user_id,
    profile: { ...profile, email: order.email }, plans: [], created_at: createdAt,
    ...(values ? { values_assessment: values } : {}),
  });
  if (insertError?.code === "23505") throw new ReportBusyError("Report is still being prepared. Retry shortly without paying again.");
  if (insertError) throw new Error("report_insert_failed");
  const { data: linked, error: linkError } = await db.from("orders").update({ report_id: id })
    .eq("id", order.id).select("id").single();
  if (linkError || !linked) {
    await releaseReport({ id, plans: null, createdAt });
    throw new Error("report_link_failed");
  }
  return { id, plans: null, createdAt };
}

export async function releaseReport(report: PreparedReport) {
  if (!report.createdAt) return;
  await getSupabaseAdmin().from("reports").delete().eq("id", report.id)
    .eq("created_at", report.createdAt).filter("plans", "eq", "[]");
}
export async function persistReport(report: PreparedReport, plans: PivotPlan[]) {
  if (!plans.length) throw new Error("empty_report");
  const { data, error } = await getSupabaseAdmin().from("reports").update({ plans })
    .eq("id", report.id).eq("created_at", report.createdAt!).select("id").single();
  if (error || !data) throw new Error("report_persist_failed");
}

// The paid response ends only AFTER durable persistence. A partial model stream
// or failed database write is a stream error, never a delivered-report success.
export function persistedReportResponse(
  textStream: AsyncIterable<string>,
  object: PromiseLike<{ plans: PivotPlan[] }>,
  report: PreparedReport,
  onSaved: () => Promise<void>,
  onFailed: () => Promise<void> = async () => {},
): Response {
  const encoder = new TextEncoder();
  const finalObject = Promise.resolve(object);
  void finalObject.catch(() => {}); // Consume model rejection even if its stream fails first.
  return new Response(new ReadableStream<Uint8Array>({
    async start(controller) {
      try {
        for await (const text of textStream) controller.enqueue(encoder.encode(text));
        const result = await finalObject;
        await persistReport(report, result.plans);
        await onSaved();
        controller.close();
      } catch {
        try { await releaseReport(report); } catch { /* A stale claim can be retried after its lease. */ }
        try { await onFailed(); } catch { /* Telemetry never masks the delivery error. */ }
        controller.error(new Error("Your report could not be saved. Retry without paying again."));
      }
    },
  }), { headers: { "Content-Type": "text/plain; charset=utf-8", "Cache-Control": "no-store", "x-report-id": report.id } });
}
