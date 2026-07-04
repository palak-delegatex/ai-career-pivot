import type { Metadata } from "next";
import { getTranslations, setRequestLocale } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import AssessmentClient from "./AssessmentClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "assessment" });
  return {
    title: t("metaTitle"),
    description: t("metaDescription"),
    alternates: { canonical: "https://ai-career-pivot.com/assessment" },
  };
}

export default async function AssessmentPage({
  params,
}: {
  params: Promise<{ locale: string }>;
}) {
  const { locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations({ locale, namespace: "assessment" });
  const crumbs = breadcrumbSchema([{ name: t("breadcrumb"), path: "/assessment" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <AssessmentClient />
      </AuthenticatedLayout>
    </>
  );
}
