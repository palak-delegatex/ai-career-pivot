import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getTranslations, setRequestLocale } from "next-intl/server";
import { getSupabaseClient } from "@/lib/supabase";
import SiteNav from "@/components/SiteNav";
import type { PivotPlan, UserProfile, ValuesAssessment } from "@/lib/intake";
import ReportContent from "./ReportContent";
import CareerProfileCard from "@/components/CareerProfileCard";
import ActivityTracker from "@/components/ActivityTracker";
import ShareResultButtons from "@/components/ShareResultButtons";

interface Props {
  params: Promise<{ id: string; locale: string }>;
}

/** Highest-matchScore plan — the headline result we surface and let users share. */
function bestPlan(plans: PivotPlan[]): PivotPlan | undefined {
  return plans
    .filter((p) => typeof p.matchScore === "number")
    .sort((a, b) => (b.matchScore ?? 0) - (a.matchScore ?? 0))[0];
}

// Personal reports are shareable (share loop) but must NOT be indexed by search
// engines — they contain the user's profile. The co-located opengraph-image
// wires og:image automatically; here we set a safe title/description + noindex.
export async function generateMetadata(): Promise<Metadata> {
  return {
    title: "My AI Career Pivot Plan",
    description:
      "See your AI-mapped career pivot match — built from your skills, values, and finances.",
    robots: { index: false, follow: false },
    openGraph: {
      title: "My AI Career Pivot Plan",
      description: "AI-mapped career pivot match from AICareerPivot.",
      type: "website",
    },
  };
}

export default async function ReportPage({ params }: Props) {
  const { id, locale } = await params;
  setRequestLocale(locale);
  const t = await getTranslations('report');
  const supabase = getSupabaseClient();

  const { data: report } = await supabase
    .from("reports")
    .select("*")
    .eq("id", id)
    .single();

  if (!report) notFound();

  const profile = report.profile as UserProfile;
  const plans = report.plans as PivotPlan[];
  const valuesAssessment = report.values_assessment as ValuesAssessment | null;
  const topPlan = bestPlan(plans);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <ActivityTracker reportId={id} />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">
            {t('eyebrow')}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {profile.name ? t('headingNamed', { name: profile.name }) : t('headingGeneric')}
          </h1>
          {profile.currentTitle && (
            <p className="text-slate-400 text-lg">
              {profile.currentTitle}
              {profile.currentIndustry ? ` · ${profile.currentIndustry}` : ""}
              {profile.yearsExperience ? ` · ${t('yearsExp', { count: profile.yearsExperience })}` : ""}
            </p>
          )}
        </div>

        <div className="mb-10 flex justify-center">
          <ShareResultButtons score={topPlan?.matchScore} />
        </div>

        {valuesAssessment && (
          <CareerProfileCard assessment={valuesAssessment} />
        )}

        {profile.transferableSkills.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-teal-400 mb-4">
              {t('transferableSkillsHeading')}
              <span className="text-slate-500 text-sm font-normal ml-2">
                ({profile.transferableSkills.length})
              </span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.transferableSkills.map((skill) => (
                <span
                  key={skill}
                  className="px-3 py-1 bg-teal-900/40 border border-teal-700/50 rounded-full text-teal-300 text-sm"
                >
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        <ReportContent plans={plans} reportId={id} location={profile.location} profile={profile} />

        <div className="mt-12 text-center text-slate-500 text-xs">
          <p>{t('generatedBy', { date: new Date(report.created_at).toLocaleDateString() })}</p>
          <p className="mt-1">
            {t('questions')}
          </p>
        </div>
      </main>
    </div>
  );
}
