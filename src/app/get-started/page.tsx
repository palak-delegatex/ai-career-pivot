import SiteNav from "@/components/SiteNav";
import GetStartedClient from "./GetStartedClient";

export const metadata = {
  title: "Get Started — Free Career Pivot Analysis | AICareerPivot",
  description: "Paste your LinkedIn URL and see personalized career pivot paths in under 60 seconds. No signup, no payment required.",
};

export default function GetStartedPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <GetStartedClient />
    </div>
  );
}
