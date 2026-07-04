"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { trackPaymentVerified, trackPaymentVerificationFailed, trackCtaClicked } from "@/lib/tracking";
import { getSupabaseBrowserClient } from "@/lib/supabase-browser";
import SocialProofStrip from "@/components/SocialProofStrip";

function CheckoutSuccessInner() {
  const t = useTranslations("checkout");
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!sessionId) {
      router.replace("/pricing");
      return;
    }

    fetch(`/api/checkout/verify?session_id=${sessionId}`)
      .then((res) => res.json())
      .then(async (data) => {
        if (data.paid) {
          trackPaymentVerified({ session_id: sessionId });
          sessionStorage.setItem("payment_session_id", sessionId);
          sessionStorage.setItem("payment_email", data.email);

          const supabase = getSupabaseBrowserClient();
          const { data: authData } = await supabase.auth.getUser();
          if (!authData.user && data.email) {
            sessionStorage.setItem("pending_auth_email", data.email);
          }

          setStatus("success");
        } else {
          trackPaymentVerificationFailed({ session_id: sessionId });
          setStatus("error");
        }
      })
      .catch(() => {
        trackPaymentVerificationFailed({ session_id: sessionId });
        setStatus("error");
      });
  }, [sessionId, router]);

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-slate-400">{t("verifying")}</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-3">{t("errorHeading")}</h1>
          <p className="text-slate-400 mb-6">
            {t("errorMessage")}
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors"
          >
            {t("errorBackToPricing")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
      <div className="max-w-md text-center">
        <div className="w-16 h-16 bg-teal-600 rounded-full flex items-center justify-center mx-auto mb-6">
          <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={3} d="M5 13l4 4L19 7" />
          </svg>
        </div>
        <h1 className="text-3xl font-extrabold mb-3">{t("successHeading")}</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          {t("successMessage")}
        </p>

        {/* What You Unlocked */}
        <div className="text-left mb-8 space-y-2">
          <p className="text-sm font-semibold text-slate-200 mb-3">{t("unlockedHeading")}</p>
          {[
            t("unlocked1"),
            t("unlocked2"),
            t("unlocked3"),
            t("unlocked4"),
          ].map((item) => (
            <div key={item} className="flex items-start gap-2">
              <svg className="w-4 h-4 text-teal-400 mt-0.5 shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
              </svg>
              <span className="text-sm text-slate-300">{item}</span>
            </div>
          ))}
        </div>

        <Link
          href="/onboarding"
          onClick={() => trackCtaClicked({ cta_text: "Build My Roadmap", cta_location: "checkout_success", destination: "/onboarding" })}
          className="inline-block px-10 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
        >
          {t("ctaBuildRoadmap")} →
        </Link>

        {/* Social proof */}
        <div className="mt-6 mb-4">
          <SocialProofStrip
            variant="minimal"
            testimonial={{
              quote: t("testimonialQuote"),
              name: "Priya R.",
              role: t("testimonialRole"),
              initials: "PR",
              gradient: "from-teal-500 to-cyan-500",
            }}
            metrics={[]}
            className="justify-center"
          />
          <p className="text-xs text-slate-500 mt-1">{t("socialProofCount")}</p>
        </div>

        <p className="text-slate-500 text-xs">
          {t("receiptNote")}
        </p>
      </div>
    </div>
  );
}

export default function CheckoutSuccessPage() {
  return (
    <Suspense
      fallback={
        <div className="flex min-h-screen bg-slate-900 items-center justify-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin" />
        </div>
      }
    >
      <CheckoutSuccessInner />
    </Suspense>
  );
}
