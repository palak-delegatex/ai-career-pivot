import type { MetadataRoute } from "next";
import fs from "fs";
import path from "path";
import { getAllPosts } from "@/lib/blog";

const BASE_URL = "https://ai-career-pivot.com";

function pageLastModified(pagePath: string): Date {
  const appDir = path.join(process.cwd(), "src/app");
  const filePath = path.join(appDir, pagePath, "page.tsx");
  try {
    return fs.statSync(filePath).mtime;
  } catch {
    return new Date("2026-06-01");
  }
}

export default function sitemap(): MetadataRoute.Sitemap {
  const posts = getAllPosts();

  const blogPosts: MetadataRoute.Sitemap = posts.map((post) => ({
    url: `${BASE_URL}/blog/${post.slug}`,
    lastModified: new Date(post.lastModified),
    changeFrequency: "monthly",
    priority: 0.8,
  }));

  const toolPages: MetadataRoute.Sitemap = [
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
  ].map(({ path: pagePath, priority }) => ({
    url: `${BASE_URL}${pagePath}`,
    lastModified: pageLastModified(pagePath),
    changeFrequency: "monthly" as const,
    priority,
  }));

  return [
    {
      url: BASE_URL,
      lastModified: pageLastModified(""),
      changeFrequency: "weekly",
      priority: 1.0,
    },
    {
      url: `${BASE_URL}/blog`,
      lastModified: pageLastModified("blog"),
      changeFrequency: "weekly",
      priority: 0.85,
    },
    ...blogPosts,
    {
      url: `${BASE_URL}/how-it-works`,
      lastModified: pageLastModified("how-it-works"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/about`,
      lastModified: pageLastModified("about"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/faq`,
      lastModified: pageLastModified("faq"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    {
      url: `${BASE_URL}/pricing`,
      lastModified: pageLastModified("pricing"),
      changeFrequency: "monthly",
      priority: 0.8,
    },
    {
      url: `${BASE_URL}/success-stories`,
      lastModified: pageLastModified("success-stories"),
      changeFrequency: "monthly",
      priority: 0.6,
    },
    ...toolPages,
    {
      url: `${BASE_URL}/free`,
      lastModified: pageLastModified("free"),
      changeFrequency: "monthly",
      priority: 0.7,
    },
    {
      url: `${BASE_URL}/privacy`,
      lastModified: pageLastModified("privacy"),
      changeFrequency: "yearly",
      priority: 0.3,
    },
  ];
}
