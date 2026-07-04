import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import JobTrackerClient from "./JobTrackerClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Job Tracker — AICareerPivot",
  description: "Track your job applications with a visual Kanban board and pipeline analytics.",
  alternates: alternatesFor("/job-tracker", locale),
};
}

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
