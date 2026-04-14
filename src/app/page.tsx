"use client";

import Link from "next/link";
import { motion, useInView, useMotionValue, useTransform, useSpring } from "framer-motion";
import { useRef, useState, useEffect } from "react";

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
    price: "0",
    priceCurrency: "USD",
    description: "Early access waitlist — free to join",
  },
};

const experts = [
  {
    name: "Dario Amodei",
    title: "CEO, Anthropic",
    initials: "DA",
    gradient: "from-rose-500 to-pink-500",
    borderGlow: "hover:shadow-rose-500/20",
    accentBorder: "hover:border-rose-500/40",
    quote:
      "AI will have effects that are much broader and occur much faster than previous labor market shocks.",
    context: "Davos 2026",
    urgencyLabel: "50% of entry-level jobs",
    urgencyDesc: "disrupted in 1–5 years",
  },
  {
    name: "Geoffrey Hinton",
    title: "Nobel Laureate · \"Godfather of AI\"",
    initials: "GH",
    gradient: "from-amber-400 to-orange-500",
    borderGlow: "hover:shadow-amber-500/20",
    accentBorder: "hover:border-amber-500/40",
    quote:
      "AI capabilities are doubling roughly every seven months — the pace of change is unlike anything we have seen before.",
    context: "Nobel Lecture 2024",
    urgencyLabel: "2026",
    urgencyDesc: "the tipping point for mass displacement",
  },
  {
    name: "Jensen Huang",
    title: "CEO, NVIDIA",
    initials: "JH",
    gradient: "from-emerald-400 to-teal-600",
    borderGlow: "hover:shadow-emerald-500/20",
    accentBorder: "hover:border-emerald-500/40",
    quote:
      "It is essential to learn how to use AI — how to direct it, manage it, guardrail it, evaluate it.",
    context: "CES 2025",
    urgencyLabel: "Every job",
    urgencyDesc: "will fundamentally change",
  },
  {
    name: "Chamath Palihapitiya",
    title: "Founder, Social Capital",
    initials: "CP",
    gradient: "from-sky-400 to-blue-600",
    borderGlow: "hover:shadow-sky-500/20",
    accentBorder: "hover:border-sky-500/40",
    quote:
      "Young people willing to be AI native are well placed. Those who aren't will be left behind.",
    context: "All-In Podcast",
    urgencyLabel: "18 months",
    urgencyDesc: "before traditional roles transform",
  },
];

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

const steps = [
  {
    number: "01",
    title: "We Read Your Background",
    desc: "Share your LinkedIn, resume, and portfolio. Our AI analyzes your actual experience — job history, transferable skills, achievements — before generating a single recommendation.",
    accent: "from-teal-500 to-emerald-500",
    border: "border-teal-500/20",
    glow: "hover:shadow-teal-500/10",
  },
  {
    number: "02",
    title: "AI Builds Your Strategy",
    desc: "We combine your real background with your financial situation and family constraints to create a custom transition roadmap. Not generic advice. Your plan, built from your data.",
    accent: "from-teal-400 to-cyan-500",
    border: "border-teal-500/20",
    glow: "hover:shadow-teal-500/10",
  },
  {
    number: "03",
    title: "Execute with Confidence",
    desc: "Get concrete milestones for 6 months, 1 year, and 2 years — with skill gaps and actions grounded in where you actually are today.",
    accent: "from-cyan-500 to-teal-500",
    border: "border-cyan-500/20",
    glow: "hover:shadow-cyan-500/10",
  },
];

const personas = [
  { label: "Burned-out professionals ready for change", tag: "Burnout" },
  { label: "Parents who can't just quit and figure it out", tag: "Family" },
  { label: "Earners who need income continuity", tag: "Finance" },
  { label: "Career changers entering a new industry", tag: "Pivot" },
  { label: "Remote workers exploring new opportunities", tag: "Remote" },
  { label: "Ambitious employees who want faster growth", tag: "Growth" },
];

const stats = [
  { value: "3×", label: "Faster than solo planning" },
  { value: "6mo", label: "To your first milestone" },
  { value: "100%", label: "Personalized to your life" },
];

