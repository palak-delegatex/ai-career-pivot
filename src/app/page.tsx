import Link from "next/link";

export default function Home() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white">
      {/* Nav */}
      <nav className="flex items-center justify-between px-6 py-5 max-w-6xl mx-auto w-full">
        <div className="flex items-center gap-2">
          <span className="text-2xl">🧭</span>
          <span className="font-bold text-xl tracking-tight">AICareerPivot</span>
        </div>
        <div className="flex items-center gap-4">
          <Link
            href="/waitlist"
            className="px-4 py-2 rounded-full bg-indigo-600 hover:bg-indigo-500 text-sm font-semibold transition-colors"
          >
            Join Waitlist
          </Link>
        </div>
      </nav>

      {/* Hero */}
      <main className="flex-1 flex flex-col items-center justify-center px-6 py-20 text-center max-w-4xl mx-auto w-full">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-indigo-900/50 border border-indigo-700 text-indigo-300 text-sm font-medium mb-8">
          <span className="w-2 h-2 rounded-full bg-indigo-400 animate-pulse"></span>
          Early Access — Limited Spots
        </div>

        <h1 className="text-5xl sm:text-6xl font-extrabold leading-tight tracking-tight mb-6">
          Stop feeling trapped.
          <br />
          <span className="bg-gradient-to-r from-indigo-400 to-cyan-400 bg-clip-text text-transparent">
            Build your escape plan.
          </span>
        </h1>

        <p className="text-xl text-slate-300 leading-relaxed max-w-2xl mb-10">
          AICareerPivot is your personalized career strategist. It analyzes your skills,
          finances, and family constraints to build an actionable roadmap —
          6 months, 1 year, and 2 years out.
        </p>

        <div className="flex flex-col sm:flex-row gap-4 mb-16">
          <Link
            href="/waitlist"
            className="px-8 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 font-semibold text-lg transition-colors shadow-lg shadow-indigo-900/50"
          >
            Get My Roadmap →
          </Link>
          <Link
            href="#how-it-works"
            className="px-8 py-4 rounded-full border border-slate-600 hover:border-slate-400 font-semibold text-lg transition-colors text-slate-300 hover:text-white"
          >
            See How It Works
          </Link>
        </div>

        {/* Social proof */}
        <p className="text-slate-500 text-sm">
          Built for professionals ready to make their next move
        </p>
      </main>

      {/* How it works */}
      <section
        id="how-it-works"
        className="py-24 px-6 bg-slate-800/50"
      >
        <div className="max-w-5xl mx-auto">
          <h2 className="text-3xl font-bold text-center mb-4">How It Works</h2>
          <p className="text-slate-400 text-center mb-16 max-w-xl mx-auto">
            Three steps to go from stuck to strategic
          </p>
          <div className="grid sm:grid-cols-3 gap-8">
            {[
              {
                step: "01",
                icon: "🎯",
                title: "Share Your Situation",
                desc: "Tell us about your current role, skills, financial runway, and what matters most to your family.",
              },
              {
                step: "02",
                icon: "🤖",
                title: "AI Builds Your Strategy",
                desc: "Our AI analyzes your profile and creates a custom transition roadmap — not generic advice.",
              },
              {
                step: "03",
                icon: "🗺️",
                title: "Execute with Confidence",
                desc: "Get concrete milestones for 6 months, 1 year, and 2 years with skill gaps and actions clearly laid out.",
              },
            ].map((item) => (
              <div
                key={item.step}
                className="bg-slate-800 rounded-2xl p-8 border border-slate-700 hover:border-indigo-700 transition-colors"
              >
                <div className="text-4xl mb-4">{item.icon}</div>
                <div className="text-xs font-bold text-indigo-400 mb-2 tracking-widest uppercase">
                  Step {item.step}
                </div>
                <h3 className="text-xl font-bold mb-3">{item.title}</h3>
                <p className="text-slate-400 leading-relaxed">{item.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Who it's for */}
      <section className="py-24 px-6">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-3xl font-bold mb-4">Built for People Like You</h2>
          <p className="text-slate-400 mb-12 max-w-xl mx-auto">
            Unlike generic career advice, we factor in your whole life
          </p>
          <div className="grid sm:grid-cols-2 gap-6 text-left">
            {[
              { icon: "💼", label: "Burned-out professionals ready for change" },
              { icon: "👨‍👩‍👧", label: "Parents who can't just quit and figure it out" },
              { icon: "💰", label: "Earners who need income continuity" },
              { icon: "🔄", label: "Career changers entering a new industry" },
              { icon: "🌍", label: "Remote workers exploring new opportunities" },
              { icon: "📈", label: "Ambitious employees who want faster growth" },
            ].map((item) => (
              <div
                key={item.label}
                className="flex items-center gap-4 bg-slate-800/60 rounded-xl px-6 py-4 border border-slate-700"
              >
                <span className="text-2xl">{item.icon}</span>
                <span className="text-slate-200 font-medium">{item.label}</span>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA */}
      <section className="py-24 px-6 bg-gradient-to-r from-indigo-900/50 to-cyan-900/30">
        <div className="max-w-2xl mx-auto text-center">
          <h2 className="text-4xl font-bold mb-6">
            Ready to map your next chapter?
          </h2>
          <p className="text-slate-300 text-lg mb-10">
            Join the waitlist and be first to get your personalized career pivot roadmap.
          </p>
          <Link
            href="/waitlist"
            className="inline-block px-10 py-4 rounded-full bg-indigo-600 hover:bg-indigo-500 font-bold text-lg transition-colors shadow-xl shadow-indigo-900/50"
          >
            Join the Waitlist →
          </Link>
        </div>
      </section>

      {/* Footer */}
      <footer className="py-8 px-6 border-t border-slate-800 text-center text-slate-500 text-sm">
        <p>© 2026 AICareerPivot. Your career, your timeline.</p>
      </footer>
    </div>
  );
}
