"use client";

import { useState, useEffect } from "react";
import { useRouter } from "@/i18n/navigation";
import { motion } from "framer-motion";
import { useTranslations } from "next-intl";
import InlineGuaranteeBadge from "@/components/InlineGuaranteeBadge";
import { trackCtaClicked, trackCtaHovered } from "@/lib/tracking";

// Sticky mobile CTA now routes cold traffic to the FREE snapshot rather than
// /pricing ($19) — the hero-to-paid jump was the root cause of the ~2-5%
// landing→free_upload_started rate (AIC-1052 conversion audit).
const CTA_TEXT = "Try My Free Skill-Gap Snapshot";
const CTA_DEST = "/free?mode=upload";

export default function StickyCtaBar() {
  const [visible, setVisible] = useState(false);
  const t = useTranslations("home.stickyCta");
  const router = useRouter();

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  // Inline file-picker (AIC-1155): mirror the hero CTA — pick the resume here,
  // queue it for /free to auto-start, then navigate. Cancelled picker fires no
  // change event, so nothing happens.
  function handleFileSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    trackCtaClicked({ cta_text: CTA_TEXT, cta_location: "sticky_bar_mobile", destination: CTA_DEST });
    window.__queuedResumeFile = file;
    router.push(CTA_DEST);
  }

  if (!visible) return null;

  const label = t.rich("cta", { s: (chunks) => <s className="text-slate-400 font-normal ml-1 mr-1">{chunks}</s> });
  const btnClass =
    "px-6 py-3 min-h-[44px] flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-sm text-white hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-200";

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#030712]/95 backdrop-blur-md border-t border-slate-800/60 py-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex flex-col items-center justify-center gap-1.5"
    >
      <div className="flex items-center justify-center gap-4">
        <label
          onMouseEnter={() => trackCtaHovered({ cta_text: CTA_TEXT, cta_location: "sticky_bar_mobile" })}
          className={`${btnClass} cursor-pointer`}
        >
          {label}
          <input
            type="file"
            accept=".pdf,.docx,.doc,.txt"
            className="sr-only"
            onChange={handleFileSelect}
          />
        </label>
      </div>
      <InlineGuaranteeBadge variant="short" />
    </motion.div>
  );
}
