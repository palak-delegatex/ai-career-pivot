import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import MockInterviewClient from "./MockInterviewClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Mock Interview — AICareerPivot",
  description: "Practice AI-powered mock interviews for your target role. Get real-time feedback and a scorecard.",
  alternates: { canonical: "https://ai-career-pivot.com/mock-interview" },
};

export default function MockInterviewPage() {
  const crumbs = breadcrumbSchema([{ name: "Mock Interview", path: "/mock-interview" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <MockInterviewClient />
      </div>
    </>
  );
}
