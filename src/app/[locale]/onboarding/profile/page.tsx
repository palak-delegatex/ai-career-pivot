"use client";

import { Suspense, useEffect, useState, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type { UserProfile, PivotPlan } from "@/lib/intake";
import type { ValuesAssessment } from "@/lib/intake";
import { trackProfileReviewed, trackPlanGenerationStarted, trackPlanGenerationCompleted, trackPlanGenerationError } from "@/lib/tracking";
import { MatchScoreCard } from "@/components/MatchScoreCard";
import StreamingPlanGeneration from "@/components/StreamingPlanGeneration";

export default function ProfileReviewPage() {
  return (
    <Suspense fallback={
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    }>
      <ProfileReviewContent />
    </Suspense>
  );
}

function ProfileReviewContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");
  const [autoGenerate, setAutoGenerate] = useState(false);

  useEffect(() => {
    const stored = sessionStorage.getItem("intake_profile");
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setProfile(JSON.parse(stored));
    trackProfileReviewed();
    if (searchParams.get("generate") === "1") {
      setAutoGenerate(true);
    }
  }, [router, searchParams]);

  useEffect(() => {
    if (autoGenerate && profile && !generating) {
      handleGenerate();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [autoGenerate, profile]);

  function handleGenerate() {
    if (!profile) return;
    trackPlanGenerationStarted({
      current_title: profile.currentTitle,
      current_industry: profile.currentIndustry,
      skills_count: profile.skills.length,
    });
    setGenerating(true);
    setError("");
  }

  const handleStreamComplete = useCallback((plans: PivotPlan[], reportId?: string) => {
    if (reportId) {
      trackPlanGenerationCompleted({ plans_count: plans.length, has_report_id: true });
      sessionStorage.removeItem("payment_session_id");
      sessionStorage.removeItem("payment_email");
      sessionStorage.removeItem("intake_profile");
      sessionStorage.removeItem("values_assessment");
      router.push(`/report/${reportId}`);
    } else {
      trackPlanGenerationCompleted({ plans_count: plans.length, has_report_id: false });
      sessionStorage.setItem("intake_plans", JSON.stringify(plans));
      router.push("/onboarding/plan");
    }
  }, [router]);

  const handleStreamError = useCallback((message: string) => {
    trackPlanGenerationError({ error: message });
    setError(message);
    setGenerating(false);
  }, []);

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (generating && profile) {
    const storedPaymentId = typeof window !== "undefined" ? sessionStorage.getItem("payment_session_id") : null;
    const storedAssessment = typeof window !== "undefined" ? sessionStorage.getItem("values_assessment") : null;
    const parsedAssessment: ValuesAssessment | undefined = storedAssessment
      ? JSON.parse(storedAssessment)
      : undefined;

    return (
      <StreamingPlanGeneration
        profile={profile}
        paymentSessionId={storedPaymentId ?? undefined}
        valuesAssessment={parsedAssessment}
        onComplete={handleStreamComplete}
        onError={handleStreamError}
      />
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">✅</div>
          <h1 className="text-3xl font-extrabold mb-3">Your Profile is Ready</h1>
          <p className="text-slate-400">Review what we extracted. This is the foundation of your pivot plans.</p>
        </div>

        {/* Summary card */}
        <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-teal-400 mb-4">Career Summary</h2>
          <div className="grid grid-cols-2 gap-4 text-sm">
            {profile.currentTitle && (
              <div>
                <span className="text-slate-500">Current title</span>
                <p className="text-white font-medium">{profile.currentTitle}</p>
              </div>
            )}
            {profile.currentIndustry && (
              <div>
                <span className="text-slate-500">Industry</span>
                <p className="text-white font-medium">{profile.currentIndustry}</p>
              </div>
            )}
            {profile.yearsExperience && (
              <div>
                <span className="text-slate-500">Years experience</span>
                <p className="text-white font-medium">{profile.yearsExperience} years</p>
              </div>
            )}
          </div>
        </div>

        {/* Skills */}
        {profile.transferableSkills.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-teal-400 mb-4">
              Transferable Skills
              <span className="text-slate-500 text-sm font-normal ml-2">({profile.transferableSkills.length} identified)</span>
            </h2>
            <div className="flex flex-wrap gap-2">
              {profile.transferableSkills.map((skill) => (
                <span key={skill} className="px-3 py-1 bg-teal-900/40 border border-teal-700/50 rounded-full text-teal-300 text-sm">
                  {skill}
                </span>
              ))}
            </div>
          </div>
        )}

        {/* Experience */}
        {profile.experience.length > 0 && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-teal-400 mb-4">Experience</h2>
            <div className="space-y-3">
              {profile.experience.slice(0, 5).map((exp, i) => (
                <div key={i} className="flex justify-between items-start text-sm">
                  <div>
                    <p className="text-white font-medium">{exp.title}</p>
                    <p className="text-slate-400">{exp.company}</p>
                  </div>
                  <span className="text-slate-500 text-xs whitespace-nowrap ml-4">
                    {exp.startYear} – {exp.endYear ?? "present"}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Location & Circumstances */}
        {(profile.location || profile.circumstances) && (
          <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6 mb-6">
            <h2 className="text-lg font-bold text-teal-400 mb-4">Your Constraints</h2>
            <div className="grid grid-cols-2 gap-4 text-sm">
              {profile.location && (
                <div>
                  <span className="text-slate-500">Location</span>
                  <p className="text-white font-medium">
                    {[profile.location.city, profile.location.region, profile.location.country].filter(Boolean).join(", ")}
                  </p>
                </div>
              )}
              {profile.circumstances?.salaryFloor && (
                <div>
                  <span className="text-slate-500">Salary floor</span>
                  <p className="text-white font-medium">{profile.circumstances.salaryFloor}</p>
                </div>
              )}
              {profile.circumstances?.timeline && (
                <div>
                  <span className="text-slate-500">Timeline</span>
                  <p className="text-white font-medium">{profile.circumstances.timeline}</p>
                </div>
              )}
              {profile.circumstances?.riskTolerance && (
                <div>
                  <span className="text-slate-500">Risk tolerance</span>
                  <p className="text-white font-medium capitalize">{profile.circumstances.riskTolerance}</p>
                </div>
              )}
              {profile.circumstances?.dependents && profile.circumstances.dependents !== "none" && (
                <div>
                  <span className="text-slate-500">Dependents</span>
                  <p className="text-white font-medium capitalize">{profile.circumstances.dependents}</p>
                </div>
              )}
              {profile.circumstances?.willingnessToRelocate && (
                <div>
                  <span className="text-slate-500">Relocation</span>
                  <p className="text-white font-medium">
                    {profile.circumstances.willingnessToRelocate === "yes" ? "Open to relocating" :
                     profile.circumstances.willingnessToRelocate === "no" ? "Staying in current area" :
                     "Remote preferred"}
                  </p>
                </div>
              )}
            </div>
          </div>
        )}

        <MatchScoreCard profile={profile} />

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 mb-6">
            {error}
          </p>
        )}

        <div className="bg-slate-800/60 border border-teal-700/30 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-teal-400 mb-2">Personalize Your Roadmap</h2>
          <p className="text-slate-400 text-sm mb-4">
            Take a quick values assessment (5-8 min) to get more tailored career recommendations.
          </p>
          <button
            onClick={() => router.push("/assessment")}
            className="px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-sm transition-colors shadow-lg shadow-teal-900/50"
          >
            Take Values Assessment →
          </button>
        </div>

        <div className="flex gap-4">
          <button
            onClick={() => router.push("/onboarding")}
            className="flex-1 px-6 py-4 rounded-xl border border-slate-600 hover:border-slate-400 text-slate-300 font-medium transition-colors"
          >
            ← Re-upload
          </button>
          <button
            onClick={handleGenerate}
            className="flex-[2] px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Skip Assessment & Generate →
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          We found {profile.skills.length} skills across your background. Claude will use all of them to build your roadmaps.
        </p>
      </div>
    </div>
  );
}
