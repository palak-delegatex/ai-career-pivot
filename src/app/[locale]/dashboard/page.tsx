import SiteNav from "@/components/SiteNav";
import DashboardClient from "./DashboardClient";

export const metadata = {
  title: "Your Roadmaps — AICareerPivot",
  description: "View your saved career pivot roadmaps and next actions.",
};

export default function DashboardPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <DashboardClient />
    </div>
  );
}
