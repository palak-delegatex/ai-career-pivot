import { describe, it, expect } from "vitest";
import { getPlanRecoveryTemplate } from "./email-drip";

describe("getPlanRecoveryTemplate", () => {
  it("builds a pricing link that pre-fills the lead's email", () => {
    const { html } = getPlanRecoveryTemplate("Jane+Test@Example.com");
    // Email is URL-encoded so a one-tap return lands on a prefilled checkout.
    expect(html).toContain("email=Jane%2BTest%40Example.com");
    expect(html).toContain("/pricing?");
    expect(html).toContain("utm_campaign=plan_recovery");
  });

  it("personalizes the subject and greeting with the first name only", () => {
    const { subject, html } = getPlanRecoveryTemplate("a@b.com", "Jordan Rivera");
    expect(subject).toContain("Jordan");
    expect(subject).not.toContain("Rivera");
    expect(html).toContain("Jordan, your");
  });

  it("falls back to a generic subject when no name is given", () => {
    const { subject, html } = getPlanRecoveryTemplate("a@b.com");
    expect(subject).toMatch(/plan is ready/i);
    expect(subject).not.toContain("undefined");
    expect(html).toContain("Your AI career pivot plan is ready");
  });
});
