import { beforeEach, describe, expect, it, vi } from "vitest";
import { MemoryDb } from "@/test/memory-db";
import type { PaidOrder } from "./paid-orders";
import type { UserProfile, PivotPlan } from "./intake";
const m = vi.hoisted(() => ({ db: null as unknown as MemoryDb }));
vi.mock("./supabase", () => ({ getSupabaseAdmin: () => m.db }));
import { preparePaidReport, persistReport, persistedReportResponse, ReportBusyError } from "./paid-reports";
const order = { id: "b2dbe410-6962-44ef-b4e6-cfb5ed3bca60", email: "buyer@example.test", status: "paid", stripe_session_id: "cs_fixture", auth_user_id: null, report_id: null, plan_type: "report" } satisfies PaidOrder;
const profile = { email: "spoof@example.test", skills: [], transferableSkills: [], experience: [], education: [], certifications: [], interests: [] } satisfies UserProfile;
const plans = [{ targetRole: "Fixture role" }] as PivotPlan[];
describe("paid report delivery", () => {
 beforeEach(() => { m.db = new MemoryDb(); m.db.rows.orders.push({ ...order }); });
 it("links both directions and binds the trusted purchase email", async () => {
  const report = await preparePaidReport(order, profile);
  expect(m.db.rows.reports[0]).toMatchObject({ id: report.id, order_id: order.id, email: order.email });
  expect(m.db.rows.orders[0].report_id).toBe(report.id);
 });
 it("allows only one concurrent generator for an order", async () => {
  const results = await Promise.allSettled([preparePaidReport(order, profile), preparePaidReport(order, profile)]);
  expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
  expect(m.db.rows.reports).toHaveLength(1);
 });
 it("returns the saved report on refresh without generating again", async () => {
  const report = await preparePaidReport(order, profile); await persistReport(report, plans);
  expect((await preparePaidReport(order, profile)).plans).toEqual(plans);
 });
 it("rejects active claims, recovers stale empty claims", async () => {
  await preparePaidReport(order, profile);
  await expect(preparePaidReport(order, profile)).rejects.toBeInstanceOf(ReportBusyError);
  m.db.rows.reports[0].created_at = new Date(Date.now() - 360000).toISOString();
  await preparePaidReport(order, profile); expect(m.db.rows.reports).toHaveLength(1);
 });
 it("does not leave an unlinked placeholder when linkage fails", async () => {
  m.db.failure = { table: "orders", op: "update" };
  await expect(preparePaidReport(order, profile)).rejects.toThrow("report_link_failed");
  expect(m.db.rows.reports).toHaveLength(0);
 });
 it("ends a response only after the report is saved", async () => {
  const report = await preparePaidReport(order, profile); const saved = vi.fn(async () => {});
  async function* text() { yield JSON.stringify({ plans }); }
  const response = persistedReportResponse(text(), Promise.resolve({ plans }), report, saved);
  await response.text(); expect(m.db.rows.reports[0].plans).toEqual(plans); expect(saved).toHaveBeenCalledOnce();
 });
 it("fails the stream and permits retry when final persistence fails", async () => {
  const report = await preparePaidReport(order, profile); const saved = vi.fn(async () => {});
  m.db.failure = { table: "reports", op: "update" };
  async function* text() { yield JSON.stringify({ plans }); }
  await expect(persistedReportResponse(text(), Promise.resolve({ plans }), report, saved).text()).rejects.toThrow();
  expect(saved).not.toHaveBeenCalled(); expect(m.db.rows.reports).toHaveLength(0);
  await expect(preparePaidReport(order, profile)).resolves.toMatchObject({ id: order.id });
 });
 it("releases an interrupted model stream so the same purchase can retry", async () => {
  const report = await preparePaidReport(order, profile);
  const saved = vi.fn(async () => {});
  const failed = vi.fn(async () => {});
  async function* interrupted() { yield '{"plans":['; throw new Error("model disconnected"); }
  await expect(persistedReportResponse(interrupted(), Promise.reject(new Error("incomplete object")), report, saved, failed).text()).rejects.toThrow();
  expect(saved).not.toHaveBeenCalled();
  expect(failed).toHaveBeenCalledOnce();
  expect(m.db.rows.reports).toHaveLength(0);
  await expect(preparePaidReport(order, profile)).resolves.toMatchObject({ id: order.id });
 });
 it("does not let a stale worker overwrite or delete a newer generation claim", async () => {
  const stale = await preparePaidReport(order, profile);
  m.db.rows.reports[0].created_at = new Date(Date.parse(stale.createdAt!) + 1000).toISOString();
  const newerTimestamp = m.db.rows.reports[0].created_at;
  async function* text() { yield JSON.stringify({ plans }); }
  await expect(persistedReportResponse(text(), Promise.resolve({ plans }), stale, async () => {}).text()).rejects.toThrow();
  expect(m.db.rows.reports).toHaveLength(1);
  expect(m.db.rows.reports[0]).toMatchObject({ created_at: newerTimestamp, plans: [] });
 });
});
