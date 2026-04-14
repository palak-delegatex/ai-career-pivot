"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";

type FormState = "idle" | "loading" | "success" | "already" | "error";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [persona, setPersona] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");

  useEffect(() => {
    posthog.capture("waitlist_form_viewed");
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setState("loading");
    setErrorMsg("");

    try {
      const params = new URLSearchParams(window.location.search);
      const utmSource = params.get("utm_source");
      const utmMedium = params.get("utm_medium");
      const utmCampaign = params.get("utm_campaign");

      posthog.capture("waitlist_form_submitted", {
        persona,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
      });

      const res = await fetch("/api/waitlist", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name,
          email,
          persona,
          utm_source: utmSource,
          utm_medium: utmMedium,
          utm_campaign: utmCampaign,
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        setState("error");
        setErrorMsg(data.error || "Something went wrong. Please try again.");
        return;
      }

      if (data.alreadyOnList) {
        setState("already");
      } else {
        setState("success");
      }
    } catch {
      setState("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (state === "success" || state === "already") {
    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full text-center">
          <div className="text-5xl mb-6">{state === "success" ? "🎉" : "✅"}</div>
          <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-teal-400">
            {state === "success" ? "You're in!" : "Already on the list!"}
          </h1>
          <p className="text-slate-300 text-lg leading-relaxed">
            {state === "success"
              ? "We'll reach out when your roadmap is ready."
              : "You're already on the waitlist. We'll be in touch soon."}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6 py-20">
      <div className="max-w-lg w-full text-center">
        <div className="text-5xl mb-6">🧭</div>
        <h1 className="text-4xl font-extrabold mb-4 tracking-tight">
          Join the Waitlist
        </h1>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
          Be first to get your AI-powered career pivot roadmap. We&apos;re
          onboarding early users now.
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder="Your name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500 text-lg"
          />
          <input
            type="email"
            placeholder="Your email address"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500 text-lg"
          />
          <select
            value={persona}
            onChange={(e) => setPersona(e.target.value)}
            className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-slate-300 text-lg"
          >
            <option value="">What best describes you?</option>
            <option value="burnout">Burned out and ready for change</option>
            <option value="parent">Parent needing income continuity</option>
            <option value="career-change">Switching industries</option>
            <option value="growth">Wanting faster career growth</option>
            <option value="other">Other</option>
          </select>

          {state === "error" && (
            <p className="text-red-400 text-sm text-left">{errorMsg}</p>
          )}

          <button
            type="submit"
            disabled={state === "loading"}
            className="w-full px-8 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-60 disabled:cursor-not-allowed font-bold text-lg transition-colors shadow-lg shadow-teal-900/50 mt-2"
          >
            {state === "loading" ? "Claiming your spot…" : "Claim My Spot →"}
          </button>
        </form>

        <p className="text-slate-500 text-sm mt-6">
          No spam. Just your roadmap when it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
