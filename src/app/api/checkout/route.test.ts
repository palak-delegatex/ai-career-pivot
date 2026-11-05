import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryDb } from "@/test/memory-db";
const m = vi.hoisted(() => ({ db: null as unknown as MemoryDb, create: vi.fn(), promos: vi.fn(), user: null as { id: string; email: string } | null, track: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => m.db }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: m.user } }) } }) }));
vi.mock("@/lib/journey-server", () => ({ trackServerJourney: m.track }));
vi.mock("@/lib/stripe", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/stripe")>(), getStripeClient: () => ({ promotionCodes: { list: m.promos }, checkout: { sessions: { create: m.create } } }) }));
import { POST } from "./route";
const input = { email: "buyer@example.test", checkoutAttemptId: "1fd0ed34-1ffd-4ce9-bfa8-8d74d7f9908e", posthogDistinctId: "anonymous_fixture_id" };
function request(body = input) { return new NextRequest("https://app.example.test/api/checkout", { method: "POST", headers: { origin: "https://attacker.example.test" }, body: JSON.stringify(body) }); }
describe("checkout", () => {
 beforeEach(() => { m.db = new MemoryDb(); m.user = null; m.create.mockReset().mockResolvedValue({ id: "cs_fixture", url: "https://checkout.stripe.com/fixture" }); m.track.mockReset(); m.promos.mockReset().mockResolvedValue({ data: [{ id: "promo_fixture" }] }); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-signature-key"); vi.stubEnv("BYPASS_PAYMENT_EMAILS", "buyer@example.test"); });
 it("charges the advertised $19 once and sets an HttpOnly purchase capability", async () => {
  const res = await POST(request()); expect(res.status).toBe(200);
  expect(m.create.mock.calls[0][0]).toMatchObject({ mode: "payment", success_url: "https://app.example.test/checkout/success?session_id={CHECKOUT_SESSION_ID}", line_items: [{ price_data: { unit_amount: 1900 } }] });
  expect(res.headers.get("set-cookie")).toContain("HttpOnly");
  expect(m.db.rows.orders[0].status).toBe("pending"); // Anonymous email alone cannot claim team bypass.
 });
 it("does not expose a payable URL when order persistence fails", async () => {
  m.db.failure = { table: "orders", op: "upsert" };
  const res = await POST(request()); expect(res.status).toBe(503); expect(await res.json()).not.toHaveProperty("url");
 });
 it("reuses the Stripe key on retries without downgrading paid orders", async () => {
  await POST(request()); m.db.rows.orders[0].status = "paid"; await POST(request());
  expect(m.create.mock.calls[0][1]).toEqual(m.create.mock.calls[1][1]); expect(m.db.rows.orders).toHaveLength(1); expect(m.db.rows.orders[0].status).toBe("paid");
 });
 it("requires verified account ownership for the existing team bypass", async () => {
  m.user = { id: "fixture-user", email: input.email };
  const res = await POST(request()); expect(res.status).toBe(200); expect(m.create).not.toHaveBeenCalled(); expect(m.db.rows.orders[0].status).toBe("paid");
 });
 it("rejects invalid plans before creating Stripe sessions", async () => {
  const res = await POST(request({ ...input, plan: "__proto__" } as typeof input)); expect(res.status).toBe(400); expect(m.create).not.toHaveBeenCalled();
 });
 it("rejects object-shaped plans without throwing or creating a session", async () => {
  const res = await POST(request({ ...input, plan: { toString: null } } as typeof input));
  expect(res.status).toBe(400); expect(m.create).not.toHaveBeenCalled();
 });
 it("preserves active discount and guarantee metadata", async () => {
  await POST(request({ ...input, discountCode: "FIXTURE100" } as typeof input));
  expect(m.create.mock.calls[0][0]).toMatchObject({ discounts: [{ promotion_code: "promo_fixture" }], metadata: { discountCode: "FIXTURE100", money_back_guarantee: "30_day" } });
 });
 it("does not silently charge full price for an invalid discount", async () => {
  m.promos.mockResolvedValue({ data: [] });
  const res = await POST(request({ ...input, discountCode: "INVALID" } as typeof input));
  expect(res.status).toBe(400); expect(m.create).not.toHaveBeenCalled();
 });
 it.each([['lifetime', 14900, 'payment', undefined], ['report_monthly', 999, 'subscription', { interval: 'month' }]])("preserves %s billing", async (plan, amount, mode, recurring) => {
  await POST(request({ ...input, plan } as typeof input));
  const params = m.create.mock.calls[0][0];
  expect(params.mode).toBe(mode); expect(params.line_items[0].price_data.unit_amount).toBe(amount);
  expect(params.line_items[0].price_data.recurring).toEqual(recurring);
 });
 it("preserves existing recurring billing definitions with explicit cadence", async () => {
  await POST(request({ ...input, plan: "report_annual" } as typeof input));
  expect(m.create.mock.calls[0][0]).toMatchObject({ mode: "subscription", line_items: [{ price_data: { unit_amount: 7900, recurring: { interval: "year" } } }] });
 });
});
