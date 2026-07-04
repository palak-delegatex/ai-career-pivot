"use client";

import { useEffect, useState } from "react";
import posthog from "posthog-js";
import { trackReferralLinkCopied } from "@/lib/tracking";
import { useTranslations } from "next-intl";

type FormState = "idle" | "loading" | "success" | "already" | "error";

const BASE_URL = "https://ai-career-pivot.com";

export default function WaitlistForm() {
  const t = useTranslations("waitlist");
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
        setErrorMsg(data.error || t("errorGeneric"));
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
      setErrorMsg(t("errorNetwork"));
    }
  }

  if (state === "success" || state === "already") {
    const referralLink = referralCode
      ? `${BASE_URL}/waitlist?ref=${referralCode}`
      : null;
    const shareText = referralLink
      ? t("shareText", { referralLink })
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
              {state === "success" ? t("successHeading") : t("alreadyHeading")}
            </h1>
            <p className="text-slate-300 text-lg leading-relaxed">
              {state === "success"
                ? t("successMessage")
                : t("alreadyMessage")}
            </p>
          </div>

          {referralLink && (
            <div className="bg-slate-800 border border-teal-800 rounded-2xl p-6 mb-6">
              <p className="text-teal-400 font-bold text-sm mb-1">{t("referralMoveUp")}</p>
              <p className="text-slate-300 text-sm mb-4 leading-relaxed">
                {t("referralDesc")}
              </p>
              <div className="flex items-center gap-3 mb-4">
                <code className="flex-1 bg-slate-900 text-teal-300 text-sm px-3 py-2 rounded-lg truncate">
                  {referralLink}
                </code>
                <button
                  onClick={copyLink}
                  className="shrink-0 px-4 py-2 bg-teal-600 hover:bg-teal-500 text-white text-sm font-semibold rounded-lg transition-colors"
                >
                  {copied ? t("btnCopied") : t("btnCopy")}
                </button>
              </div>
              {shareText && (
                <>
                  <p className="text-slate-500 text-xs font-semibold mb-2">{t("shareLabel")}</p>
                  <p className="text-slate-400 text-xs leading-relaxed italic bg-slate-900 rounded-lg px-3 py-2">
                    &ldquo;{shareText}&rdquo;
                  </p>
                </>
              )}
            </div>
          )}

          <div className="bg-slate-800 border border-slate-700 rounded-2xl p-5 text-center">
            <p className="text-slate-400 text-sm leading-relaxed">
              {t("referralEmailNote")}
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
          {t("formHeading")}
        </h1>
        <p className="text-slate-300 text-lg mb-10 leading-relaxed">
          {t("formSubheading")}
        </p>

        <form className="flex flex-col gap-4" onSubmit={handleSubmit}>
          <input
            type="text"
            placeholder={t("placeholderName")}
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            className="w-full px-5 py-4 rounded-xl bg-slate-800 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-500 text-lg"
          />
          <input
            type="email"
            placeholder={t("placeholderEmail")}
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
            <option value="">{t("selectDefault")}</option>
            <option value="burnout">{t("personaBurnout")}</option>
            <option value="parent">{t("personaParent")}</option>
            <option value="career-change">{t("personaCareerChange")}</option>
            <option value="growth">{t("personaGrowth")}</option>
            <option value="other">{t("personaOther")}</option>
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
