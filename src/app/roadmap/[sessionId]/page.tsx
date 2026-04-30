import { redirect } from "next/navigation";
import Link from "next/link";
import { getPaidSession } from "@/lib/payments";

export const dynamic = "force-dynamic";

export default async function RoadmapPage({
  params,
}: {
  params: Promise<{ sessionId: string }>;
}) {
  const { sessionId } = await params;

  const paid = await getPaidSession(sessionId);
  if (!paid) {
    redirect(`/checkout/cancel?reason=not_paid&session_id=${sessionId}`);
  }

  // NOTE: integration point for issue #2 (AI roadmap generator).
  // Look up the generated roadmap by `sessionId` (or `paid.customer_email`)
  // and render it here in place of this stub.
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white px-6 py-16">
      <div className="max-w-2xl mx-auto">
        <div className="text-center mb-10">
          <div className="text-4xl mb-4">🗺️</div>
          <h1 className="text-3xl font-extrabold mb-3">You&apos;re in. Welcome aboard.</h1>
          <p className="text-slate-400 leading-relaxed">
            Your $9 early-access payment is confirmed and a receipt is on its way to{" "}
            <span className="text-teal-300">{paid.customer_email}</span>.
          </p>
        </div>

        <div className="bg-slate-800/60 border border-teal-700/40 rounded-2xl p-6 mb-6">
          <h2 className="text-lg font-bold text-teal-400 mb-2">Your roadmap is being assembled</h2>
          <p className="text-slate-300 leading-relaxed text-sm">
            We&apos;re finishing the personalized 6-month, 1-year, and 2-year plan based on the
            background you shared during intake. This page will display the full roadmap once
            generation is complete.
          </p>
        </div>

        <div className="bg-slate-800/40 border border-slate-700 rounded-2xl p-6 text-sm text-slate-400">
          <p className="font-semibold text-white mb-1">Order details</p>
          <p>Session: <span className="font-mono text-slate-300">{paid.stripe_session_id}</span></p>
          <p>
            Amount: ${(paid.amount_total / 100).toFixed(2)} {paid.currency.toUpperCase()}
          </p>
        </div>

        <div className="mt-8 text-center">
          <Link href="/" className="text-teal-400 hover:text-teal-300 text-sm font-semibold">
            ← Back to home
          </Link>
        </div>
      </div>
    </div>
  );
}
