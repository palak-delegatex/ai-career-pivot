"use client";

import { Lock } from "lucide-react";
import { trackUpgradePromptViewed, trackUpgradePromptClicked } from "@/lib/tracking";
import { useEffect } from "react";

interface ContextualGateProps {
  count: number;
  label: string;
  cta?: string;
  onUpgrade: () => void;
  children?: React.ReactNode;
}

export default function ContextualGate({
  count,
  label,
  cta = "Upgrade to unlock",
  onUpgrade,
  children,
}: ContextualGateProps) {
  useEffect(() => {
    trackUpgradePromptViewed({ feature: label, location: "contextual_gate" });
  }, [label]);

  return (
    <div className="relative overflow-hidden rounded-xl">
      {children && (
        <div className="pointer-events-none select-none" style={{ filter: "blur(2px)" }}>
          {children}
        </div>
      )}
      <div
        className="absolute inset-0 flex flex-col items-center justify-center gap-3 z-10"
        style={{
          background: "rgba(3, 7, 18, 0.5)",
          backdropFilter: "blur(2px)",
          border: "1px solid #334155",
          borderRadius: "12px",
        }}
      >
        <Lock className="h-5 w-5 text-slate-400" />
        <p className="text-sm text-slate-300 font-medium">
          {count} {label}
        </p>
        <button
          onClick={() => {
            trackUpgradePromptClicked({ feature: label, location: "contextual_gate", destination: "/pricing" });
            onUpgrade();
          }}
          className="px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-medium rounded-lg transition-colors"
        >
          {cta}
        </button>
      </div>
    </div>
  );
}
