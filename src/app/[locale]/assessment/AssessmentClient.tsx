"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { motion, AnimatePresence } from "framer-motion";
import { useTranslations } from "next-intl";
import type { ValuesAssessment } from "@/lib/intake";

const WORK_STYLE_IDS = ["independent", "collaborative", "leading", "supporting"] as const;

const VALUE_IDS = [
  { id: "compensation", icon: "💰" },
  { id: "balance", icon: "⚖️" },
  { id: "creativity", icon: "🎨" },
  { id: "impact", icon: "🌍" },
  { id: "learning", icon: "📚" },
  { id: "status", icon: "⭐" },
  { id: "autonomy", icon: "🔓" },
  { id: "stability", icon: "🏠" },
] as const;

const ENERGY_SPECTRUM_IDS = ["social", "scope", "risk", "focus"] as const;

const DEALBREAKER_IDS = [
  "pay-cut",
  "overtime",
  "remote-only",
  "in-office",
  "travel",
  "pressure",
  "limited-growth",
] as const;

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

export default function AssessmentClient() {
  const t = useTranslations("assessment");
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

  const STEP_LABELS = [
    t("stepWorkStyle"),
    t("stepValues"),
    t("stepEnergy"),
    t("stepDealbreakers"),
  ];

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
              {step === 0 ? t("skipAssessment") : t("back")}
            </button>

            {step < 3 ? (
              <button
                onClick={goNext}
                disabled={step === 0 && !workStyle}
                className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 disabled:cursor-not-allowed font-bold text-sm transition-colors shadow-lg shadow-teal-900/50"
              >
                {t("continue")}
              </button>
            ) : (
              <button
                onClick={handleComplete}
                disabled={saving}
                className="px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-40 font-bold text-sm transition-colors shadow-lg shadow-teal-900/50"
              >
                {saving ? t("saving") : t("generateRoadmap")}
              </button>
            )}
          </div>

          {step === 0 && (
            <p className="text-center text-slate-600 text-xs mt-6">
              {t("optionalHint")}
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
  const t = useTranslations("assessment");
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        {t("step1Title")}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        {t("step1Body")}
      </p>
      <div className="grid grid-cols-1 gap-3">
        {WORK_STYLE_IDS.map((id) => (
          <button
            key={id}
            onClick={() => onSelect(id)}
            className="flex flex-col items-start p-5 rounded-xl border-2 transition-all text-left"
            style={{
              backgroundColor: selected === id ? "var(--primary)" : "var(--muted)",
              borderColor: selected === id ? "var(--primary)" : "transparent",
              color: selected === id ? "#fff" : "var(--foreground)",
            }}
          >
            <span className="font-bold text-sm">{t(`workStyle.${id}.label`)}</span>
            <span
              className="text-xs mt-1"
              style={{
                color: selected === id ? "rgba(255,255,255,0.8)" : "var(--muted-foreground)",
              }}
            >
              {t(`workStyle.${id}.desc`)}
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
  const t = useTranslations("assessment");
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        {t("step2Title")}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        {t("step2Body")}
      </p>

      {ranked.length > 0 && (
        <div className="mb-6">
          <p className="text-xs text-slate-500 mb-2 font-medium uppercase tracking-wider">
            {t("rankingLabel", { count: ranked.length })}
          </p>
          <div className="space-y-2">
            {ranked.map((id, i) => {
              const val = VALUE_IDS.find((v) => v.id === id)!;
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
                    {i + 1}. {val.icon} {t(`value.${id}.label`)}
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
        {VALUE_IDS.filter((v) => !ranked.includes(v.id)).map((val) => (
          <button
            key={val.id}
            onClick={() => onToggle(val.id)}
            disabled={ranked.length >= 5}
            className="flex items-center gap-2 px-4 py-3 rounded-xl text-sm font-medium transition-all disabled:opacity-30 disabled:cursor-not-allowed"
            style={{ backgroundColor: "var(--muted)", color: "var(--foreground)" }}
          >
            <span>{val.icon}</span>
            <span>{t(`value.${val.id}.label`)}</span>
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
  const t = useTranslations("assessment");
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        {t("step3Title")}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        {t("step3Body")}
      </p>
      <div className="space-y-8">
        {ENERGY_SPECTRUM_IDS.map((id) => (
          <div key={id}>
            <div className="flex justify-between text-sm mb-2">
              <span className="text-slate-300 font-medium">{t(`spectrum.${id}.left`)}</span>
              <span className="text-slate-300 font-medium">{t(`spectrum.${id}.right`)}</span>
            </div>
            <input
              type="range"
              min={0}
              max={100}
              value={values[id]}
              onChange={(e) => onChange(id, Number(e.target.value))}
              className="w-full h-2 rounded-full appearance-none cursor-pointer"
              style={
                {
                  background: `linear-gradient(to right, var(--primary) ${values[id]}%, var(--muted) ${values[id]}%)`,
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
  const t = useTranslations("assessment");
  return (
    <div>
      <h2 className="font-serif text-xl font-bold text-center mb-2">
        {t("step4Title")}
      </h2>
      <p className="text-slate-400 text-sm text-center mb-8">
        {t("step4Body")}
      </p>
      <div className="grid grid-cols-1 gap-3">
        {DEALBREAKER_IDS.map((id) => {
          const isSelected = selected.has(id);
          return (
            <button
              key={id}
              onClick={() => onToggle(id)}
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
              <span className="text-sm font-medium">{t(`dealbreaker.${id}.label`)}</span>
            </button>
          );
        })}
      </div>
    </div>
  );
}
