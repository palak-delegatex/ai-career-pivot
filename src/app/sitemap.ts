import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getAllPosts } from "@/lib/blog";
import { pivots } from "@/content/pivots";
import { locales } from "@/i18n/routing";
import { localizedPath } from "@/lib/seo";

const BASE_URL = "https://ai-career-pivot.com";

function pageLastModified(pagePath: string): Date {
  // Routes live under `src/app/[locale]/` since the AIC-667 locale migration.
  const appDir = path.join(process.cwd(), "src/app/[locale]");
  const filePath = path.join(appDir, pagePath, "page.tsx");
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    return new Date("2026-06-01");
  }
}

/**
 * hreflang `alternates.languages` for a canonical (en) path — every locale
 * variant plus `x-default`. Emitted as absolute URLs (sitemaps require them).
 */
function localeAlternates(canonicalPath: string): { languages: Record<string, string> } {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = `${BASE_URL}${localizedPath(canonicalPath, locale)}`;
  }
  languages["x-default"] = `${BASE_URL}${localizedPath(canonicalPath, "en")}`;
  return { languages };
}

type Entry = {
  path: string;
  lastModified: Date;
  changeFrequency: MetadataRoute.Sitemap[number]["changeFrequency"];
  priority: number;
};

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogPosts: Entry[] = posts.map((post) => ({
    path: `/blog/${post.slug}`,
    lastModified: new Date(post.lastModified),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  // Programmatic pivot pages (AIC-688 Scope 4): one indexable page per
  // from→to role transition, driven by src/content/pivots.ts.
  const pivotLastModified = pageLastModified("pivot/[slug]");
  const pivotPages: Entry[] = pivots.map((pivot) => ({
    path: `/pivot/${pivot.slug}`,
    lastModified: pivotLastModified,
    changeFrequency: "monthly" as const,
    priority: 0.7,
  }));

  const toolPages: Entry[] = [
    { path: "/assessment", priority: 0.7 },
    { path: "/gap-analysis", priority: 0.7 },
    { path: "/linkedin-optimizer", priority: 0.7 },
    { path: "/resume-generator", priority: 0.7 },
    { path: "/mock-interview", priority: 0.7 },
    { path: "/cover-letter", priority: 0.7 },
    { path: "/ats-score", priority: 0.7 },
    { path: "/networking", priority: 0.6 },
    { path: "/job-tracker", priority: 0.6 },
  ].map(({ path: pagePath, priority }) => ({
    path: pagePath,
    lastModified: pageLastModified(pagePath),
    changeFrequency: "monthly" as const,
    priority,
  }));

  const entries: Entry[] = [
    { path: "/", lastModified: pageLastModified(""), changeFrequency: "weekly", priority: 1.0 },
    { path: "/blog", lastModified: pageLastModified("blog"), changeFrequency: "weekly", priority: 0.85 },
    ...blogPosts,
    { path: "/how-it-works", lastModified: pageLastModified("how-it-works"), changeFrequency: "monthly", priority: 0.7 },
    { path: "/chrome-extension", lastModified: pageLastModified("chrome-extension"), changeFrequency: "monthly", priority: 0.7 },
    { path: "/about", lastModified: pageLastModified("about"), changeFrequency: "monthly", priority: 0.6 },
    { path: "/faq", lastModified: pageLastModified("faq"), changeFrequency: "monthly", priority: 0.6 },
    { path: "/pricing", lastModified: pageLastModified("pricing"), changeFrequency: "monthly", priority: 0.8 },
    { path: "/success-stories", lastModified: pageLastModified("success-stories"), changeFrequency: "monthly", priority: 0.6 },
    ...toolPages,
    { path: "/pivot", lastModified: pageLastModified("pivot"), changeFrequency: "weekly", priority: 0.8 },
    ...pivotPages,
    { path: "/free", lastModified: pageLastModified("free"), changeFrequency: "monthly", priority: 0.7 },
    { path: "/privacy", lastModified: pageLastModified("privacy"), changeFrequency: "yearly", priority: 0.3 },
  ];

  return entries.map((e) => ({
    url: `${BASE_URL}${localizedPath(e.path, "en")}`,
    lastModified: e.lastModified,
    changeFrequency: e.changeFrequency,
    priority: e.priority,
    alternates: localeAlternates(e.path),
  }));
}
