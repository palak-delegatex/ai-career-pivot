import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import LinkedInOptimizerClient from "./LinkedInOptimizerClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "LinkedIn Profile Optimizer | AICareerPivot",
  description:
    "Optimize your LinkedIn profile for your career pivot. Get section-by-section rewrites, missing keywords, and recruiter search terms.",
  alternates: alternatesFor("/linkedin-optimizer", locale),
};
}

export default function LinkedInOptimizerPage() {
  const crumbs = breadcrumbSchema([{ name: "LinkedIn Optimizer", path: "/linkedin-optimizer" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <LinkedInOptimizerClient />
    </>
  );
}
