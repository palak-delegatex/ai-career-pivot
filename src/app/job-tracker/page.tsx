import type { Metadata } from "next";
import AuthenticatedLayout from "@/components/AuthenticatedLayout";
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
      <AuthenticatedLayout>
        <JobTrackerClient />
      </AuthenticatedLayout>
    </>
  );
}
