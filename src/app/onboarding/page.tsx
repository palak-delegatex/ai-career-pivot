"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import type { UserProfile } from "@/lib/intake";

type Step = "form" | "processing" | "error" | "no_payment";

const ANALYSIS_STEPS = [
  "Parsing document structure",
  "Extracting work history",
  "Identifying key skills",
  "Mapping to job market trends",
  "Generating personalized insights",
] as const;

const FUN_FACTS = [
  "Recruiters spend an average of 7 seconds on a first resume scan.",
  "Tailoring your resume to each role increases callback rates by 40%.",
  "Your skills section is often scanned before your experience.",
  "ATS systems filter out ~75% of resumes before a human sees them.",
  "Action verbs like 'spearheaded' and 'orchestrated' outperform passive language.",
] as const;

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
  const [activeStep, setActiveStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  useEffect(() => {
    const paymentEmail = sessionStorage.getItem("payment_email");
    const paymentSessionId = sessionStorage.getItem("payment_session_id");
    if (!paymentSessionId) {
      setStep("no_payment");
      return;
    }
    if (paymentEmail) setEmail(paymentEmail);
  }, []);

  useEffect(() => {
    if (step !== "processing") return;
    let timeout: ReturnType<typeof setTimeout>;
    let current = 0;
    function scheduleNext() {
      const delay = 6000 + Math.random() * 2000;
      timeout = setTimeout(() => {
        current += 1;
        if (current < ANALYSIS_STEPS.length) {
          setActiveStep(current);
          if (current < ANALYSIS_STEPS.length - 1) scheduleNext();
        }
      }, delay);
    }
    scheduleNext();
    return () => clearTimeout(timeout);
  }, [step]);

  useEffect(() => {
    if (step !== "processing") return;
    const cycle = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(cycle);
  }, [step]);

  const snapToComplete = useCallback(() => {
    setActiveStep(ANALYSIS_STEPS.length - 1);
  }, []);

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

      if (profile.name) setUserName(profile.name.split(" ")[0]);
      snapToComplete();

      // 4. Store profile in sessionStorage and navigate to review
      sessionStorage.setItem("intake_profile", JSON.stringify(profile));
      router.push("/onboarding/profile");
    } catch (err) {
      setStep("error");
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
    }
  }

  if (step === "no_payment") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">🔒</div>
          <h1 className="text-2xl font-bold mb-3">Purchase Required</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Get your personalized career pivot roadmap for $29. After payment, you&apos;ll upload your resume and we&apos;ll build your plan.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-10 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Get Started — $29 →
          </Link>
        </div>
      </div>
    );
  }

  if (step === "processing") {
    const headline = userName
      ? `Analyzing ${userName}'s background…`
      : "Our AI is reading between the lines";

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md w-full flex flex-col items-center">
          {/* Neural Document Scanner */}
          <div className="mb-8">
            <svg width="210" height="150" viewBox="0 0 210 150" fill="none" aria-label="AI analyzing resume">
              <defs>
                <filter id="scanGlow">
                  <feGaussianBlur stdDeviation="3" result="blur" />
                  <feMerge>
                    <feMergeNode in="blur" />
                    <feMergeNode in="SourceGraphic" />
                  </feMerge>
                </filter>
                <linearGradient id="scanGrad" x1="0" y1="0" x2="1" y2="0">
                  <stop offset="0%" stopColor="#2dd4bf" stopOpacity="0" />
                  <stop offset="20%" stopColor="#2dd4bf" stopOpacity="1" />
                  <stop offset="80%" stopColor="#2dd4bf" stopOpacity="1" />
                  <stop offset="100%" stopColor="#2dd4bf" stopOpacity="0" />
                </linearGradient>
              </defs>

              {/* Layer 1: Document silhouette */}
              <rect x="15" y="5" width="95" height="140" rx="6" fill="white" fillOpacity="0.15" />

              {/* Text rows — pulse bright as scan line passes */}
              <rect x="28" y="35" width="70" height="3" rx="1.5" fill="white" fillOpacity="0.3">
                <animate attributeName="fill-opacity" values="0.3;0.3;0.8;0.3;0.3" keyTimes="0;0.05;0.07;0.12;1" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="28" y="52" width="60" height="3" rx="1.5" fill="white" fillOpacity="0.3">
                <animate attributeName="fill-opacity" values="0.3;0.3;0.8;0.3;0.3" keyTimes="0;0.22;0.24;0.29;1" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="28" y="69" width="65" height="3" rx="1.5" fill="white" fillOpacity="0.3">
                <animate attributeName="fill-opacity" values="0.3;0.3;0.8;0.3;0.3" keyTimes="0;0.39;0.41;0.46;1" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="28" y="86" width="52" height="3" rx="1.5" fill="white" fillOpacity="0.3">
                <animate attributeName="fill-opacity" values="0.3;0.3;0.8;0.3;0.3" keyTimes="0;0.56;0.58;0.63;1" dur="3s" repeatCount="indefinite" />
              </rect>
              <rect x="28" y="103" width="58" height="3" rx="1.5" fill="white" fillOpacity="0.3">
                <animate attributeName="fill-opacity" values="0.3;0.3;0.8;0.3;0.3" keyTimes="0;0.73;0.75;0.80;1" dur="3s" repeatCount="indefinite" />
              </rect>

              {/* Layer 2: AI scan line with glow */}
              <g filter="url(#scanGlow)">
                <rect x="17" y="28" width="91" height="3" rx="1.5" fill="url(#scanGrad)">
                  <animateTransform attributeName="transform" type="translate" values="0 0;0 80;0 0" keyTimes="0;0.80;0.81" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.79;0.81;0.90;0.91" dur="3s" repeatCount="indefinite" />
                </rect>
              </g>

              {/* Layer 3: Neural network — connections from document to input nodes */}
              <line x1="110" y1="40" x2="138" y2="32" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.12">
                <animate attributeName="stroke-opacity" values="0.12;0.12;0.5;0.12;0.12" keyTimes="0;0.09;0.11;0.16;1" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="110" y1="57" x2="138" y2="57" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.12">
                <animate attributeName="stroke-opacity" values="0.12;0.12;0.5;0.12;0.12" keyTimes="0;0.26;0.28;0.33;1" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="110" y1="74" x2="138" y2="82" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.12">
                <animate attributeName="stroke-opacity" values="0.12;0.12;0.5;0.12;0.12" keyTimes="0;0.43;0.45;0.50;1" dur="3s" repeatCount="indefinite" />
              </line>
              <line x1="110" y1="91" x2="138" y2="107" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.12">
                <animate attributeName="stroke-opacity" values="0.12;0.12;0.5;0.12;0.12" keyTimes="0;0.60;0.62;0.67;1" dur="3s" repeatCount="indefinite" />
              </line>

              {/* Inter-node connections (input → output layer) */}
              <line x1="144" y1="32" x2="172" y2="48" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="57" x2="172" y2="48" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="57" x2="172" y2="78" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="82" x2="172" y2="78" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="82" x2="172" y2="108" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="107" x2="172" y2="108" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />

              {/* Input layer nodes (4) — light up sequentially as scan reads rows */}
              <circle cx="140" cy="32" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.1;0.5;0.1" keyTimes="0;0.10;0.13;0.18;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.25;0.7;0.25" keyTimes="0;0.10;0.13;0.18;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="140" cy="57" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.1;0.5;0.1" keyTimes="0;0.27;0.30;0.35;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.25;0.7;0.25" keyTimes="0;0.27;0.30;0.35;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="140" cy="82" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.1;0.5;0.1" keyTimes="0;0.44;0.47;0.52;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.25;0.7;0.25" keyTimes="0;0.44;0.47;0.52;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="140" cy="107" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.1;0.5;0.1" keyTimes="0;0.61;0.64;0.69;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.25;0.7;0.25" keyTimes="0;0.61;0.64;0.69;0.85;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>

              {/* Output layer nodes (3) — light up after all inputs, then all nodes pulse together */}
              <circle cx="175" cy="48" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.5;0.1" keyTimes="0;0.78;0.81;0.84;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.7;0.25" keyTimes="0;0.78;0.81;0.84;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="175" cy="78" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.5;0.1" keyTimes="0;0.78;0.81;0.84;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.7;0.25" keyTimes="0;0.78;0.81;0.84;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>
              <circle cx="175" cy="108" r="4" fill="#2dd4bf" fillOpacity="0.1" stroke="#2dd4bf" strokeWidth="1" strokeOpacity="0.25">
                <animate attributeName="fill-opacity" values="0.1;0.1;0.6;0.1;0.5;0.1" keyTimes="0;0.78;0.81;0.84;0.88;0.93" dur="3s" repeatCount="indefinite" />
                <animate attributeName="stroke-opacity" values="0.25;0.25;0.8;0.25;0.7;0.25" keyTimes="0;0.78;0.81;0.84;0.88;0.93" dur="3s" repeatCount="indefinite" />
              </circle>
            </svg>
          </div>

          <h2 className="text-2xl font-bold mb-1 text-center">{headline}</h2>
          <p className="text-slate-500 text-sm mb-8">Usually done in under 30 seconds</p>

          {/* Progress stepper */}
          <div className="w-full mb-8">
            {ANALYSIS_STEPS.map((label, i) => {
              const completed = i < activeStep;
              const active = i === activeStep;
              return (
                <div key={label} className="flex items-start gap-3 mb-3 last:mb-0">
                  <div className="flex-shrink-0 mt-0.5">
                    {completed ? (
                      <svg className="w-5 h-5 text-teal-400" fill="none" viewBox="0 0 20 20">
                        <circle cx="10" cy="10" r="10" fill="currentColor" opacity="0.15" />
                        <path d="M6 10.5l2.5 2.5 5.5-5.5" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" fill="none" />
                      </svg>
                    ) : active ? (
                      <span
                        className="block w-5 h-5 rounded-full bg-teal-400"
                        style={{ animation: "step-pulse 1.5s ease-in-out infinite" }}
                      />
                    ) : (
                      <span className="block w-5 h-5 rounded-full border-2 border-slate-600" />
                    )}
                  </div>
                  <span
                    className={
                      completed
                        ? "text-slate-400 text-sm"
                        : active
                          ? "text-white text-sm font-semibold"
                          : "text-slate-500 text-sm"
                    }
                  >
                    {label}
                  </span>
                </div>
              );
            })}
          </div>

          {/* Rotating fun facts */}
          <div className="w-full rounded-xl bg-white/[0.06] px-5 py-4 min-h-[60px] flex items-center justify-center">
            <p
              className="text-slate-300 text-sm text-center leading-relaxed"
              style={{
                animation: factVisible ? "fact-fade-in 0.4s ease-out forwards" : "none",
                opacity: factVisible ? 1 : 0,
                transition: factVisible ? "none" : "opacity 0.3s ease-out",
              }}
            >
              💡 {FUN_FACTS[factIndex]}
            </p>
          </div>
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
                onClick={(e) => e.stopPropagation()}
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
