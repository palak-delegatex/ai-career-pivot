"use client";

import { useState, useRef } from "react";
import { useRouter } from "next/navigation";
import type { UserProfile } from "@/lib/intake";

type Step = "form" | "processing" | "error";

export default function OnboardingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [step, setStep] = useState<Step>("form");
  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [processingMsg, setProcessingMsg] = useState("");
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!email || (!linkedinUrl && !resumeFile)) {
      setError("Please provide your email and at least one source (LinkedIn URL or resume).");
      return;
    }

    setStep("processing");
    setError("");

    try {
      let profile: UserProfile | null = null;

      // 1. Parse resume (primary if provided, higher quality than LinkedIn)
      if (resumeFile) {
        setProcessingMsg("Analyzing your resume…");
        const fd = new FormData();
        fd.append("resume", resumeFile);
        fd.append("email", email);
        const res = await fetch("/api/intake/resume", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Resume parsing failed");
        const data = await res.json();
        profile = { ...data.profile, email };
      }

      // 2. Merge LinkedIn data
      if (linkedinUrl) {
        setProcessingMsg("Fetching LinkedIn profile…");
        const res = await fetch("/api/intake/linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl, email }),
        });
        if (res.ok) {
          const data = await res.json();
          // Merge: LinkedIn fills gaps in resume data
          if (profile) {
            profile = {
              ...profile,
              currentTitle: profile.currentTitle ?? data.profile.currentTitle,
              currentIndustry: profile.currentIndustry ?? data.profile.currentIndustry,
              skills: [...new Set([...profile.skills, ...data.profile.skills])],
              transferableSkills: [...new Set([...profile.transferableSkills, ...data.profile.transferableSkills])],
              linkedinUrl,
            };
          } else {
            profile = { ...data.profile, email, linkedinUrl };
          }
        }
        // LinkedIn failure is non-fatal — continue with resume
      }

      // 3. Merge website context (optional)
      if (websiteUrl) {
        setProcessingMsg("Scanning your portfolio…");
        const res = await fetch("/api/intake/website", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ websiteUrl, email }),
        });
        if (res.ok && profile) {
          const data = await res.json();
          profile = {
            ...profile,
            skills: [...new Set([...profile.skills, ...data.context.skills])],
            interests: [...new Set([...(profile.interests ?? []), ...data.context.interests])],
            websiteUrl,
          };
        }
      }

      if (!profile) throw new Error("Could not extract a profile. Please upload your resume.");

      // 4. Store profile in sessionStorage and navigate to review
      sessionStorage.setItem("intake_profile", JSON.stringify(profile));
      router.push("/onboarding/profile");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (step === "processing") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-2xl font-bold mb-3">Analyzing your background…</h2>
          <p className="text-slate-400">{processingMsg}</p>
          <p className="text-slate-500 text-sm mt-4">This takes 20–40 seconds</p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full">
        <div className="text-center mb-10">
          <div className="text-5xl mb-4">🧭</div>
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Let&apos;s Build Your Roadmap
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Share your background and we&apos;ll generate a personalized career pivot plan — not generic advice.
          </p>
        </div>

        <form className="flex flex-col gap-5" onSubmit={handleSubmit}>
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Email address <span className="text-teal-400">*</span>
            </label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="you@example.com"
              required
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Resume upload <span className="text-teal-400">*</span>
              <span className="text-slate-500 font-normal ml-2">(PDF or DOCX)</span>
            </label>
            <div
              className="w-full px-4 py-4 rounded-xl bg-slate-800 border border-dashed border-slate-600 hover:border-teal-500 cursor-pointer text-center transition-colors"
              onClick={() => fileRef.current?.click()}
            >
              {resumeFile ? (
                <span className="text-teal-400 font-medium">{resumeFile.name}</span>
              ) : (
                <span className="text-slate-400">Click to upload resume</span>
              )}
              <input
                ref={fileRef}
                type="file"
                accept=".pdf,.docx,.doc,.txt"
                className="hidden"
                onChange={(e) => setResumeFile(e.target.files?.[0] ?? null)}
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              LinkedIn URL
              <span className="text-slate-500 font-normal ml-2">(optional, improves accuracy)</span>
            </label>
            <input
              type="url"
              value={linkedinUrl}
              onChange={(e) => setLinkedinUrl(e.target.value)}
              placeholder="https://linkedin.com/in/yourprofile"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-2">
              Portfolio or personal site
              <span className="text-slate-500 font-normal ml-2">(optional)</span>
            </label>
            <input
              type="url"
              value={websiteUrl}
              onChange={(e) => setWebsiteUrl(e.target.value)}
              placeholder="https://yoursite.com"
              className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500"
            />
          </div>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50 mt-2"
          >
            Analyze My Background →
          </button>
        </form>

        <p className="text-slate-500 text-xs text-center mt-6">
          Your data is processed securely and never shared. You can request deletion anytime.
        </p>
      </div>
    </div>
  );
}
