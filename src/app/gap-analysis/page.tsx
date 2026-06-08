import type { Metadata } from "next";
import GapAnalysisClient from "./GapAnalysisClient";

export const metadata: Metadata = {
  title: "Job-Specific Gap Analysis | AICareerPivot",
  description:
    "Paste any job posting and instantly see how your skills match up — with actionable steps to close every gap.",
};

export default function GapAnalysisPage() {
  return <GapAnalysisClient />;
}
