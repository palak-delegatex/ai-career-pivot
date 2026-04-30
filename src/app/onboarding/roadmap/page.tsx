"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import type {
  FamilyConstraints,
  FinancialObligationBand,
  PivotPlan,
  RiskTolerance,
  RoadmapIntake,
  UserProfile,
} from "@/lib/intake";
import { trackPurchaseCompleted } from "@/lib/analytics";

const OBLIGATION_OPTIONS: { value: FinancialObligationBand; label: string }[] = [
  { value: "under_2k", label: "Under $2k / month" },
  { value: "2k_4k", label: "$2k – $4k / month" },
  { value: "4k_7k", label: "$4k – $7k / month" },
  { value: "7k_10k", label: "$7k – $10k / month" },
  { value: "10k_15k", label: "$10k – $15k / month" },
  { value: "over_15k", label: "Over $15k / month" },
];

const RISK_OPTIONS: { value: RiskTolerance; label: string; desc: string }[] = [
  {
    value: "conservative",
    label: "Conservative",
    desc: "Keep my income; pivot slowly while employed",
  },
  {
    value: "moderate",
    label: "Moderate",
    desc: "Accept a short income dip for a faster transition",
  },
  {
    value: "aggressive",
    label: "Aggressive",
    desc: "Move fast, even with significant short-term income risk",
  },
];

const PARTNER_OPTIONS: { value: FamilyConstraints["partnerIncome"]; label: string }[] = [
  { value: "none", label: "I'm the sole earner" },
  { value: "partial", label: "Partner contributes partially" },
  { value: "equal", label: "Roughly equal" },
  { value: "primary", label: "Partner is primary earner" },
];

