import { describe, it, expect } from "vitest";
import { getCheckoutRecoveryTemplate } from "./email-drip";

describe("getCheckoutRecoveryTemplate", () => {
  it("builds a resume link that pre-fills the buyer's email and plan", () => {
    const { html } = getCheckoutRecoveryTemplate("Jane+Test@Example.com", "lifetime");
    // Email is URL-encoded so a one-tap resume lands on a prefilled checkout.
    expect(html).toContain("email=Jane%2BTest%40Example.com");
    expect(html).toContain("plan=lifetime");
    expect(html).toContain("utm_campaign=checkout_recovery");
  });

  it("shows the price for the plan the buyer abandoned", () => {
    expect(getCheckoutRecoveryTemplate("a@b.com", "report").html).toContain("$19");
    expect(getCheckoutRecoveryTemplate("a@b.com", "lifetime").html).toContain("$149");
  });

  it("falls back to the report plan copy for an unknown plan", () => {
    const { html } = getCheckoutRecoveryTemplate("a@b.com", "mystery");
    expect(html).toContain("$19");
    // Unknown plan still points back to a working checkout link.
    expect(html).toContain("plan=mystery");
  });

  it("uses a subject that signals the checkout is resumable", () => {
    expect(getCheckoutRecoveryTemplate("a@b.com", "report").subject).toMatch(/checkout/i);
  });
});
