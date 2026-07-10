import { describe, it, expect } from "vitest";
import { bulletHasMetric } from "./ats-scoring";

describe("bulletHasMetric — strong-signal branch (unchanged behaviour)", () => {
  it("counts percentages, currency, and multipliers", () => {
    expect(bulletHasMetric("Increased conversion by 35%")).toBe(true);
    expect(bulletHasMetric("Generated $2.4M in new revenue")).toBe(true);
    expect(bulletHasMetric("Drove 50% growth in signups")).toBe(true);
  });

  it("counts listed quantity keywords", () => {
    expect(bulletHasMetric("Onboarded 500 users in Q1")).toBe(true);
    expect(bulletHasMetric("Cut 40 hours of manual work weekly")).toBe(true);
  });
});

describe("bulletHasMetric — bare-number branch (the bug fix)", () => {
  it("counts numbers with units outside the fixed keyword list", () => {
    expect(bulletHasMetric("Managed a team of 12 engineers")).toBe(true);
    expect(bulletHasMetric("Reduced onboarding from 10 steps to 3")).toBe(true);
    expect(bulletHasMetric("Shipped 5 releases per quarter")).toBe(true);
    expect(bulletHasMetric("Handled 200 support tickets weekly")).toBe(true);
  });

  it("counts decimals and comma-grouped numbers", () => {
    expect(bulletHasMetric("Maintained a 4.9 average CSAT rating")).toBe(true);
    expect(bulletHasMetric("Processed 12,000 records overnight")).toBe(true);
  });
});

describe("bulletHasMetric — dates and contact digits are NOT metrics", () => {
  it("ignores month-year and year ranges", () => {
    expect(bulletHasMetric("Software Engineer — Jan 2024")).toBe(false);
    expect(bulletHasMetric("Acme Corp, 2021–2024")).toBe(false);
    expect(bulletHasMetric("Product Manager (2019 - present)")).toBe(false);
    expect(bulletHasMetric("Started role 01/2022")).toBe(false);
  });

  it("ignores phone numbers and zip codes", () => {
    expect(bulletHasMetric("Contact: +1 (415) 555-2671")).toBe(false);
    expect(bulletHasMetric("San Francisco, CA 94103")).toBe(false);
  });

  it("has no metric when the bullet is purely qualitative", () => {
    expect(bulletHasMetric("Led cross-functional design reviews")).toBe(false);
  });

  it("still counts a real metric even alongside a date", () => {
    expect(bulletHasMetric("Since Jan 2024, mentored 8 junior devs")).toBe(true);
  });
});
