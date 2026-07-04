import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import CoverLetterClient from "./CoverLetterClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "AI Cover Letter Generator | AICareerPivot",
  description:
    "Generate a tailored, compelling cover letter for your career pivot with AI-powered keyword matching and tone control.",
  alternates: alternatesFor("/cover-letter", locale),
};
}

export default function CoverLetterPage() {
  const crumbs = breadcrumbSchema([{ name: "Cover Letter Generator", path: "/cover-letter" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <CoverLetterClient />
    </>
  );
}
