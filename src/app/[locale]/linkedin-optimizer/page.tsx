import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import LinkedInOptimizerClient from "./LinkedInOptimizerClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "linkedinOptimizer" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "https://ai-career-pivot.com/linkedin-optimizer" } };
}

export default function LinkedInOptimizerPage() {
  const crumbs = breadcrumbSchema([{ name: "LinkedIn Optimizer", path: "/linkedin-optimizer" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <LinkedInOptimizerClient />
      </AuthenticatedLayout>
    </>
  );
}
