import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import MockInterviewClient from "./MockInterviewClient";
import { breadcrumbSchema } from "@/lib/schema";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
  title: "Mock Interview — AICareerPivot",
  description: "Practice AI-powered mock interviews for your target role. Get real-time feedback and a scorecard.",
  alternates: alternatesFor("/mock-interview", locale),
};
}

export default function MockInterviewPage() {
  const crumbs = breadcrumbSchema([{ name: "Mock Interview", path: "/mock-interview" }]);
  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(crumbs) }}
      />
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
        <SiteNav />
        <MockInterviewClient />
      </div>
    </>
  );
}
