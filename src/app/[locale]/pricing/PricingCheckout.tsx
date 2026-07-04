"use client";

import { useEffect, useState } from "react";
import { trackCheckoutStarted, trackCheckoutError } from "@/lib/tracking";
import { useTranslations } from "next-intl";

// Transient failures (network blips, 5xx, rate-limits) are worth retrying
// automatically before showing the user an error — a single checkout attempt
// per month means every recoverable failure is real revenue.
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [600, 1800]; // backoff before attempts 2 and 3

// A thrown error carries `.transient` when the failure is safe to retry.
class CheckoutError extends Error {
  transient: boolean;
  constructor(message: string, transient: boolean) {
    super(message);
    this.transient = transient;
  }
}

export default function PricingCheckout({
  plan = "report",
  prefillEmail = "",
  ctaLocation = "pricing_page",
  sourceFeature,
}: {
  plan?: string;
  prefillEmail?: string;
  ctaLocation?: string;
  sourceFeature?: string;
}) {
  const t = useTranslations("pricing");
  const [email, setEmail] = useState(prefillEmail);
  const [discountCode, setDiscountCode] = useState("");
  const [showDiscount, setShowDiscount] = useState(false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  // Prefill email from a ?email= deep link (e.g. arriving from the plan page)
  // so returning buyers don't have to retype what they already gave us.
  useEffect(() => {
    if (prefillEmail) return;
    const fromUrl = new URLSearchParams(window.location.search).get("email");
    if (fromUrl) setEmail(fromUrl);
  }, [prefillEmail]);

  const labels: Record<string, string> = {
    report: t("checkoutBtnReport"),
    lifetime: t("checkoutBtnLifetime"),
  };

  async function attemptCheckout(): Promise<string> {
    let res: Response;
    try {
      res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, discountCode: discountCode || undefined, sourceFeature }),
      });
    } catch {
      // fetch rejects only on network-level failure — always transient
      throw new CheckoutError(t("checkoutErrorRetry"), true);
    }

    let data: { url?: string; error?: string } = {};
    try {
      data = await res.json();
    } catch {
      // ignore body parse errors; handled by status below
    }

    if (!res.ok) {
      // 5xx and 429 are server-side/transient; 4xx (bad email, invalid plan) is not.
      const transient = res.status >= 500 || res.status === 429;
      throw new CheckoutError(
        transient ? t("checkoutErrorRetry") : data.error ?? t("checkoutErrorRetry"),
        transient
      );
    }
    if (!data.url) {
      throw new CheckoutError(t("checkoutErrorRetry"), true);
    }
    return data.url;
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError(t("checkoutErrorEmail"));
      return;
    }
    trackCheckoutStarted({ plan, has_discount: !!discountCode, cta_location: ctaLocation });
    setLoading(true);
    setError("");

    for (let attempt = 1; attempt <= MAX_ATTEMPTS; attempt++) {
      try {
        const url = await attemptCheckout();
        window.location.href = url;
        return; // navigating away — keep the button in its loading state
      } catch (err) {
        const isCheckoutError = err instanceof CheckoutError;
        const transient = isCheckoutError && err.transient;
        const message = err instanceof Error ? err.message : t("checkoutErrorRetry");
        const willRetry = transient && attempt < MAX_ATTEMPTS;

        trackCheckoutError({ plan, error: message, attempt, retrying: willRetry });

        if (!willRetry) {
          setError(message);
          setLoading(false);
          return;
        }
        await new Promise((r) => setTimeout(r, RETRY_DELAYS_MS[attempt - 1]));
      }
    }
  }

  return (
    <form onSubmit={handleCheckout} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
        placeholder={t("checkoutEmailPlaceholder")}
        required
        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-400 text-sm"
      />
      {showDiscount ? (
        <input
          type="text"
          value={discountCode}
          onChange={(e) => setDiscountCode(e.target.value)}
          placeholder={t("checkoutDiscountPlaceholder")}
          autoFocus
          className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-400 text-sm"
        />
      ) : (
        <button
          type="button"
          onClick={() => setShowDiscount(true)}
          className="text-slate-400 hover:text-slate-300 text-xs underline underline-offset-2"
        >
          {t("checkoutHasDiscount")}
        </button>
      )}
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="block w-full text-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors shadow-lg shadow-teal-900/50"
      >
        {loading ? t("checkoutRedirecting") : labels[plan] ?? labels.report}
      </button>
    </form>
  );
}
