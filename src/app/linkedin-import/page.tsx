import type { Metadata } from "next";
import LinkedInImportClient from "./LinkedInImportClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Import LinkedIn Profile to Resume | AICareerPivot",
  description:
    "Import your LinkedIn profile to auto-generate an ATS-optimized resume draft. Paste your URL, profile data, or upload your LinkedIn data export.",
  alternates: { canonical: "https://ai-career-pivot.com/linkedin-import" },
};

export default function LinkedInImportPage() {
  const crumbs = breadcrumbSchema([
    { name: "LinkedIn Import", path: "/linkedin-import" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <LinkedInImportClient />
    </>
  );
}
