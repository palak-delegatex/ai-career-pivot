"use client";

import { useState, useRef, useEffect, useCallback } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import { StepIndicator } from "@/components/StepIndicator";
import type { UserProfile, UserCircumstances, UserLocation, PivotPlan, ValuesAssessment } from "@/lib/intake";
import StreamingPlanGeneration from "@/components/StreamingPlanGeneration";
import { trackOnboardingStarted, trackOnboardingCompleted, trackOnboardingError, trackAiInsightsReceived, getFeatureFlagVariant, trackExperimentViewed, trackExperimentConversion, trackLinkedinImportStarted, trackLinkedinImportCompleted, trackLinkedinImportError, trackQuickPivotGenerated } from "@/lib/tracking";
import type { QuickPivotResult } from "@/app/api/intake/quick-pivot/route";
import { computeATSMatchBreakdown, type MatchRateBreakdown, type JDKeywords } from "@/lib/ats-scoring";
import { ScoreRing } from "@/components/ScoreRing";

const GENERIC_JD_KEYWORDS: JDKeywords = {
  required: [
    "communication", "teamwork", "problem solving", "leadership",
    "project management", "analytical", "collaboration",
  ],
  preferred: [
    "strategic thinking", "data analysis", "stakeholder management",
    "agile", "cross-functional", "presentation", "mentoring",
  ],
  keywords: [
    "results-driven", "detail-oriented", "initiative", "innovation",
    "deadline", "budget", "planning", "reporting", "process improvement",
    "customer", "metrics", "KPI", "growth", "optimization",
  ],
};

type PageStep = "form" | "processing" | "error" | "no_payment" | "generating";

