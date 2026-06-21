import SiteNav from "@/components/SiteNav";
import AutoApplyClient from "./AutoApplyClient";

export const metadata = {
  title: "Smart Auto-Apply — AICareerPivot",
  description: "AI-matched jobs reviewed and approved by you. Quality over quantity.",
};

export default function AutoApplyPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <AutoApplyClient />
    </div>
  );
}
