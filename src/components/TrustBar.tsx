"use client";

import { useRef } from "react";
import { motion, useInView } from "framer-motion";
import { useTranslations } from "next-intl";

export default function TrustBar() {
  const t = useTranslations("trustBar");
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-40px" });

  const partners = [
    {
      name: "Anthropic",
      svg: (
        <svg viewBox="0 0 120 24" className="h-6 w-auto" fill="currentColor">
          <text x="0" y="18" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">
            {t("partners.anthropic")}
          </text>
        </svg>
      ),
    },
    {
      name: "Vercel",
      svg: (
        <svg viewBox="0 0 76 24" className="h-5 w-auto" fill="currentColor">
          <path d="M13 2L25 22H1L13 2Z" />
          <text x="30" y="18" fontSize="14" fontWeight="600" fontFamily="system-ui, sans-serif">
            {t("partners.vercel")}
          </text>
        </svg>
      ),
    },
    {
      name: "Stripe",
      svg: (
        <svg viewBox="0 0 80 24" className="h-6 w-auto" fill="currentColor">
          <text x="0" y="18" fontSize="16" fontWeight="700" fontFamily="system-ui, sans-serif">
            {t("partners.stripe")}
          </text>
        </svg>
      ),
    },
  ];

  return (
    <section className="py-12 px-6 border-y border-slate-800/40">
      <motion.div
        ref={ref}
        initial={{ opacity: 0 }}
        animate={inView ? { opacity: 1 } : { opacity: 0 }}
        transition={{ duration: 0.6 }}
        className="max-w-3xl mx-auto"
      >
        <p className="text-center text-slate-600 text-xs font-medium tracking-widest uppercase mb-6">
          {t("tagline")}
        </p>
        <div className="flex items-center justify-center gap-0">
          {partners.map((p, i) => (
            <div key={p.name} className="flex items-center">
              {i > 0 && (
                <div className="w-px h-8 bg-slate-800 mx-8 sm:mx-12" />
              )}
              <div className="text-slate-500 opacity-30 hover:opacity-100 hover:text-slate-300 transition-all duration-300 cursor-default">
                {p.svg}
              </div>
            </div>
          ))}
        </div>
      </motion.div>
    </section>
  );
}
