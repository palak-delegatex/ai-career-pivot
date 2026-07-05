import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import { getTranslations, setRequestLocale } from "next-intl/server";
import JobTrackerClient from "./JobTrackerClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  const t = await getTranslations({ locale, namespace: "jobTracker" });
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: alternatesFor("/job-tracker", locale),
  };
}

export default async function JobTrackerPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations("jobTracker");
  const crumbs = breadcrumbSchema([{ name: t("page.breadcrumb"), path: "/job-tracker" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <JobTrackerClient />
      </div>
    </>
  );
}
