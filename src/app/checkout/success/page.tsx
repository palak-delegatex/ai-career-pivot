"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { trackPaymentVerified, trackPaymentVerificationFailed, trackCtaClicked } from "@/lib/tracking";

function CheckoutSuccessInner() {
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
      .then((data) => {
        if (data.paid) {
          trackPaymentVerified({ session_id: sessionId });
          sessionStorage.setItem("payment_session_id", sessionId);
          sessionStorage.setItem("payment_email", data.email);
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
            We couldn&apos;t verify your payment. If you were charged, please contact us — we&apos;ll sort it out.
          </p>
          <Link
            href="/pricing"
            className="inline-block px-8 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors"
          >
            Back to Pricing
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
        <p className="text-slate-400 mb-8 leading-relaxed">
          You&apos;re all set. Now upload your resume and LinkedIn profile so we can build your personalized career pivot roadmap.
        </p>
        <Link
          href="/onboarding"
          onClick={() => trackCtaClicked({ cta_text: "Build My Roadmap", cta_location: "checkout_success", destination: "/onboarding" })}
          className="inline-block px-10 py-4 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold text-lg transition-colors shadow-lg shadow-teal-900/50"
        >
          Build My Roadmap →
        </Link>
        <p className="text-slate-500 text-xs mt-6">
          Your receipt has been sent to your email.
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