export default function Home() {
  const [waitlistCount, setWaitlistCount] = useState<number | null>(null);

  useEffect(() => {
    fetch("/api/waitlist/count")
      .then((r) => r.json())
      .then((d: { count: number }) => {
        // Only show count if meaningful (>= 10); round down to nearest 10
        if (d.count >= 10) {
          setWaitlistCount(Math.floor(d.count / 10) * 10);
        }
      })
      .catch(() => {
        // Silently fail — badge shows fallback text
      });
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
            <Link href="/how-it-works" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors">How It Works</Link>
            <Link href="/about" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors">About</Link>
            <Link href="/faq" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors">FAQ</Link>
            <Link href="/blog" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors">Blog</Link>
            <Link href="/pricing" className="hidden md:block text-sm text-slate-400 hover:text-white transition-colors">Pricing</Link>
            <Link
              href="/waitlist"
              className="px-4 py-2 rounded-lg bg-teal-600 hover:bg-teal-500 text-sm font-semibold transition-all duration-200 hover:shadow-lg hover:shadow-teal-500/25 text-white"
            >
              Join Waitlist
            </Link>
          </div>
        </motion.nav>

        {/* Hero */}
        <main className="flex-1 flex flex-col items-center justify-center px-6 pt-16 pb-24 text-center max-w-5xl mx-auto w-full">
          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ duration: 0.4 }}
            className="inline-flex items-center gap-2 px-3 py-1.5 rounded-full bg-teal-950/80 border border-teal-500/30 text-teal-300 text-sm font-medium mb-10 backdrop-blur-sm"
          >
            <span className="w-1.5 h-1.5 rounded-full bg-teal-400 animate-pulse" />
            {waitlistCount !== null
              ? `${waitlistCount}+ professionals on the waitlist`
              : "Early Access — Limited Spots"}
          </motion.div>

          <motion.h1
            variants={stagger}
            initial="hidden"
            animate="visible"
            className="text-5xl sm:text-7xl font-extrabold leading-[1.08] tracking-tight mb-6"
          >
            <motion.span variants={fadeUp} className="block text-white">
              Stop feeling trapped.
            </motion.span>
            <motion.span variants={fadeUp} className="block shimmer-text mt-2">
              Build your escape plan.
            </motion.span>
          </motion.h1>

          <motion.p
            variants={fadeUp}
            initial="hidden"
            animate="visible"
            transition={{ delay: 0.35 }}
            className="text-lg sm:text-xl text-slate-400 leading-relaxed max-w-2xl mb-12"
          >
            Most career advice ignores your actual background. We don&apos;t.
            AICareerPivot reads your LinkedIn, resume, and portfolio — then builds a personalized
            roadmap around your real skills, finances, and family constraints.
          </motion.p>

          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.5, duration: 0.4 }}
            className="flex flex-col sm:flex-row gap-3 mb-20"
          >
            <Link
              href="/waitlist"
              className="group relative px-8 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 font-semibold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/30 hover:scale-[1.02] text-white overflow-hidden"
            >
              <span className="relative z-10">Get My Roadmap →</span>
              <div className="absolute inset-0 bg-gradient-to-r from-teal-500 to-emerald-500 opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
            </Link>
            <Link
              href="#how-it-works"
              className="px-8 py-4 rounded-xl border border-slate-700 hover:border-slate-500 font-semibold text-base transition-all duration-200 text-slate-300 hover:text-white hover:bg-slate-800/50 backdrop-blur-sm"
            >
              See How It Works
            </Link>
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
        </main>

        {/* How it works */}
        <section id="how-it-works" className="py-28 px-6">
          <div className="max-w-5xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                How It Works
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                From stuck to strategic in three steps
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-md mx-auto">
                A simple process that turns your whole situation into a concrete action plan.
              </motion.p>
            </AnimatedSection>

            <AnimatedSection className="grid sm:grid-cols-3 gap-5">
              {steps.map((step) => (
                <motion.div
                  key={step.number}
                  variants={fadeUp}
                  whileHover={{ y: -4, transition: { duration: 0.2 } }}
                  className={`card-glow relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-7 border ${step.border} hover:shadow-xl ${step.glow} transition-all duration-300`}
                >
                  <div className={`inline-flex items-center justify-center w-10 h-10 rounded-xl bg-gradient-to-br ${step.accent} mb-5`}>
                    <span className="text-white font-bold text-sm">{step.number}</span>
                  </div>
                  <h3 className="text-lg font-bold text-white mb-2">{step.title}</h3>
                  <p className="text-slate-400 text-sm leading-relaxed">{step.desc}</p>
                  {/* Corner accent */}
                  <div className={`absolute top-0 right-0 w-16 h-16 bg-gradient-to-br ${step.accent} opacity-5 rounded-2xl`} />
                </motion.div>
              ))}
            </AnimatedSection>
          </div>
        </section>

        {/* Built for people like you */}
        <section className="py-28 px-6 bg-slate-900/40 border-y border-slate-800/50">
          <div className="max-w-4xl mx-auto">
            <AnimatedSection className="text-center mb-14">
              <motion.p variants={fadeUp} className="text-teal-400 text-sm font-semibold tracking-widest uppercase mb-3">
                Who It&apos;s For
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                Built for people like you
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-md mx-auto">
                Unlike generic career advice, we read your actual background first — then factor in your whole life.
              </motion.p>
            </AnimatedSection>

            <AnimatedSection className="grid sm:grid-cols-2 gap-3">
              {personas.map((item, i) => (
                <motion.div
                  key={item.label}
                  variants={fadeUp}
                  custom={i}
                  whileHover={{ x: 4, transition: { duration: 0.15 } }}
                  className="flex items-center justify-between bg-slate-900/70 backdrop-blur-sm rounded-xl px-5 py-3.5 border border-slate-800 hover:border-slate-600 transition-all duration-200 group"
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

        {/* AI Experts Section */}
        <section className="py-28 px-6 overflow-hidden">
          <div className="max-w-6xl mx-auto">
            <AnimatedSection className="text-center mb-16">
              <motion.p variants={fadeUp} className="text-amber-400 text-sm font-semibold tracking-widest uppercase mb-3">
                The Experts Have Spoken
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                The world&apos;s top AI pioneers agree:&nbsp;
                <span className="bg-gradient-to-r from-amber-400 to-orange-500 bg-clip-text text-transparent">
                  act now.
                </span>
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto">
                From Nobel laureates to CEOs shaping the AI era — the message is unanimous. The window to adapt is open today, not tomorrow.
              </motion.p>
            </AnimatedSection>

            <AnimatedSection className="grid sm:grid-cols-2 gap-5">
              {experts.map((expert, i) => (
                <motion.div
                  key={expert.name}
                  variants={{
                    hidden: { opacity: 0, y: 40, scale: 0.97 },
                    visible: {
                      opacity: 1,
                      y: 0,
                      scale: 1,
                      transition: { duration: 0.5, delay: i * 0.1, ease: [0.21, 1.11, 0.81, 0.99] },
                    },
                  }}
                >
                  <TiltCard className="h-full">
                    <div
                      className={`h-full relative bg-slate-900/80 backdrop-blur-sm rounded-2xl p-7 border border-slate-800 ${expert.accentBorder} ${expert.borderGlow} hover:shadow-2xl transition-all duration-300 group cursor-default`}
                    >
                      {/* Animated background glow */}
                      <div className={`absolute inset-0 rounded-2xl bg-gradient-to-br ${expert.gradient} opacity-0 group-hover:opacity-[0.04] transition-opacity duration-500`} />

                      {/* Decorative quote mark */}
                      <div className={`absolute top-4 right-5 text-7xl font-serif leading-none select-none bg-gradient-to-br ${expert.gradient} bg-clip-text text-transparent opacity-20 group-hover:opacity-40 transition-opacity duration-300`}>
                        &ldquo;
                      </div>

                      <div className="relative z-10">
                        {/* Avatar + name row */}
                        <div className="flex items-center gap-3.5 mb-5">
                          {/* Photo placeholder — swap src with real URL when available */}
                          <div className={`w-12 h-12 rounded-full bg-gradient-to-br ${expert.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0 shadow-lg`}>
                            {expert.initials}
                          </div>
                          <div>
                            <div className="text-white font-bold text-sm leading-tight">{expert.name}</div>
                            <div className="text-slate-500 text-xs mt-0.5 leading-tight">{expert.title}</div>
                          </div>
                          <div className="ml-auto text-xs text-slate-600 italic shrink-0">{expert.context}</div>
                        </div>

                        {/* Quote */}
                        <blockquote className="text-slate-200 text-base leading-relaxed font-medium mb-5">
                          &ldquo;{expert.quote}&rdquo;
                        </blockquote>

                        {/* Urgency chip */}
                        <div className="flex items-center gap-2">
                          <div className={`w-1.5 h-1.5 rounded-full bg-gradient-to-br ${expert.gradient} animate-pulse`} />
                          <span className="text-xs text-slate-400">
                            <span className="font-semibold text-white">{expert.urgencyLabel}</span>{" "}
                            {expert.urgencyDesc}
                          </span>
                        </div>
                      </div>
                    </div>
                  </TiltCard>
                </motion.div>
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
                <div className="w-2 h-2 rounded-full bg-amber-400 animate-ping" />
                <p className="text-slate-300 text-sm font-medium">
                  The experts are aligned — the disruption is already here.{" "}
                  <span className="text-white font-semibold">Your move.</span>
                </p>
              </div>
              <Link
                href="/waitlist"
                className="shrink-0 px-5 py-2.5 rounded-lg bg-gradient-to-r from-amber-500 to-orange-500 hover:from-amber-400 hover:to-orange-400 text-white text-sm font-bold transition-all duration-200 hover:shadow-lg hover:shadow-amber-500/30 hover:scale-[1.03]"
              >
                Build My Pivot Plan →
              </Link>
            </motion.div>
          </div>
        </section>

        {/* Testimonial/quote */}
        <section className="py-28 px-6">
          <AnimatedSection className="max-w-3xl mx-auto text-center">
            <motion.div
              variants={fadeUp}
              className="relative bg-gradient-to-br from-teal-950/60 to-slate-900/60 backdrop-blur-sm rounded-3xl p-10 sm:p-14 border border-teal-500/20"
            >
              <div className="absolute top-6 left-8 text-teal-500/30 text-8xl font-serif leading-none select-none">&ldquo;</div>
              <p className="relative text-xl sm:text-2xl text-slate-200 leading-relaxed font-medium mb-6">
                Most career advice ignores that you have a mortgage, kids, and a partner who also has
                a career. AICareerPivot finally accounts for the real constraints.
              </p>
              <div className="flex items-center justify-center gap-3">
                <div className="w-9 h-9 rounded-full bg-gradient-to-br from-teal-500 to-emerald-500 flex items-center justify-center text-white font-bold text-sm">S</div>
                <div className="text-left">
                  <div className="text-white font-semibold text-sm">Sarah K.</div>
                  <div className="text-slate-500 text-xs">Senior Engineer → Product Lead</div>
                </div>
              </div>
            </motion.div>
          </AnimatedSection>
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
                  Ready to map your next chapter?
                </motion.h2>
                <motion.p variants={fadeUp} className="text-slate-300 text-lg mb-10 leading-relaxed">
                  Join the waitlist and be first to get your personalized career pivot roadmap.
                </motion.p>
                <motion.div variants={fadeUp}>
                  <Link
                    href="/waitlist"
                    className="group inline-flex items-center gap-2 px-10 py-4 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-lg transition-all duration-200 hover:shadow-2xl hover:shadow-teal-500/30 hover:scale-[1.03] text-white"
                  >
                    Join the Waitlist
                    <svg className="w-4 h-4 group-hover:translate-x-1 transition-transform" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                    </svg>
                  </Link>
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
                Skill Up
              </motion.p>
              <motion.h2 variants={fadeUp} className="text-3xl sm:text-4xl font-extrabold text-white mb-4">
                AI Skills That Actually Get You Hired
              </motion.h2>
              <motion.p variants={fadeUp} className="text-slate-400 max-w-xl mx-auto">
                The credentials hiring managers recognize. Curated for professionals pivoting into AI-adjacent roles.
              </motion.p>
            </AnimatedSection>

            <AnimatedSection>
              <motion.div
                variants={stagger}
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5"
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
                ].map((course) => (
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
                      {course.matchScore}% match
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
                        {course.valueProp}
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
                  Not sure which courses match your background? Get a personalized learning path with your free career pivot analysis.
                </p>
                <Link
                  href="/waitlist"
                  className="inline-flex items-center gap-2 px-7 py-3.5 rounded-xl bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-500 hover:to-emerald-500 font-bold text-base transition-all duration-200 hover:shadow-xl hover:shadow-teal-500/25 hover:scale-[1.02] text-white"
                >
                  Get My Personalized Learning Path →
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
                <h2 className="text-2xl font-extrabold text-white tracking-tight">From the blog</h2>
                <p className="text-slate-400 text-sm mt-1">Practical guides for your career transition</p>
              </div>
              <Link href="/blog" className="text-teal-400 text-sm font-semibold hover:text-teal-300 transition-colors">
                All articles →
              </Link>
            </div>
            <div className="grid sm:grid-cols-3 gap-6">
              {[
                {
                  slug: "the-6-month-career-pivot-framework",
                  title: "The 6-Month Career Pivot Framework",
                  excerpt: "A step-by-step guide to planning your transition with concrete milestones and financial checkpoints.",
                  readTime: "8 min read",
                },
                {
                  slug: "how-to-change-careers-with-a-family",
                  title: "How to Change Careers When You Have a Family",
                  excerpt: "Career change advice that actually accounts for the mortgage, kids, and a partner who also has a career.",
                  readTime: "7 min read",
                },
                {
                  slug: "the-8-ai-certifications-that-matter-for-career-pivots-2026",
                  title: "The 8 AI Certifications That Actually Matter in 2026",
                  excerpt: "Which credentials deliver real salary ROI — and which ones are just checkboxes. Ranked by outcome data.",
                  readTime: "12 min read",
                },
              ].map((post) => (
                <Link
                  key={post.slug}
                  href={`/blog/${post.slug}`}
                  className="group block bg-slate-900/60 border border-slate-800 hover:border-teal-800/60 rounded-2xl p-6 transition-all duration-200 hover:bg-slate-800/60"
                >
                  <p className="text-slate-500 text-xs mb-3">{post.readTime}</p>
                  <h3 className="text-white font-bold text-base leading-snug mb-3 group-hover:text-teal-300 transition-colors">
                    {post.title}
                  </h3>
                  <p className="text-slate-400 text-sm leading-relaxed line-clamp-3">{post.excerpt}</p>
                </Link>
              ))}
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer className="py-8 px-6 border-t border-slate-800/60 text-center text-slate-600 text-sm">
          <div className="flex items-center justify-center gap-2 mb-2">
            <div className="w-4 h-4 rounded bg-gradient-to-br from-teal-500 to-emerald-600" />
            <span className="text-slate-500 font-medium">AICareerPivot</span>
          </div>
          <nav className="flex items-center justify-center gap-4 mb-2" aria-label="Footer navigation">
            <Link href="/about" className="hover:text-slate-400 transition-colors">About</Link>
            <Link href="/how-it-works" className="hover:text-slate-400 transition-colors">How It Works</Link>
            <Link href="/faq" className="hover:text-slate-400 transition-colors">FAQ</Link>
            <Link href="/blog" className="hover:text-slate-400 transition-colors">Blog</Link>
            <Link href="/pricing" className="hover:text-slate-400 transition-colors">Pricing</Link>
            <Link href="/waitlist" className="hover:text-slate-400 transition-colors">Join Waitlist</Link>
          </nav>
          <p>© 2026 AICareerPivot. Your career, your timeline.</p>
        </footer>
      </div>
    </>
  );
}
