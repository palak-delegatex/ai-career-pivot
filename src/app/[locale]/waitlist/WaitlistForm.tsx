"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { trackReferralLinkCopied } from "@/lib/tracking";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";

type FormState = "idle" | "loading" | "success" | "already" | "error";

const BASE_URL = "https://ai-career-pivot.com";

export default function WaitlistForm() {
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [persona, setPersona] = useState("");
  const [state, setState] = useState<FormState>("idle");
  const [errorMsg, setErrorMsg] = useState("");
  const [referralCode, setReferralCode] = useState<string | null>(null);
  const [copied, setCopied] = useState(false);

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
      const refCode = params.get("ref");

      posthog.capture("waitlist_form_submitted", {
        persona,
        utm_source: utmSource,
        utm_medium: utmMedium,
        utm_campaign: utmCampaign,
        ref: refCode,
      });

      const apiUrl = new URL("/api/waitlist", window.location.origin);
      if (refCode) apiUrl.searchParams.set("ref", refCode);

      const res = await fetch(apiUrl.toString(), {
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
        if (data.referralCode) setReferralCode(data.referralCode);
        setState("success");
      }
    } catch {
      setState("error");
      setErrorMsg("Network error. Please try again.");
    }
  }

  if (state === "success" || state === "already") {
    const referralLink = referralCode
      ? `${BASE_URL}/waitlist?ref=${referralCode}`
      : null;
    const shareText = referralLink
      ? `I just joined the waitlist for AICareerPivot — an AI tool that builds career change roadmaps around your real constraints (mortgage, kids, finances). Way more useful than generic advice. If this sounds like you: ${referralLink}`
      : null;

    function copyLink() {
      if (!referralLink) return;
      navigator.clipboard.writeText(referralLink).then(() => {
        trackReferralLinkCopied();
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
      });
    }

    return (
      <div className="flex flex-col min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6 py-20">
        <div className="max-w-lg w-full">
          <div className="text-center mb-10">
            <div className="text-5xl mb-6">{state === "success" ? "🎉" : "✅"}</div>
            <h1 className="text-4xl font-extrabold mb-4 tracking-tight text-teal-400">
              {state === "success" ? "You're in!" : "Already on the list!"}
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              {state === "success"
                ? "We'll analyze your LinkedIn, resume, and background to build a roadmap from your actual experience — not a template. Check your email for next steps."
                : "You're already on the waitlist. Check your email for your personal referral link and next steps."}
            </p>
          </div>

          {referralLink && (
            <div className="bg-slate-800 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-teal-400 font-bold text-sm mb-1">Move up the waitlist</p>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                Share your link below. Every referral moves you higher — 1 referral skips 50 people, 10 referrals unlocks founding member pricing ($49/mo forever).
              </p>
              <div className="flex items-center gap-3 mb-4">
                <code className="flex-1 bg-slate-900 text-teal-300 text-sm px-3 py-2 rounded-lg truncate">
                  {referralLink}
                </code>
                <Button
                  type="button"
                  onClick={copyLink}
                  className="h-auto shrink-0 px-4 py-2 text-sm font-semibold"
                >
                  {copied ? "Copied!" : "Copy"}
                </Button>
              </div>
              {shareText && (
                <>
                  <p className="text-slate-500 text-xs font-semibold mb-2">Ready-to-share message:</p>
                  <p className="text-slate-400 text-xs leading-relaxed italic bg-slate-900 rounded-lg px-3 py-2">
                    &ldquo;{shareText}&rdquo;
                  </p>
                </>
              )}
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-slate-400 text-sm leading-relaxed">
              Your personal referral dashboard link is in your confirmation email.
            </p>
          </div>
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

        <form className="flex flex-col gap-4 text-left" onSubmit={handleSubmit}>
          <div className="space-y-2">
            <Label htmlFor="waitlist-name">Your name</Label>
            <Input
              id="waitlist-name"
              type="text"
              placeholder="Your name"
              value={name}
              onChange={(e) => setName(e.target.value)}
              required
              className="h-auto rounded-xl bg-secondary px-5 py-4 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waitlist-email">Email address</Label>
            <Input
              id="waitlist-email"
              type="email"
              placeholder="Your email address"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              className="h-auto rounded-xl bg-secondary px-5 py-4 text-lg"
            />
          </div>
          <div className="space-y-2">
            <Label htmlFor="waitlist-persona">What best describes you?</Label>
            <Select value={persona} onValueChange={(val) => setPersona(val ?? "")}>
              <SelectTrigger
                id="waitlist-persona"
                className="w-full rounded-xl bg-secondary px-5 text-lg data-[size=default]:h-auto data-[size=default]:py-4"
              >
                <SelectValue placeholder="What best describes you?" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="burnout">Burned out and ready for change</SelectItem>
                <SelectItem value="parent">Parent needing income continuity</SelectItem>
                <SelectItem value="career-change">Switching industries</SelectItem>
                <SelectItem value="growth">Wanting faster career growth</SelectItem>
                <SelectItem value="other">Other</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {state === "error" && (
            <p className="text-destructive text-sm text-left">{errorMsg}</p>
          )}

          <Button
            type="submit"
            size="lg"
            disabled={state === "loading"}
            className="mt-2 h-auto w-full rounded-xl px-8 py-4 text-lg font-bold shadow-lg shadow-primary/30"
          >
            {state === "loading" ? "Claiming your spot…" : "Claim My Spot →"}
          </Button>
        </form>

        <p className="text-slate-500 text-sm mt-6">
          No spam. Just your roadmap when it&apos;s ready.
        </p>
      </div>
    </div>
  );
}
