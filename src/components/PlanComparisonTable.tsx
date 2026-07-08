import { Check } from "lucide-react";

/**
 * PlanComparisonTable (AIC-778 / AIC-618 D4)
 *
 * The tier-by-tier "Compare plans" grid that sits under the three pricing
 * cards. Unlike PricingComparisonTable (which frames us vs. a coach vs.
 * ChatGPT), this table compares OUR OWN tiers so the Free column anchors the
 * ladder: the visitor sees exactly what the free snapshot already gives them
 * and what each row the paid tiers unlock beyond it (Anchoring effect).
 *
 * The Report ($19) column is visually anchored as the conversion target, and
 * the Free column is the fixed reference point on the left. Server component,
 * no interactivity; horizontal scroll on mobile with the feature-label column
 * kept readable.
 */

type Cell = boolean | string;

interface Row {
  feature: string;
  free: Cell;
  report: Cell;
  lifetime: Cell;
}

const ROWS: Row[] = [
  { feature: "Career path matches", free: "1", report: "3", lifetime: "3" },
  { feature: "Skill-gap analysis", free: "Top 3", report: "Full (15+)", lifetime: "Full (15+)" },
  { feature: "Transferable strengths", free: true, report: true, lifetime: true },
  { feature: "6 / 12 / 24-month milestone roadmap", free: false, report: true, lifetime: true },
  { feature: "Financial bridge plan", free: false, report: true, lifetime: true },
  { feature: "Salary trajectory & ROI", free: false, report: true, lifetime: true },
  { feature: "AI coaching & weekly actions", free: false, report: true, lifetime: true },
  { feature: "AI resume builder", free: false, report: true, lifetime: true },
  { feature: "Job board with match scores", free: false, report: true, lifetime: true },
  { feature: "Unlimited report updates", free: false, report: false, lifetime: true },
  { feature: "All future features", free: false, report: false, lifetime: true },
];

function CellValue({ value, accent }: { value: Cell; accent?: boolean }) {
  if (value === true) {
    return (
      <span className="inline-flex items-center justify-center">
        <Check className={`w-5 h-5 ${accent ? "text-teal-400" : "text-emerald-400"}`} aria-label="Included" />
      </span>
    );
  }
  if (value === false) {
    return <span className="text-slate-600" aria-label="Not included">—</span>;
  }
  return (
    <span className={`text-sm ${accent ? "text-white font-semibold" : "text-slate-400"}`}>{value}</span>
  );
}

export default function PlanComparisonTable() {
  return (
    <div className="max-w-4xl mx-auto mb-16">
      <h2 className="text-2xl font-extrabold text-center mb-8">Compare plans</h2>
      <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[560px] border-separate border-spacing-0">
          <caption className="sr-only">
            Free Snapshot compared with the $19 Career Report and $149 Lifetime plans
          </caption>
          <thead>
            <tr>
              <th scope="col" className="text-left align-bottom p-4 w-2/5">
                <span className="text-xs uppercase tracking-widest text-slate-500">Feature</span>
              </th>
              <th scope="col" className="p-4 text-center align-bottom">
                <span className="block text-sm font-semibold text-slate-300">Free</span>
                <span className="block text-xs text-slate-500 mt-0.5">$0</span>
              </th>
              <th scope="col" className="p-3 text-center align-bottom">
                <div className="relative rounded-t-2xl bg-teal-950/30 border-x-2 border-t-2 border-teal-500 px-4 pt-6 pb-3 -mb-px">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Recommended
                  </span>
                  <span className="block text-sm font-bold text-teal-400">Report</span>
                  <span className="block text-xs text-slate-400 mt-0.5">$19 one-time</span>
                </div>
              </th>
              <th scope="col" className="p-4 text-center align-bottom">
                <span className="block text-sm font-semibold text-slate-300">Lifetime</span>
                <span className="block text-xs text-slate-500 mt-0.5">$149 one-time</span>
              </th>
            </tr>
          </thead>
          <tbody>
            {ROWS.map((row, i) => {
              const last = i === ROWS.length - 1;
              return (
                <tr key={row.feature}>
                  <th
                    scope="row"
                    className="text-left p-4 text-sm text-slate-300 font-normal border-t border-slate-800"
                  >
                    {row.feature}
                  </th>
                  <td className="p-4 text-center border-t border-slate-800">
                    <CellValue value={row.free} />
                  </td>
                  <td
                    className={`p-4 text-center bg-teal-950/30 border-x-2 border-teal-500 border-t border-t-teal-900/40 ${last ? "rounded-b-2xl border-b-2" : ""}`}
                  >
                    <CellValue value={row.report} accent />
                  </td>
                  <td className="p-4 text-center border-t border-slate-800">
                    <CellValue value={row.lifetime} />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-slate-500 text-xs text-center mt-4">
        Start free — no card, no account. Upgrade only when you&apos;re ready to see the full plan.
      </p>
    </div>
  );
}
