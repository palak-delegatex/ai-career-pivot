"use client";

import { useRef, useState } from "react";
import { trackCheckoutStarted, trackCheckoutError, trackPricingPlanSelected, pageSource } from "@/lib/tracking";

// Transient failures (network blips, 5xx, rate-limits) are worth retrying
// automatically before showing the user an error — a single checkout attempt
// per month means every recoverable failure is real revenue.
const MAX_ATTEMPTS = 3;
const RETRY_DELAYS_MS = [600, 1800]; // backoff before attempts 2 and 3

// Shown when checkout can't start after exhausting automatic retries.
const CHECKOUT_RETRY_MESSAGE =
  "We couldn't start your checkout — this is usually a brief hiccup. Please tap the button to try again.";

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
  sourceFeature,
}: {
  plan?: string;
  prefillEmail?: string;
  sourceFeature?: string;
}) {
  const [email, setEmail] = useState(prefillEmail);
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  // Fire `pricing_plan_selected` once per plan card, the first time the visitor
  // engages that card's form — the mid-funnel step immediately before
  // checkout_started (AIC-742). A ref (not state) so re-renders never re-emit.
  const selectedTracked = useRef(false);

  function handlePlanEngaged() {
    if (selectedTracked.current) return;
    selectedTracked.current = true;
    trackPricingPlanSelected({ plan, source: sourceFeature ?? pageSource() });
  }

  const labels: Record<string, string> = {
    report: "Get My Report — $19",
    lifetime: "Get Lifetime Access — $149",
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
      throw new CheckoutError(CHECKOUT_RETRY_MESSAGE, true);
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
        transient ? CHECKOUT_RETRY_MESSAGE : data.error ?? CHECKOUT_RETRY_MESSAGE,
        transient
      );
    }
    if (!data.url) {
      throw new CheckoutError(CHECKOUT_RETRY_MESSAGE, true);
    }
    return data.url;
  }

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    // Ensures the plan-selected step is recorded before checkout_started even
    // when the email was prefilled and the field never received focus.
    handlePlanEngaged();
    trackCheckoutStarted({ plan, has_discount: !!discountCode });
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
        const message = err instanceof Error ? err.message : CHECKOUT_RETRY_MESSAGE;
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
        onFocus={handlePlanEngaged}
        placeholder="Your email address"
        required
        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-400 text-sm"
      />
      <input
        type="text"
        value={discountCode}
        onChange={(e) => setDiscountCode(e.target.value)}
        placeholder="Discount code (optional)"
        className="w-full px-4 py-3 rounded-xl bg-slate-700 border border-slate-600 focus:border-teal-500 focus:outline-none text-white placeholder-slate-400 text-sm"
      />
      {error && (
        <p className="text-red-400 text-sm">{error}</p>
      )}
      <button
        type="submit"
        disabled={loading}
        className="block w-full text-center px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed font-bold transition-colors shadow-lg shadow-teal-900/50"
      >
        {loading ? "Redirecting to checkout..." : labels[plan] ?? labels.report}
      </button>
    </form>
  );
}
