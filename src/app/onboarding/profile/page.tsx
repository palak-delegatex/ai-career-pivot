"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/intake";

export default function ProfileReviewPage() {
  const router = useRouter();
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [generating, setGenerating] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const stored = sessionStorage.getItem("intake_profile");
    if (!stored) {
      router.replace("/onboarding");
      return;
    }
    setProfile(JSON.parse(stored));
  }, [router]);

  async function handleGenerate() {
    if (!profile) return;
    setGenerating(true);
    setError("");
    try {
      const res = await fetch("/api/intake/plan", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok) throw new Error((await res.json()).error ?? "Plan generation failed");
      const data = await res.json();
      sessionStorage.setItem("intake_plans", JSON.stringify(data.plans));
      router.push("/onboarding/plan");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setGenerating(false);
    }
  }

  if (!profile) {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="w-10 h-10 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (generating) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-2xl font-bold mb-3">Generating your pivot plans…</h2>
          <p className="text-slate-400">Building personalized 6-month, 1-year, and 2-year roadmaps</p>
        </div>
      </div>
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

        {error && (
          <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3 mb-6">
            {error}
          </p>
        )}

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
            Generate My Pivot Plans →
          </button>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          We found {profile.skills.length} skills across your background. Claude will use all of them to build your roadmaps.
        </p>
      </div>
    </div>
  );
}
