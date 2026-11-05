import { beforeEach, describe, expect, it, vi } from "vitest";
import { NextRequest } from "next/server";
const m = vi.hoisted(() => ({ construct: vi.fn(), record: vi.fn() }));
vi.mock("@/lib/stripe", () => ({ getStripeClient: () => ({ webhooks: { constructEvent: m.construct } }) }));
vi.mock("@/lib/paid-orders", () => ({ recordPaidSession: m.record }));
vi.mock("@/lib/journey-server", () => ({ trackServerJourney: vi.fn() }));
import { POST } from "./route";
const req = () => new NextRequest("https://example.test/api/webhook/stripe", { method: "POST", headers: { "stripe-signature": "test" }, body: "fixture" });
describe("signed payment webhook", () => {
 beforeEach(() => { vi.stubEnv("STRIPE_WEBHOOK_KEY", "fixture"); m.record.mockReset(); m.construct.mockReset().mockReturnValue({ type: "checkout.session.completed", data: { object: { id: "fixture" } } }); });
 it("returns non-2xx for failed persistence so Stripe can retry", async () => {
  m.record.mockRejectedValue(new Error("test")); expect((await POST(req())).status).toBe(503);
 });
 it("rejects invalid signatures before order mutation", async () => {
  m.construct.mockImplementation(() => { throw new Error("test"); }); expect((await POST(req())).status).toBe(400); expect(m.record).not.toHaveBeenCalled();
 });
 it("handles delayed-payment success", async () => {
  m.construct.mockReturnValue({ type: "checkout.session.async_payment_succeeded", data: { object: { id: "fixture" } } }); expect((await POST(req())).status).toBe(200); expect(m.record).toHaveBeenCalledOnce();
 });
});
