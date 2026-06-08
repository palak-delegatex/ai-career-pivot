import type { Metadata } from "next";
import ATSScoreClient from "./ATSScoreClient";

export const metadata: Metadata = {
  title: "ATS Resume Score | AICareerPivot",
  description:
    "Upload your resume and get an instant ATS compatibility score with specific fixes to beat applicant tracking systems.",
};

export default function ATSScorePage() {
  return <ATSScoreClient />;
}
