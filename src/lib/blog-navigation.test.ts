import { describe, expect, it } from "vitest";
import fs from "node:fs";
import path from "node:path";
import matter from "gray-matter";
import { articleNextSteps, blogOffers } from "./blog-next-steps";
import { blogLinkInfo } from "./blog-links";
import { locales } from "../i18n/routing";

describe("editorial next-step contracts", () => {
  it("only targets published articles with takeaways and no duplicate legacy CTA", () => {
    for (const [slug, intent] of Object.entries(articleNextSteps)) {
      const {data, content} = matter(fs.readFileSync(path.join(process.cwd(), "src/content/blog", `${slug}.mdx`), "utf8"));
      expect(data.title).toBeTruthy();
      expect(data.tldr?.length).toBeGreaterThan(0);
      expect(content).not.toContain("<FreeSnapshotCTA");
      expect(content).not.toMatch(/^# /m);
      expect(content).not.toContain("](/quiz)");
      expect(blogOffers[intent].destination).toMatch(/^\/(quiz|readiness|free)(\?mode=upload)?$/);
    }
  });
  it("provides the same complete promise in every supported locale", () => {
    for (const locale of locales) {
      const messages = JSON.parse(fs.readFileSync(path.join(process.cwd(), `messages/${locale}.json`), "utf8"));
      for (const intent of Object.keys(blogOffers)) {
        for (const key of ["heading", "description", "label"]) expect(messages.blog.nextStep[intent][key].length).toBeGreaterThan(5);
      }
    }
  });
  it("distinguishes resume upload, job posting, interests, and planning", () => {
    expect(blogOffers.snapshot.destination).toBe("/free?mode=upload");
    expect(blogOffers.posting.destination).toBe("/free");
    expect(blogOffers.explore.destination).toBe("/quiz");
    expect(blogOffers.planning.destination).toBe("/readiness");
  });
});

describe("article link classification", () => {
  it.each(["/quiz", "/free?mode=upload", "/de/readiness", "/pt-BR/pivot/teacher/data-analyst", "/assessment", "/onboarding"])("tracks public and intentional onboarding product links: %s", href => {
    expect(blogLinkInfo(href).product).toBe(true);
  });
  it.each(["#source-1", "https://example.com/free", "//example.com/quiz", "mailto:hello@example.com", "/blog/example", "/free-results"])("does not turn reading/source links into conversion events: %s", href => {
    expect(blogLinkInfo(href).product).toBe(false);
  });
  it("preserves existing locale prefixes", () => {
    expect(blogLinkInfo("/de/free?mode=upload")).toEqual({internal: true, localized: true, product: true});
  });
});