export default function RoadmapIntakePage() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const sessionId = searchParams.get("session_id");
  const purchaseFiredRef = useRef(false);

  useEffect(() => {
    if (sessionId && !purchaseFiredRef.current) {
      purchaseFiredRef.current = true;
      trackPurchaseCompleted({ stripe_session_id: sessionId });
    }
  }, [sessionId]);

  const [email, setEmail] = useState("");
  const [currentTitle, setCurrentTitle] = useState("");
  const [currentIndustry, setCurrentIndustry] = useState("");
  const [yearsExperience, setYearsExperience] = useState<number | "">("");
  const [skillsInput, setSkillsInput] = useState("");
  const [targetRole, setTargetRole] = useState("");
  const [targetIndustry, setTargetIndustry] = useState("");
  const [obligations, setObligations] = useState<FinancialObligationBand>("4k_7k");

  const [hasKids, setHasKids] = useState(false);
  const [numberOfKids, setNumberOfKids] = useState<number | "">("");
  const [partnerIncome, setPartnerIncome] = useState<FamilyConstraints["partnerIncome"]>("none");
  const [locationLocked, setLocationLocked] = useState(false);
  const [locationReason, setLocationReason] = useState("");

  const [risk, setRisk] = useState<RiskTolerance>("moderate");

  const [transferableSkills, setTransferableSkills] = useState<string[]>([]);
  const [experienceSummary, setExperienceSummary] = useState<string>("");

  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState("");

  // Pre-fill from prior intake steps if available
  useEffect(() => {
    try {
      const profileRaw = sessionStorage.getItem("intake_profile");
      if (profileRaw) {
        const p: UserProfile = JSON.parse(profileRaw);
        if (p.email) setEmail(p.email);
        if (p.currentTitle) setCurrentTitle(p.currentTitle);
        if (p.currentIndustry) setCurrentIndustry(p.currentIndustry);
        if (typeof p.yearsExperience === "number") setYearsExperience(p.yearsExperience);
        if (p.skills?.length) setSkillsInput(p.skills.slice(0, 5).join(", "));
        if (p.transferableSkills?.length) setTransferableSkills(p.transferableSkills);
        if (p.experience?.length) {
          setExperienceSummary(
            p.experience.slice(0, 4).map((e) => `${e.title} at ${e.company}`).join("; ")
          );
        }
      }

      const planRaw = sessionStorage.getItem("intake_plans");
      const selectedRoleRaw = sessionStorage.getItem("intake_selected_plan_index");
      if (planRaw) {
        const plans: PivotPlan[] = JSON.parse(planRaw);
        const idx = selectedRoleRaw ? Math.max(0, parseInt(selectedRoleRaw, 10)) : 0;
        const chosen = plans[idx] ?? plans[0];
        if (chosen) {
          setTargetRole(chosen.targetRole);
          setTargetIndustry(chosen.targetIndustry);
        }
      }
    } catch {
      // ignore — sessionStorage may be unavailable
    }
  }, []);

  function parseSkills(input: string): string[] {
    return input
      .split(/[,\n]/)
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError("");

    const skills = parseSkills(skillsInput);
    if (!email || !currentTitle || !currentIndustry || yearsExperience === "" || skills.length < 3) {
      setError("Please fill in your current role, years of experience, and at least 3 top skills.");
      return;
    }
    if (!targetRole || !targetIndustry) {
      setError("Please name a target role and target industry.");
      return;
    }

    const intake: RoadmapIntake = {
      email,
      currentTitle,
      currentIndustry,
      yearsExperience: typeof yearsExperience === "number" ? yearsExperience : Number(yearsExperience),
      topSkills: skills,
      targetRole,
      targetIndustry,
      monthlyObligations: obligations,
      family: {
        hasKids,
        numberOfKids: hasKids && numberOfKids !== "" ? Number(numberOfKids) : undefined,
        partnerIncome,
        locationLocked,
        locationReason: locationLocked ? locationReason || undefined : undefined,
      },
      riskTolerance: risk,
      transferableSkills: transferableSkills.length ? transferableSkills : undefined,
      experienceSummary: experienceSummary || undefined,
    };

    setSubmitting(true);
    try {
      const res = await fetch("/api/roadmap/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...intake, sessionId }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data?.error ?? "Roadmap generation failed");
      }
      sessionStorage.setItem("roadmap_intake", JSON.stringify(intake));
      sessionStorage.setItem("roadmap_result", JSON.stringify(data.roadmap));
      router.push("/onboarding/roadmap/result");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong. Please try again.");
      setSubmitting(false);
    }
  }

  if (submitting) {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md w-full text-center">
          <div className="w-16 h-16 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-8" />
          <h2 className="text-2xl font-bold mb-3">Building your detailed roadmap…</h2>
          <p className="text-slate-400">Drafting personalized 6-month, 1-year, and 2-year phases.</p>
          <p className="text-slate-500 text-sm mt-4">This usually takes 30–60 seconds.</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🧭</div>
          <h1 className="text-3xl font-extrabold mb-3 tracking-tight">Build Your Detailed Roadmap</h1>
          <p className="text-slate-400">
            Tell us about your real situation — finances, family, risk tolerance — and we&apos;ll generate
            a 2-year transition plan around it.
          </p>
        </div>

        <form className="flex flex-col gap-7" onSubmit={handleSubmit}>
          <Section title="Where you are today">
            <Field label="Email" required>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
                className={inputClass}
                placeholder="you@example.com"
              />
            </Field>
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Current job title" required>
                <input
                  type="text"
                  value={currentTitle}
                  onChange={(e) => setCurrentTitle(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="e.g. Senior Marketing Manager"
                />
              </Field>
              <Field label="Industry" required>
                <input
                  type="text"
                  value={currentIndustry}
                  onChange={(e) => setCurrentIndustry(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="e.g. SaaS / Healthcare"
                />
              </Field>
            </div>
            <Field label="Years of experience" required>
              <input
                type="number"
                min={0}
                max={60}
                value={yearsExperience}
                onChange={(e) =>
                  setYearsExperience(e.target.value === "" ? "" : Math.max(0, Number(e.target.value)))
                }
                required
                className={inputClass}
                placeholder="e.g. 12"
              />
            </Field>
            <Field
              label="Top 3–5 skills"
              hint="Comma-separated. The skills you'd put first on a resume."
              required
            >
              <input
                type="text"
                value={skillsInput}
                onChange={(e) => setSkillsInput(e.target.value)}
                className={inputClass}
                placeholder="e.g. Product strategy, B2B SaaS GTM, SQL, Stakeholder management"
              />
            </Field>
          </Section>

          <Section title="Where you want to go">
            <div className="grid sm:grid-cols-2 gap-4">
              <Field label="Target role" required>
                <input
                  type="text"
                  value={targetRole}
                  onChange={(e) => setTargetRole(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="e.g. AI Product Manager"
                />
              </Field>
              <Field label="Target industry" required>
                <input
                  type="text"
                  value={targetIndustry}
                  onChange={(e) => setTargetIndustry(e.target.value)}
                  required
                  className={inputClass}
                  placeholder="e.g. Generative AI tooling"
                />
              </Field>
            </div>
          </Section>

          <Section title="Your financial picture">
            <Field label="Monthly financial obligations">
              <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                {OBLIGATION_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setObligations(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium transition-colors ${
                      obligations === opt.value
                        ? "bg-teal-600 border-teal-500 text-white"
                        : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>
          </Section>

          <Section title="Family & life constraints">
            <div className="flex items-start gap-3">
              <input
                id="has-kids"
                type="checkbox"
                checked={hasKids}
                onChange={(e) => setHasKids(e.target.checked)}
                className="mt-1 w-4 h-4 accent-teal-500"
              />
              <label htmlFor="has-kids" className="text-sm text-slate-200 select-none">
                I have kids at home
              </label>
            </div>
            {hasKids && (
              <Field label="How many kids?">
                <input
                  type="number"
                  min={1}
                  max={12}
                  value={numberOfKids}
                  onChange={(e) =>
                    setNumberOfKids(e.target.value === "" ? "" : Math.max(1, Number(e.target.value)))
                  }
                  className={inputClass}
                  placeholder="e.g. 2"
                />
              </Field>
            )}

            <Field label="Partner income">
              <div className="grid grid-cols-2 gap-2">
                {PARTNER_OPTIONS.map((opt) => (
                  <button
                    type="button"
                    key={opt.value}
                    onClick={() => setPartnerIncome(opt.value)}
                    className={`px-3 py-2 rounded-lg border text-sm font-medium text-left transition-colors ${
                      partnerIncome === opt.value
                        ? "bg-teal-600 border-teal-500 text-white"
                        : "bg-slate-800 border-slate-600 text-slate-300 hover:border-slate-400"
                    }`}
                  >
                    {opt.label}
                  </button>
                ))}
              </div>
            </Field>

            <div className="flex items-start gap-3">
              <input
                id="loc-locked"
                type="checkbox"
                checked={locationLocked}
                onChange={(e) => setLocationLocked(e.target.checked)}
                className="mt-1 w-4 h-4 accent-teal-500"
              />
              <label htmlFor="loc-locked" className="text-sm text-slate-200 select-none">
                I&apos;m location-locked (can&apos;t relocate for a job)
              </label>
            </div>
            {locationLocked && (
              <Field label="Why? (optional)" hint="Helps us suggest remote-friendly options.">
                <input
                  type="text"
                  value={locationReason}
                  onChange={(e) => setLocationReason(e.target.value)}
                  className={inputClass}
                  placeholder="e.g. Kids in school, partner's job, family caregiving"
                />
              </Field>
            )}
          </Section>

          <Section title="Risk tolerance">
            <div className="grid gap-3">
              {RISK_OPTIONS.map((opt) => (
                <button
                  type="button"
                  key={opt.value}
                  onClick={() => setRisk(opt.value)}
                  className={`px-4 py-3 rounded-xl border text-left transition-colors ${
                    risk === opt.value
                      ? "bg-teal-900/40 border-teal-500"
                      : "bg-slate-800/60 border-slate-600 hover:border-slate-400"
                  }`}
                >
                  <div className="font-bold text-sm">{opt.label}</div>
                  <div className="text-xs text-slate-400 mt-1">{opt.desc}</div>
                </button>
              ))}
            </div>
          </Section>

          {error && (
            <p className="text-red-400 text-sm bg-red-950/30 border border-red-800/40 rounded-lg px-4 py-3">
              {error}
            </p>
          )}

          <button
            type="submit"
            className="w-full px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
          >
            Generate My Roadmap →
          </button>
          <p className="text-slate-500 text-xs text-center -mt-4">
            We use Claude to generate a roadmap personalized to your real situation.
          </p>
        </form>
      </div>
    </div>
  );
}

const inputClass =
  "w-full px-4 py-3 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500";

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-slate-800/40 border border-slate-700/60 rounded-2xl p-6">
      <h2 className="text-lg font-bold text-teal-400 mb-4">{title}</h2>
      <div className="flex flex-col gap-4">{children}</div>
    </div>
  );
}

function Field({
  label,
  hint,
  required,
  children,
}: {
  label: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-slate-300 mb-2">
        {label}
        {required && <span className="text-teal-400 ml-1">*</span>}
        {hint && <span className="text-slate-500 font-normal ml-2">{hint}</span>}
      </label>
      {children}
    </div>
  );
}
