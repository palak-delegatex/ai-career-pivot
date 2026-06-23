import type { Metadata } from "next";
import CareerPathClient from "./CareerPathClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Career Path Visualization | AICareerPivot",
  description:
    "Explore interactive career transition paths personalized to your skills. See salary ranges, skill gaps, milestones, and required certifications for every pivot route.",
  alternates: { canonical: "https://ai-career-pivot.com/career-path" },
};

export default function CareerPathPage() {
  const crumbs = breadcrumbSchema([{ name: "Career Path", path: "/career-path" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <CareerPathClient />
    </>
  );
}
