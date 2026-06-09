import SiteNav from "@/components/SiteNav";
import JobTrackerClient from "./JobTrackerClient";

export const metadata = {
  title: "Job Tracker — AICareerPivot",
  description: "Track your job applications with a visual Kanban board and pipeline analytics.",
};

export default function JobTrackerPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <JobTrackerClient />
    </div>
  );
}
