import type { Metadata } from "next";
import WaitlistForm from "./WaitlistForm";

export const metadata: Metadata = {
  title: "Join the Waitlist — AI Career Pivot",
  description:
    "Get early access to your AI-powered career pivot roadmap for $9. Join the waitlist and be first to receive a personalized 6-month, 1-year, and 2-year career transition plan.",
  alternates: {
    canonical: "https://ai-career-pivot.com/waitlist",
  },
  openGraph: {
    title: "Join the Waitlist — AI Career Pivot",
    description:
      "Get early access for $9 to your AI-powered career pivot roadmap built around your skills, finances, and family constraints.",
    url: "https://ai-career-pivot.com/waitlist",
  },
  twitter: {
    card: "summary_large_image",
    title: "Join the Waitlist — AI Career Pivot",
    description:
      "Get early access for $9 to your AI-powered career pivot roadmap built around your skills, finances, and family constraints.",
  },
};

export default function WaitlistPage() {
  return <WaitlistForm />;
}
