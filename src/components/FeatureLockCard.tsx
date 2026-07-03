"use client";

import { Lock } from "lucide-react";
import { trackUpgradePromptViewed, trackUpgradePromptClicked } from "@/lib/tracking";
import { useEffect } from "react";

interface FeatureLockCardProps {
  feature: string;
  title: string;
  description: string;
  icon?: React.ReactNode;
  onUpgrade: () => void;
}

export default function FeatureLockCard({
  feature,
  title,
  description,
  icon,
  onUpgrade,
}: FeatureLockCardProps) {
  useEffect(() => {
    trackUpgradePromptViewed({ feature, location: "feature_lock_card" });
  }, [feature]);

  return (
    <button
      onClick={() => {
        trackUpgradePromptClicked({ feature, location: "feature_lock_card", destination: "/pricing" });
        onUpgrade();
      }}
      className="relative w-full text-left bg-[#0f172a] border border-[#1e293b] rounded-xl p-5 transition-colors hover:border-[#334155] group cursor-pointer"
    >
      <div className="flex items-start gap-3">
        {icon && <div style={{ opacity: 0.4 }}>{icon}</div>}
        <div className="flex-1 min-w-0">
          <p className="text-sm font-medium" style={{ color: "#64748b" }}>
            {title}
          </p>
          <p className="text-xs mt-1" style={{ color: "#475569" }}>
            {description}
          </p>
        </div>
      </div>
      <div className="absolute inset-0 flex items-center justify-center rounded-xl bg-[#030712]/60 opacity-0 group-hover:opacity-100 transition-opacity">
        <div className="flex items-center gap-2 px-4 py-2 bg-teal-600 rounded-lg">
          <Lock className="h-3.5 w-3.5 text-white" />
          <span className="text-sm font-medium text-white">Upgrade to unlock</span>
        </div>
      </div>
    </button>
  );
}