function normalizeLinkedinUrl(raw: string): string {
  let url = raw.trim();
  if (!url) return url;
  // Add protocol if missing
  if (!/^https?:\/\//i.test(url)) url = "https://" + url;
  try {
    const u = new URL(url);
    // Strip query params and hash, normalize to just the path
    const clean = `https://www.linkedin.com${u.pathname}`.replace(/\/+$/, "");
    // Validate it looks like a linkedin.com/in/ profile URL
    if (/linkedin\.com\/(in|pub)\/[^/]+/i.test(clean)) return clean;
  } catch {
    // Fall through — return as-is
  }
  return url;
}

function linkedinUrlStatus(url: string): "empty" | "valid" | "invalid" {
  if (!url) return "empty";
  return /linkedin\.com\/(in|pub)\/[^/]+/i.test(url) ? "valid" : "invalid";
}

function extractLinkedinUsername(url: string): string | null {
  const match = url.match(/linkedin\.com\/(?:in|pub)\/([^/?#]+)/i);
  return match ? decodeURIComponent(match[1]).replace(/-/g, " ") : null;
}

const WIZARD_STEPS = ["Verify Profile", "Preferences"];

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

const SALARY_RANGES = [
  { value: "", label: "Prefer not to say" },
  { value: "Under $30,000", label: "Under $30,000" },
  { value: "$30,000 – $50,000", label: "$30,000 – $50,000" },
  { value: "$50,000 – $75,000", label: "$50,000 – $75,000" },
  { value: "$75,000 – $100,000", label: "$75,000 – $100,000" },
  { value: "$100,000 – $150,000", label: "$100,000 – $150,000" },
  { value: "$150,000 – $200,000", label: "$150,000 – $200,000" },
  { value: "Over $200,000", label: "Over $200,000" },
] as const;

function getUserTeasers(name: string): string[] {
  return [
    `${name}, your transferable skills may unlock more roles than you think.`,
    `${name}, AI is mapping your experience to the latest market trends.`,
    `We're identifying ${name}'s strongest career pivot angles.`,
    `${name}, your background is being analyzed across 50+ industries.`,
    `Personalized insights are being generated just for ${name}.`,
  ];
}

function validateEmail(value: string): string {
  if (!value) return "";
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(value) ? "" : "Please enter a valid email address";
}

function validateResumeFile(file: File): string {
  const ext = "." + (file.name.split(".").pop()?.toLowerCase() ?? "");
  if (![".pdf", ".docx", ".doc", ".txt"].includes(ext)) return "Please upload a PDF, DOCX, or TXT file";
  if (file.size > 10 * 1024 * 1024) return "File must be under 10 MB";
  return "";
}

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: {
    x: 0,
    opacity: 1,
  },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

function parseInsightsFromStream(text: string): string[] {
  return text
    .split("\n")
    .map((line) => line.replace(/^\d+[\.\)]\s*/, "").trim())
    .filter((line) => line.length > 10);
}

export default function OnboardingPage() {
  const router = useRouter();
  const fileRef = useRef<HTMLInputElement>(null);

  const [pageStep, setPageStep] = useState<PageStep>("form");
  const [wizardStep, setWizardStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [email, setEmail] = useState("");
  const [linkedinUrl, setLinkedinUrl] = useState("");
  const [websiteUrl, setWebsiteUrl] = useState("");
  const [resumeFile, setResumeFile] = useState<File | null>(null);
  const [, setProcessingMsg] = useState("");
  const [error, setError] = useState("");
  const [activeStep, setActiveStep] = useState(0);
  const [factIndex, setFactIndex] = useState(0);
  const [factVisible, setFactVisible] = useState(true);
  const [userName, setUserName] = useState<string | null>(null);

  const [circumstances, setCircumstances] = useState<UserCircumstances>({
    timeline: "6-12 months",
    riskTolerance: "moderate",
    willingnessToRelocate: "remote-preferred",
  });
  const [location, setLocation] = useState<UserLocation | null>(null);
  const [locationText, setLocationText] = useState("");
  const [detectingLocation, setDetectingLocation] = useState(false);

  const [aiInsights, setAiInsights] = useState<string[]>([]);
  const [insightIndex, setInsightIndex] = useState(0);
  const [insightVisible, setInsightVisible] = useState(true);
  const insightsReady = aiInsights.length > 0;

  const [ctaVariant, setCtaVariant] = useState<string>("control");

  const [dropActive, setDropActive] = useState(false);
  const [gpsResolved, setGpsResolved] = useState(false);
  const [linkedinPasting, setLinkedinPasting] = useState(false);
  const [linkedinPreview, setLinkedinPreview] = useState<{ username: string } | null>(null);

  const [emailError, setEmailError] = useState("");
  const [emailTouched, setEmailTouched] = useState(false);
  const [resumeError, setResumeError] = useState("");
  const [celebration, setCelebration] = useState<string | null>(null);
  const [generatingProfile, setGeneratingProfile] = useState<UserProfile | null>(null);

  type LinkedInTab = "url" | "export";
  const [linkedinTab, setLinkedinTab] = useState<LinkedInTab>("url");
  const [linkedinExportFile, setLinkedinExportFile] = useState<File | null>(null);
  const [linkedinExportError, setLinkedinExportError] = useState("");
  const [linkedinImporting, setLinkedinImporting] = useState(false);
  const [linkedinImportedProfile, setLinkedinImportedProfile] = useState<UserProfile | null>(null);
  const [quickPivotResult, setQuickPivotResult] = useState<QuickPivotResult | null>(null);
  const [quickPivotLoading, setQuickPivotLoading] = useState(false);
  const linkedinExportRef = useRef<HTMLInputElement>(null);

  const [resumePreviewScore, setResumePreviewScore] = useState<MatchRateBreakdown | null>(null);
  const [resumePreviewAnimated, setResumePreviewAnimated] = useState(false);

  useEffect(() => {
    if (!resumeFile) {
      setResumePreviewScore(null);
      setResumePreviewAnimated(false);
      return;
    }
    const reader = new FileReader();
    reader.onload = () => {
      const text = typeof reader.result === "string"
        ? reader.result.replace(/[^\x20-\x7E\n\r\t]/g, " ")
        : "";
      if (text.trim().length < 20) return;
      const result = computeATSMatchBreakdown(text, GENERIC_JD_KEYWORDS, {
        fileType: resumeFile.name.split(".").pop()?.toLowerCase(),
      });
      setResumePreviewScore(result);
      requestAnimationFrame(() => setResumePreviewAnimated(true));
    };
    reader.readAsText(resumeFile);
  }, [resumeFile]);

  useEffect(() => {
    if (linkedinUrlStatus(linkedinUrl) === "valid") {
      const username = extractLinkedinUsername(linkedinUrl);
      setLinkedinPreview(username ? { username } : null);
    } else {
      setLinkedinPreview(null);
    }
  }, [linkedinUrl]);

  async function pasteLinkedinFromClipboard() {
    try {
      setLinkedinPasting(true);
      const text = await navigator.clipboard.readText();
      const normalized = normalizeLinkedinUrl(text.trim());
      if (linkedinUrlStatus(normalized) === "valid") {
        setLinkedinUrl(normalized);
      } else if (text.trim()) {
        setLinkedinUrl(text.trim());
      }
    } catch {
      // Clipboard permission denied — ignore silently
    } finally {
      setLinkedinPasting(false);
    }
  }

  async function fetchQuickPivot(profile: UserProfile) {
    setQuickPivotLoading(true);
    try {
      const res = await fetch("/api/intake/quick-pivot", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (res.ok) {
        const data: QuickPivotResult = await res.json();
        setQuickPivotResult(data);
        trackQuickPivotGenerated({
          paths_count: data.pivotPaths.length,
          top_match_score: data.pivotPaths[0]?.matchScore ?? 0,
        });
      }
    } catch {
      // Non-fatal — preview is a bonus
    } finally {
      setQuickPivotLoading(false);
    }
  }

  async function handleLinkedinImport() {
    if (linkedinTab === "url") {
      if (linkedinUrlStatus(linkedinUrl) !== "valid") return;
      setLinkedinImporting(true);
      trackLinkedinImportStarted({ method: "url" });
      try {
        const res = await fetch("/api/intake/linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl, email }),
        });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "LinkedIn import failed");
        }
        const data = await res.json();
        const profile: UserProfile = { ...data.profile, email, linkedinUrl };
        setLinkedinImportedProfile(profile);
        trackLinkedinImportCompleted({
          method: "url",
          skills_count: profile.skills?.length ?? 0,
          experience_count: profile.experience?.length ?? 0,
        });
        fetchQuickPivot(profile);
      } catch (err) {
        const message = err instanceof Error ? err.message : "LinkedIn import failed";
        setLinkedinExportError(message);
        trackLinkedinImportError({ method: "url", error: message });
      } finally {
        setLinkedinImporting(false);
      }
    } else {
      if (!linkedinExportFile) return;
      setLinkedinImporting(true);
      trackLinkedinImportStarted({ method: "data-export" });
      try {
        const fd = new FormData();
        fd.append("linkedinExport", linkedinExportFile);
        fd.append("email", email);
        const res = await fetch("/api/intake/linkedin-export", { method: "POST", body: fd });
        if (!res.ok) {
          const err = await res.json().catch(() => ({}));
          throw new Error(err.error ?? "LinkedIn export import failed");
        }
        const data = await res.json();
        const profile: UserProfile = { ...data.profile, email };
        setLinkedinImportedProfile(profile);
        trackLinkedinImportCompleted({
          method: "data-export",
          skills_count: profile.skills?.length ?? 0,
          experience_count: profile.experience?.length ?? 0,
        });
        fetchQuickPivot(profile);
      } catch (err) {
        const message = err instanceof Error ? err.message : "LinkedIn export import failed";
        setLinkedinExportError(message);
        trackLinkedinImportError({ method: "data-export", error: message });
      } finally {
        setLinkedinImporting(false);
      }
    }
  }

  function clearLinkedinImport() {
    setLinkedinImportedProfile(null);
    setQuickPivotResult(null);
    setLinkedinExportError("");
  }

  const [showAdvanced, setShowAdvanced] = useState(false);

  useEffect(() => {
    const paymentEmail = sessionStorage.getItem("payment_email");
    const paymentSessionId = sessionStorage.getItem("payment_session_id");
    const freeProfile = sessionStorage.getItem("free_profile");
    const getStartedEmail = sessionStorage.getItem("get_started_email");

    if (!paymentSessionId && !freeProfile) {
      setPageStep("no_payment");
      return;
    }

    if (paymentEmail) setEmail(paymentEmail);
    else if (getStartedEmail) setEmail(getStartedEmail);

    if (freeProfile) {
      try {
        const profile = JSON.parse(freeProfile);
        if (profile.linkedinUrl) setLinkedinUrl(profile.linkedinUrl);
        if (profile.email && !paymentEmail) setEmail(profile.email);
        setLinkedinImportedProfile(profile);
      } catch {
        // Non-fatal
      }
    }
  }, []);

  useEffect(() => {
    if (typeof window === "undefined") return;
    import("posthog-js").then(({ default: posthog }) => {
      posthog.onFeatureFlags(() => {
        const variant = getFeatureFlagVariant("onboarding_cta_copy", "control");
        setCtaVariant(variant);
        sessionStorage.setItem("ab_onboarding_cta_copy", variant);
        trackExperimentViewed({ flag: "onboarding_cta_copy", variant, page: "onboarding" });
      });
    });
  }, []);

  // activeStep is now driven directly by handleSubmit API progress — no timer needed

  useEffect(() => {
    if (pageStep !== "processing" || insightsReady) return;
    const cycle = setInterval(() => {
      setFactVisible(false);
      setTimeout(() => {
        setFactIndex((prev) => (prev + 1) % FUN_FACTS.length);
        setFactVisible(true);
      }, 400);
    }, 5000);
    return () => clearInterval(cycle);
  }, [pageStep, insightsReady]);

  useEffect(() => {
    if (pageStep !== "processing" || !insightsReady) return;
    setInsightVisible(true);
    const cycle = setInterval(() => {
      setInsightVisible(false);
      setTimeout(() => {
        setInsightIndex((prev) => (prev + 1) % aiInsights.length);
        setInsightVisible(true);
      }, 400);
    }, 6000);
    return () => clearInterval(cycle);
  }, [pageStep, insightsReady, aiInsights.length]);

  // snapToComplete removed — activeStep is now set directly in handleSubmit

  function goNext() {
    setDirection(1);
    setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
  }

  function goBack() {
    setDirection(-1);
    setWizardStep((s) => Math.max(s - 1, 0));
  }

  function celebrateThenAdvance(message: string) {
    setCelebration(message);
    setTimeout(() => {
      setCelebration(null);
      setDirection(1);
      setWizardStep((s) => Math.min(s + 1, WIZARD_STEPS.length - 1));
    }, 600);
  }

  function canAdvanceStep1(): boolean {
    return !!email && (!!linkedinUrl || !!resumeFile || !!linkedinImportedProfile || !!linkedinExportFile);
  }

  function handleStep1Next() {
    setEmailTouched(true);
    const emailErr = validateEmail(email);
    if (emailErr) {
      setEmailError(emailErr);
      return;
    }
    if (!canAdvanceStep1()) {
      setError("Please provide your email and at least one source (LinkedIn profile or resume).");
      return;
    }
    setError("");
    setEmailError("");
    celebrateThenAdvance(linkedinImportedProfile ? "LinkedIn profile imported" : "Background info saved");
  }

  function handleStep2Next() {
    celebrateThenAdvance("Sources added");
  }

  async function fetchInsights(profile: UserProfile) {
    try {
      const res = await fetch("/api/intake/insights", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      if (!res.ok || !res.body) return;

      const reader = res.body.getReader();
      const decoder = new TextDecoder();
      let accumulated = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) break;
        accumulated += decoder.decode(value, { stream: true });
        const parsed = parseInsightsFromStream(accumulated);
        if (parsed.length > 0) {
          setAiInsights(parsed);
        }
      }
      const finalParsed = parseInsightsFromStream(accumulated);
      if (finalParsed.length > 0) {
        trackAiInsightsReceived({ insights_count: finalParsed.length });
      }
    } catch {
      // Non-fatal — fun facts continue as fallback
    }
  }

  async function detectLocation() {
    if (!navigator.geolocation) return;
    setDetectingLocation(true);
    setGpsResolved(false);
    navigator.geolocation.getCurrentPosition(
      async (pos) => {
        try {
          const res = await fetch(
            `https://nominatim.openstreetmap.org/reverse?lat=${pos.coords.latitude}&lon=${pos.coords.longitude}&format=json&accept-language=en`,
            { headers: { "User-Agent": "AICareerPivot/1.0" } }
          );
          if (res.ok) {
            const data = await res.json();
            const addr = data.address ?? {};
            const city = addr.city ?? addr.town ?? addr.village ?? "";
            const region = addr.state ?? "";
            const country = addr.country ?? "";
            setLocation({ city, region, country, source: "gps" });
            setLocationText([city, region, country].filter(Boolean).join(", "));
            setGpsResolved(true);
            setTimeout(() => setGpsResolved(false), 1500);
          }
        } catch {
          // Non-fatal
        } finally {
          setDetectingLocation(false);
        }
      },
      () => setDetectingLocation(false),
      { timeout: 10000 }
    );
  }

  function handleLocationManualChange(value: string) {
    setLocationText(value);
    const parts = value.split(",").map((s) => s.trim());
    if (parts.length >= 1 && parts[0]) {
      setLocation({
        city: parts[0],
        region: parts[1] ?? "",
        country: parts[2] ?? "",
        source: "manual",
      });
    } else {
      setLocation(null);
    }
  }

  const handleStreamComplete = useCallback((plans: PivotPlan[], reportId?: string) => {
    if (reportId) {
      sessionStorage.removeItem("payment_session_id");
      sessionStorage.removeItem("payment_email");
      sessionStorage.removeItem("intake_profile");
      sessionStorage.removeItem("values_assessment");
      router.push(`/report/${reportId}`);
    } else {
      sessionStorage.setItem("intake_plans", JSON.stringify(plans));
      router.push("/onboarding/plan");
    }
  }, [router]);

  const handleStreamError = useCallback((message: string) => {
    setPageStep("error");
    setError(message);
  }, []);

  async function handleSubmit() {
    const hasCircumstancesData = Object.values(circumstances).some(Boolean);
    trackExperimentConversion({ flag: "onboarding_cta_copy", variant: ctaVariant, event: "form_submitted", page: "onboarding" });
    trackOnboardingStarted({
      has_resume: !!resumeFile,
      has_linkedin: !!linkedinUrl,
      has_website: !!websiteUrl,
      has_location: !!location,
      has_circumstances: hasCircumstancesData,
    });

    setPageStep("processing");
    setActiveStep(0);
    setError("");

    try {
      let profile: UserProfile | null = linkedinImportedProfile ? { ...linkedinImportedProfile } : null;

      if (resumeFile) {
        setProcessingMsg("Analyzing your resume...");
        const fd = new FormData();
        fd.append("resume", resumeFile);
        fd.append("email", email);
        const res = await fetch("/api/intake/resume", { method: "POST", body: fd });
        if (!res.ok) throw new Error((await res.json()).error ?? "Resume parsing failed");
        const data = await res.json();
        if (profile) {
          profile = {
            ...profile,
            currentTitle: profile.currentTitle ?? data.profile.currentTitle,
            currentIndustry: profile.currentIndustry ?? data.profile.currentIndustry,
            skills: [...new Set([...profile.skills, ...(data.profile.skills ?? [])])],
            transferableSkills: [...new Set([...profile.transferableSkills, ...(data.profile.transferableSkills ?? [])])],
            experience: [...profile.experience, ...(data.profile.experience ?? [])].filter(
              (e, i, arr) => arr.findIndex(x => x.title === e.title && x.company === e.company) === i
            ),
            education: [...profile.education, ...(data.profile.education ?? [])].filter(
              (e, i, arr) => arr.findIndex(x => x.institution === e.institution && x.degree === e.degree) === i
            ),
            certifications: [...new Set([...profile.certifications, ...(data.profile.certifications ?? [])])],
          };
        } else {
          profile = { ...data.profile, email };
        }
        setActiveStep(1);
      }

      if (linkedinUrl && !linkedinImportedProfile) {
        setProcessingMsg("Fetching LinkedIn profile...");
        setActiveStep(2);
        const res = await fetch("/api/intake/linkedin", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ linkedinUrl, email }),
        });
        if (res.ok) {
          const data = await res.json();
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
        } else if (!profile) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(
            errData.error ?? "LinkedIn fetch failed. Make sure your profile is public, or upload your resume instead."
          );
        }
      } else if (linkedinExportFile && !linkedinImportedProfile) {
        setProcessingMsg("Processing LinkedIn data export...");
        setActiveStep(2);
        const fd = new FormData();
        fd.append("linkedinExport", linkedinExportFile);
        fd.append("email", email);
        const res = await fetch("/api/intake/linkedin-export", { method: "POST", body: fd });
        if (res.ok) {
          const data = await res.json();
          if (profile) {
            profile = {
              ...profile,
              currentTitle: profile.currentTitle ?? data.profile.currentTitle,
              currentIndustry: profile.currentIndustry ?? data.profile.currentIndustry,
              skills: [...new Set([...profile.skills, ...(data.profile.skills ?? [])])],
              transferableSkills: [...new Set([...profile.transferableSkills, ...(data.profile.transferableSkills ?? [])])],
            };
          } else {
            profile = { ...data.profile, email };
          }
        } else if (!profile) {
          const errData = await res.json().catch(() => ({}));
          throw new Error(errData.error ?? "LinkedIn export processing failed.");
        }
      }

      if (profile && profile.skills?.length > 0) {
        fetchInsights(profile);
      }

      if (websiteUrl) {
        setProcessingMsg("Scanning your portfolio...");
        setActiveStep(3);
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

      const hasCircumstances = Object.values(circumstances).some(Boolean);
      if (hasCircumstances) profile.circumstances = circumstances;
      if (location) profile.location = location;

      if (profile.name) setUserName(profile.name.split(" ")[0]);
      setActiveStep(ANALYSIS_STEPS.length - 1);

      trackOnboardingCompleted({
        has_resume: !!resumeFile,
        has_linkedin: !!linkedinUrl,
        has_website: !!websiteUrl,
        skills_count: profile.skills.length,
      });

      sessionStorage.setItem("intake_profile", JSON.stringify(profile));
      setGeneratingProfile(profile);
      setPageStep("generating");
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong. Please try again.";
      trackOnboardingError({ error: message, stage: "form_submission" });
      setPageStep("error");
      setError(message);
    }
  }

  if (pageStep === "no_payment") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">&#x1f512;</div>
          <h1 className="text-2xl font-bold mb-3">Get Started First</h1>
          <p className="text-slate-400 mb-8 leading-relaxed">
            Start with a free career pivot analysis, then upgrade to the full roadmap when you&apos;re ready.
          </p>
          <div className="flex flex-col gap-3">
            <Link
              href="/get-started"
              className="inline-block px-10 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
            >
              Get Free Analysis &rarr;
            </Link>
            <Link
              href="/pricing"
              className="text-sm text-slate-400 hover:text-slate-300 underline transition-colors"
            >
              Or purchase the full report directly — $19
            </Link>
          </div>
        </div>
      </div>
    );
  }

  if (pageStep === "generating" && generatingProfile) {
    const storedPaymentId = typeof window !== "undefined" ? sessionStorage.getItem("payment_session_id") : null;
    const storedAssessment = typeof window !== "undefined" ? sessionStorage.getItem("values_assessment") : null;
    const parsedAssessment: ValuesAssessment | undefined = storedAssessment ? JSON.parse(storedAssessment) : undefined;

    return (
      <StreamingPlanGeneration
        profile={generatingProfile}
        paymentSessionId={storedPaymentId ?? undefined}
        valuesAssessment={parsedAssessment}
        showProfileSummary
        onComplete={handleStreamComplete}
        onError={handleStreamError}
      />
    );
  }

  if (pageStep === "processing") {
    const displayName = linkedinPreview?.username ?? userName ?? (email ? email.split("@")[0] : null);
    const headline = displayName
      ? `Analyzing ${displayName}'s background...`
      : "Our AI is reading between the lines";

    const teasers = displayName ? getUserTeasers(displayName) : null;
    const displayInsight = insightsReady ? aiInsights[insightIndex] : null;
    const displayFact = !insightsReady ? (teasers ? teasers[factIndex % teasers.length] : FUN_FACTS[factIndex]) : null;

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-lg w-full flex flex-col items-center">
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

              <rect x="15" y="5" width="95" height="140" rx="6" fill="white" fillOpacity="0.15" />

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

              <g filter="url(#scanGlow)">
                <rect x="17" y="28" width="91" height="3" rx="1.5" fill="url(#scanGrad)">
                  <animateTransform attributeName="transform" type="translate" values="0 0;0 80;0 0" keyTimes="0;0.80;0.81" dur="3s" repeatCount="indefinite" />
                  <animate attributeName="opacity" values="1;1;0;0;1" keyTimes="0;0.79;0.81;0.90;0.91" dur="3s" repeatCount="indefinite" />
                </rect>
              </g>

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

              <line x1="144" y1="32" x2="172" y2="48" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="57" x2="172" y2="48" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="57" x2="172" y2="78" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="82" x2="172" y2="78" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="82" x2="172" y2="108" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />
              <line x1="144" y1="107" x2="172" y2="108" stroke="#2dd4bf" strokeWidth="0.75" strokeOpacity="0.08" />

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

          {insightsReady ? (
            <div className="w-full rounded-xl bg-gradient-to-br from-teal-950/40 to-slate-800/60 border border-teal-800/30 px-5 py-5 min-h-[80px]">
              <div className="flex items-center gap-2 mb-3">
                <span className="inline-flex items-center gap-1.5 text-xs font-semibold text-teal-400 uppercase tracking-wider">
                  <svg className="w-3.5 h-3.5" viewBox="0 0 16 16" fill="currentColor">
                    <path d="M8 1a.75.75 0 01.75.75v1.5a.75.75 0 01-1.5 0v-1.5A.75.75 0 018 1zm4.95 2.05a.75.75 0 010 1.06l-1.06 1.06a.75.75 0 11-1.06-1.06l1.06-1.06a.75.75 0 011.06 0zM14.25 7.25a.75.75 0 010 1.5h-1.5a.75.75 0 010-1.5h1.5zM12.89 11.83a.75.75 0 01-1.06 1.06l-1.06-1.06a.75.75 0 011.06-1.06l1.06 1.06zM8.75 12.75a.75.75 0 00-1.5 0v1.5a.75.75 0 001.5 0v-1.5zM4.17 12.89a.75.75 0 01-1.06-1.06l1.06-1.06a.75.75 0 111.06 1.06l-1.06 1.06zM3.25 8.75a.75.75 0 010-1.5h-1.5a.75.75 0 010 1.5h1.5zM4.17 3.11a.75.75 0 011.06 1.06L4.17 5.23a.75.75 0 01-1.06-1.06l1.06-1.06z" />
                  </svg>
                  AI Insight — based on your profile
                </span>
              </div>
              <p
                className="text-slate-200 text-sm leading-relaxed"
                style={{
                  animation: insightVisible ? "fact-fade-in 0.4s ease-out forwards" : "none",
                  opacity: insightVisible ? 1 : 0,
                  transition: insightVisible ? "none" : "opacity 0.3s ease-out",
                }}
              >
                {displayInsight}
              </p>
              <div className="flex gap-1 mt-3 justify-center">
                {aiInsights.map((_, i) => (
                  <span
                    key={i}
                    className={`block w-1.5 h-1.5 rounded-full transition-colors duration-300 ${
                      i === insightIndex ? "bg-teal-400" : "bg-slate-600"
                    }`}
                  />
                ))}
              </div>
            </div>
          ) : (
            <div className="w-full rounded-xl bg-white/[0.06] px-5 py-4 min-h-[60px] flex items-center justify-center">
              <p
                className="text-slate-300 text-sm text-center leading-relaxed"
                style={{
                  animation: factVisible ? "fact-fade-in 0.4s ease-out forwards" : "none",
                  opacity: factVisible ? 1 : 0,
                  transition: factVisible ? "none" : "opacity 0.3s ease-out",
                }}
              >
                {displayFact}
              </p>
            </div>
          )}
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6 py-20 pb-24 md:pb-20">
      <div className="max-w-lg w-full">
        <div className="text-center mb-8">
          <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
            Let&apos;s Build Your Roadmap
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            Share your background and we&apos;ll generate a personalized career pivot plan.
          </p>
        </div>

        <StepIndicator steps={WIZARD_STEPS} currentStep={wizardStep} estimatedTime="~2 minutes" />

        <AnimatePresence>
          {celebration && (
            <motion.div
              initial={{ opacity: 0, y: -10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0 }}
              className="text-center mb-4"
            >
              <span className="text-sm font-medium" style={{ color: "var(--chart-3)" }}>
                &#10003; {celebration}
              </span>
            </motion.div>
          )}
        </AnimatePresence>

        <div className="relative overflow-hidden min-h-[340px]">
          <AnimatePresence initial={false} custom={direction} mode="wait">
            {wizardStep === 0 && (
              <motion.div
                key="step-0"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-col gap-5"
              >
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Email address <span className="text-teal-400">*</span>
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => { setEmail(e.target.value); if (emailTouched) setEmailError(validateEmail(e.target.value)); }}
                    onBlur={() => { setEmailTouched(true); setEmailError(validateEmail(email)); }}
                    placeholder="you@example.com"
                    required
                    className={`w-full px-4 py-3 rounded-xl bg-slate-800 border focus:outline-none text-white placeholder-slate-500 transition-colors ${
                      emailTouched && emailError
                        ? "border-[var(--destructive)] focus:border-[var(--destructive)]"
                        : emailTouched && email && !emailError
                          ? "border-teal-500/70 focus:border-teal-400"
                          : "border-slate-600 focus:border-teal-500"
                    }`}
                  />
                  {emailTouched && emailError && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>{emailError}</p>
                  )}
                  {emailTouched && email && !emailError && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--chart-3)" }}>&#10003; Valid email</p>
                  )}
                </div>

                {/* LinkedIn Import — Primary fast path */}
                <div className="rounded-xl bg-slate-800/60 border border-slate-700/60 p-4">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-[#0A66C2]" viewBox="0 0 24 24" fill="currentColor">
                      <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                    </svg>
                    <span className="text-sm font-semibold text-slate-200">Import from LinkedIn</span>
                    <span className="ml-auto text-xs text-teal-400 font-medium">Fastest</span>
                  </div>

                  {linkedinImportedProfile ? (
                    <div className="space-y-3">
                      <div className="flex items-center justify-between px-3 py-2.5 rounded-lg bg-teal-950/40 border border-teal-800/40">
                        <div className="flex items-center gap-2">
                          <span className="text-teal-400">&#10003;</span>
                          <div>
                            <p className="text-sm font-medium text-teal-300">
                              {linkedinImportedProfile.name ?? linkedinPreview?.username ?? "Profile"} imported
                            </p>
                            <p className="text-xs text-slate-400">
                              {linkedinImportedProfile.skills.length} skills &middot; {linkedinImportedProfile.experience.length} roles &middot; {linkedinImportedProfile.education.length} education
                            </p>
                          </div>
                        </div>
                        <button
                          type="button"
                          onClick={clearLinkedinImport}
                          className="text-xs text-slate-500 hover:text-slate-300 transition-colors"
                        >
                          Clear
                        </button>
                      </div>

                      {/* Quick Pivot Preview */}
                      {quickPivotLoading && (
                        <div className="px-3 py-3 rounded-lg bg-slate-800/80 border border-slate-700/40">
                          <div className="flex items-center gap-2">
                            <svg className="w-4 h-4 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none">
                              <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                            </svg>
                            <span className="text-xs text-slate-400">Generating pivot suggestions...</span>
                          </div>
                        </div>
                      )}

                      {quickPivotResult && (
                        <div className="space-y-2">
                          <p className="text-xs font-medium text-slate-400 uppercase tracking-wider">Instant pivot preview</p>

                          {/* Skill snapshot */}
                          <div className="flex gap-2 flex-wrap">
                            {quickPivotResult.skillGapPreview.strongSkills.slice(0, 4).map((skill) => (
                              <span key={skill} className="px-2 py-1 rounded-full bg-teal-950/50 border border-teal-800/30 text-xs text-teal-300">
                                {skill}
                              </span>
                            ))}
                            {quickPivotResult.skillGapPreview.strongSkills.length > 4 && (
                              <span className="px-2 py-1 text-xs text-slate-500">
                                +{quickPivotResult.skillGapPreview.strongSkills.length - 4} more
                              </span>
                            )}
                          </div>

                          {/* Top pivot suggestions */}
                          {quickPivotResult.pivotPaths.slice(0, 3).map((path, i) => (
                            <div key={i} className="flex items-center gap-3 px-3 py-2 rounded-lg bg-slate-800/60 border border-slate-700/30">
                              <div className="flex-shrink-0 w-10 h-10 rounded-lg bg-gradient-to-br from-teal-600/20 to-slate-700/40 flex items-center justify-center">
                                <span className="text-sm font-bold text-teal-400">{path.matchScore}%</span>
                              </div>
                              <div className="min-w-0 flex-1">
                                <p className="text-sm font-medium text-slate-200 truncate">{path.targetRole}</p>
                                <p className="text-xs text-slate-500 truncate">{path.targetIndustry} &middot; {path.timeToTransition}</p>
                              </div>
                            </div>
                          ))}

                          {quickPivotResult.skillGapPreview.growthAreas.length > 0 && (
                            <div className="flex items-start gap-2 px-3 py-2 rounded-lg bg-amber-950/20 border border-amber-800/20">
                              <span className="text-amber-400 text-xs mt-0.5">&#9650;</span>
                              <p className="text-xs text-amber-300/80">
                                Growth areas: {quickPivotResult.skillGapPreview.growthAreas.slice(0, 3).join(", ")}
                                {quickPivotResult.skillGapPreview.growthAreas.length > 3 && ` +${quickPivotResult.skillGapPreview.growthAreas.length - 3} more`}
                              </p>
                            </div>
                          )}
                        </div>
                      )}
                    </div>
                  ) : (
                    <>
                      {/* Tab selector */}
                      <div className="flex gap-1 mb-3 p-0.5 rounded-lg bg-slate-900/60">
                        <button
                          type="button"
                          onClick={() => { setLinkedinTab("url"); setLinkedinExportError(""); }}
                          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            linkedinTab === "url"
                              ? "bg-slate-700 text-white"
                              : "text-slate-400 hover:text-slate-300"
                          }`}
                        >
                          Paste URL
                        </button>
                        <button
                          type="button"
                          onClick={() => { setLinkedinTab("export"); setLinkedinExportError(""); }}
                          className={`flex-1 px-3 py-1.5 rounded-md text-xs font-medium transition-colors ${
                            linkedinTab === "export"
                              ? "bg-slate-700 text-white"
                              : "text-slate-400 hover:text-slate-300"
                          }`}
                        >
                          Upload Data Export
                        </button>
                      </div>

                      {linkedinTab === "url" ? (
                        <div className="space-y-2">
                          <div className="flex gap-2">
                            <div className="relative flex-1">
                              <input
                                type="text"
                                value={linkedinUrl}
                                onChange={(e) => setLinkedinUrl(e.target.value)}
                                onBlur={() => {
                                  const normalized = normalizeLinkedinUrl(linkedinUrl);
                                  if (normalized !== linkedinUrl) setLinkedinUrl(normalized);
                                }}
                                onPaste={(e) => {
                                  const pasted = e.clipboardData.getData("text");
                                  const normalized = normalizeLinkedinUrl(pasted);
                                  if (normalized !== pasted) {
                                    e.preventDefault();
                                    setLinkedinUrl(normalized);
                                  }
                                }}
                                placeholder="linkedin.com/in/yourname"
                                className={`w-full px-4 py-2.5 pr-10 rounded-lg bg-slate-800 border focus:outline-none text-white placeholder-slate-500 text-sm transition-colors ${
                                  linkedinUrlStatus(linkedinUrl) === "valid"
                                    ? "border-teal-500/70 focus:border-teal-400"
                                    : linkedinUrlStatus(linkedinUrl) === "invalid"
                                    ? "border-amber-500/60 focus:border-amber-400"
                                    : "border-slate-600 focus:border-teal-500"
                                }`}
                              />
                              {linkedinUrlStatus(linkedinUrl) === "valid" && (
                                <span className="absolute right-3 top-1/2 -translate-y-1/2 text-teal-400 text-xs font-medium pointer-events-none">&#10003;</span>
                              )}
                            </div>
                            {!linkedinUrl && (
                              <button
                                type="button"
                                onClick={pasteLinkedinFromClipboard}
                                disabled={linkedinPasting}
                                className="px-3 py-2.5 rounded-lg bg-slate-700 border border-slate-600 hover:border-teal-500 text-slate-300 hover:text-teal-400 transition-colors text-sm disabled:opacity-50"
                                title="Paste from clipboard"
                              >
                                {linkedinPasting ? (
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                                  </svg>
                                ) : (
                                  <svg className="w-4 h-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                                    <rect x="9" y="9" width="13" height="13" rx="2" ry="2" />
                                    <path d="M5 15H4a2 2 0 01-2-2V4a2 2 0 012-2h9a2 2 0 012 2v1" />
                                  </svg>
                                )}
                              </button>
                            )}
                          </div>
                          {linkedinUrlStatus(linkedinUrl) === "invalid" && (
                            <p className="text-xs text-amber-400/80">
                              Should look like linkedin.com/in/yourname
                            </p>
                          )}
                          {linkedinPreview && linkedinUrlStatus(linkedinUrl) === "valid" && (
                            <div className="flex items-center gap-2.5 px-3 py-2 rounded-lg bg-teal-950/30 border border-teal-800/30">
                              <div className="w-6 h-6 rounded-full bg-teal-600/30 flex items-center justify-center flex-shrink-0">
                                <svg className="w-3.5 h-3.5 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                                  <path d="M20.447 20.452h-3.554v-5.569c0-1.328-.027-3.037-1.852-3.037-1.853 0-2.136 1.445-2.136 2.939v5.667H9.351V9h3.414v1.561h.046c.477-.9 1.637-1.85 3.37-1.85 3.601 0 4.267 2.37 4.267 5.455v6.286zM5.337 7.433a2.062 2.062 0 01-2.063-2.065 2.064 2.064 0 112.063 2.065zm1.782 13.019H3.555V9h3.564v11.452zM22.225 0H1.771C.792 0 0 .774 0 1.729v20.542C0 23.227.792 24 1.771 24h20.451C23.2 24 24 23.227 24 22.271V1.729C24 .774 23.2 0 22.222 0h.003z"/>
                                </svg>
                              </div>
                              <span className="text-sm text-teal-300/90 capitalize truncate">{linkedinPreview.username}</span>
                            </div>
                          )}
                          {linkedinUrlStatus(linkedinUrl) === "valid" && email && !linkedinImporting && (
                            <button
                              type="button"
                              onClick={handleLinkedinImport}
                              className="w-full px-4 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#0952a0] text-white text-sm font-medium transition-colors"
                            >
                              Import LinkedIn Profile
                            </button>
                          )}
                        </div>
                      ) : (
                        <div className="space-y-2">
                          <label
                            className={`block w-full px-4 py-3 rounded-lg bg-slate-800 border border-dashed cursor-pointer text-center transition-all duration-200 ${
                              linkedinExportFile
                                ? "border-teal-600"
                                : "border-slate-600 hover:border-teal-500"
                            }`}
                          >
                            {linkedinExportFile ? (
                              <span className="text-teal-400 font-medium text-sm">{linkedinExportFile.name}</span>
                            ) : (
                              <span className="text-slate-400 text-sm">Click to upload LinkedIn data export (.zip)</span>
                            )}
                            <input
                              ref={linkedinExportRef}
                              type="file"
                              accept=".zip"
                              className="sr-only"
                              onChange={(e) => {
                                const file = e.target.files?.[0] ?? null;
                                if (file && file.size > 50 * 1024 * 1024) {
                                  setLinkedinExportError("File must be under 50MB");
                                  return;
                                }
                                setLinkedinExportError("");
                                setLinkedinExportFile(file);
                              }}
                            />
                          </label>
                          <p className="text-xs text-slate-500">
                            Get your data: LinkedIn Settings &rarr; Data Privacy &rarr; Get a copy of your data
                          </p>
                          {linkedinExportFile && email && !linkedinImporting && (
                            <button
                              type="button"
                              onClick={handleLinkedinImport}
                              className="w-full px-4 py-2.5 rounded-lg bg-[#0A66C2] hover:bg-[#0952a0] text-white text-sm font-medium transition-colors"
                            >
                              Import Data Export
                            </button>
                          )}
                        </div>
                      )}

                      {linkedinImporting && (
                        <div className="flex items-center gap-2 mt-2 px-3 py-2 rounded-lg bg-slate-800/60">
                          <svg className="w-4 h-4 animate-spin text-teal-400" viewBox="0 0 24 24" fill="none">
                            <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                          </svg>
                          <span className="text-sm text-slate-400">Importing your profile...</span>
                        </div>
                      )}

                      {linkedinExportError && (
                        <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>{linkedinExportError}</p>
                      )}
                    </>
                  )}
                </div>

                {/* Resume upload — secondary option */}
                <div>
                  <span className="block text-sm font-medium text-slate-300 mb-2">
                    Resume upload
                    <span className="text-slate-500 font-normal ml-2">{linkedinImportedProfile ? "(optional — enriches your profile)" : "(PDF or DOCX)"}</span>
                  </span>
                  <label
                    className={`block w-full px-4 py-4 rounded-xl bg-slate-800 border border-dashed cursor-pointer text-center transition-all duration-200 ${
                      dropActive
                        ? "border-teal-400 bg-teal-950/30 scale-[1.01]"
                        : resumeFile
                          ? "border-teal-600"
                          : "border-slate-600 hover:border-teal-500"
                    }`}
                    onDragOver={(e) => { e.preventDefault(); setDropActive(true); }}
                    onDragLeave={() => setDropActive(false)}
                    onDrop={(e) => {
                      e.preventDefault();
                      setDropActive(false);
                      const file = e.dataTransfer.files?.[0];
                      if (file) {
                        const err = validateResumeFile(file);
                        if (err) { setResumeError(err); return; }
                        setResumeError("");
                        setResumeFile(file);
                      }
                    }}
                  >
                    {resumeFile ? (
                      <span className="text-teal-400 font-medium">{resumeFile.name}</span>
                    ) : (
                      <span className="text-slate-400">
                        {dropActive ? "Drop your resume here" : "Click or drag to upload resume"}
                      </span>
                    )}
                    <input
                      ref={fileRef}
                      type="file"
                      accept=".pdf,.docx,.doc,.txt"
                      className="sr-only"
                      onChange={(e) => {
                        const file = e.target.files?.[0] ?? null;
                        if (file) {
                          const err = validateResumeFile(file);
                          if (err) { setResumeError(err); return; }
                          setResumeError("");
                        }
                        setResumeFile(file);
                      }}
                    />
                  </label>
                  {resumeError && (
                    <p className="mt-1.5 text-xs" style={{ color: "var(--destructive)" }}>{resumeError}</p>
                  )}
                </div>

                {resumePreviewScore && (
                  <div className="rounded-xl bg-gradient-to-br from-teal-950/40 to-slate-800/60 border border-teal-800/30 p-4 flex items-center gap-4">
                    <ScoreRing
                      score={resumePreviewScore.overallScore}
                      animated={resumePreviewAnimated}
                      label="Resume Strength"
                      size={80}
                    />
                    <div className="flex-1 min-w-0">
                      <p className="text-sm font-semibold text-slate-200 mb-1.5">Quick Resume Check</p>
                      <ul className="space-y-1">
                        <li className="text-xs text-slate-400">
                          <span className={resumePreviewScore.formattingScore >= 70 ? "text-emerald-400" : "text-amber-400"}>
                            {resumePreviewScore.formattingScore >= 70 ? "✓" : "⚠"}
                          </span>{" "}
                          Formatting: {resumePreviewScore.formattingScore}% ATS-friendly
                        </li>
                        <li className="text-xs text-slate-400">
                          <span className={resumePreviewScore.summary.matchedKeywords > 5 ? "text-emerald-400" : "text-amber-400"}>
                            {resumePreviewScore.summary.matchedKeywords > 5 ? "✓" : "⚠"}
                          </span>{" "}
                          {resumePreviewScore.summary.matchedKeywords} of {resumePreviewScore.summary.totalKeywords} key skills detected
                        </li>
                        {resumePreviewScore.formattingIssues.filter(i => i.severity === "critical").length > 0 && (
                          <li className="text-xs text-red-400">
                            {"✘"} {resumePreviewScore.formattingIssues.filter(i => i.severity === "critical").length} critical formatting issue{resumePreviewScore.formattingIssues.filter(i => i.severity === "critical").length > 1 ? "s" : ""}
                          </li>
                        )}
                      </ul>
                    </div>
                  </div>
                )}

                {error && (
                  <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
                    {error}
                  </p>
                )}

                <div className="sticky bottom-0 z-10 mt-2 -mx-1 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent md:static md:bg-none md:p-0">
                  <button
                    type="button"
                    onClick={handleStep1Next}
                    className="w-full px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    Next &rarr;
                  </button>
                </div>
              </motion.div>
            )}

            {wizardStep === 1 && (
              <motion.div
                key="step-1"
                custom={direction}
                variants={slideVariants}
                initial="enter"
                animate="center"
                exit="exit"
                transition={{ duration: 0.25, ease: "easeInOut" }}
                className="flex flex-col gap-4"
              >
                <p className="text-slate-400 text-sm mb-1">
                  Fine-tune your plan with real-life constraints. Smart defaults are pre-selected.
                </p>

                {/* Core preferences */}
                <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4">
                  <h3 className="text-xs font-bold text-slate-400 uppercase tracking-wider mb-3">Preferences</h3>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Transition timeline</label>
                      <select
                        value={circumstances.timeline ?? ""}
                        onChange={(e) => setCircumstances({ ...circumstances, timeline: (e.target.value || undefined) as UserCircumstances["timeline"] })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white appearance-none"
                      >
                        <option value="">No preference</option>
                        <option value="asap">As soon as possible</option>
                        <option value="3-6 months">3-6 months</option>
                        <option value="6-12 months">6-12 months</option>
                        <option value="1-2 years">1-2 years</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Risk tolerance</label>
                      <select
                        value={circumstances.riskTolerance ?? ""}
                        onChange={(e) => setCircumstances({ ...circumstances, riskTolerance: (e.target.value || undefined) as UserCircumstances["riskTolerance"] })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white appearance-none"
                      >
                        <option value="">No preference</option>
                        <option value="conservative">Conservative — keep income stable</option>
                        <option value="moderate">Moderate — some income gap OK</option>
                        <option value="aggressive">Aggressive — willing to take a leap</option>
                      </select>
                    </div>

                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">Willingness to relocate</label>
                      <select
                        value={circumstances.willingnessToRelocate ?? ""}
                        onChange={(e) => setCircumstances({ ...circumstances, willingnessToRelocate: (e.target.value || undefined) as UserCircumstances["willingnessToRelocate"] })}
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white appearance-none"
                      >
                        <option value="">No preference</option>
                        <option value="yes">Yes, open to relocating</option>
                        <option value="no">No, staying in current area</option>
                        <option value="remote-preferred">Remote work preferred</option>
                      </select>
                    </div>

                    {/* Portfolio URL (moved from old step 2) */}
                    <div>
                      <label className="block text-sm text-slate-400 mb-1.5">
                        Portfolio or personal site
                        <span className="text-slate-500 font-normal ml-1">(optional)</span>
                      </label>
                      <input
                        type="url"
                        value={websiteUrl}
                        onChange={(e) => setWebsiteUrl(e.target.value)}
                        placeholder="https://yoursite.com"
                        className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500"
                      />
                    </div>
                  </div>
                </div>

                {/* Collapsed Advanced section */}
                <button
                  type="button"
                  onClick={() => setShowAdvanced(!showAdvanced)}
                  className="flex items-center gap-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
                >
                  <svg
                    className={`w-4 h-4 transition-transform duration-200 ${showAdvanced ? "rotate-90" : ""}`}
                    fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}
                  >
                    <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                  </svg>
                  Advanced options (location, salary, dependents)
                </button>

                <AnimatePresence>
                  {showAdvanced && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: "auto", opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.2 }}
                      className="overflow-hidden"
                    >
                      <div className="rounded-xl bg-slate-800/40 border border-slate-700/50 p-4 space-y-3">
                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Your location</label>
                          <div className="flex gap-2">
                            <input
                              type="text"
                              value={locationText}
                              onChange={(e) => handleLocationManualChange(e.target.value)}
                              placeholder="City, State, Country"
                              className="flex-1 px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500"
                            />
                            <button
                              type="button"
                              onClick={detectLocation}
                              disabled={detectingLocation}
                              className="px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 hover:border-teal-500 text-slate-300 hover:text-teal-400 transition-colors text-sm font-medium whitespace-nowrap disabled:opacity-50"
                            >
                              {detectingLocation ? (
                                <span className="inline-flex items-center gap-1.5">
                                  <svg className="w-4 h-4 animate-spin" viewBox="0 0 24 24" fill="none">
                                    <circle cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="2" strokeDasharray="31.4 31.4" strokeLinecap="round" />
                                  </svg>
                                  Detecting
                                </span>
                              ) : gpsResolved ? (
                                <motion.span
                                  initial={{ scale: 0.8 }}
                                  animate={{ scale: [0.8, 1.2, 1] }}
                                  transition={{ duration: 0.4 }}
                                  className="text-teal-400"
                                >
                                  &#10003; Found
                                </motion.span>
                              ) : (
                                "Use GPS"
                              )}
                            </button>
                          </div>
                          {location?.source === "gps" && !gpsResolved && (
                            <p className="text-teal-500 text-xs mt-1.5">Detected via GPS — edit above to override</p>
                          )}
                        </div>

                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Minimum salary requirement</label>
                          <select
                            value={circumstances.salaryFloor ?? ""}
                            onChange={(e) => setCircumstances({ ...circumstances, salaryFloor: e.target.value || undefined })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white appearance-none"
                          >
                            {SALARY_RANGES.map((r) => (
                              <option key={r.value} value={r.value}>{r.label}</option>
                            ))}
                          </select>
                        </div>

                        <div>
                          <label className="block text-sm text-slate-400 mb-1.5">Dependents</label>
                          <select
                            value={circumstances.dependents ?? ""}
                            onChange={(e) => setCircumstances({ ...circumstances, dependents: (e.target.value || undefined) as UserCircumstances["dependents"] })}
                            className="w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white appearance-none"
                          >
                            <option value="">Prefer not to say</option>
                            <option value="none">No dependents</option>
                            <option value="partner">Partner</option>
                            <option value="children">Children</option>
                            <option value="caretaker">Caretaker for family</option>
                          </select>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>

                <div className="sticky bottom-0 z-10 mt-2 -mx-1 px-1 pt-2 pb-[max(0.5rem,env(safe-area-inset-bottom))] bg-gradient-to-t from-slate-900 via-slate-900/95 to-transparent md:static md:bg-none md:p-0">
                  <div className="flex gap-3">
                    <button
                      type="button"
                      onClick={goBack}
                      className="flex-1 px-8 py-4 rounded-xl border border-slate-600 hover:border-slate-500 font-bold text-lg transition-colors text-slate-300"
                    >
                      &larr; Back
                    </button>
                    <button
                      type="button"
                      onClick={handleSubmit}
                      className="flex-1 px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
                    >
                      {ctaVariant === "urgency"
                        ? "Reveal My Plan"
                        : ctaVariant === "benefit"
                          ? "Show My Best Move"
                          : "Analyze My Background"}
                      {" "}&rarr;
                    </button>
                  </div>
                  <button
                    type="button"
                    onClick={handleSubmit}
                    className="w-full min-h-[44px] text-sm font-medium transition-colors text-center mt-1 underline"
                    style={{ color: "var(--muted-foreground)" }}
                  >
                    Skip &mdash; I&apos;ll let the AI decide
                  </button>
                  <Link
                    href="/dashboard"
                    className="block w-full text-center text-xs text-slate-500 hover:text-slate-300 transition-colors mt-2 py-1"
                  >
                    Skip for now &rarr;
                  </Link>
                </div>
              </motion.div>
            )}
          </AnimatePresence>
        </div>

        <p className="text-slate-500 text-xs text-center mt-6">
          Your data is processed securely and never shared. You can request deletion anytime.
        </p>
      </div>
    </div>
  );
}
