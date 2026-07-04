"use client";

import { useEffect, useState } from "react";
import { trackCheckoutStarted, trackCheckoutError } from "@/lib/tracking";
import { useTranslations } from "next-intl";

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

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError(t("checkoutErrorEmail"));
      return;
    }
    trackCheckoutStarted({ plan, has_discount: !!discountCode, cta_location: ctaLocation });
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, discountCode: discountCode || undefined, sourceFeature }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      const message = err instanceof Error ? err.message : "Something went wrong.";
      trackCheckoutError({ plan, error: message });
      setError(message);
      setLoading(false);
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
