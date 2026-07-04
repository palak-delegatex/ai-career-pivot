import type { Metadata } from "next";
import SuccessStoriesClient from "./SuccessStoriesClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Success Stories | AICareerPivot",
  description:
    "Real career transition stories from professionals who pivoted successfully with AICareerPivot. See data-driven outcomes and proven roadmaps.",
  alternates: { canonical: "https://ai-career-pivot.com/success-stories" },
  openGraph: {
    title: "Career Pivot Success Stories | AICareerPivot",
    description:
      "Nurse → UX Designer. Teacher → Product Manager. See real career transitions with concrete data.",
    type: "website",
  },
};

export default function SuccessStoriesPage() {
  const crumbs = breadcrumbSchema([{ name: "Success Stories", path: "/success-stories" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <SuccessStoriesClient />
    </>
  );
}
