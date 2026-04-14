import type { Metadata } from "next";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist — AICareerPivot",
  description:
    "Get early access to your AI-powered career pivot roadmap. Join the waitlist and be first to receive a personalized 6-month, 1-year, and 2-year career transition plan.",
  alternates: {
    canonical: "https://ai-career-pivot.vercel.app/waitlist",
  },
  openGraph: {
    title: "Join the Waitlist — AICareerPivot",
    description:
      "Get early access to your AI-powered career pivot roadmap built around your skills, finances, and family constraints.",
    url: "https://ai-career-pivot.vercel.app/waitlist",
  },
};

export default function WaitlistPage() {
  return <WaitlistForm />;
}
