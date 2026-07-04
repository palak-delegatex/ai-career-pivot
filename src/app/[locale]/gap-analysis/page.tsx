import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import GapAnalysisClient from "./GapAnalysisClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Job-Specific Gap Analysis | AICareerPivot",
  description:
    "Paste any job posting and instantly see how your skills match up — with actionable steps to close every gap.",
  alternates: alternatesFor("/gap-analysis", locale),
};
}

export default function GapAnalysisPage() {
  const crumbs = breadcrumbSchema([{ name: "Gap Analysis", path: "/gap-analysis" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <GapAnalysisClient />
    </>
  );
}
