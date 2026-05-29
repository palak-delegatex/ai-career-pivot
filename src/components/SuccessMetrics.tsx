"use client";

import { useRef, useEffect, useState } from "react";
import { motion, useInView } from "framer-motion";

const metrics = [
  { value: 500, suffix: "+", label: "Professionals Pivoted" },
  { value: 92, suffix: "%", label: "Report Career Progress" },
  { value: 3.2, suffix: "x", label: "Faster Than Solo Planning", decimals: 1 },
  { value: 15, prefix: "$", suffix: "K", label: "Average Salary Uplift" },
];

function CountUp({
  target,
  decimals = 0,
  prefix = "",
  suffix = "",
  active,
}: {
  target: number;
  decimals?: number;
  prefix?: string;
  suffix?: string;
  active: boolean;
}) {
  const [current, setCurrent] = useState(0);

  useEffect(() => {
    if (!active) return;
    const duration = 1800;
    const steps = 60;
    const increment = target / steps;
    let step = 0;
    const timer = setInterval(() => {
      step++;
      if (step >= steps) {
        setCurrent(target);
        clearInterval(timer);
      } else {
        setCurrent(Math.min(increment * step, target));
      }
    }, duration / steps);
    return () => clearInterval(timer);
  }, [active, target]);

  return (
    <span>
      {prefix}
      {current.toFixed(decimals)}
      {suffix}
    </span>
  );
}

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

export default function SuccessMetrics() {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });

  return (
    <section className="py-24 px-6">
      <div className="max-w-5xl mx-auto">
        <motion.div
          ref={ref}
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="text-center mb-12"
        >
          <motion.p
            variants={fadeUp}
            className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3"
          >
            Proven Results
          </motion.p>
          <motion.h2
            variants={fadeUp}
            className="text-3xl sm:text-4xl font-extrabold text-white"
          >
            Numbers that speak for themselves
          </motion.h2>
        </motion.div>

        <motion.div
          variants={stagger}
          initial="hidden"
          animate={inView ? "visible" : "hidden"}
          className="grid grid-cols-2 lg:grid-cols-4 gap-5"
        >
          {metrics.map((m) => (
            <motion.div
              key={m.label}
              variants={fadeUp}
              className="relative bg-slate-900/60 backdrop-blur-sm rounded-2xl p-7 border border-slate-800/60 text-center group hover:border-slate-700 transition-colors"
            >
              <div className="text-3xl sm:text-4xl font-extrabold text-white mb-2">
                <CountUp
                  target={m.value}
                  decimals={m.decimals ?? 0}
                  prefix={m.prefix ?? ""}
                  suffix={m.suffix}
                  active={inView}
                />
              </div>
              <p className="text-slate-400 text-sm">{m.label}</p>
              <div className="absolute bottom-0 left-1/2 -translate-x-1/2 w-12 h-0.5 bg-gradient-to-r from-teal-500 to-emerald-500 rounded-full" />
            </motion.div>
          ))}
        </motion.div>
      </div>
    </section>
  );
}
