"use client";

import Image from "next/image";
import Link from "next/link";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef } from "react";

interface VoiceExpert {
  name: string;
  title: string;
  imageSrc: string;
  imageAlt: string;
  gradient: string;
  borderGlow: string;
  accentBorder: string;
  quote: string;
  context: string;
  urgencyLabel: string;
  urgencyDesc: string;
}

const voices: VoiceExpert[] = [
  {
    name: "Dario Amodei",
    title: "CEO, Anthropic",
    imageSrc: "/images/voices/dario-amodei.png",
    imageAlt: "Thoughtful tech CEO in a modern office with dramatic side lighting and city skyline at dusk",
    gradient: "from-rose-500 to-pink-500",
    borderGlow: "hover:shadow-rose-500/20",
    accentBorder: "hover:border-rose-500/40",
    quote: "AI will have effects that are much broader and occur much faster than previous labor market shocks.",
    context: "Davos 2026",
    urgencyLabel: "50% of entry-level jobs",
    urgencyDesc: "disrupted in 1–5 years",
  },
  {
    name: "Geoffrey Hinton",
    title: 'Nobel Laureate · "Godfather of AI"',
    imageSrc: "/images/voices/geoffrey-hinton.png",
    imageAlt: "Distinguished professor in a university library with neural network diagrams on a chalkboard and golden hour light",
    gradient: "from-amber-400 to-orange-500",
    borderGlow: "hover:shadow-amber-500/20",
    accentBorder: "hover:border-amber-500/40",
    quote: "AI capabilities are doubling roughly every seven months — the pace of change is unlike anything we have seen before.",
    context: "Nobel Lecture 2024",
    urgencyLabel: "2026",
    urgencyDesc: "the tipping point for mass displacement",
  },
  {
    name: "Jensen Huang",
    title: "CEO, NVIDIA",
    imageSrc: "/images/voices/jensen-huang.png",
    imageAlt: "Charismatic tech executive on stage with dramatic teal lighting and holographic GPU chip diagrams",
    gradient: "from-emerald-400 to-teal-600",
    borderGlow: "hover:shadow-emerald-500/20",
    accentBorder: "hover:border-emerald-500/40",
    quote: "It is essential to learn how to use AI — how to direct it, manage it, guardrail it, evaluate it.",
    context: "CES 2025",
    urgencyLabel: "Every job",
    urgencyDesc: "will fundamentally change",
  },
  {
    name: "Chamath Palihapitiya",
    title: "Founder, Social Capital",
    imageSrc: "/images/voices/chamath-palihapitiya.png",
    imageAlt: "Venture capitalist in a modern podcast studio with neon blue lighting and market data monitors",
    gradient: "from-sky-400 to-blue-600",
    borderGlow: "hover:shadow-sky-500/20",
    accentBorder: "hover:border-sky-500/40",
    quote: "Young people willing to be AI native are well placed. Those who aren't will be left behind.",
    context: "All-In Podcast",
    urgencyLabel: "18 months",
    urgencyDesc: "before traditional roles transform",
  },
];

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

