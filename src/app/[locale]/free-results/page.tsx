import SiteNav from "@/components/SiteNav";
import FreeResultsClient from "./FreeResultsClient";

export const metadata = {
  title: "Your Free Skill-Gap Snapshot — AICareerPivot",
  description: "See your top career pivot matches and skill gaps. Unlock the full roadmap for $19.",
};

export default function FreeResultsPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <FreeResultsClient />
    </div>
  );
}
