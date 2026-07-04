import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import ResumeGeneratorClient from "./ResumeGeneratorClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "AI Resume & Cover Letter Generator | AICareerPivot",
  description:
    "Generate an ATS-optimized resume and tailored cover letter for your career pivot in seconds.",
  alternates: alternatesFor("/resume-generator", locale),
};
}

export default function ResumeGeneratorPage() {
  const crumbs = breadcrumbSchema([{ name: "Resume Generator", path: "/resume-generator" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <ResumeGeneratorClient />
    </>
  );
}
