import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
import { MemoryDb } from "@/test/memory-db";
const m = vi.hoisted(() => ({ db: null as unknown as MemoryDb, cookie: "", generated: vi.fn(), user: null as { id: string; email: string } | null, track: vi.fn() }));
vi.mock("@/lib/supabase", () => ({ getSupabaseAdmin: () => m.db, getSupabaseClient: () => m.db }));
vi.mock("@/lib/supabase-server", () => ({ getSupabaseServerClient: async () => ({ auth: { getUser: async () => ({ data: { user: m.user } }) } }) }));
vi.mock("next/headers", () => ({ cookies: async () => ({ get: () => m.cookie ? { value: m.cookie } : undefined }) }));
vi.mock("@/lib/journey-server", () => ({ trackServerJourney: m.track }));
vi.mock("@/lib/milestone-emails", () => ({ scheduleMilestoneEmails: vi.fn(async () => {}) }));
vi.mock("@ai-sdk/anthropic", () => ({ anthropic: () => ({}) }));
vi.mock("ai", () => ({ jsonSchema: (x: unknown) => x, streamObject: m.generated }));
vi.mock("@/lib/stripe", async importOriginal => ({ ...await importOriginal<typeof import("@/lib/stripe")>(), getStripeClient: () => ({ checkout: { sessions: {
 create: async () => ({ id: "cs_journey_fixture", url: "https://checkout.stripe.com/fixture" }),
 retrieve: async () => ({ id: "cs_journey_fixture", payment_status: "paid", customer_email: "buyer@example.test", amount_total: 1900, currency: "usd", metadata: { plan: "report", posthog_distinct_id: "anonymous_fixture_id" } }),
} } }) }));
import { POST as checkout } from "./checkout/route";
import { GET as verify } from "./checkout/verify/route";
import { POST as generate } from "./intake/plan/route";
import { POST as dashboard } from "./dashboard/route";
import { canAccessReport } from "@/lib/report-access";
const profile = { email: "wrong@example.test", skills: [], transferableSkills: [], experience: [], education: [], certifications: [], interests: [] };
const plans = [{ targetRole: "Fixture role" }];
const post = (path: string, body: unknown) => new NextRequest("https://app.example.test" + path, { method: "POST", body: JSON.stringify(body) });
describe("guest purchase → saved report → account recovery", () => {
 beforeEach(() => {
  m.db = new MemoryDb(); m.cookie = ""; m.user = null; m.track.mockClear(); vi.stubEnv("SUPABASE_SERVICE_ROLE_KEY", "test-only-key"); vi.stubEnv("BYPASS_PAYMENT_EMAILS", "");
  m.generated.mockReset().mockImplementation(() => ({ textStream: (async function* () { yield JSON.stringify({ plans }); })(), object: Promise.resolve({ plans }) }));
 });
 async function buy() {
  const res = await checkout(post("/api/checkout", { email: "buyer@example.test", posthogDistinctId: "anonymous_fixture_id" }));
  expect(res.status).toBe(200); m.cookie = res.cookies.get("aic_order_access")!.value;
  const verified = await verify(new NextRequest("https://app.example.test/api/checkout/verify?session_id=cs_journey_fixture"));
  expect(await verified.json()).toMatchObject({ paid: true, email: "buyer@example.test" });
 }
 it("saves, links, authorizes and reuses the report, without leaking profile identity to telemetry", async () => {
  await buy();
  const request = () => post("/api/intake/plan", { profile, paymentSessionId: "cs_journey_fixture", posthogDistinctId: "anonymous_fixture_id" });
  const response = await generate(request()); expect(response.status).toBe(200); await response.text();
  const report = m.db.rows.reports[0]; const order = m.db.rows.orders[0];
  expect(report.email).toBe("buyer@example.test"); expect(report.order_id).toBe(order.id); expect(order.report_id).toBe(report.id);
  expect(await canAccessReport(report as { id: string })).toBe(true);
  await (await generate(request())).text(); expect(m.generated).toHaveBeenCalledOnce();
  expect(JSON.stringify(m.track.mock.calls)).not.toContain("@example.test");
  m.cookie = ""; expect(await canAccessReport(report as { id: string })).toBe(false);
  m.user = { id: "owner_fixture", email: "buyer@example.test" };
  expect(await canAccessReport(report as { id: string; email: string })).toBe(true);
  expect((await (await dashboard()).json()).reports).toHaveLength(1);
 });
 it("rejects a stolen session reference without its purchase cookie or verified owner", async () => {
  await buy(); m.cookie = "";
  expect((await verify(new NextRequest("https://app.example.test/api/checkout/verify?session_id=cs_journey_fixture"))).status).toBe(403);
  expect((await generate(post("/api/intake/plan", { profile, paymentSessionId: "cs_journey_fixture" }))).status).toBe(403);
  expect(m.generated).not.toHaveBeenCalled(); expect((await dashboard()).status).toBe(401);
 });
 it("does not reveal a report to another signed-in account", async () => {
  await buy(); await (await generate(post("/api/intake/plan", { profile, paymentSessionId: "cs_journey_fixture" }))).text();
  m.cookie = ""; m.user = { id: "other_fixture", email: "other@example.test" };
  expect(await canAccessReport(m.db.rows.reports[0] as { id: string; email: string })).toBe(false);
  expect((await (await dashboard()).json()).reports).toHaveLength(0);
 });
 it("does not let a matching email override an explicitly linked owner", async () => {
  await buy(); await (await generate(post("/api/intake/plan", { profile, paymentSessionId: "cs_journey_fixture" }))).text();
  m.db.rows.orders[0].auth_user_id = "original_owner";
  m.db.rows.reports[0].auth_user_id = "original_owner";
  m.cookie = ""; m.user = { id: "different_owner", email: "buyer@example.test" };
  expect((await verify(new NextRequest("https://app.example.test/api/checkout/verify?session_id=cs_journey_fixture"))).status).toBe(403);
  expect(await canAccessReport(m.db.rows.reports[0] as { id: string; email: string; auth_user_id: string })).toBe(false);
  expect((await (await dashboard()).json()).reports).toHaveLength(0);
 });

});
