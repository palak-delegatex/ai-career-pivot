import type { Metadata } from "next";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import GapAnalysisClient from "./GapAnalysisClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Job-Specific Gap Analysis | AICareerPivot",
  description:
    "Paste any job posting and instantly see how your skills match up — with actionable steps to close every gap.",
  alternates: { canonical: "https://ai-career-pivot.com/gap-analysis" },
};

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
