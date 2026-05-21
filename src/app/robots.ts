import type { MetadataRoute } from "next";

export default function robots(): MetadataRoute.Robots {
  return {
    rules: [
      {
        userAgent: "*",
        allow: "/",
        disallow: ["/dashboard", "/onboarding", "/checkout", "/report", "/design-test"],
      },
    ],
    sitemap: "https://ai-career-pivot.com/sitemap.xml",
    host: "https://ai-career-pivot.com",
  };
}
