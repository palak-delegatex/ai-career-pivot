import type { Metadata } from "next";
import { alternatesFor } from "@/lib/seo";
import type { Locale } from "@/i18n/routing";
import SiteNav from "@/components/SiteNav";
import CareerQuizClient from "./CareerQuizClient";

export async function generateMetadata({
  params,
}: {
  params: Promise<{ locale: string }>;
}): Promise<Metadata> {
  const locale = (await params).locale as Locale;
  return {
    title: "30-Second Career Quiz — Find Your AI Role | AICareerPivot",
    description:
      "Answer 4 quick questions and see which AI-adjacent role fits your background — no resume, no signup. Then get your personalized pivot roadmap.",
    alternates: alternatesFor("/quiz", locale),
  };
}

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <CareerQuizClient />
    </div>
  );
}
