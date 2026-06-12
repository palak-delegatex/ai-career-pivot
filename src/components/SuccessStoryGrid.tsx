"use client";

import { useRef, useState } from "react";
import { motion, useInView } from "framer-motion";
import SuccessStoryCard from "./SuccessStoryCard";
import type { SuccessStory } from "@/lib/success-stories";

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

interface SuccessStoryGridProps {
  stories: SuccessStory[];
  variant?: "dark" | "light";
  layout?: "grid" | "carousel";
  showHeader?: boolean;
  className?: string;
}

export default function SuccessStoryGrid({
  stories,
  variant = "dark",
  layout = "grid",
  showHeader = true,
  className = "",
}: SuccessStoryGridProps) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  const scrollRef = useRef<HTMLDivElement>(null);
  const [scrollIndex, setScrollIndex] = useState(0);

  const isDark = variant === "dark";

  function scrollTo(direction: "prev" | "next") {
    if (!scrollRef.current) return;
    const cardWidth = scrollRef.current.firstElementChild?.clientWidth ?? 360;
    const gap = 24;
    const newIndex =
      direction === "next"
        ? Math.min(scrollIndex + 1, stories.length - 1)
        : Math.max(scrollIndex - 1, 0);
    setScrollIndex(newIndex);
    scrollRef.current.scrollTo({
      left: newIndex * (cardWidth + gap),
      behavior: "smooth",
    });
  }

  return (
    <section className={`py-20 px-6 ${className}`} ref={ref}>
      <div className="max-w-6xl mx-auto">
        {showHeader && (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="text-center mb-14"
          >
            <motion.p
              variants={fadeUp}
              className={`text-sm font-semibold tracking-widest uppercase mb-3 ${
                isDark ? "text-teal-400" : "text-teal-600"
              }`}
            >
              Success Stories
            </motion.p>
            <motion.h2
              variants={fadeUp}
              className={`text-3xl sm:text-4xl font-extrabold mb-4 ${
                isDark ? "text-white" : "text-slate-900"
              }`}
            >
              Real transitions,{" "}
              <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                real outcomes
              </span>
            </motion.h2>
            <motion.p
              variants={fadeUp}
              className={`text-base max-w-2xl mx-auto ${
                isDark ? "text-slate-400" : "text-slate-600"
              }`}
            >
              Join thousands of professionals who have successfully pivoted their
              careers with AICareerPivot.
            </motion.p>
          </motion.div>
        )}

        {layout === "grid" ? (
          <motion.div
            variants={stagger}
            initial="hidden"
            animate={inView ? "visible" : "hidden"}
            className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6"
          >
            {stories.map((story) => (
              <motion.div key={story.id} variants={fadeUp}>
                <SuccessStoryCard story={story} variant={variant} />
              </motion.div>
            ))}
          </motion.div>
        ) : (
          <div className="relative">
            <div
              ref={scrollRef}
              className="flex gap-6 overflow-x-auto snap-x snap-mandatory scrollbar-hide pb-4"
              style={{ scrollbarWidth: "none" }}
            >
              {stories.map((story) => (
                <div
                  key={story.id}
                  className="snap-start shrink-0 w-[340px] sm:w-[380px]"
                >
                  <SuccessStoryCard story={story} variant={variant} />
                </div>
              ))}
            </div>

            {/* Carousel controls */}
            <div className="flex items-center justify-center gap-3 mt-6">
              <button
                onClick={() => scrollTo("prev")}
                disabled={scrollIndex === 0}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${
                  isDark
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label="Previous story"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M15 19l-7-7 7-7" />
                </svg>
              </button>
              <div className="flex gap-1.5">
                {stories.map((_, i) => (
                  <div
                    key={i}
                    className={`w-2 h-2 rounded-full transition-colors ${
                      i === scrollIndex
                        ? "bg-teal-500"
                        : isDark
                          ? "bg-slate-700"
                          : "bg-slate-300"
                    }`}
                  />
                ))}
              </div>
              <button
                onClick={() => scrollTo("next")}
                disabled={scrollIndex === stories.length - 1}
                className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors disabled:opacity-30 ${
                  isDark
                    ? "bg-slate-800 text-white hover:bg-slate-700"
                    : "bg-slate-100 text-slate-700 hover:bg-slate-200"
                }`}
                aria-label="Next story"
              >
                <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
                </svg>
              </button>
            </div>
          </div>
        )}
      </div>
    </section>
  );
}
