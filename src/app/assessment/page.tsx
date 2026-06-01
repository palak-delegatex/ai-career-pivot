"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import type { ValuesAssessment } from "@/lib/intake";

const WORK_STYLES = [
  { id: "independent", label: "Independent", desc: "I do my best work solo with autonomy" },
  { id: "collaborative", label: "Collaborative", desc: "I thrive in team-based environments" },
  { id: "leading", label: "Leading", desc: "I naturally take charge and guide others" },
  { id: "supporting", label: "Supporting", desc: "I excel at enabling others to succeed" },
] as const;

const VALUES = [
  { id: "compensation", label: "Compensation", icon: "💰" },
  { id: "balance", label: "Work-Life Balance", icon: "⚖️" },
  { id: "creativity", label: "Creativity", icon: "🎨" },
  { id: "impact", label: "Social Impact", icon: "🌍" },
  { id: "learning", label: "Continuous Learning", icon: "📚" },
  { id: "status", label: "Status & Recognition", icon: "⭐" },
  { id: "autonomy", label: "Autonomy", icon: "🔓" },
  { id: "stability", label: "Job Stability", icon: "🏠" },
] as const;

const ENERGY_SPECTRUMS = [
  { id: "social", left: "Introvert", right: "Extrovert" },
  { id: "scope", left: "Specialist", right: "Generalist" },
  { id: "risk", left: "Risk-Averse", right: "Risk-Seeking" },
  { id: "focus", left: "Process-Oriented", right: "Outcome-Oriented" },
] as const;

const DEALBREAKERS = [
  { id: "pay-cut", label: "Significant pay cut" },
  { id: "overtime", label: "Frequent overtime" },
  { id: "remote-only", label: "Remote-only work" },
  { id: "in-office", label: "In-office requirement" },
  { id: "travel", label: "Frequent travel" },
  { id: "pressure", label: "High-pressure environment" },
  { id: "limited-growth", label: "Limited growth opportunities" },
] as const;

const STEP_LABELS = ["Work Style", "Values", "Energy", "Dealbreakers"];

const slideVariants = {
  enter: (direction: number) => ({
    x: direction > 0 ? 300 : -300,
    opacity: 0,
  }),
  center: { x: 0, opacity: 1 },
  exit: (direction: number) => ({
    x: direction > 0 ? -300 : 300,
    opacity: 0,
  }),
};

