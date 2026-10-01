import { describe, expect, it } from "vitest";
import { pivots } from "../content/pivots";
import { readinessContext } from "./readiness-context";
import { readinessRetakeUrl } from "./readiness-retake";
import { decodeResult, encodeResult } from "./readiness";

describe("readiness path context", () => {
  it.each([
    ["teacher", "product-manager", "Teacher", "Product Manager"],
    ["accountant", "data-analyst", "Accountant", "Data Analyst"],
  ])("resolves canonical labels for %s → %s", (from, to, fromRole, toRole) => {
    expect(readinessContext({ from, to })).toEqual({ fromRole, toRole });
  });

  it.each([
    {},
    { from: "teacher" },
    { to: "product-manager" },
    { from: "unknown", to: "product-manager" },
    { from: "teacher", to: "unknown" },
    { from: "teacher", to: "financial-systems-analyst" },
    { from: ["teacher", "teacher"], to: "product-manager" },
    { from: "teacher", to: ["product-manager", "data-analyst"] },
    { from: "<script>alert(1)</script>", to: "product-manager" },
    { from: "Teacher", to: "product-manager" },
  ])("ignores invalid context %j", (query) => {
    expect(readinessContext(query)).toBeNull();
  });

  it("accepts every published pair using only canonical labels", () => {
    for (const pivot of pivots) {
      expect(readinessContext({ from: pivot.fromSlug, to: pivot.toSlug })).toEqual({
        fromRole: pivot.fromRole, toRole: pivot.toRole,
      });
    }
  });

  it("keeps shared results independent of optional context", () => {
    const dimensions = { experience: 75, motivation: 60, commitment: 80, urgency: 50 };
    const r = encodeResult(dimensions);
    for (const query of [{ r }, { r, from: "teacher", to: "product-manager" }, { r, from: "invalid" }]) {
      readinessContext(query);
      expect(decodeResult(query.r)).toEqual(dimensions);
    }
    expect(decodeResult("invalid")).toBeNull();
  });
});

describe("readiness retake", () => {
  it("removes all result tokens while keeping role context and locale", () => {
    expect(readinessRetakeUrl("https://example.com/en/readiness?from=teacher&to=product-manager&r=one&r=two#main-content"))
      .toBe("/en/readiness?from=teacher&to=product-manager#main-content");
  });
  it("supports direct and scores-only shared visits", () => {
    expect(readinessRetakeUrl("https://example.com/readiness")).toBe("/readiness");
    expect(readinessRetakeUrl("https://example.com/readiness?r=token")).toBe("/readiness");
  });
});
