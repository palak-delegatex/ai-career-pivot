"use client";

import { useState } from "react";

export default function PricingCheckout({ plan = "report" }: { plan?: string }) {
  const [email, setEmail] = useState("");
  const [discountCode, setDiscountCode] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const labels: Record<string, string> = {
    report: "Get My Report — $5",
    lifetime: "Get Lifetime Access — $149",
  };

  async function handleCheckout(e: React.FormEvent) {
    e.preventDefault();
    if (!email) {
      setError("Please enter your email address.");
      return;
    }
    setLoading(true);
    setError("");

    try {
      const res = await fetch("/api/checkout", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, plan, discountCode: discountCode || undefined }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error ?? "Checkout failed");
      if (data.url) {
        window.location.href = data.url;
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Something went wrong.");
      setLoading(false);
    }
  }

  return (
    <form onSubmit={handleCheckout} className="space-y-3">
      <input
        type="email"
        value={email}
        onChange={(e) => setEmail(e.target.value)}
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
