"use client";

import Link from "next/link";
import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { trackCtaClicked, trackCtaHovered } from "@/lib/tracking";

export default function StickyCtaBar() {
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    function onScroll() {
      setVisible(window.scrollY > 600);
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  if (!visible) return null;

  return (
    <motion.div
      initial={{ y: 80, opacity: 0 }}
      animate={{ y: 0, opacity: 1 }}
      exit={{ y: 80, opacity: 0 }}
      className="fixed bottom-0 inset-x-0 z-50 md:hidden bg-[#030712]/95 backdrop-blur-md border-t border-slate-800/60 py-3 px-4 pb-[max(0.75rem,env(safe-area-inset-bottom))] flex items-center justify-center gap-4"
    >
      <Link
        href="/get-started"
        onClick={() => trackCtaClicked({ cta_text: "See My Career Paths — Free", cta_location: "sticky_bar_mobile", destination: "/get-started" })}
        onMouseEnter={() => trackCtaHovered({ cta_text: "See My Career Paths — Free", cta_location: "sticky_bar_mobile" })}
        className="px-6 py-3 min-h-[44px] flex items-center rounded-lg bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-sm text-white hover:shadow-lg hover:shadow-teal-500/30 transition-all duration-200"
      >
        See My Career Paths — Free →
      </Link>
    </motion.div>
  );
}
