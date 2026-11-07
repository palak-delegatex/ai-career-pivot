import { beforeEach, describe, expect, it, vi } from "vitest";
import type Stripe from "stripe";
import { MemoryDb } from "@/test/memory-db";
const m = vi.hoisted(() => ({ db: null as unknown as MemoryDb, track: vi.fn() }));
vi.mock("./supabase", () => ({ getSupabaseAdmin: () => m.db }));
vi.mock("./journey-server", () => ({ trackServerJourney: m.track }));
import { recordPaidSession } from "./paid-orders";
const session = { id: "cs_test_fixture", payment_status: "paid", customer_email: "buyer@example.test", amount_total: 1900, currency: "usd", metadata: { plan: "report", posthog_distinct_id: "anonymous_fixture_id" } } as unknown as Stripe.Checkout.Session;
describe("payment persistence", () => {
 beforeEach(() => { m.db = new MemoryDb(); m.track.mockClear(); });
 it("repairs missing orders and is idempotent across webhook/return retries", async () => {
  const first = await recordPaidSession(session); await recordPaidSession(session);
  expect(m.db.rows.orders).toHaveLength(1); expect(first?.status).toBe("paid");
  expect(m.track.mock.calls[0][3]).toBe(m.track.mock.calls[1][3]);
  expect(JSON.stringify(m.track.mock.calls)).not.toContain("buyer@example.test");
 });
 it("does not mark an unpaid async checkout paid", async () => {
  expect(await recordPaidSession({ ...session, payment_status: "unpaid" })).toBeNull();
  expect(m.db.rows.orders).toHaveLength(0); expect(m.track).not.toHaveBeenCalled();
 });
 it("fulfills a completed fully discounted checkout without a payment intent", async () => {
  const order = await recordPaidSession({ ...session, payment_status: "no_payment_required", status: "complete", amount_total: 0 });
  expect(order?.status).toBe("paid");
  expect(m.db.rows.orders[0].amount_cents).toBe(0);
  expect(m.db.rows.orders[0].stripe_payment_intent).toBeNull();
 });
 it("does not fulfill an incomplete no-payment checkout", async () => {
  expect(await recordPaidSession({ ...session, payment_status: "no_payment_required", status: "open", amount_total: 0 })).toBeNull();
  expect(m.db.rows.orders).toHaveLength(0);
 });
 it("retains subscription linkage for the existing recurring plans", async () => {
  await recordPaidSession({ ...session, subscription: "sub_fixture", metadata: { plan: "report_annual" }, amount_total: 7900 });
  expect(m.db.rows.orders[0]).toMatchObject({ plan_type: "report_annual", stripe_subscription_id: "sub_fixture", amount_cents: 7900 });
 });
 it("fails rather than acknowledge a failed paid-order write", async () => {
  m.db.failure = { table: "orders", op: "update" };
  await expect(recordPaidSession(session)).rejects.toThrow("order_update_failed");
  expect(m.track).not.toHaveBeenCalled();
 });
 it("preserves report linkage when payment is replayed", async () => {
  await recordPaidSession(session); m.db.rows.orders[0].report_id = "report_fixture";
  await recordPaidSession(session); expect(m.db.rows.orders[0].report_id).toBe("report_fixture");
 });
});
