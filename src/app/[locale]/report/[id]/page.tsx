import type { Metadata } from "next";
import { notFound } from "next/navigation";
import { getSupabaseClient } from "@/lib/supabase";
import { getSupabaseServerClient } from "@/lib/supabase-server";
import { Link } from "@/i18n/navigation";
import SiteNav from "@/components/SiteNav";
import type { PivotPlan, UserProfile, ValuesAssessment } from "@/lib/intake";
import ReportContent from "./ReportContent";
import CareerProfileCard from "@/components/CareerProfileCard";
import ActivityTracker from "@/components/ActivityTracker";
import ShareResultButtons from "@/components/ShareResultButtons";

interface Props {
  params: Promise<{ id: string }>;
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
  const { id } = await params;
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

  // Owner detection (AIC-712). The report page is public-by-unguessable-link so
  // the share loop works end to end, but personal profile details are shown
  // ONLY to the authenticated owner. A non-owner (unauthenticated link
  // recipient, or a different signed-in user) gets a PII-minimized public view:
  // the pivot plans/roadmap only — no name, no profile card, no dealbreakers,
  // no transferable-skills list, and none of the profile-driven owner tools
  // (resume/cover-letter/gap-analysis generators run off the owner's profile).
  const serverSupabase = await getSupabaseServerClient();
  const {
    data: { user },
  } = await serverSupabase.auth.getUser();
  const isOwner = Boolean(
    user &&
      ((report.auth_user_id && report.auth_user_id === user.id) ||
        (report.email &&
          user.email &&
          report.email.toLowerCase() === user.email.toLowerCase()))
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <SiteNav />
      <ActivityTracker reportId={id} />
      <main className="max-w-4xl mx-auto px-6 py-12">
        <div className="text-center mb-10">
          <p className="text-teal-400 font-semibold text-sm uppercase tracking-widest mb-3">
            {isOwner ? "Your Career Pivot Report" : "AI Career Pivot Report"}
          </p>
          <h1 className="text-3xl sm:text-4xl font-extrabold tracking-tight mb-2">
            {isOwner && profile.name
              ? `${profile.name}'s Personalized Roadmap`
              : "A Personalized AI Career Pivot Roadmap"}
          </h1>
          {isOwner && profile.currentTitle && (
            <p className="text-slate-400 text-lg">
              {profile.currentTitle}
              {profile.currentIndustry ? ` · ${profile.currentIndustry}` : ""}
              {profile.yearsExperience ? ` · ${profile.yearsExperience} years experience` : ""}
            </p>
          )}
        </div>

        {isOwner ? (
          <div className="mb-10 flex justify-center">
            <ShareResultButtons score={topPlan?.matchScore} />
          </div>
        ) : (
          <div className="mb-10 rounded-2xl border border-teal-700/40 bg-teal-900/20 p-6 text-center">
            <p className="text-teal-300 font-semibold mb-1">
              This is someone&rsquo;s AI-mapped career pivot plan.
            </p>
            <p className="text-slate-300 text-sm mb-4">
              See your own match — built from your skills, values, and finances in minutes.
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 rounded-xl bg-teal-500 hover:bg-teal-400 text-slate-900 font-bold text-sm transition-colors"
            >
              Build my career pivot plan →
            </Link>
          </div>
        )}

        {isOwner && valuesAssessment && (
          <CareerProfileCard assessment={valuesAssessment} />
        )}

        {isOwner && profile.transferableSkills.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-8">
            <h2 className="text-lg font-bold text-teal-400 mb-4">
              Transferable Skills Identified
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

        <ReportContent
          plans={plans}
          reportId={id}
          location={isOwner ? profile.location : undefined}
          profile={isOwner ? profile : undefined}
        />

        <div className="mt-12 text-center text-slate-500 text-xs">
          <p>Generated by AICareerPivot · {new Date(report.created_at).toLocaleDateString()}</p>
          <p className="mt-1">
            Questions? Reply to your receipt email or reach us at support@ai-career-pivot.com
          </p>
        </div>
      </main>
    </div>
  );
}
