import type { Metadata } from "next";
import LinkedInOptimizerClient from "./LinkedInOptimizerClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "LinkedIn Profile Optimizer | AICareerPivot",
  description:
    "Optimize your LinkedIn profile for your career pivot. Get section-by-section rewrites, missing keywords, and recruiter search terms.",
  alternates: { canonical: "https://ai-career-pivot.com/linkedin-optimizer" },
};

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
