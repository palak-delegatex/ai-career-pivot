"use client";

import { useState, useMemo, useCallback, useEffect } from "react";
import { useLocale } from "next-intl";
import {
  DollarSign,
  Target,
  CheckCircle2,
  Circle,
  FileText,
  Star,
  TrendingUp,
  AlertTriangle,
  Shield,
  Copy,
  Check,
  ChevronDown,
  ChevronUp,
  Calculator,
} from "lucide-react";
import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import { Badge } from "@/components/ui/badge";
import type { UserProfile, PivotPlan, MarketData } from "@/lib/intake";
import { MarketDataLoader } from "@/components/MarketDataBanner";

interface SalaryNegotiationTabProps {
  profile: UserProfile;
  plan: PivotPlan;
}

// --- Target Salary Calculator ---

function parseSalaryNumber(s: string | undefined): number | null {
  if (!s) return null;
  const nums = s.match(/[\d,]+/g)?.map((n) => parseInt(n.replace(/,/g, ""), 10));
  if (!nums || nums.length === 0) return null;
  return nums.length >= 2 ? Math.round((nums[0] + nums[1]) / 2) : nums[0];
}

// Figures are US BLS market data (USD); the `$` symbol is fixed, only the
// grouping separator follows the active app locale.
function fmtCurrency(n: number, locale: string): string {
  return "$" + n.toLocaleString(locale);
}

type ExperienceLevel = "entry" | "mid" | "senior" | "lead";

const EXPERIENCE_MULTIPLIERS: Record<ExperienceLevel, { low: number; high: number; label: string }> = {
  entry: { low: 0.85, high: 0.95, label: "Entry (0-2 yrs)" },
  mid: { low: 0.95, high: 1.05, label: "Mid (3-7 yrs)" },
  senior: { low: 1.05, high: 1.2, label: "Senior (8-14 yrs)" },
  lead: { low: 1.15, high: 1.35, label: "Lead/Principal (15+ yrs)" },
};

function inferExperienceLevel(years: number | undefined): ExperienceLevel {
  if (!years || years <= 2) return "entry";
  if (years <= 7) return "mid";
  if (years <= 14) return "senior";
  return "lead";
}

