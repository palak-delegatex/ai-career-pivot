"use client";

import Link from "next/link";
import Image from "next/image";
import type { Post } from "@/lib/blog";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect, useCallback, useMemo } from "react";
import { useTranslations } from "next-intl";
import VoicesOfTheAIEra from "@/components/VoicesOfTheAIEra";
import SuccessMetrics from "@/components/SuccessMetrics";
import CaseStudyCards from "@/components/CaseStudyCards";
import FeatureShowcase from "@/components/FeatureShowcase";
import TrustBar from "@/components/TrustBar";
import { trackCtaClicked, trackCtaHovered, trackScrollDepth } from "@/lib/tracking";
import StickyCtaBar from "@/components/StickyCtaBar";
import { testimonials } from "@/lib/testimonials";

const organizationSchema = {
  "@context": "https://schema.org",
  "@type": "Organization",
  name: "AICareerPivot",
  url: "https://ai-career-pivot.com",
  description:
    "AICareerPivot is a personalized AI career strategist that builds custom transition roadmaps by analyzing your skills, financial situation, and family constraints to create actionable 6-month, 1-year, and 2-year career pivot plans.",
  foundingDate: "2026",
  areaServed: "Worldwide",
  serviceType: "Career Coaching",
  audience: {
    "@type": "Audience",
    audienceType: "Professionals seeking career transitions",
  },
};

const websiteSchema = {
  "@context": "https://schema.org",
  "@type": "WebSite",
  name: "AICareerPivot",
  url: "https://ai-career-pivot.com",
  description:
    "Personalized AI-powered career pivot roadmaps for professionals who need to account for skills, finances, and family constraints.",
  potentialAction: {
    "@type": "SearchAction",
    target: "https://ai-career-pivot.com/?q={search_term_string}",
    "query-input": "required name=search_term_string",
  },
};

