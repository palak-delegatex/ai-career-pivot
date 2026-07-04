import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import FreeUploadClient from "./FreeUploadClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "Free Skill-Gap Snapshot — AICareerPivot",
    description: "Upload your resume and get a free skill-gap analysis. See which career pivots fit you best — no payment required.",
    alternates: alternatesFor("/free", locale),
  };
}

export default function FreePage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <FreeUploadClient />
    </div>
  );
}
