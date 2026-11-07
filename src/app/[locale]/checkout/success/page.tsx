"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackPaymentVerified, trackPaymentVerificationFailed, trackCtaClicked } from "@/lib/tracking";

function CheckoutSuccessInner() {
  const router = useRouter();
  const params = useSearchParams();
  const sessionId = params.get("session_id");
  const [retry, setRetry] = useState(0);
  const [continuePath, setContinuePath] = useState("/onboarding");
  const [message, setMessage] = useState("");
  const [status, setStatus] = useState<"verifying" | "success" | "error">("verifying");

  useEffect(() => {
    if (!sessionId) {
      router.replace("/pricing");
      return;
    }

    fetch(`/api/checkout/verify?session_id=${encodeURIComponent(sessionId)}`)
      .then(async (res) => { const data = await res.json(); if (!res.ok) throw new Error(data.error ?? "Please retry verification without paying again."); return data; })
      .then(async (data) => {
        if (data.paid) {
          trackPaymentVerified({ session_id: sessionId });
          sessionStorage.setItem("payment_session_id", sessionId);
          sessionStorage.setItem("payment_email", data.email);

          if (data.reportId) {
            setContinuePath(`/report/${data.reportId}`);
          } else {
            // Preserve the free result's uploaded profile through the purchase.
            const existing = sessionStorage.getItem("intake_profile") ?? sessionStorage.getItem("free_profile");
            if (existing) {
              try {
                const profile = JSON.parse(existing);
                if ([profile.skills, profile.transferableSkills, profile.experience, profile.education, profile.certifications, profile.interests].every(Array.isArray)) {
                  sessionStorage.setItem("intake_profile", JSON.stringify({ ...profile, email: data.email }));
                  setContinuePath("/onboarding/profile?generate=1");
                }
              } catch { /* Missing/old profile: onboarding remains available. */ }
            }
          }

          setStatus("success");
        } else {
          trackPaymentVerificationFailed({ session_id: sessionId });
          setStatus("error");
        }
      })
      .catch((error) => {
        setMessage(error instanceof Error ? error.message : "Please retry verification without paying again.");
        trackPaymentVerificationFailed({ session_id: sessionId });
        setStatus("error");
      });
  }, [sessionId, router, retry]);

  if (status === "verifying") {
    return (
      <div className="flex min-h-screen bg-slate-900 items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-teal-500 border-t-transparent rounded-full animate-spin mx-auto mb-6" />
          <p className="text-slate-400">Confirming your payment...</p>
        </div>
      </div>
    );
  }

  if (status === "error") {
    return (
      <div className="flex min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white items-center justify-center px-6">
        <div className="max-w-md text-center">
          <div className="text-5xl mb-6">⚠️</div>
          <h1 className="text-2xl font-bold mb-3">Payment Not Confirmed</h1>
          <p className="text-slate-400 mb-6">
            {message || "Payment is not confirmed yet. Retry verification; do not pay again."}
          </p>
          <button onClick={() => { setStatus("verifying"); setRetry(v => v + 1); }} className="mb-4 px-6 py-3 rounded-xl bg-teal-600 font-bold">Retry verification</button>
          <Link
            href={`/login?next=${encodeURIComponent("/checkout/success?session_id=" + sessionId)}`}
            className="inline-block px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors"
          >
            Sign in with your purchase email
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
        <h1 className="text-3xl font-extrabold mb-3">Payment Confirmed!</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">
          Continue with your uploaded profile, or add your background to build your personalized report. You do not need to pay again.
        </p>

        {/* What You Unlocked */}
        <div className="text-left mb-8 space-y-2">
          <p className="text-sm font-semibold text-slate-200 mb-3">What You Unlocked:</p>
          {[
            "Multi-timeline roadmap (6mo / 1yr / 2yr)",
            "Salary trajectory & financial bridge plan",
            "AI coaching + weekly action plan",
            "Constraint-aware planning for your life",
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
          href={continuePath}
          onClick={() => trackCtaClicked({ cta_text: "Build My Roadmap", cta_location: "checkout_success", destination: continuePath.split("?")[0] })}
          className="inline-block px-10 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
        >
          Build My Roadmap →
        </Link>

        <div className="mt-6 mb-4">
          <p className="text-xs text-slate-500 mt-1">You&rsquo;re in — let&rsquo;s build your roadmap</p>
        </div>

        <p className="text-slate-500 text-xs">
          Your report will be saved after generation. Keep this browser open, or sign in with your purchase email to find it later.
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
