"use client";

import { Link } from "@/i18n/navigation";
import Image from "next/image";
import { useTranslations } from "next-intl";
import type { Post } from "@/lib/blog";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useEffect, useCallback } from "react";
import SiteNav from "@/components/SiteNav";
import VoicesOfTheAIEra from "@/components/VoicesOfTheAIEra";
import SuccessMetrics from "@/components/SuccessMetrics";
import FeatureShowcase from "@/components/FeatureShowcase";
import TrustBar from "@/components/TrustBar";
import { trackCtaClicked, trackCtaHovered, trackScrollDepth } from "@/lib/tracking";
import StickyCtaBar from "@/components/StickyCtaBar";
import HonestSocialProofSection from "@/components/HonestSocialProofSection";

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


export default function HomeClient({ recentPosts }: { recentPosts: Omit<Post, "content">[] }) {
  const heroRef = useRef<HTMLElement>(null);
  const th = useTranslations("home");
  const steps = th.raw("steps") as { title: string; desc: string }[];
  const personas = th.raw("personas") as { label: string; tag: string }[];
  const stats = th.raw("stats") as { value: string; label: string }[];
  const beforeAfterCards = th.raw("beforeAfter") as { before: string; after: string; timeline: string }[];
  const courseCopy = th.raw("courses.items") as { valueProp: string; duration: string; cost: string }[];
  const handleHeroCtaHover = useCallback(() => {
    trackCtaHovered({ cta_text: "Get My Free Skill-Gap Snapshot", cta_location: "hero" });
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
        <SiteNav />

        {/* Hero */}
        <main id="main-content" ref={heroRef} className="relative flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center w-full overflow-hidden">
          <Image
            src="/images/hero-career-pivot.png"
            alt=""
            fill
            priority
            // Decorative hero sits under an 80% dark overlay and is the LCP
            // element on `/` — ship it at quality 50 (allowlisted in
            // next.config) so the LCP paint is far lighter (AIC-1067). AVIF is
            // preferred via the global formats config.
            quality={50}
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
            {th("hero.badge")}
          </motion.div>

          {/* LCP-critical: the hero H1 + subtitle are the largest above-the-fold
              text and are the Largest Contentful Paint candidate. They must paint
              on first render, NOT wait for framer-motion to hydrate — a JS-gated
              opacity:0 → 1 entrance here delays LCP until the client bundle loads
              and runs (AIC-1055). Render them statically at full opacity; the
              badge/CTA/stats below keep their entrance animations. */}
          <h1 className="text-5xl sm:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6">
            <span className="block text-white">{th("hero.titleLine1")}</span>
            {/* Static teal instead of animated shimmer (AIC-1117): keeps the
                value line legible/high-contrast and drops one infinite animation
                above the fold. */}
            <span className="block text-teal-300 mt-2">{th("hero.titleLine2")}</span>
          </h1>

          <p className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mb-8">
            {th("hero.subtitle")}
          </p>

          {/* Primary CTA — larger, animated ring for attention */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-col items-center gap-4 mb-10"
          >
            {/* Primary CTA now routes cold traffic to the FREE snapshot, not
                /pricing ($19) — landing→free_upload_started was converting at
                only ~2-5% because the hero pushed straight to paid (AIC-1052
                conversion audit). The paid plan stays one click away via the
                secondary link below for high-intent visitors. */}
            <Link
              href="/free?mode=upload"
              onClick={() => trackCtaClicked({ cta_text: "Get My Free Skill-Gap Snapshot", cta_location: "hero", destination: "/free?mode=upload" })}
              onMouseEnter={handleHeroCtaHover}
              className="group relative px-14 py-7 rounded-xl bg-gradient-to-r from-teal-500 to-emerald-500 font-bold text-xl transition-all duration-200 hover:shadow-2xl hover:shadow-teal-500/50 hover:scale-[1.04] text-white overflow-hidden ring-2 ring-teal-400/30 ring-offset-2 ring-offset-[#030712] animate-cta-breathe"
            >
              <span className="relative z-10">{th.rich("hero.ctaPrimary", { s: (chunks) => <s className="text-white/60 font-normal">{chunks}</s> })}</span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-400 to-emerald-400 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
              <div className="absolute -inset-1 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-20 blur-lg group-hover:opacity-40 transition-opacity duration-300" />
            </Link>
            {/* Single-CTA hero (AIC-1117): the secondary $19 pricing link was
                removed to keep one clear action above the fold. Pricing stays
                reachable via the nav/footer. */}
            <div className="flex flex-col items-center gap-1.5">
              <p className="text-slate-500 text-sm">
                {th("hero.freeNote")}
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

        {/* Dual-path entry (AIC-830 / AIC-825 Path C) — below the hero, so
            high-intent visitors still hit the primary CTA first. Users past the
            fold self-select by readiness: resume-ready → upload, just-browsing →
            zero-upload job-posting quick-check, not-sure-yet → 30s career quiz
            (AIC-833 / Path B). */}
        <section className="py-16 px-6">
          <AnimatedSection className="max-w-4xl mx-auto text-center">
            <h2 className="text-2xl sm:text-3xl font-extrabold mb-2 font-serif">Start your pivot — pick your path</h2>
            <p className="text-slate-400 mb-10">See real value in seconds. No signup, no credit card.</p>
            <div className="grid sm:grid-cols-3 gap-5 text-left">
              <Link
                href="/free?mode=upload"
                onClick={() => trackCtaClicked({ cta_text: "I have a resume ready", cta_location: "dual_path", destination: "/free?mode=upload" })}
                className="group rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-teal-500 p-6 transition-colors"
              >
                <div className="text-2xl mb-3">📄</div>
                <div className="font-bold text-white mb-1">I have a resume ready</div>
                <p className="text-sm text-slate-400 mb-4">Upload it for a personalized skill-gap match score in 30 seconds.</p>
                <span className="text-teal-400 text-sm font-semibold group-hover:text-teal-300">Upload resume →</span>
              </Link>
              <Link
                href="/free"
                onClick={() => trackCtaClicked({ cta_text: "Check a job posting", cta_location: "dual_path", destination: "/free" })}
                className="group rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-teal-500 p-6 transition-colors"
              >
                <div className="text-2xl mb-3">⚡</div>
                <div className="font-bold text-white mb-1">Just browsing a job?</div>
                <p className="text-sm text-slate-400 mb-4">Paste any job posting and see the skills it demands — no resume needed.</p>
                <span className="text-teal-400 text-sm font-semibold group-hover:text-teal-300">Check a job posting →</span>
              </Link>
              <Link
                href="/quiz"
                onClick={() => trackCtaClicked({ cta_text: "Take the career quiz", cta_location: "dual_path", destination: "/quiz" })}
                className="group rounded-2xl bg-slate-800/60 border border-slate-700 hover:border-teal-500 p-6 transition-colors"
              >
                <div className="text-2xl mb-3">🧭</div>
                <div className="font-bold text-white mb-1">Not sure where you fit?</div>
                <p className="text-sm text-slate-400 mb-4">Answer 4 quick questions and see which AI-adjacent role matches you.</p>
                <span className="text-teal-400 text-sm font-semibold group-hover:text-teal-300">Take the 30-second quiz →</span>
              </Link>
            </div>
          </AnimatedSection>
        </section>

        {/* How it works */}
        <section id="how-it-works" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {th("howItWorks.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {th("howItWorks.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-md mx-auto">
                {th("howItWorks.subtitle")}
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
                  <h3 className="text-lg font-bold text-white mb-2">{steps[i]?.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{steps[i]?.desc}</p>
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
            alt="AI-powered career analytics dashboard showing skill match scores and progress tracking"
            fill
            // Below-the-fold decorative visual sitting under a heavy top/bottom
            // gradient — lazy by default (non-priority) and shipped at quality 50
            // (allowlisted in next.config) to cut its bytes off the mobile page
            // weight without visible loss under the overlay (AIC-1110).
            quality={50}
            className="object-cover object-center"
            sizes="100vw"
          />
          <div className="absolute inset-0 bg-gradient-to-b from-[#030712] via-[#030712]/60 to-[#030712]" />
          <div className="relative z-10 max-w-5xl mx-auto px-6 text-center">
            <p className="text-sm font-semibold tracking-widest uppercase text-teal-400 mb-4">{th("dashboard.eyebrow")}</p>
            <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">{th("dashboard.title")}</h2>
            <p className="text-lg text-slate-400 max-w-2xl mx-auto">{th("dashboard.subtitle")}</p>
          </div>
        </section>

        {/* Built for people like you */}
        <section className="py-28 px-6 bg-slate-900/40 border-y border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-14">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {th("whoItsFor.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {th("whoItsFor.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-md mx-auto">
                {th("whoItsFor.subtitle")}
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

        {/* Honest social proof (AIC-893) — replaces the removed fabricated
            testimonials section: labeled sample output + early-access framing +
            verifiable credibility signals. Gated by the `honest-proof` A/B flag. */}
        <HonestSocialProofSection />

        {/* Trust Bar */}
        <TrustBar />

        {/* Before/After Success Metrics */}
        <section className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                {th("transformations.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {th("transformations.titleLead")}{" "}
                <span className="bg-gradient-to-r from-teal-400 to-emerald-400 bg-clip-text text-transparent">
                  {th("transformations.titleAccent")}
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
                  {th("finalCta.title")}
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-300 text-lg mb-8 leading-relaxed">
                  {th("finalCta.subtitle")}
                </motion.p>
                <motion.div variants={fadeUp} className="flex flex-col items-center gap-3">
                  <Link
                    href="/pricing"
                    onClick={() => trackCtaClicked({ cta_text: "Build My Pivot Plan — $19", cta_location: "final_cta", destination: "/pricing" })}
                    onMouseEnter={() => trackCtaHovered({ cta_text: "Build My Pivot Plan — $19", cta_location: "final_cta" })}
                    className="group inline-flex items-center gap-2 px-10 py-5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-teal-500/30 hover:scale-[1.03] text-white"
                  >
                    {th.rich("finalCta.cta", { s: (chunks) => <s className="text-white/60 font-normal">{chunks}</s> })}
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
                  <p className="text-slate-500 text-sm">{th("finalCta.note")}</p>
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
                {th("courses.eyebrow")}
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                {th("courses.title")}
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto">
                {th("courses.subtitle")}
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
                ].map((course, i) => (
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
                      {th("courses.match", { score: course.matchScore })}
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
                        {courseCopy[i]?.valueProp}
                      </p>
                    </div>

                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs text-slate-500 bg-slate-800/60 px-2 py-0.5 rounded-full">
                        {courseCopy[i]?.duration}
                      </span>
                      <span className={`text-xs px-2 py-0.5 rounded-full font-medium ${course.costColor}`}>
                        {courseCopy[i]?.cost}
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
                  {th("courses.ctaNote")}
                </p>
                <Link
                  href="/pricing"
                  onClick={() => trackCtaClicked({ cta_text: "Get My Personalized Learning Path — $19", cta_location: "courses", destination: "/pricing" })}
                  onMouseEnter={() => trackCtaHovered({ cta_text: "Get My Personalized Learning Path — $19", cta_location: "courses" })}
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] text-white"
                >
                  {th.rich("courses.cta", { s: (chunks) => <s className="text-white/60 font-normal">{chunks}</s> })}
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
                <h2 className="text-2xl font-extrabold text-white tracking-tight">{th("blog.title")}</h2>
                <p className="text-slate-400 text-sm mt-1">{th("blog.subtitle")}</p>
              </div>
              <Link href="/blog" className="text-teal-400 text-sm font-semibold hover:text-teal-300 transition-colors">
                {th("blog.all")}
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

