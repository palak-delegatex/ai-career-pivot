import Link from "next/link";

export const dynamic = "force-dynamic";

const REASON_COPY: Record<string, { title: string; body: string }> = {
  missing_session: {
    title: "We couldn't find that checkout",
    body: "Looks like you got here without going through Stripe. Start a new checkout to grab your roadmap.",
  },
  not_paid: {
    title: "Payment didn't complete",
    body: "Stripe didn't confirm your payment. No charge was made — please try again.",
  },
  default: {
    title: "Checkout cancelled",
    body: "No charge was made. Whenever you're ready, you can try again — your intake answers are still saved.",
  },
};

interface CancelSearchParams {
  reason?: string;
}

export default async function CheckoutCancelPage({
  searchParams,
}: {
  searchParams: Promise<CancelSearchParams>;
}) {
  const { reason } = await searchParams;
  const copy = REASON_COPY[reason ?? ""] ?? REASON_COPY.default;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 text-white flex items-center justify-center px-6">
      <div className="max-w-md w-full text-center bg-slate-800/60 border border-slate-700 rounded-2xl p-8">
        <div className="text-4xl mb-4">↩️</div>
        <h1 className="text-2xl font-extrabold mb-3">{copy.title}</h1>
        <p className="text-slate-400 mb-6 leading-relaxed">{copy.body}</p>
        <Link
          href="/onboarding/plan"
          className="inline-block px-6 py-3 rounded-xl bg-teal-600 hover:bg-teal-500 font-bold transition-colors shadow-lg shadow-teal-900/50"
        >
          Try checkout again →
        </Link>
        <div className="mt-4">
          <Link href="/onboarding" className="text-slate-400 hover:text-slate-200 text-sm">
            Or restart your intake
          </Link>
        </div>
      </div>
    </div>
  );
}
