import type { Metadata } from "next";
import { getTranslations } from "next-intl/server";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import CoverLetterClient from "./CoverLetterClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({ params }: { params: Promise<{ locale: string }> }): Promise<Metadata> {
  const { locale } = await params;
  const t = await getTranslations({ locale, namespace: "coverLetter" });
  return { title: t("metaTitle"), description: t("metaDescription"), alternates: { canonical: "https://ai-career-pivot.com/cover-letter" } };
}

export default function CoverLetterPage() {
  const crumbs = breadcrumbSchema([{ name: "Cover Letter Generator", path: "/cover-letter" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <CoverLetterClient />
      </AuthenticatedLayout>
    </>
  );
}
