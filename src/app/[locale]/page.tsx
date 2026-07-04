import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getAllPosts } from "@/lib/blog";
import HomeClient from "./HomeClient";
import { organizationSchema } from "@/lib/schema";
import {
  canonicalFor,
  hreflangAlternates,
  ogLocale,
} from "@/i18n/metadata";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "meta.landing" });
  const url = canonicalFor(locale, "");

  // OG image comes from the colocated `opengraph-image.tsx` file convention
  // (localized per locale) — intentionally not overridden here.
  return {
    title: t("title"),
    description: t("description"),
    alternates: {
      canonical: url,
      languages: hreflangAlternates(""),
    },
    openGraph: {
      type: "website",
      url,
      siteName: "AICareerPivot",
      locale: ogLocale(locale),
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
    twitter: {
      card: "summary_large_image",
      title: t("ogTitle"),
      description: t("ogDescription"),
    },
  };
}

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AICareerPivot",
  url: "https://ai-career-pivot.com",
  description:
    "Personalized career transition roadmaps powered by AI. Analyzes your skills, finances, and constraints to build actionable pivot plans.",
  dateModified: "2026-06-12",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ai-career-pivot.com/blog?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

export default async function Page({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const recentPosts = getAllPosts().slice(0, 4);
  const orgSchema = organizationSchema();
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{
          __html: JSON.stringify([orgSchema, websiteSchema]),
        }}
      />
      <HomeClient recentPosts={recentPosts} />
    </>
  );
}
