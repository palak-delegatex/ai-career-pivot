import { describe, it, expect } from "vitest";
import { readdirSync, readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";
import { scanContent } from "./blog-honesty-guard.mjs";

const __dirname = dirname(fileURLToPath(import.meta.url));
const BLOG_DIR = join(__dirname, "..", "src", "content", "blog");

// AIC-1063: the honest-proof pre-merge gate for the AIC-1033 blog pipeline.
// Two invariants: (1) it must NEVER flag an already-audited live post — a false
// HOLD burns publish cadence, which the ticket forbids; (2) it MUST catch each
// fabricated-proof class from the PR #230 post-mortem.

describe("blog honesty guard — zero false positives on the live corpus", () => {
  const files = readdirSync(BLOG_DIR).filter((f) => /\.mdx?$/.test(f));

  it("scans a non-trivial corpus (guard against an empty glob)", () => {
    expect(files.length).toBeGreaterThan(50);
  });

  for (const file of files) {
    it(`clean: ${file}`, () => {
      const findings = scanContent(readFileSync(join(BLOG_DIR, file), "utf8"));
      // If this ever fails, either a rule got too broad or a genuinely dishonest
      // post reached the corpus — both are worth stopping for.
      expect(findings, JSON.stringify(findings, null, 2)).toHaveLength(0);
    });
  }
});

describe("blog honesty guard — catches each fabrication class", () => {
  it("own-product outcome claim (our users + result)", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\n73% of our users got hired within 60 days of using our platform.`
    );
    expect(findings.some((f) => f.rule === "own-product-outcome-claim")).toBe(true);
  });

  it("named-individual testimonial (quote attributed to a real name)", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\n"This changed my life and I landed my dream role." — Sarah Mitchell, former teacher`
    );
    expect(findings.some((f) => f.rule === "named-individual-testimonial")).toBe(true);
  });

  it("named-individual success persona (Name, a former role, transitioned…)", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nJane Doe, a former accountant, transitioned into an AI role and doubled her salary.`
    );
    expect(findings.some((f) => f.rule === "named-individual-testimonial")).toBe(true);
  });

  it("star / numeric rating marker", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nCustomers rated us 4.9 out of 5 stars. ★★★★★`
    );
    expect(findings.some((f) => f.rule === "testimonial-or-rating-marker")).toBe(true);
  });

  it("unsupported outcome stat when the post cites no source at all", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nAn incredible 92% of career changers who followed this method got hired.`
    );
    expect(findings.some((f) => f.rule === "unsupported-outcome-stat")).toBe(true);
  });
});

describe("blog honesty guard — does NOT flag honest patterns", () => {
  it("allows an illustrative archetype with no proper name", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nFor a 38-year-old marketing director, a nine-month pivot makes sense.`
    );
    expect(findings).toHaveLength(0);
  });

  it("allows a market stat when the post cites a recognized source", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nAccording to PwC, workers with AI skills earn 56% more than peers.`
    );
    expect(findings).toHaveLength(0);
  });

  it("allows generic negotiation advice ranges", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nMost employers build in 10–20% of flexibility on base pay.`
    );
    expect(findings).toHaveLength(0);
  });

  it("allows discussing testimonials generically (no fabricated one)", () => {
    const findings = scanContent(
      `---\ntitle: x\n---\nTalk to alumni you found yourself, not just the testimonials the program selected for you.`
    );
    expect(findings).toHaveLength(0);
  });
});