function TargetSalaryCalculator({
  profile,
  plan,
  marketData,
}: {
  profile: UserProfile;
  plan: PivotPlan;
  marketData: MarketData | null;
}) {
  const locale = useLocale();
  const [currentComp, setCurrentComp] = useState(() => {
    const parsed = parseSalaryNumber(plan.financialSummary?.currentSalaryRange);
    return parsed ? String(parsed) : "";
  });
  const [experienceLevel, setExperienceLevel] = useState<ExperienceLevel>(
    inferExperienceLevel(profile.yearsExperience)
  );

  const salaryFloor = parseSalaryNumber(profile.circumstances?.salaryFloor);
  const currentCompNum = currentComp ? parseInt(currentComp.replace(/,/g, ""), 10) : null;

  const negotiationRange = useMemo(() => {
    const median = marketData?.salaryMedian;
    if (!median) return null;

    const mult = EXPERIENCE_MULTIPLIERS[experienceLevel];
    const rangeLow = Math.round(median * mult.low);
    const rangeHigh = Math.round(median * mult.high);

    const anchor = Math.round(rangeHigh * 1.05);
    const walkAway = Math.max(rangeLow, salaryFloor ?? 0);

    return { rangeLow, rangeHigh, anchor, walkAway, median };
  }, [marketData, experienceLevel, salaryFloor]);

  const meetsFloor = negotiationRange && salaryFloor
    ? negotiationRange.rangeLow >= salaryFloor
    : null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <Calculator className="h-5 w-5 text-teal-400" />
        <h3 className="text-sm font-bold text-teal-400">Target Salary Calculator</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 mb-5">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Current Total Compensation</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={currentComp}
              onChange={(e) => setCurrentComp(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="85,000"
              className="w-full pl-7 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Experience Level</label>
          <select
            value={experienceLevel}
            onChange={(e) => setExperienceLevel(e.target.value as ExperienceLevel)}
            className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-300 focus:outline-none focus:border-teal-500 transition-colors appearance-none"
          >
            {Object.entries(EXPERIENCE_MULTIPLIERS).map(([key, { label }]) => (
              <option key={key} value={key}>{label}</option>
            ))}
          </select>
        </div>
      </div>

      {negotiationRange ? (
        <div className="space-y-4">
          <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
            <div className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Walk-away</p>
              <p className="text-sm font-bold text-red-400">{fmtCurrency(negotiationRange.walkAway, locale)}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Range Low</p>
              <p className="text-sm font-bold text-amber-400">{fmtCurrency(negotiationRange.rangeLow, locale)}</p>
            </div>
            <div className="bg-slate-900/60 border border-teal-700/30 rounded-lg p-3 text-center">
              <p className="text-[10px] text-teal-500 uppercase tracking-wider mb-1">Target</p>
              <p className="text-sm font-bold text-teal-300">{fmtCurrency(negotiationRange.rangeHigh, locale)}</p>
            </div>
            <div className="bg-slate-900/60 rounded-lg p-3 text-center">
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mb-1">Anchor High</p>
              <p className="text-sm font-bold text-emerald-400">{fmtCurrency(negotiationRange.anchor, locale)}</p>
            </div>
          </div>

          {/* Salary range bar visualization */}
          <div className="relative h-3 bg-slate-700/60 rounded-full overflow-hidden">
            <div
              className="absolute h-full bg-gradient-to-r from-red-500/60 via-amber-500/60 to-emerald-500/60 rounded-full"
              style={{
                left: `${(negotiationRange.walkAway / negotiationRange.anchor) * 100 * 0.9}%`,
                right: "0%",
              }}
            />
            {salaryFloor && (
              <div
                className="absolute top-0 bottom-0 w-0.5 bg-red-400"
                style={{ left: `${(salaryFloor / negotiationRange.anchor) * 100 * 0.9}%` }}
                title={`Your floor: ${fmtCurrency(salaryFloor, locale)}`}
              />
            )}
          </div>

          {currentCompNum && currentCompNum > 0 && (
            <p className="text-xs text-slate-400">
              This target represents a{" "}
              <span className="text-emerald-400 font-medium">
                {Math.round(((negotiationRange.rangeHigh - currentCompNum) / currentCompNum) * 100)}% increase
              </span>{" "}
              from your current comp.
            </p>
          )}

          {salaryFloor && (
            <div className={`flex items-center gap-2 text-xs px-3 py-2 rounded-lg ${
              meetsFloor
                ? "bg-emerald-900/20 border border-emerald-700/30 text-emerald-300"
                : "bg-red-900/20 border border-red-700/30 text-red-300"
            }`}>
              {meetsFloor ? (
                <CheckCircle2 className="h-3.5 w-3.5 shrink-0" />
              ) : (
                <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
              )}
              {meetsFloor
                ? `This range meets your minimum salary requirement of ${fmtCurrency(salaryFloor, locale)}.`
                : `Warning: The lower end of this range is below your stated floor of ${fmtCurrency(salaryFloor, locale)}. Negotiate firmly for the target or above.`
              }
            </div>
          )}

          <p className="text-[10px] text-slate-600">
            Based on market data for {marketData?.role}. {marketData?.source}.
          </p>
        </div>
      ) : (
        <div className="text-center py-6 text-xs text-slate-500">
          Market data unavailable for this role. Enter your details above to see ranges once data loads.
        </div>
      )}
    </div>
  );
}

// --- Negotiation Prep Checklist ---

interface ChecklistItem {
  id: string;
  label: string;
  detail: string;
  category: "research" | "strategy" | "preparation";
}

const CHECKLIST_ITEMS: ChecklistItem[] = [
  {
    id: "research-comp",
    label: "Research the company's compensation philosophy",
    detail: "Check Glassdoor, Levels.fyi, and Blind for salary data specific to this company. Note their bonus structure and equity practices.",
    category: "research",
  },
  {
    id: "know-batna",
    label: "Define your BATNA (Best Alternative to Negotiated Agreement)",
    detail: "Know your walk-away point. What will you do if this doesn't work out? Other offers, current job, freelancing? A strong BATNA gives you leverage.",
    category: "strategy",
  },
  {
    id: "quantify-value",
    label: "Quantify your unique value with specific metrics",
    detail: "Prepare 3-5 concrete examples: revenue generated, costs saved, team impact, projects delivered. Numbers are more persuasive than adjectives.",
    category: "preparation",
  },
  {
    id: "practice-delivery",
    label: "Practice your salary ask out loud",
    detail: "Rehearse with a friend or mirror. State your number confidently without hedging ('I was thinking maybe...'). Aim for: 'Based on my research and experience, I'm targeting $X.'",
    category: "preparation",
  },
  {
    id: "total-comp",
    label: "List your total compensation requirements beyond base salary",
    detail: "Consider: signing bonus, equity/RSUs, remote work, PTO, professional development budget, title, performance review timeline. These are often easier to negotiate than base.",
    category: "strategy",
  },
  {
    id: "prepare-counters",
    label: "Prepare counterpoints for common pushbacks",
    detail: "'That's above our budget' — Can we discuss a signing bonus or accelerated review? 'We don't negotiate' — All offers have flexibility. 'You lack X experience' — Here's how my Y experience transfers.",
    category: "preparation",
  },
  {
    id: "timing",
    label: "Plan your timing and communication channel",
    detail: "Negotiate after receiving a written offer, not during interviews. Phone/video is better than email for initial negotiation — tone matters. Follow up in writing to confirm agreements.",
    category: "strategy",
  },
];

const CATEGORY_CONFIG = {
  research: { color: "text-cyan-400", bg: "bg-cyan-900/20", border: "border-cyan-700/30" },
  strategy: { color: "text-violet-400", bg: "bg-violet-900/20", border: "border-violet-700/30" },
  preparation: { color: "text-amber-400", bg: "bg-amber-900/20", border: "border-amber-700/30" },
};

function NegotiationChecklist() {
  const [checked, setChecked] = useState<Set<string>>(new Set());

  const toggle = useCallback((id: string) => {
    setChecked((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const progress = Math.round((checked.size / CHECKLIST_ITEMS.length) * 100);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Shield className="h-5 w-5 text-teal-400" />
          <h3 className="text-sm font-bold text-teal-400">Negotiation Prep Checklist</h3>
        </div>
        <Badge className="bg-slate-900/60 border-slate-700 text-slate-300 text-[10px]">
          {checked.size}/{CHECKLIST_ITEMS.length}
        </Badge>
      </div>

      {/* Progress bar */}
      <div className="h-1.5 bg-slate-700 rounded-full overflow-hidden mb-5">
        <div
          className="h-full bg-teal-500 rounded-full transition-all duration-300"
          style={{ width: `${progress}%` }}
        />
      </div>

      <div className="space-y-2">
        {CHECKLIST_ITEMS.map((item) => {
          const done = checked.has(item.id);
          const cat = CATEGORY_CONFIG[item.category];
          return (
            <button
              key={item.id}
              onClick={() => toggle(item.id)}
              className={`w-full text-left px-4 py-3 rounded-xl border transition-colors ${
                done
                  ? "bg-teal-900/15 border-teal-700/30"
                  : "bg-slate-900/30 border-slate-700/40 hover:border-slate-600"
              }`}
            >
              <div className="flex items-start gap-3">
                {done ? (
                  <CheckCircle2 className="h-4 w-4 text-teal-400 mt-0.5 shrink-0" />
                ) : (
                  <Circle className="h-4 w-4 text-slate-600 mt-0.5 shrink-0" />
                )}
                <div className="flex-1 min-w-0">
                  <div className="flex items-center gap-2">
                    <p className={`text-xs font-medium ${done ? "text-teal-300 line-through" : "text-slate-300"}`}>
                      {item.label}
                    </p>
                    <span className={`text-[9px] px-1.5 py-0.5 rounded ${cat.bg} ${cat.border} ${cat.color} border capitalize`}>
                      {item.category}
                    </span>
                  </div>
                  <p className="text-[11px] text-slate-500 mt-1 leading-relaxed">{item.detail}</p>
                </div>
              </div>
            </button>
          );
        })}
      </div>

      {progress === 100 && (
        <div className="mt-4 px-4 py-3 bg-emerald-900/20 border border-emerald-700/30 rounded-xl text-center">
          <p className="text-xs text-emerald-300 font-medium">
            You&apos;re fully prepared! Go in confident — you&apos;ve done the work.
          </p>
        </div>
      )}
    </div>
  );
}

// --- Counter-Offer Script Template ---

function CounterOfferScript({
  profile,
  plan,
  marketData,
}: {
  profile: UserProfile;
  plan: PivotPlan;
  marketData: MarketData | null;
}) {
  const locale = useLocale();
  const [offerAmount, setOfferAmount] = useState("");
  const [companyName, setCompanyName] = useState("");
  const [copied, setCopied] = useState(false);
  const [mode, setMode] = useState<"email" | "verbal">("email");

  const targetSalary = useMemo(() => {
    if (!marketData) return null;
    const level = inferExperienceLevel(profile.yearsExperience);
    return Math.round(marketData.salaryMedian * EXPERIENCE_MULTIPLIERS[level].high);
  }, [marketData, profile.yearsExperience]);

  const offerNum = offerAmount ? parseInt(offerAmount.replace(/,/g, ""), 10) : null;
  const name = profile.name?.split(" ")[0] || "there";
  const role = plan.targetRole;

  const emailScript = useMemo(() => {
    const target = targetSalary ? fmtCurrency(targetSalary, locale) : "[YOUR TARGET]";
    const offer = offerNum ? fmtCurrency(offerNum, locale) : "[THEIR OFFER]";
    const company = companyName || "[COMPANY]";

    return `Subject: ${role} Offer — Compensation Discussion

Hi [Hiring Manager],

Thank you for the offer to join ${company} as ${role}. I'm genuinely excited about the opportunity and the team's mission.

After reviewing the offer of ${offer} base salary and researching market compensation for this role, I'd like to discuss the base salary. Based on market data and the experience I bring — including ${profile.skills.slice(0, 3).join(", ")}${profile.yearsExperience ? ` and ${profile.yearsExperience} years of relevant experience` : ""} — I believe a base salary of ${target} would better reflect the value I'll deliver.

I'm confident I can make an immediate impact, and I want to make sure we start on a foundation that works for both of us long-term.

I'm open to discussing other elements of the package as well — signing bonus, equity, or an accelerated performance review timeline.

Would you have time this week to discuss?

Best regards,
${profile.name || "[YOUR NAME]"}`;
  }, [offerNum, companyName, targetSalary, profile, role, locale]);

  const verbalScript = useMemo(() => {
    const target = targetSalary ? fmtCurrency(targetSalary, locale) : "[YOUR TARGET]";
    const offer = offerNum ? fmtCurrency(offerNum, locale) : "[THEIR OFFER]";

    return `OPENING:
"Thank you so much for the offer — I'm really excited about the role and the team. I do want to discuss the compensation to make sure we're aligned."

STATE YOUR ASK:
"Based on my research into market rates for ${role} and the experience I bring, I was targeting a base salary of ${target}. The current offer of ${offer} is below that range."

JUSTIFY WITH VALUE:
"In my previous roles, I've ${profile.experience?.[0]?.description ? "demonstrated..." : "[describe a key achievement with numbers]"}. I'm confident I can bring that same impact here."

HANDLE PUSHBACK:
• "I understand budget constraints. Could we explore a signing bonus to bridge the gap?"
• "Would you be open to a 6-month performance review with a salary adjustment built in?"
• "Are there other elements — equity, PTO, remote flexibility — where there's more room?"

CLOSE:
"I want to make this work. What can we do to get closer to ${target}?"`;
  }, [offerNum, targetSalary, profile, role, locale]);

  const script = mode === "email" ? emailScript : verbalScript;

  const handleCopy = useCallback(() => {
    navigator.clipboard.writeText(script);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, [script]);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <div className="flex items-center gap-2 mb-4">
        <FileText className="h-5 w-5 text-teal-400" />
        <h3 className="text-sm font-bold text-teal-400">Counter-Offer Script</h3>
      </div>

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-3 mb-4">
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Their Offer Amount</label>
          <div className="relative">
            <span className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500 text-sm">$</span>
            <input
              type="text"
              inputMode="numeric"
              value={offerAmount}
              onChange={(e) => setOfferAmount(e.target.value.replace(/[^0-9]/g, ""))}
              placeholder="90,000"
              className="w-full pl-7 pr-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
            />
          </div>
        </div>
        <div>
          <label className="text-xs text-slate-400 block mb-1.5">Company Name</label>
          <input
            type="text"
            value={companyName}
            onChange={(e) => setCompanyName(e.target.value)}
            placeholder="Acme Inc."
            className="w-full px-3 py-2.5 bg-slate-900/60 border border-slate-700 rounded-lg text-sm text-slate-300 placeholder:text-slate-600 focus:outline-none focus:border-teal-500 transition-colors"
          />
        </div>
      </div>

      {/* Mode toggle */}
      <div className="flex gap-2 mb-4">
        <button
          onClick={() => setMode("email")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mode === "email"
              ? "bg-teal-600 text-white"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          Email Template
        </button>
        <button
          onClick={() => setMode("verbal")}
          className={`px-3 py-1.5 rounded-lg text-xs font-medium transition-colors ${
            mode === "verbal"
              ? "bg-teal-600 text-white"
              : "bg-slate-900/60 text-slate-400 hover:text-slate-300"
          }`}
        >
          Verbal Script
        </button>
      </div>

      {/* Script output */}
      <div className="relative">
        <pre className="bg-slate-900/80 border border-slate-700/60 rounded-xl p-4 text-xs text-slate-300 whitespace-pre-wrap leading-relaxed max-h-80 overflow-y-auto font-sans">
          {script}
        </pre>
        <button
          onClick={handleCopy}
          className="absolute top-3 right-3 p-2 bg-slate-800 border border-slate-700 rounded-lg hover:border-teal-500 transition-colors"
          title="Copy to clipboard"
        >
          {copied ? (
            <Check className="h-3.5 w-3.5 text-emerald-400" />
          ) : (
            <Copy className="h-3.5 w-3.5 text-slate-400" />
          )}
        </button>
      </div>

      <p className="text-[10px] text-slate-600 mt-3">
        Customize the bracketed sections with your specific details. This is a starting template — adjust the tone for your situation.
      </p>
    </div>
  );
}

// --- Offer Evaluation Scorecard ---

interface ScoreCategory {
  key: string;
  label: string;
  icon: typeof DollarSign;
  description: string;
}

const SCORE_CATEGORIES: ScoreCategory[] = [
  { key: "salary", label: "Base Salary", icon: DollarSign, description: "Does the base meet your market range and financial needs?" },
  { key: "benefits", label: "Benefits & Perks", icon: Shield, description: "Health insurance, 401k match, PTO, remote work, equity/RSUs" },
  { key: "growth", label: "Growth Potential", icon: TrendingUp, description: "Career advancement path, learning budget, mentorship, title trajectory" },
  { key: "culture", label: "Culture & Fit", icon: Star, description: "Team dynamics, work-life balance, company values alignment, management style" },
];

function OfferScorecard({
  profile,
}: {
  profile: UserProfile;
}) {
  const locale = useLocale();
  const [scores, setScores] = useState<Record<string, number>>({});
  const [expanded, setExpanded] = useState(true);

  const salaryFloor = parseSalaryNumber(profile.circumstances?.salaryFloor);

  const setScore = useCallback((key: string, value: number) => {
    setScores((prev) => ({ ...prev, [key]: value }));
  }, []);

  const filledCount = Object.keys(scores).length;
  const avgScore = filledCount > 0
    ? Math.round(Object.values(scores).reduce((a, b) => a + b, 0) / filledCount)
    : 0;

  const verdict = avgScore >= 8 ? "Strong offer — likely worth accepting"
    : avgScore >= 6 ? "Decent offer — negotiate on weak areas"
    : avgScore >= 4 ? "Below expectations — significant negotiation needed"
    : filledCount > 0 ? "Weak offer — consider alternatives"
    : null;

  const verdictColor = avgScore >= 8 ? "text-emerald-400"
    : avgScore >= 6 ? "text-teal-400"
    : avgScore >= 4 ? "text-amber-400"
    : "text-red-400";

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-6">
      <button
        onClick={() => setExpanded(!expanded)}
        className="w-full flex items-center justify-between"
      >
        <div className="flex items-center gap-2">
          <Target className="h-5 w-5 text-teal-400" />
          <h3 className="text-sm font-bold text-teal-400">Offer Evaluation Scorecard</h3>
        </div>
        {expanded ? (
          <ChevronUp className="h-4 w-4 text-slate-500" />
        ) : (
          <ChevronDown className="h-4 w-4 text-slate-500" />
        )}
      </button>

      {expanded && (
        <div className="mt-5 space-y-4">
          <p className="text-xs text-slate-400">
            Rate each dimension 1-10 to see if this offer aligns with your needs.
          </p>

          {SCORE_CATEGORIES.map((cat) => {
            const Icon = cat.icon;
            const value = scores[cat.key];

            return (
              <div key={cat.key} className="bg-slate-900/40 border border-slate-700/60 rounded-xl p-4">
                <div className="flex items-center gap-2 mb-1">
                  <Icon className="h-4 w-4 text-slate-400" />
                  <span className="text-xs font-medium text-slate-300">{cat.label}</span>
                  {value !== undefined && (
                    <span className={`ml-auto text-sm font-bold ${
                      value >= 8 ? "text-emerald-400" : value >= 6 ? "text-teal-400" : value >= 4 ? "text-amber-400" : "text-red-400"
                    }`}>
                      {value}/10
                    </span>
                  )}
                </div>
                <p className="text-[10px] text-slate-500 mb-3">{cat.description}</p>
                <div className="flex gap-1">
                  {Array.from({ length: 10 }, (_, i) => i + 1).map((n) => (
                    <button
                      key={n}
                      onClick={() => setScore(cat.key, n)}
                      className={`flex-1 h-7 rounded text-[10px] font-medium transition-colors ${
                        value !== undefined && n <= value
                          ? n >= 8 ? "bg-emerald-600 text-white"
                            : n >= 6 ? "bg-teal-600 text-white"
                            : n >= 4 ? "bg-amber-600 text-white"
                            : "bg-red-600 text-white"
                          : "bg-slate-800 text-slate-600 hover:bg-slate-700"
                      }`}
                    >
                      {n}
                    </button>
                  ))}
                </div>
              </div>
            );
          })}

          {filledCount === SCORE_CATEGORIES.length && (
            <div className={`p-4 rounded-xl border ${
              avgScore >= 8 ? "bg-emerald-900/20 border-emerald-700/30"
                : avgScore >= 6 ? "bg-teal-900/20 border-teal-700/30"
                : avgScore >= 4 ? "bg-amber-900/20 border-amber-700/30"
                : "bg-red-900/20 border-red-700/30"
            }`}>
              <div className="flex items-center justify-between mb-2">
                <span className="text-xs text-slate-400">Overall Score</span>
                <span className={`text-lg font-bold ${verdictColor}`}>{avgScore}/10</span>
              </div>
              <p className={`text-xs font-medium ${verdictColor}`}>{verdict}</p>

              {salaryFloor && scores.salary !== undefined && scores.salary < 6 && (
                <p className="text-[10px] text-red-400 mt-2 flex items-center gap-1.5">
                  <AlertTriangle className="h-3 w-3 shrink-0" />
                  Your salary score is low. This may not meet your stated minimum of {fmtCurrency(salaryFloor, locale)}.
                  Prioritize negotiating base salary before accepting.
                </p>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// --- Main Tab Component ---

export default function SalaryNegotiationTab({ profile, plan }: SalaryNegotiationTabProps) {
  return (
    <MarketDataLoader roles={[plan.targetRole]}>
      {(marketDataMap) => {
        const marketData = marketDataMap[plan.targetRole] ?? null;

        return (
          <div className="space-y-6">
            <TargetSalaryCalculator
              profile={profile}
              plan={plan}
              marketData={marketData}
            />
            <NegotiationChecklist />
            <CounterOfferScript
              profile={profile}
              plan={plan}
              marketData={marketData}
            />
            <OfferScorecard profile={profile} />
          </div>
        );
      }}
    </MarketDataLoader>
  );
}
