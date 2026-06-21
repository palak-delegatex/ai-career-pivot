import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import InterviewCopilotClient from "./InterviewCopilotClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Interview Copilot — AICareerPivot",
  description:
    "Real-time AI assistance during live interviews. Get instant talking points, STAR answers, and experience highlights as questions are asked.",
  alternates: { canonical: "https://ai-career-pivot.com/interview-copilot" },
};

export default function InterviewCopilotPage() {
  const crumbs = breadcrumbSchema([
    { name: "Mock Interview", path: "/mock-interview" },
    { name: "Interview Copilot", path: "/interview-copilot" },
  ]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <InterviewCopilotClient />
      </div>
    </>
  );
}
