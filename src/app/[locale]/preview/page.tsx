import SiteNav from "@/components/SiteNav";
import PreviewClient from "./PreviewClient";

export const metadata = {
  title: "Free Skill-Gap Preview — AICareerPivot",
  description:
    "Enter your current and target role to get an instant AI-powered skill gap analysis. No signup required.",
};

export default function PreviewPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <PreviewClient />
    </div>
  );
}
