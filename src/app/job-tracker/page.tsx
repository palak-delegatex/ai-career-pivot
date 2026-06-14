import type { Metadata } from "next";
import SiteNav from "@/components/SiteNav";
import JobTrackerClient from "./JobTrackerClient";
import { breadcrumbSchema } from "@/lib/schema";

export const metadata: Metadata = {
  title: "Job Tracker — AICareerPivot",
  description: "Track your job applications with a visual Kanban board and pipeline analytics.",
  alternates: { canonical: "https://ai-career-pivot.com/job-tracker" },
};

export default function JobTrackerPage() {
  const crumbs = breadcrumbSchema([{ name: "Job Tracker", path: "/job-tracker" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <JobTrackerClient />
      </div>
    </>
  );
}
