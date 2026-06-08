import type { Metadata } from "next";
import ResumeGeneratorClient from "./ResumeGeneratorClient";

export const metadata: Metadata = {
  title: "AI Resume & Cover Letter Generator | AICareerPivot",
  description:
    "Generate an ATS-optimized resume and tailored cover letter for your career pivot in seconds.",
};

export default function ResumeGeneratorPage() {
  return <ResumeGeneratorClient />;
}
