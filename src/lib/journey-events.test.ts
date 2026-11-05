import { describe, expect, it } from "vitest";
import { safeAnalyticsId, safeAnalyticsUrl, sanitizeAnalyticsProperties } from "./journey-events";
describe("analytics privacy", () => {
 it("redacts nested first-touch URLs and profile fields", () => {
  expect(sanitizeAnalyticsProperties({ $set_once: { $initial_current_url: "https://example.test/?code=secret", email: "private@example.test" }, current_title: "private", error: "email private@example.test" })).toEqual({ $set_once: { $initial_current_url: "https://example.test/" }, error: "request_failed" });
 });
 it("removes auth codes, payment references, email and fragments", () => {
  const url = safeAnalyticsUrl("https://example.test/login?code=private&session_id=cs_private&email=x@example.test&next=%2Fauth%3Fcode%3Dprivate&utm_source=google#access_token=private");
  expect(url).toBe("https://example.test/login?utm_source=google");
 });
 it("redacts structured properties inside arrays", () => {
  expect(sanitizeAnalyticsProperties({ items: [{ email: "private@example.test", profile: {}, count: 1 }, [{ access_token: "private", url: "https://example.test/?code=private" }]] })).toEqual({ items: [{ count: 1 }, [{ url: "https://example.test/" }]] });
 });
 it("never accepts emails as anonymous identity", () => {
  expect(safeAnalyticsId("buyer@example.test")).toBeUndefined();
  expect(safeAnalyticsId("anonymous_fixture_id")).toBe("anonymous_fixture_id");
 });
});
