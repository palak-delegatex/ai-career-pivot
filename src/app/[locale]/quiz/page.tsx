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
    title: "Career Quiz — Explore an AI-Adjacent Role | AICareerPivot",
    description:
      "Answer four questions for an interest-based AI-adjacent role suggestion — no resume or signup. Use it as a starting point for your research.",
    alternates: alternatesFor("/quiz", locale),
  };
}

export default function QuizPage() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <main id="main-content">
        <CareerQuizClient />
      </main>
    </div>
  );
}
