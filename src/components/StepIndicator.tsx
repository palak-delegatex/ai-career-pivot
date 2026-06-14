"use client";

import { motion } from "framer-motion";

interface StepIndicatorProps {
  steps: string[];
  currentStep: number;
}

export function StepIndicator({ steps, currentStep }: StepIndicatorProps) {
  return (
    <div className="flex items-center justify-center gap-0 w-full max-w-md mx-auto mb-10">
      {steps.map((label, i) => {
        const completed = i < currentStep;
        const active = i === currentStep;

        return (
          <div key={label} className="flex items-center flex-1 last:flex-none">
            <div className="flex flex-col items-center gap-1.5">
              <div className="relative flex items-center justify-center w-9 h-9">
                {completed ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{
                      scale: [0.8, 1.2, 1],
                      boxShadow: [
                        "0 0 0 0 rgba(74, 222, 128, 0)",
                        "0 0 12px 4px rgba(74, 222, 128, 0.35)",
                        "0 0 0 0 rgba(74, 222, 128, 0)",
                      ],
                    }}
                    transition={{ duration: 0.3, ease: "easeOut" }}
                    className="w-9 h-9 rounded-full flex items-center justify-center"
                    style={{ backgroundColor: "var(--chart-3)" }}
                  >
                    <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  </motion.div>
                ) : active ? (
                  <motion.div
                    initial={{ scale: 0.8 }}
                    animate={{ scale: 1 }}
                    className="w-9 h-9 rounded-full flex items-center justify-center text-white text-sm font-bold"
                    style={{ backgroundColor: "var(--primary)" }}
                  >
                    {i + 1}
                  </motion.div>
                ) : (
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium border-2"
                    style={{
                      borderColor: "var(--muted)",
                      color: "var(--muted-foreground)",
                    }}
                  >
                    {i + 1}
                  </div>
                )}
              </div>
              <span
                className="text-xs font-medium whitespace-nowrap"
                style={{
                  color: active
                    ? "var(--primary-foreground)"
                    : completed
                      ? "var(--chart-3)"
                      : "var(--muted-foreground)",
                }}
              >
                {label}
              </span>
            </div>

            {i < steps.length - 1 && (
              <div className="flex-1 mx-2 mt-[-1.25rem]">
                <div
                  className="h-0.5 w-full rounded-full"
                  style={{
                    backgroundColor: i < currentStep
                      ? "var(--chart-3)"
                      : "var(--muted)",
                  }}
                />
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
