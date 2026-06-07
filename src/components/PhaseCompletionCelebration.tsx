"use client";

import { useEffect, useState } from "react";

interface PhaseCompletionCelebrationProps {
  phaseLabel: string;
  phaseColor: "emerald" | "teal" | "cyan";
  onDismiss: () => void;
}

const PHASE_GRADIENTS: Record<string, string> = {
  emerald: "from-emerald-500 to-emerald-700",
  teal: "from-teal-500 to-teal-700",
  cyan: "from-cyan-500 to-cyan-700",
};

const PHASE_BORDERS: Record<string, string> = {
  emerald: "border-emerald-500/60",
  teal: "border-teal-500/60",
  cyan: "border-cyan-500/60",
};

export default function PhaseCompletionCelebration({
  phaseLabel,
  phaseColor,
  onDismiss,
}: PhaseCompletionCelebrationProps) {
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    const timer = setTimeout(() => {
      setVisible(false);
      onDismiss();
    }, 3000);
    return () => clearTimeout(timer);
  }, [onDismiss]);

  function handleClick() {
    setVisible(false);
    onDismiss();
  }

  if (!visible) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-slate-900/80 backdrop-blur-sm animate-in fade-in duration-300"
      onClick={handleClick}
    >
      {/* CSS confetti */}
      <div className="absolute inset-0 overflow-hidden pointer-events-none" aria-hidden="true">
        {Array.from({ length: 40 }).map((_, i) => (
          <span
            key={i}
            className="confetti-piece absolute block rounded-sm"
            style={{
              left: `${(i * 2.5) % 100}%`,
              width: `${6 + (i % 4) * 2}px`,
              height: `${6 + (i % 3) * 3}px`,
              backgroundColor: [
                "#2dd4bf", "#34d399", "#22d3ee", "#a78bfa",
                "#fbbf24", "#fb923c", "#f472b6", "#60a5fa",
              ][i % 8],
              animationName: "confettiFall",
              animationDuration: `${1.5 + (i % 10) * 0.15}s`,
              animationTimingFunction: "cubic-bezier(0.25, 0.46, 0.45, 0.94)",
              animationIterationCount: "infinite",
              animationDelay: `${(i % 8) * 0.1}s`,
              transform: `rotate(${(i * 37) % 360}deg)`,
            }}
          />
        ))}
      </div>

      {/* Card */}
      <div
        className={`relative bg-slate-900 border-2 ${PHASE_BORDERS[phaseColor]} rounded-2xl p-8 max-w-sm mx-4 text-center shadow-2xl animate-in zoom-in-95 duration-300`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Badge */}
        <div
          className={`w-16 h-16 mx-auto mb-4 rounded-full bg-gradient-to-br ${PHASE_GRADIENTS[phaseColor]} flex items-center justify-center shadow-lg`}
        >
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
          </svg>
        </div>

        <h2 className="text-2xl font-extrabold text-white mb-2">
          Phase Complete!
        </h2>
        <p className="text-slate-400 text-sm mb-1">
          You finished all milestones in
        </p>
        <p className={`text-lg font-bold bg-gradient-to-r ${PHASE_GRADIENTS[phaseColor]} bg-clip-text text-transparent mb-5`}>
          {phaseLabel}
        </p>

        <button
          onClick={handleClick}
          className="px-6 py-2.5 rounded-xl bg-gradient-to-r from-teal-600 to-cyan-600 hover:from-teal-500 hover:to-cyan-500 text-white font-semibold text-sm transition-colors"
        >
          Share This Achievement
        </button>

        <p className="text-slate-600 text-xs mt-3">Click anywhere to dismiss</p>
      </div>

      <style jsx>{`
        @keyframes confettiFall {
          0% {
            transform: translateY(-10vh) rotate(0deg);
            opacity: 1;
          }
          100% {
            transform: translateY(110vh) rotate(720deg);
            opacity: 0;
          }
        }
      `}</style>
    </div>
  );
}
