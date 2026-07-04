import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import GapAnalysisClient from "./GapAnalysisClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "gapAnalysis" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "https://ai-career-pivot.com/gap-analysis" } };
}

export default function GapAnalysisPage() {
  const crumbs = breadcrumbSchema([{ name: "Gap Analysis", path: "/gap-analysis" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <GapAnalysisClient />
      </AuthenticatedLayout>
    </>
  );
}
