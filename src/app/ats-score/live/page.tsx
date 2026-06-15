import type { Metadata } from "next";
import { breadcrumbSchema } from "@/lib/schema";
import LiveATSScoreClient from "./LiveATSScoreClient";

export const metadata: Metadata = {
  title: "Live ATS Match Score | AICareerPivot",
  description:
    "Paste a job description and edit your resume with real-time ATS match scoring. See keyword matches, formatting issues, and section feedback update live as you type.",
  alternates: { canonical: "https://ai-career-pivot.com/ats-score/live" },
};

export default function LiveATSScorePage() {
  const crumbs = breadcrumbSchema([
    { name: "ATS Score", path: "/ats-score" },
    { name: "Live Match", path: "/ats-score/live" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <LiveATSScoreClient />
    </>
  );
}
