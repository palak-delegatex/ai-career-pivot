import SiteNav from "@/components/SiteNav";
import FreeUploadClient from "./FreeUploadClient";

export const metadata = {
  title: "Free Skill-Gap Snapshot — AICareerPivot",
  description: "Upload your resume and get a free skill-gap analysis. See which career pivots fit you best — no payment required.",
};

export default function FreePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <FreeUploadClient />
    </div>
  );
}
