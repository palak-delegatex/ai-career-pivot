import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ResumeGeneratorClient from "./ResumeGeneratorClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "resumeGenerator" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "https://ai-career-pivot.com/resume-generator" } };
}

export default function ResumeGeneratorPage() {
  const crumbs = breadcrumbSchema([{ name: "Resume Generator", path: "/resume-generator" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <ResumeGeneratorClient />
      </AuthenticatedLayout>
    </>
  );
}