const softwareApplicationSchema = {
  "@context": "https://schema.org",
  "@type": "SoftwareApplication",
  name: "AICareerPivot",
  applicationCategory: "BusinessApplication",
  operatingSystem: "Web",
  url: "https://ai-career-pivot.com",
  description:
    "AI-powered career transition planning tool that creates personalized roadmaps with concrete 6-month, 1-year, and 2-year milestones.",
  offers: {
    "@type": "Offer",
    price: "19",
    priceCurrency: "USD",
    description: "Personalized career pivot roadmap — intro pricing",
  },
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

const fadeUp = {
  hidden: { opacity: 0, y: 30 },
  visible: { opacity: 1, y: 0 },
};

const stagger = {
  hidden: {},
  visible: { transition: { staggerChildren: 0.12 } },
};

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

// Style-only metadata for the "how it works" steps. Copy (title/desc) comes
// from the `home.steps` message array, merged by index.
const stepStyles = [
  {
    number: "01",
    accent: "from-teal-500 to-emerald-500",
    border: "border-teal-500/20",
    glow: "hover:shadow-teal-500/10",
  },
  {
    number: "02",
    accent: "from-teal-400 to-cyan-500",
    border: "border-teal-500/20",
    glow: "hover:shadow-teal-500/10",
  },
  {
    number: "03",
    accent: "from-cyan-500 to-teal-500",
    border: "border-cyan-500/20",
    glow: "hover:shadow-cyan-500/10",
  },
];


function ActivityIndicator() {
  const t = useTranslations("home");
  const [count, setCount] = useState(14);

  useEffect(() => {
    const interval = setInterval(() => {
      setCount(Math.floor(Math.random() * (25 - 8 + 1)) + 8);
    }, 30_000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="flex justify-center py-6 px-6">
      <div className="inline-flex items-center gap-2.5 px-5 py-3 rounded-full bg-slate-900/70 backdrop-blur-sm border border-slate-800/60">
        <span className="relative flex h-2.5 w-2.5">
          <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-emerald-400 opacity-75" />
          <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-emerald-500" />
        </span>
        <p className="text-slate-400 text-sm">
          <span className="text-white font-semibold">{t("activity.countLabel", { count })}</span> {t("activity.suffix")}
        </p>
      </div>
    </div>
  );
}


type StepText = { title: string; desc: string };
type PersonaText = { label: string; tag: string };
type StatText = { value: string; label: string };
type BeforeAfterText = { before: string; after: string; timeline: string };

export default function HomeClient({ recentPosts }: { recentPosts: Omit<Post, "content">[] }) {
  const t = useTranslations("home");
  const heroRef = useRef<HTMLElement>(null);

  const stepsText = t.raw("steps") as StepText[];
  const personas = t.raw("personas") as PersonaText[];
  const stats = t.raw("stats") as StatText[];
  const beforeAfterCards = t.raw("beforeAfterCards") as BeforeAfterText[];
  const courseValueProps = t.raw("courses.valueProps") as string[];

  const shuffledTestimonials = useMemo(() => {
    const arr = [...testimonials];
    for (let i = arr.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [arr[i], arr[j]] = [arr[j], arr[i]];
    }
    return arr;
  }, []);

  const handleHeroCtaHover = useCallback(() => {
    trackCtaHovered({ cta_text: "Build My Pivot Plan Now — $19", cta_location: "hero" });
  }, []);

  useEffect(() => {
    let lastDepth = 0;
    function onScroll() {
      const depth = Math.round((window.scrollY / (document.body.scrollHeight - window.innerHeight)) * 100);
      const rounded = Math.floor(depth / 25) * 25;
      if (rounded > lastDepth && rounded > 0) {
        lastDepth = rounded;
        const sections = ["hero", "how-it-works", "testimonials", "final-cta"];
        const idx = Math.min(Math.floor(rounded / 25) - 1, sections.length - 1);
        trackScrollDepth({ depth_percent: rounded, section_visible: sections[idx] });
      }
    }
    window.addEventListener("scroll", onScroll, { passive: true });
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  return (
    <>
      {/* Structured data */}
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(organizationSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteSchema) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(softwareApplicationSchema) }}
      />

      {/* Sticky CTA bar */}
      <StickyCtaBar />

      {/* Mesh background */}
      <div className="mesh-bg" />

      <div className="relative z-10 flex flex-col min-h-screen dot-grid">
        {/* Nav */}
        <motion.nav
          initial={{ opacity: 0, y: -16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full"
        >
          <div className="flex items-center gap-2.5">
            <div className="w-8 h-8 rounded-lg bg-gradient-to-br from-teal-500 to-emerald-600 flex items-center justify-center">
              <svg className="w-4 h-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6-10l6-3m0 13l5.447 2.724A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4" />
              </svg>
            </div>
            <span className="font-semibold text-lg tracking-tight text-white">AICareerPivot</span>
          </div>
          <div className="flex items-center gap-4">
            <Link href="/how-it-works" className="hidden md:inline-flex items-center min-h-[44px] px-2 text-sm text-slate-400 hover:text-white transition-colors">{t("nav.howItWorks")}</Link>
            <Link href="/about" className="hidden md:inline-flex items-center min-h-[44px] px-2 text-sm text-slate-400 hover:text-white transition-colors">{t("nav.about")}</Link>
            <Link href="/faq" className="hidden md:inline-flex items-center min-h-[44px] px-2 text-sm text-slate-400 hover:text-white transition-colors">{t("nav.faq")}</Link>
            <Link href="/blog" className="hidden md:inline-flex items-center min-h-[44px] px-2 text-sm text-slate-400 hover:text-white transition-colors">{t("nav.blog")}</Link>
            <Link href="/pricing" className="hidden md:inline-flex items-center min-h-[44px] px-2 text-sm text-slate-400 hover:text-white transition-colors">{t("nav.pricing")}</Link>
            <Link
              href="/pricing"
              className="px-4 py-2.5 min-h-[44px] inline-flex items-center rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25 text-white"
            >
              {t("nav.getStarted")}
            </Link>
          </div>
        </motion.nav>

        {/* Hero */}
        <main ref={heroRef} className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center w-full overflow-hidden">
          <Image
            src="/images/hero-career-pivot.png"
            alt=""
            fill
            priority
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712]/80 via-[#030712]/70 to-[#030712]" />
          <div className="relative z-10 max-w-5xl mx-auto w-full flex flex-col items-center">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-amber-950/80 border border-amber-500/30 text-amber-300 text-sm font-medium mb-10 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-amber-400 animate-pulse" />
            {t("hero.badge")}
          </motion.div>

          <motion.h1
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-5xl sm:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6"
          >
            <motion.span variants={fadeUp} className="block text-white">
              {t("hero.titleLine1")}
            </motion.span>
            <motion.span variants={fadeUp} className="block shimmer-text mt-2">
              {t("hero.titleLine2")}
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.35 }}
            className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mb-6"
          >
            {t("hero.subtitle")}
          </motion.p>

          {/* Social proof — positioned ABOVE CTA for trust-before-action */}
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.45, duration: 0.5 }}
            className="mb-6 max-w-md mx-auto"
          >
            <div className="flex items-center justify-center gap-3 bg-slate-900/70 backdrop-blur-sm border border-slate-800/60 rounded-xl px-5 py-3">
              <div className="flex -space-x-2 shrink-0">
                {[
                  { initials: "SK", gradient: "from-teal-500 to-emerald-500" },
                  { initials: "MT", gradient: "from-sky-500 to-blue-600" },
                  { initials: "PR", gradient: "from-violet-500 to-purple-600" },
                  { initials: "JL", gradient: "from-amber-500 to-orange-500" },
                  { initials: "EV", gradient: "from-rose-500 to-pink-500" },
                ].map((a) => (
                  <div key={a.initials} className={`w-7 h-7 rounded-full bg-gradient-to-br ${a.gradient} flex items-center justify-center text-white text-[10px] font-bold ring-2 ring-slate-900`}>
                    {a.initials}
                  </div>
                ))}
              </div>
              <p className="text-slate-400 text-sm">
                <span className="text-white font-semibold">{t("hero.socialProof", { count: 127 })}</span>
              </p>
            </div>
          </motion.div>

          {/* Primary CTA — larger, animated ring for attention */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-col items-center gap-4 mb-10"
          >
            <div className="flex flex-col sm:flex-row gap-3">
              <Link
                href="/pricing"
                onClick={() => trackCtaClicked({ cta_text: "Build My Pivot Plan Now — $19", cta_location: "hero", destination: "/pricing" })}
                onMouseEnter={handleHeroCtaHover}
                className="group relative px-12 py-6 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-xl transition-all duration-200 hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-[1.04] text-white overflow-hidden ring-2 ring-teal-400/30 ring-offset-2 ring-offset-[#030712]"
              >
                <span className="relative z-10">{t("hero.ctaPrimary")} <s className="text-white/60 font-normal">$29</s> $19 →</span>
                <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300" />
              </Link>
              <Link
                href="#how-it-works"
                className="px-8 py-6 rounded-xl border border-slate-700 hover:border-slate-500 font-semibold text-base transition-all duration-200 text-slate-300 hover:text-white hover:bg-slate-800/50 backdrop-blur-sm"
              >
                {t("hero.ctaSecondary")}
              </Link>
            </div>
            <div className="flex flex-col items-center gap-1.5">
              <Link
                href="/free"
                onClick={() => trackCtaClicked({ cta_text: "Try Free Skill-Gap Snapshot", cta_location: "hero", destination: "/free" })}
                className="text-sm text-teal-400 hover:text-teal-300 underline underline-offset-2 transition-colors"
              >
                {t("hero.freeLink")}
              </Link>
              <p className="text-slate-500 text-sm">
                {t("hero.freeNote")}
              </p>
              <p className="text-amber-400/80 text-xs font-medium">
                {t("hero.viewersToday", { count: 83 })}
              </p>
            </div>
          </motion.div>

          {/* Stats */}
          <motion.div
            variants={stagger}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.6 }}
            className="grid grid-cols-3 gap-6 sm:gap-12 border-t border-slate-800/80 pt-10 w-full max-w-lg mx-auto"
          >
            {stats.map((s) => (
              <motion.div key={s.label} variants={fadeUp} className="text-center">
                <div className="text-2xl sm:text-3xl font-extrabold text-white mb-1">{s.value}</div>
                <div className="text-xs text-slate-500 leading-tight">{s.label}</div>
              </motion.div>
            ))}
          </motion.div>
          </div>
        </main>

        {/* Real-time activity indicator */}
        <ActivityIndicator />

        {/* How it works */}
        <section id="how-it-works" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {t("howItWorks.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("howItWorks.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-md mx-auto">
                {t("howItWorks.subtitle")}
              </motion.p>
            </AnimatedSection>

            <AnimatedSection className="grid md:grid-cols-3 gap-5">
              {stepStyles.map((step, i) => (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`card-glow relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-7 border ${step.border} hover:shadow-xl ${step.glow} transition-all duration-300`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} mb-5`}>
                    <span className="text-white font-bold text-sm">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{stepsText[i]?.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{stepsText[i]?.desc}</p>
                  {/* Corner accent */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${step.accent} opacity-5 rounded-2xl`} />
                </motion.div>
              ))}
            </AnimatedSection>
          </div>
        </section>

        {/* AI feature showcase — surface plan gen / insights / PDF before signup (AIC-532) */}
        <FeatureShowcase />

        {/* Success Metrics Banner */}
        <SuccessMetrics />

        {/* Dashboard visual proof */}
        <section className="relative w-full py-24 overflow-hidden">
          <Image
            src="/images/dashboard.png"
            alt={t("dashboard.imageAlt")}
            fill
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#030712]/60 to-[#030712]" />
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold tracking-widest uppercase text-teal-400 mb-4">{t("dashboard.eyebrow")}</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{t("dashboard.title")}</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">{t("dashboard.subtitle")}</p>
          </div>
        </section>

        {/* Built for people like you */}
        <section className="py-28 px-6 bg-slate-900/40 border-y border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-14">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {t("whoFor.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("whoFor.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-md mx-auto">
                {t("whoFor.subtitle")}
              </motion.p>
            </AnimatedSection>

            <AnimatedSection className="grid md:grid-cols-2 gap-3">
              {personas.map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="flex items-center justify-between bg-slate-900/70 backdrop-blur-sm rounded-xl px-5 py-3.5 min-h-[44px] border border-slate-800 hover:border-slate-600 transition-all duration-200 group"
                >
                  <span className="text-slate-300 text-sm font-medium group-hover:text-white transition-colors">{item.label}</span>
                  <span className="text-xs font-semibold text-teal-400 bg-teal-950/60 border border-teal-800/50 px-2 py-0.5 rounded-md ml-3 shrink-0">
                    {item.tag}
                  </span>
                </motion.div>
              ))}
            </AnimatedSection>
          </div>
        </section>

        {/* Voices of the AI Era — Image-Forward Expert Quotes */}
        <VoicesOfTheAIEra />

        {/* Case Study Cards */}
        <CaseStudyCards />

        {/* Trust Bar */}
        <TrustBar />

        {/* Social Proof / Testimonials */}
        <section className="py-28 px-6 bg-slate-900/30 border-y border-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {t("testimonials.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("testimonials.titleLead")}{" "}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  {t("testimonials.titleHighlight")}
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-lg mx-auto">
                {t("testimonials.subtitle")}
              </motion.p>
            </AnimatedSection>

            <AnimatedSection className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
              {shuffledTestimonials.map((t, i) => (
                <motion.div
                  key={t.name}
                  variants={{
                    hidden: { opacity: 0, y: 30, scale: 0.97 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.45, delay: i * 0.08, ease: [0.21, 1.11, 0.81, 0.99] },
                    },
                  }}
                  whileHover={{ y: -3, transition: { duration: 0.2 } }}
                  className="relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-7 border border-slate-800 hover:border-slate-700 hover:shadow-xl transition-all duration-300 group"
                >
                  <div className="absolute top-4 right-5 text-5xl font-serif leading-none select-none text-slate-800 group-hover:text-slate-700 transition-colors">
                    &ldquo;
                  </div>

                  <div className="relative z-10">
                    {/* 5-star rating */}
                    <div className="flex gap-0.5 mb-3">
                      {Array.from({ length: 5 }).map((_, s) => (
                        <svg key={s} className="w-4 h-4 text-teal-400" viewBox="0 0 24 24" fill="currentColor">
                          <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                        </svg>
                      ))}
                    </div>

                    <blockquote className="text-slate-300 text-sm leading-relaxed mb-6">
                      &ldquo;{t.quote}&rdquo;
                    </blockquote>

                    <div className="flex items-center gap-3 pt-4 border-t border-slate-800/60">
                      <div className={`w-9 h-9 rounded-full bg-gradient-to-br ${t.gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}>
                        {t.initials}
                      </div>
                      <div>
                        <div className="text-white font-semibold text-sm">{t.name}</div>
                        {/* Role transition badge */}
                        <div className="inline-flex items-center gap-1.5 mt-1 px-2 py-0.5 rounded-full bg-slate-800 border border-slate-700 text-xs text-slate-400">
                          {t.role}
                        </div>
                      </div>
                    </div>
                  </div>
                </motion.div>
              ))}
            </AnimatedSection>

            <AnimatedSection className="mt-12 text-center">
              <motion.div variants={fadeUp}>
                <Link
                  href="/pricing"
                  onClick={() => trackCtaClicked({ cta_text: "Start My Career Pivot — $19", cta_location: "testimonials", destination: "/pricing" })}
                  onMouseEnter={() => trackCtaHovered({ cta_text: "Start My Career Pivot — $19", cta_location: "testimonials" })}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] text-white"
                >
                  {t("testimonials.cta")} <s className="text-white/60 font-normal">$29</s> $19 →
                </Link>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>

        {/* Before/After Success Metrics */}
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {t("beforeAfter.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("beforeAfter.titleLead")}{" "}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  {t("beforeAfter.titleHighlight")}
                </span>
              </motion.h2>
            </AnimatedSection>

            <AnimatedSection className="grid grid-cols-1 md:grid-cols-3 gap-5">
              {beforeAfterCards.map((card, i) => (
                <motion.div
                  key={card.after}
                  variants={{
                    hidden: { opacity: 0, y: 30 },
                    visible: { opacity: 1, y: 0, transition: { duration: 0.5, delay: i * 0.12 } },
                  }}
                  className="bg-slate-800/60 border border-slate-700 rounded-xl p-6 flex flex-col gap-4"
                >
                  <p className="text-slate-500 text-sm">{card.before}</p>
                  <div className="flex items-center gap-2">
                    <div className="flex-1 h-px bg-gradient-to-r from-slate-700 to-teal-500/60" />
                    <motion.svg
                      initial={{ x: -4, opacity: 0 }}
                      whileInView={{ x: 0, opacity: 1 }}
                      transition={{ delay: 0.3 + i * 0.12, duration: 0.4 }}
                      viewport={{ once: true }}
                      className="w-5 h-5 text-teal-400 shrink-0"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                      strokeWidth={2.5}
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </motion.svg>
                    <div className="flex-1 h-px bg-gradient-to-r from-teal-500/60 to-slate-700" />
                  </div>
                  <p className="text-white text-sm font-medium">{card.after}</p>
                  <span className="inline-flex self-start items-center px-2.5 py-1 rounded-full bg-teal-950/60 border border-teal-800/40 text-teal-300 text-xs font-semibold">
                    {card.timeline}
                  </span>
                </motion.div>
              ))}
            </AnimatedSection>
          </div>
        </section>

        {/* CTA */}
        <section className="py-28 px-6">
          <AnimatedSection className="max-w-2xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              className="relative bg-gradient-to-br from-teal-900/40 to-emerald-900/20 rounded-3xl p-10 sm:p-16 border border-teal-500/25 overflow-hidden"
            >
              {/* Background glow */}
              <div className="absolute inset-0 bg-gradient-to-r from-teal-600/5 to-cyan-600/5 animate-gradient" />
              <div className="relative z-10">
                <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                  {t("finalCta.title")}
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-300 text-lg mb-8 leading-relaxed">
                  {t("finalCta.subtitle")}
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
                  <Link
                    href="/pricing"
                    onClick={() => trackCtaClicked({ cta_text: "Build My Pivot Plan — $19", cta_location: "final_cta", destination: "/pricing" })}
                    onMouseEnter={() => trackCtaHovered({ cta_text: "Build My Pivot Plan — $19", cta_location: "final_cta" })}
                    className="group inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-teal-500/30 hover:scale-[1.03] text-white"
                  >
                    {t("finalCta.cta")} <s className="text-white/60 font-normal">$29</s> $19
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <p className="text-slate-500 text-sm">{t("finalCta.note")}</p>
                </motion.div>
              </div>
            </motion.div>
          </AnimatedSection>
        </section>

        {/* AI Course Showcase */}
        <section id="ai-courses" className="py-28 px-6 border-t border-slate-800/40">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {t("courses.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {t("courses.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto">
                {t("courses.subtitle")}
              </motion.p>
            </AnimatedSection>

            <AnimatedSection>
              <motion.div
                variants={stagger}
                className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5"
              >
                {[
                  {
                    provider: "Anthropic",
                    providerColor: "bg-orange-950 text-orange-300 border-orange-800/40",
                    providerInitial: "AN",
                    name: "AI Fluency for Professionals",
                    duration: "4 weeks",
                    cost: "Free",
                    costColor: "bg-emerald-950 text-emerald-400",
                    valueProp: "Understand how LLMs work and how to apply them in any role",
                    matchScore: 94,
                  },
                  {
                    provider: "Google",
                    providerColor: "bg-blue-950 text-blue-300 border-blue-800/40",
                    providerInitial: "G",
                    name: "AI Essentials",
                    duration: "5 weeks",
                    cost: "Free",
                    costColor: "bg-emerald-950 text-emerald-400",
                    valueProp: "Practical AI tools for workplace productivity — no coding needed",
                    matchScore: 89,
                  },
                  {
                    provider: "AWS",
                    providerColor: "bg-amber-950 text-amber-300 border-amber-800/40",
                    providerInitial: "AWS",
                    name: "AI Practitioner",
                    duration: "20 hours",
                    cost: "$300 exam",
                    costColor: "bg-amber-950/60 text-amber-400",
                    valueProp: "Industry-recognized cert for AI fundamentals on cloud infrastructure",
                    matchScore: 87,
                  },
                  {
                    provider: "Microsoft",
                    providerColor: "bg-cyan-950 text-cyan-300 border-cyan-800/40",
                    providerInitial: "MS",
                    name: "Azure AI Fundamentals (AI-900)",
                    duration: "6 hours",
                    cost: "$165 exam",
                    costColor: "bg-amber-950/60 text-amber-400",
                    valueProp: "Core AI and ML concepts — pairs well with any enterprise background",
                    matchScore: 83,
                  },
                  {
                    provider: "DeepLearning.AI",
                    providerColor: "bg-teal-950 text-teal-300 border-teal-800/40",
                    providerInitial: "DL",
                    name: "AI for Everyone",
                    duration: "6 hours",
                    cost: "Free audit",
                    costColor: "bg-emerald-950 text-emerald-400",
                    valueProp: "Andrew Ng's non-technical AI strategy course — boardroom-ready",
                    matchScore: 91,
                  },
                  {
                    provider: "IBM",
                    providerColor: "bg-indigo-950 text-indigo-300 border-indigo-800/40",
                    providerInitial: "IBM",
                    name: "AI Engineering Professional",
                    duration: "6 months",
                    cost: "$49/mo",
                    costColor: "bg-slate-800 text-slate-300",
                    valueProp: "End-to-end ML engineering skills with hands-on projects",
                    matchScore: 78,
                  },
                ].map((course, idx) => (
                  <motion.div
                    key={course.name}
                    variants={fadeUp}
                    className="relative flex flex-col gap-4 rounded-2xl bg-slate-900/60 border border-slate-800/60 p-6 hover:border-slate-700/80 transition-colors"
                  >
                    {/* Match score badge */}
                    <div className="absolute top-4 right-4 flex items-center gap-1 px-2 py-0.5 rounded-full bg-teal-950/80 border border-teal-800/40 text-teal-400 text-xs font-semibold">
                      <svg className="w-3 h-3" viewBox="0 0 24 24" fill="currentColor">
                        <path d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" />
                      </svg>
                      {t("courses.matchLabel", { score: course.matchScore })}
                    </div>

                    {/* Provider badge */}
                    <div className={`inline-flex w-fit items-center px-2.5 py-1 rounded-lg border text-xs font-bold tracking-wide ${course.providerColor}`}>
                      {course.providerInitial}
                    </div>

                    <div className="flex-1">
                      <h3 className="text-white font-semibold text-base leading-snug mb-2">
                        {course.name}
                      </h3>
                      <p className="text-slate-400 text-sm leading-relaxed">
                        {courseValueProps[idx]}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                        {course.duration}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.costColor}`}>
                        {course.cost}
                      </span>
                    </div>
                  </motion.div>
                ))}
              </motion.div>
            </AnimatedSection>

            {/* CTA */}
            <AnimatedSection className="mt-14 text-center">
              <motion.div variants={fadeUp} className="inline-flex flex-col items-center gap-4">
                <p className="text-slate-400 text-sm max-w-md">
                  {t("courses.footerNote")}
                </p>
                <Link
                  href="/pricing"
                  onClick={() => trackCtaClicked({ cta_text: "Get My Personalized Learning Path — $19", cta_location: "courses", destination: "/pricing" })}
                  onMouseEnter={() => trackCtaHovered({ cta_text: "Get My Personalized Learning Path — $19", cta_location: "courses" })}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] text-white"
                >
                  {t("courses.cta")} <s className="text-white/60 font-normal">$29</s> $19 →
                </Link>
              </motion.div>
            </AnimatedSection>
          </div>
        </section>

        {/* Blog preview */}
        <section className="py-20 px-6 border-t border-slate-800/60">
          <div className="max-w-4xl mx-auto">
            <div className="flex items-center justify-between mb-10">
              <div>
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{t("blogPreview.title")}</h2>
                <p className="text-slate-400 text-sm mt-1">{t("blogPreview.subtitle")}</p>
              </div>
              <Link href="/blog" className="text-teal-400 text-sm font-semibold hover:text-teal-300 transition-colors">
                {t("blogPreview.allLink")}
              </Link>
            </div>
            <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-6">
              {recentPosts.map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-slate-900/60 border border-slate-800 hover:border-teal-800/60 rounded-2xl p-6 transition-all duration-200 hover:bg-slate-800/60"
                >
                  <p className="text-slate-500 text-xs mb-3">{post.readingTime}</p>
                  <h3 className="text-white font-bold text-base leading-snug mb-3 group-hover:text-teal-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

      </div>
    </>
  );
}