export default function AssessmentPage() {
  const router = useRouter();
  const [step, setStep] = useState(0);
  const [direction, setDirection] = useState(1);

  const [workStyle, setWorkStyle] = useState<string | null>(null);
  const [rankedValues, setRankedValues] = useState<string[]>([]);
  const [energy, setEnergy] = useState<Record<string, number>>({
    social: 50,
    scope: 50,
    risk: 50,
    focus: 50,
  });
  const [dealbreakers, setDealbreakers] = useState<Set<string>>(new Set());
  const [saving, setSaving] = useState(false);

  const dragItem = useRef<number | null>(null);
  const dragOverItem = useRef<number | null>(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("intake_profile");
    if (!stored) {
      router.replace("/onboarding");
    }
  }, [router]);

  function goNext() {
    setDirection(1);
    setStep((s) => Math.min(s + 1, 3));
  }

  function goBack() {
    setDirection(-1);
    setStep((s) => Math.max(s - 1, 0));
  }

  function toggleValue(id: string) {
    setRankedValues((prev) => {
      if (prev.includes(id)) return prev.filter((v) => v !== id);
      if (prev.length >= 5) return prev;
      return [...prev, id];
    });
  }

  function handleDragStart(index: number) {
    dragItem.current = index;
  }

  function handleDragEnter(index: number) {
    dragOverItem.current = index;
  }

  function handleDragEnd() {
    if (dragItem.current === null || dragOverItem.current === null) return;
    const items = [...rankedValues];
    const [removed] = items.splice(dragItem.current, 1);
    items.splice(dragOverItem.current, 0, removed);
    setRankedValues(items);
    dragItem.current = null;
    dragOverItem.current = null;
  }

  function toggleDealbreaker(id: string) {
    setDealbreakers((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }

  const handleSkip = useCallback(() => {
    router.push("/onboarding/profile?generate=1");
  }, [router]);

  const handleComplete = useCallback(() => {
    setSaving(true);

    const assessment: ValuesAssessment = {
      workStyle: workStyle || "independent",
      topValues: rankedValues,
      energyProfile: energy,
      dealbreakers: Array.from(dealbreakers),
    };

    sessionStorage.setItem("values_assessment", JSON.stringify(assessment));

    router.push("/onboarding/profile?generate=1");
  }, [workStyle, rankedValues, energy, dealbreakers, router]);

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="w-full max-w-lg">
          {/* Progress dots */}
          <div className="flex items-center justify-center gap-3 mb-10">
            {STEP_LABELS.map((label, i) => (
              <div key={label} className="flex flex-col items-center gap-1.5">
                <div
                  className="w-3 h-3 rounded-full transition-all duration-300"
                  style={{
                    backgroundColor: i <= step ? "var(--primary)" : "var(--muted)",
                    transform: i === step ? "scale(1.3)" : "scale(1)",
                  }}
                />
                <span
                  className="text-[10px] font-medium"
                  style={{ color: i === step ? "var(--primary-foreground)" : "var(--muted-foreground)" }}
                >
                  {label}
                </span>
              </div>
            ))}
          </div>

          <AnimatePresence mode="wait" custom={direction}>
            <motion.div
              key={step}
              custom={direction}
              variants={slideVariants}
              initial="enter"
              animate="center"
              exit="exit"
              transition={{ duration: 0.3, ease: "easeInOut" }}
            >
              {step === 0 && (
                <StepWorkStyle selected={workStyle} onSelect={setWorkStyle} />
              )}
              {step === 1 && (
                <StepValuesRanking
                  ranked={rankedValues}
                  onToggle={toggleValue}
                  onDragStart={handleDragStart}
                  onDragEnter={handleDragEnter}
                  onDragEnd={handleDragEnd}
                />
              )}
              {step === 2 && (
                <StepEnergyMapping
                  values={energy}
                  onChange={(id, val) => setEnergy((prev) => ({ ...prev, [id]: val }))}
                />
              )}
              {step === 3 && (
                <StepDealbreakers
                  selected={dealbreakers}
                  onToggle={toggleDealbreaker}
                />
              )}
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between mt-10">
            <button
              onClick={step === 0 ? handleSkip : goBack}
              className="px-6 py-3 rounded-xl text-sm font-medium text-slate-400 hover:text-white transition-colors"
            >
              {step === 0 ? "Skip assessment" : "Back"}
            </button>

            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={step === 0 && !workStyle}
                className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm transition-colors shadow-lg shadow-teal-900/50"
              >
                Continue
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 font-bold text-sm transition-colors shadow-lg shadow-teal-900/50"
              >
                {saving ? "Saving..." : "Generate my roadmap"}
              </button>
            )}
          </div>

          {step === 0 && (
            <p className="text-center text-slate-600 text-xs mt-6">
              Optional &middot; 5-8 min &middot; Makes your roadmap more personalized
            </p>
          )}
        </div>
      </div>
    </div>
  );
}