function TiltCard({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const rawX = useMotionValue(0);
  const rawY = useMotionValue(0);
  const springConfig = { stiffness: 200, damping: 20 };
  const x = useSpring(rawX, springConfig);
  const y = useSpring(rawY, springConfig);
  const rotateX = useTransform(y, [-0.5, 0.5], [7, -7]);
  const rotateY = useTransform(x, [-0.5, 0.5], [-7, 7]);

  function onMouseMove(e: React.MouseEvent<HTMLDivElement>) {
    const rect = e.currentTarget.getBoundingClientRect();
    rawX.set((e.clientX - rect.left) / rect.width - 0.5);
    rawY.set((e.clientY - rect.top) / rect.height - 0.5);
  }

  function onMouseLeave() {
    rawX.set(0);
    rawY.set(0);
  }

  return (
    <motion.div
      ref={ref}
      onMouseMove={onMouseMove}
      onMouseLeave={onMouseLeave}
      style={{ rotateX, rotateY, transformStyle: "preserve-3d", perspective: 800 }}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function AnimatedSection({ children, className = "" }: { children: React.ReactNode; className?: string }) {
  const ref = useRef(null);
  const inView = useInView(ref, { once: true, margin: "-80px" });
  return (
    <motion.div
      ref={ref}
      variants={stagger}
      initial="hidden"
      animate={inView ? "visible" : "hidden"}
      className={className}
    >
      {children}
    </motion.div>
  );
}

function VoiceCard({ expert, index }: { expert: VoiceExpert; index: number }) {
  const isReversed = index % 2 === 1;

  return (
    <motion.div
      variants={{
        hidden: { opacity: 0, y: 40, scale: 0.97 },
        visible: {
          opacity: 1,
          y: 0,
          scale: 1,
          transition: { duration: 0.5, delay: index * 0.1, ease: [0.21, 1.11, 0.81, 0.99] },
        },
      }}
    >
      <TiltCard className="h-full">
        <div
          className={`h-full relative bg-slate-900/80 backdrop-blur-sm rounded-2xl border border-slate-800 ${expert.accentBorder} ${expert.borderGlow} hover:shadow-2xl transition-all duration-300 group cursor-default overflow-hidden`}
        >
          <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${expert.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />

          <div className={`flex flex-col ${isReversed ? "md:flex-row-reverse" : "md:flex-row"}`}>
            {/* Image */}
            <div className="relative w-full md:w-1/2 aspect-video md:aspect-auto md:min-h-[320px] overflow-hidden shrink-0">
              <Image
                src={expert.imageSrc}
                alt={expert.imageAlt}
                fill
                sizes="(max-width: 768px) 100vw, 50vw"
                quality={75}
                className="object-cover group-hover:scale-[1.03] transition-transform duration-500"
              />
              <div className="absolute inset-0 bg-gradient-to-t from-slate-900/90 via-slate-900/40 to-transparent md:hidden" />
              <div className={`absolute inset-0 hidden md:block ${isReversed ? "bg-gradient-to-l" : "bg-gradient-to-r"} from-transparent via-slate-900/30 to-slate-900/80`} />
            </div>

            {/* Content */}
            <div className="relative z-10 p-7 flex flex-col justify-center md:w-1/2">
              <div className={`absolute top-4 right-5 text-7xl font-serif leading-none select-none bg-gradient-to-br ${expert.gradient} bg-clip-text text-transparent opacity-10 group-hover:opacity-25 transition-opacity duration-300`}>
                &ldquo;
              </div>

              <blockquote className="text-slate-100 text-lg md:text-xl leading-relaxed font-serif font-semibold mb-6 relative z-10">
                &ldquo;{expert.quote}&rdquo;
              </blockquote>

              <div className="flex items-center gap-3.5 mb-4">
                <div>
                  <div className="text-white font-bold text-sm leading-tight">{expert.name}</div>
                  <div className="text-slate-500 text-xs mt-0.5 leading-tight">{expert.title}</div>
                </div>
                <div className="ml-auto text-xs text-slate-600 italic shrink-0">{expert.context}</div>
              </div>

              <div className="flex items-center gap-2">
                <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${expert.gradient} animate-pulse`} aria-hidden="true" />
                <span className="text-xs text-slate-400">
                  <span className="font-semibold text-white">{expert.urgencyLabel}</span>{" "}
                  {expert.urgencyDesc}
                </span>
              </div>
            </div>
          </div>
        </div>
      </TiltCard>
    </motion.div>
  );
}

export default function VoicesOfTheAIEra() {
  return (
    <section className="py-28 px-6 overflow-hidden relative">
      <Image
        src="/images/voices/voices-hero-bg.png"
        alt=""
        fill
        sizes="100vw"
        quality={60}
        className="object-cover fixed inset-0 -z-10"
      />
      <div className="max-w-6xl mx-auto relative z-10">
        <AnimatedSection className="text-center mb-16">
          <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
            Voices of the AI Era
          </motion.p>
          <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
            The pioneers shaping AI agree:&nbsp;
            <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
              act now.
            </span>
          </motion.h2>
          <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto">
            From Nobel laureates to CEOs shaping the AI era — the message is unanimous. The window to adapt is open today, not tomorrow.
          </motion.p>
        </AnimatedSection>

        <AnimatedSection className="flex flex-col gap-6">
          {voices.map((expert, i) => (
            <VoiceCard key={expert.name} expert={expert} index={i} />
          ))}
        </AnimatedSection>

        {/* Urgency strip */}
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, margin: "-60px" }}
          transition={{ duration: 0.5, delay: 0.4 }}
          className="mt-10 rounded-2xl bg-gradient-to-r from-amber-950/50 to-orange-950/40 border border-amber-500/20 px-7 py-5 flex flex-col sm:flex-row items-center justify-between gap-4"
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" aria-hidden="true" />
            <p className="text-slate-300 text-sm font-medium">
              The experts are aligned — the disruption is already here.{" "}
              <span className="text-white font-semibold">Your move.</span>
            </p>
          </div>
          <Link
            href="/pricing"
            className="shrink-0 px-5 py-3 min-h-[44px] inline-flex items-center rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.03]"
          >
            Build My Pivot Plan — $19 →
          </Link>
        </motion.div>
      </div>
    </section>
  );
}
