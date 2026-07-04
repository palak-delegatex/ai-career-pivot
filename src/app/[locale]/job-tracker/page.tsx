import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import JobTrackerClient from "./JobTrackerClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "jobTracker" });
  return {
    title: t("page.metaTitle"),
    description: t("page.metaDescription"),
    alternates: { canonical: "https://ai-career-pivot.com/job-tracker" },
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
      <AuthenticatedLayout>
        <JobTrackerClient />
      </AuthenticatedLayout>
    </>
  );
}
