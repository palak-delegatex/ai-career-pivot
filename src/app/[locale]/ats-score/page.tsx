import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import ATSScoreClient from "./ATSScoreClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "ATS Resume Score | AICareerPivot",
  description:
    "Upload your resume and get an instant ATS compatibility score with specific fixes to beat applicant tracking systems.",
  alternates: alternatesFor("/ats-score", locale),
};
}

export default function ATSScorePage() {
  const crumbs = breadcrumbSchema([{ name: "ATS Score", path: "/ats-score" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <ATSScoreClient />
    </>
  );
}
