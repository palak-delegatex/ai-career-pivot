"use client";

export default function WaitlistPage() {
  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-6">🧭</div>
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          Join the Waitlist
        </h1>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
          Be first to get your AI-powered career pivot roadmap. We're onboarding
          early users now.
        </p>

        <form
          className="flex flex-col gap-4"
          onSubmit={(e) => e.preventDefault()}
        >
          <input
            type="text"
            placeholder="Your name"
            className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500 text-lg"
          />
          <input
            type="email"
            placeholder="Your email address"
            className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500 text-lg"
          />
          <select className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-slate-300 text-lg">
            <option value="">What best describes you?</option>
            <option value="burnout">Burned out and ready for change</option>
            <option value="parent">Parent needing income continuity</option>
            <option value="career-change">Switching industries</option>
            <option value="growth">Wanting faster career growth</option>
            <option value="other">Other</option>
          </select>
          <button
            type="submit"
            className="w-full px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50 mt-2"
          >
            Claim My Spot →
          </button>
        </form>

        <p className="text-slate-500 text-sm mt-6">
          No spam. Just your roadmap when it's ready.
        </p>
      </div>
    </div>
  );
}