function StepWorkStyle({
  selected,
  onSelect,
}: {
  selected: string | null;
  onSelect: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        How do you prefer to work?
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        Select the style that best describes you
      </p>
      <div className="grid grid-cols-1 gap-3">
        {WORK_STYLES.map((style) => (
          <button
            key={style.id}
            onClick={() => onSelect(style.id)}
            className="flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left"
            style={{
              backgroundColor: selected === style.id ? "var(--primary)" : "var(--muted)",
              borderColor: selected === style.id ? "var(--primary)" : "transparent",
              color: selected === style.id ? "#fff" : "var(--foreground)",
            }}
          >
            <span className="font-bold text-sm">{style.label}</span>
            <span
              className="text-xs mt-1"
              style={{
                color: selected === style.id ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)",
              }}
            >
              {style.desc}
            </span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepValuesRanking({
  ranked,
  onToggle,
  onDragStart,
  onDragEnter,
  onDragEnd,
}: {
  ranked: string[];
  onToggle: (id: string) => void;
  onDragStart: (i: number) => void;
  onDragEnter: (i: number) => void;
  onDragEnd: () => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        What matters most to you?
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        Select your top 5 values, then drag to rank them
      </p>

      {ranked.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
            Your ranking ({ranked.length}/5)
          </p>
          <div className="space-y-2">
            {ranked.map((id, i) => {
              const val = VALUES.find((v) => v.id === id)!;
              return (
                <div
                  key={id}
                  draggable
                  onDragStart={() => onDragStart(i)}
                  onDragEnter={() => onDragEnter(i)}
                  onDragEnd={onDragEnd}
                  onDragOver={(e) => e.preventDefault()}
                  className="flex items-center gap-3 px-4 py-3 rounded-xl cursor-grab active:cursor-grabbing transition-all"
                  style={{ backgroundColor: "var(--primary)", color: "#fff" }}
                >
                  <svg
                    className="w-4 h-4 opacity-60 flex-shrink-0"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth={2}
                  >
                    <line x1="8" y1="6" x2="8" y2="6.01" />
                    <line x1="16" y1="6" x2="16" y2="6.01" />
                    <line x1="8" y1="12" x2="8" y2="12.01" />
                    <line x1="16" y1="12" x2="16" y2="12.01" />
                    <line x1="8" y1="18" x2="8" y2="18.01" />
                    <line x1="16" y1="18" x2="16" y2="18.01" />
                  </svg>
                  <span className="text-sm font-medium">
                    {i + 1}. {val.icon} {val.label}
                  </span>
                  <button
                    onClick={() => onToggle(id)}
                    className="ml-auto text-white/60 hover:text-white text-lg"
                  >
                    &times;
                  </button>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <div className="grid grid-cols-2 gap-2">
        {VALUES.filter((v) => !ranked.includes(v.id)).map((val) => (
          <button
            key={val.id}
            onClick={() => onToggle(val.id)}
            disabled={ranked.length >= 5}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}
          >
            <span>{val.icon}</span>
            <span>{val.label}</span>
          </button>
        ))}
      </div>
    </div>
  );
}

function StepEnergyMapping({
  values,
  onChange,
}: {
  values: Record<string, number>;
  onChange: (id: string, val: number) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        Map your energy
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        Where do you fall on each spectrum?
      </p>
      <div className="space-y-8">
        {ENERGY_SPECTRUMS.map((spectrum) => (
          <div key={spectrum.id}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300 font-medium">{spectrum.left}</span>
              <span className="text-slate-300 font-medium">{spectrum.right}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={values[spectrum.id]}
              onChange={(e) => onChange(spectrum.id, Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={
                {
                  background: `linear-gradient(to right, var(--primary) ${values[spectrum.id]}%, var(--muted) ${values[spectrum.id]}%)`,
                  "--thumb-size": "24px",
                } as React.CSSProperties
              }
            />
          </div>
        ))}
      </div>
    </div>
  );
}

function StepDealbreakers({
  selected,
  onToggle,
}: {
  selected: Set<string>;
  onToggle: (id: string) => void;
}) {
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        What are your dealbreakers?
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        Select anything you absolutely want to avoid
      </p>
      <div className="grid grid-cols-1 gap-3">
        {DEALBREAKERS.map((item) => {
          const isSelected = selected.has(item.id);
          return (
            <button
              key={item.id}
              onClick={() => onToggle(item.id)}
              className="flex items-center gap-3 px-5 py-4 rounded-xl border-2 transition-all text-left min-h-[48px]"
              style={{
                backgroundColor: isSelected ? "var(--primary)" : "var(--muted)",
                borderColor: isSelected ? "var(--primary)" : "transparent",
                color: isSelected ? "#fff" : "var(--foreground)",
              }}
            >
              <div
                className="w-5 h-5 rounded border-2 flex items-center justify-center flex-shrink-0"
                style={{
                  borderColor: isSelected ? "#fff" : "var(--muted-foreground)",
                  backgroundColor: isSelected ? "#fff" : "transparent",
                }}
              >
                {isSelected && (
                  <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="var(--primary)" strokeWidth={3}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </div>
              <span className="text-sm font-medium">{item.label}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
