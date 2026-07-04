import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import AssessmentClient from "./AssessmentClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Career Values Assessment | AICareerPivot",
  description:
    "Take AICareerPivot's career values assessment to discover your work style, priorities, and ideal career direction.",
  alternates: alternatesFor("/assessment", locale),
};
}

export default function AssessmentPage() {
  const crumbs = breadcrumbSchema([{ name: "Assessment", path: "/assessment" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AssessmentClient />
    </>
  );
}
