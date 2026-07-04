import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ATSScoreClient from "./ATSScoreClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "atsScore" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "https://ai-career-pivot.com/ats-score" } };
}

export default function ATSScorePage() {
  const crumbs = breadcrumbSchema([{ name: "ATS Score", path: "/ats-score" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <ATSScoreClient />
      </AuthenticatedLayout>
    </>
  );
}
