import type { Metadata } from "next";
import CoverLetterClient from "./CoverLetterClient";

export const metadata: Metadata = {
  title: "AI Cover Letter Generator | AICareerPivot",
  description:
    "Generate a tailored, compelling cover letter for your career pivot with AI-powered keyword matching and tone control.",
};

export default function CoverLetterPage() {
  return <CoverLetterClient />;
}
