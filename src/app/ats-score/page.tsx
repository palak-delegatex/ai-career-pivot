import type { Metadata } from "next";
import ATSScoreClient from "./ATSScoreClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "ATS Resume Score | AICareerPivot",
  description:
    "Upload your resume and get an instant ATS compatibility score with specific fixes to beat applicant tracking systems.",
  alternates: { canonical: "https://ai-career-pivot.com/ats-score" },
};

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
