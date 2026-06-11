import type { Metadata } from "next";
import LinkedInOptimizerClient from "./LinkedInOptimizerClient";

export const metadata: Metadata = {
  title: "LinkedIn Profile Optimizer | AICareerPivot",
  description:
    "Optimize your LinkedIn profile for your career pivot. Get section-by-section rewrites, missing keywords, and recruiter search terms.",
};

export default function LinkedInOptimizerPage() {
  return <LinkedInOptimizerClient />;
}
