import type { Metadata } from "next";
import CoverLetterClient from "./CoverLetterClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "AI Cover Letter Generator | AICareerPivot",
  description:
    "Generate a tailored, compelling cover letter for your career pivot with AI-powered keyword matching and tone control.",
  alternates: { canonical: "https://ai-career-pivot.com/cover-letter" },
};

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
