import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getAllPosts, getAvailableLocales } from "@/lib/blog";
import { comparisons } from "@/content/comparisons";
import { getAllResearchSlugs } from "@/content/research";
import { locales, localeUrl, type Locale } from "@/i18n/config";

function pageLastModified(pagePath: string): Date {
  const appDir = path.join(process.cwd(), "src/app");
  const filePath = path.join(appDir, pagePath, "page.tsx");
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    return new Date("2026-06-01");
  }
}

function alternatesForPath(pagePath: string): MetadataRoute.Sitemap[number]["alternates"] {
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    languages[locale] = localeUrl(pagePath, locale);
  }
  return { languages };
}

function blogAlternates(slug: string): MetadataRoute.Sitemap[number]["alternates"] {
  const available = getAvailableLocales(slug);
  const languages: Record<string, string> = {};
  for (const locale of locales) {
    if (available.includes(locale)) {
      languages[locale] = localeUrl(`/blog/${slug}`, locale);
    } else {
      languages[locale] = localeUrl(`/blog/${slug}`);
    }
  }
  return { languages };
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: localeUrl(`/blog/${post.slug}`),
    lastModified: new Date(post.lastModified),
    changeFrequency: "monthly",
    priority: 0.8,
    alternates: blogAlternates(post.slug),
  }));

  const translatedBlogPosts: MetadataRoute.Sitemap = [];
  for (const locale of locales.filter((l): l is Exclude<Locale, "en"> => l !== "en")) {
    const localePosts = getAllPosts(locale);
    for (const post of localePosts) {
      if (!posts.some((p) => p.slug === post.slug)) continue;
      translatedBlogPosts.push({
        url: localeUrl(`/blog/${post.slug}`, locale),
        lastModified: new Date(post.lastModified),
        changeFrequency: "monthly",
        priority: 0.8,
        alternates: blogAlternates(post.slug),
      });
    }
  }

  const staticPages = [
    { path: "/", priority: 1.0, changeFrequency: "weekly" as const, pagePath: "" },
    { path: "/blog", priority: 0.85, changeFrequency: "weekly" as const, pagePath: "blog" },
    { path: "/how-it-works", priority: 0.7, changeFrequency: "monthly" as const, pagePath: "how-it-works" },
    { path: "/about", priority: 0.6, changeFrequency: "monthly" as const, pagePath: "about" },
    { path: "/faq", priority: 0.6, changeFrequency: "monthly" as const, pagePath: "faq" },
    { path: "/pricing", priority: 0.8, changeFrequency: "monthly" as const, pagePath: "pricing" },
    { path: "/success-stories", priority: 0.6, changeFrequency: "monthly" as const, pagePath: "success-stories" },
    { path: "/tools", priority: 0.85, changeFrequency: "weekly" as const, pagePath: "tools" },
    { path: "/free", priority: 0.7, changeFrequency: "monthly" as const, pagePath: "free" },
    { path: "/privacy", priority: 0.3, changeFrequency: "yearly" as const, pagePath: "privacy" },
  ];

  const staticEntries: MetadataRoute.Sitemap = staticPages.flatMap(
    ({ path: pagePath, priority, changeFrequency, pagePath: appPath }) =>
      locales.map((locale) => ({
        url: localeUrl(pagePath, locale),
        lastModified: pageLastModified(appPath),
        changeFrequency,
        priority,
        alternates: alternatesForPath(pagePath),
      })),
  );

  const toolPages = [
    { path: "/assessment", priority: 0.7 },
    { path: "/gap-analysis", priority: 0.7 },
    { path: "/linkedin-optimizer", priority: 0.7 },
    { path: "/resume-generator", priority: 0.7 },
    { path: "/mock-interview", priority: 0.7 },
    { path: "/cover-letter", priority: 0.7 },
    { path: "/ats-score", priority: 0.7 },
    { path: "/networking", priority: 0.6 },
    { path: "/job-tracker", priority: 0.6 },
    { path: "/salary-negotiation", priority: 0.7 },
    { path: "/interview-copilot", priority: 0.7 },
  ];

  const toolEntries: MetadataRoute.Sitemap = toolPages.flatMap(
    ({ path: pagePath, priority }) =>
      locales.map((locale) => ({
        url: localeUrl(pagePath, locale),
        lastModified: pageLastModified(pagePath),
        changeFrequency: "monthly" as const,
        priority,
        alternates: alternatesForPath(pagePath),
      })),
  );

  return [
    ...staticEntries,
    ...blogPosts,
    ...translatedBlogPosts,
    ...toolEntries,
    ...comparisons.map((c) => ({
      url: localeUrl(`/compare/${c.slug}`),
      lastModified: new Date(c.lastModified),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
    ...getAllResearchSlugs().map((slug) => ({
      url: localeUrl(`/research/${slug}`),
      lastModified: new Date(),
      changeFrequency: "monthly" as const,
      priority: 0.7,
    })),
  ];
}
