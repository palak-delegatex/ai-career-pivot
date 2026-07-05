"use client";

import { useState } from "react";
import { useSearchParams } from "next/navigation";
import { Suspense } from "react";
import { useTranslations } from "next-intl";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";

function GoogleIcon() {
  return (
    <svg className="w-5 h-5" viewBox="0 0 24 24">
      <path
        fill="#4285F4"
        d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 01-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z"
      />
      <path
        fill="#34A853"
        d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z"
      />
      <path
        fill="#FBBC05"
        d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z"
      />
      <path
        fill="#EA4335"
        d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
      <path strokeLinecap="round" strokeLinejoin="round" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
    </svg>
  );
}

// Maps auth callback query params to an `error.*` translation key (or "" when
// there is no error). Copy is resolved via next-intl inside the component.
function getAuthErrorKey(errorParam: string | null, errorDescription: string | null, errorCode: string | null): string {
  if (!errorParam) return "";

  if (errorParam === "server_error" || errorParam === "exchange_failed") {
    const desc = errorDescription ?? "";
    if (desc.toLowerCase().includes("exchange") || errorCode === "unexpected_failure") {
      return "googleUnavailable";
    }
    return "serverError";
  }

  if (errorParam === "access_denied") {
    return "accessDenied";
  }

  return "authFailed";
}

function LoginForm() {
  const t = useTranslations("login");
  const searchParams = useSearchParams();
  const errorParam = searchParams.get("error");
  const errorDescription = searchParams.get("error_description");
  const errorCode = searchParams.get("error_code");
  const [loading, setLoading] = useState(false);
  const [email, setEmail] = useState("");
  const [magicLinkSent, setMagicLinkSent] = useState(false);
  const [error, setError] = useState(() => {
    const key = getAuthErrorKey(errorParam, errorDescription, errorCode);
    return key ? t(`error.${key}`) : "";
  });

  async function signInWithGoogle() {
    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
      setLoading(false);
    }
  }

  async function signInWithMagicLink(e: React.FormEvent) {
    e.preventDefault();
    if (!email.trim()) return;

    setLoading(true);
    setError("");

    const supabase = getSupabaseBrowserClient();
    const { error } = await supabase.auth.signInWithOtp({
      email: email.trim().toLowerCase(),
      options: {
        emailRedirectTo: `${window.location.origin}/auth/callback`,
      },
    });

    if (error) {
      setError(error.message);
    } else {
      setMagicLinkSent(true);
    }
    setLoading(false);
  }

  if (magicLinkSent) {
    return (
      <main className="flex items-center justify-center px-6 py-24">
        <div className="w-full max-w-sm text-center">
          <div className="w-16 h-16 rounded-2xl bg-teal-600/20 flex items-center justify-center mx-auto mb-6">
            <MailIcon />
          </div>
          <h1 className="text-2xl font-extrabold mb-3">{t("magicLink.heading")}</h1>
          <p className="text-slate-400 text-sm leading-relaxed mb-6">
            {t.rich("magicLink.body", {
              email,
              b: (chunks) => <span className="text-white font-medium">{chunks}</span>,
            })}
          </p>
          <button
            onClick={() => { setMagicLinkSent(false); setEmail(""); }}
            className="text-teal-400 hover:text-teal-300 text-sm font-medium transition-colors"
          >
            {t("magicLink.differentEmail")}
          </button>
        </div>
      </main>
    );
  }

  return (
    <main className="flex items-center justify-center px-6 py-24">
      <div className="w-full max-w-sm">
        <div className="text-center mb-10">
          <h1 className="text-3xl font-extrabold mb-3">{t("form.heading")}</h1>
          <p className="text-slate-400 text-sm leading-relaxed">
            {t("form.subheading")}
          </p>
        </div>

        <div className="space-y-3">
          <button
            onClick={signInWithGoogle}
            disabled={loading}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-white text-slate-900 font-semibold text-sm hover:bg-slate-100 transition-colors disabled:opacity-50"
          >
            <GoogleIcon />
            {loading ? t("form.redirecting") : t("form.continueWithGoogle")}
          </button>
        </div>

        <div className="flex items-center gap-3 my-6">
          <div className="flex-1 h-px bg-slate-700" />
          <span className="text-slate-500 text-xs font-medium">{t("form.or")}</span>
          <div className="flex-1 h-px bg-slate-700" />
        </div>

        <form onSubmit={signInWithMagicLink} className="space-y-3">
          <input
            type="email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            placeholder={t("form.emailPlaceholder")}
            required
            className="w-full px-4 py-3.5 rounded-xl bg-slate-800 border border-slate-700 text-white placeholder-slate-500 text-sm focus:outline-none focus:ring-2 focus:ring-teal-500 focus:border-transparent transition-all"
          />
          <button
            type="submit"
            disabled={loading || !email.trim()}
            className="w-full flex items-center justify-center gap-3 px-4 py-3.5 rounded-xl bg-teal-600 text-white font-semibold text-sm hover:bg-teal-500 transition-colors disabled:opacity-50"
          >
            <MailIcon />
            {loading ? t("form.sending") : t("form.continueWithEmail")}
          </button>
        </form>

        {error && (
          <p className="text-red-400 text-sm text-center mt-4">{error}</p>
        )}

        <p className="text-slate-500 text-xs text-center mt-8 leading-relaxed">
          {t("form.terms")}
        </p>
      </div>
    </main>
  );
}

export default function LoginClient() {
  return (
    <Suspense>
      <LoginForm />
    </Suspense>
  );
}
