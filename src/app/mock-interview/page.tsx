import SiteNav from "@/components/SiteNav";
import MockInterviewClient from "./MockInterviewClient";

export const metadata = {
  title: "Mock Interview — AICareerPivot",
  description: "Practice AI-powered mock interviews for your target role. Get real-time feedback and a scorecard.",
};

export default function MockInterviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <MockInterviewClient />
    </div>
  );
}
