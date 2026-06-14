import type { Metadata } from "next";
import AssessmentClient from "./AssessmentClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Career Values Assessment | AICareerPivot",
  description:
    "Take AICareerPivot's career values assessment to discover your work style, priorities, and ideal career direction.",
  alternates: { canonical: "https://ai-career-pivot.com/assessment" },
};

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
