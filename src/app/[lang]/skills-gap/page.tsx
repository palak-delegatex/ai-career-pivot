import type { Metadata } from "next";
import SkillsGapClient from "./SkillsGapClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "AI Skills Gap Analyzer | AICareerPivot",
  description:
    "Identify your skill gaps for any target role with AI-powered analysis. Get personalized course recommendations from Coursera, Udemy, YouTube and more — with priority ranking and time-to-competency estimates.",
  alternates: { canonical: "https://ai-career-pivot.com/skills-gap" },
};

export default function SkillsGapPage() {
  const crumbs = breadcrumbSchema([{ name: "Skills Gap Analyzer", path: "/skills-gap" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <SkillsGapClient />
    </>
  );
}
