import type { Metadata } from "next";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
import ResumeGeneratorClient from "./ResumeGeneratorClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "AI Resume & Cover Letter Generator | AICareerPivot",
  description:
    "Generate an ATS-optimized resume and tailored cover letter for your career pivot in seconds.",
  alternates: { canonical: "https://ai-career-pivot.com/resume-generator" },
};

export default function ResumeGeneratorPage() {
  const crumbs = breadcrumbSchema([{ name: "Resume Generator", path: "/resume-generator" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <AuthenticatedLayout>
        <ResumeGeneratorClient />
      </AuthenticatedLayout>
    </>
  );
}
