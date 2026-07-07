import { Check, X } from "lucide-react";

/**
 * PricingComparisonTable (AIC-738)
 *
 * Upgrades the flat 3-card price strip into a feature-by-feature comparison
 * that frames AICareerPivot against the status quo (a human career coach) and
 * the free alternative (ChatGPT). The AICareerPivot column is visually
 * anchored — highlighted border, accent header, "Best value" ribbon — so the
 * primary offer wins the scan. The Cost / Time rows carry the "cost of NOT
 * pivoting" frame the issue asks for.
 *
 * Server component, no interactivity. On mobile the table scrolls
 * horizontally while the feature-label column stays readable.
 */

type Cell = boolean | string;

interface Row {
  feature: string;
  coach: Cell;
  chatgpt: Cell;
  us: Cell;
}

const ROWS: Row[] = [
  { feature: "Personalized to your résumé & LinkedIn", coach: true, chatgpt: "Only if you paste everything", us: true },
  { feature: "Structured 6-mo / 1-yr / 2-yr roadmap", coach: "Sometimes", chatgpt: false, us: true },
  { feature: "Transferable-skills extraction", coach: true, chatgpt: false, us: true },
  { feature: "Skill-gap analysis + AI certifications", coach: "Extra sessions", chatgpt: false, us: true },
  { feature: "Constraint-aware (salary, family, location)", coach: true, chatgpt: false, us: true },
  { feature: "Time to a usable plan", coach: "3–5 sessions / weeks", chatgpt: "30–45 min prompting", us: "Minutes" },
  { feature: "Cost", coach: "$750–$1,250", chatgpt: "Free", us: "$19" },
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
    return (
      <span className="inline-flex items-center justify-center">
        <X className="w-5 h-5 text-slate-600" aria-label="Not included" />
      </span>
    );
  }
  return (
    <span className={`text-sm ${accent ? "text-white font-semibold" : "text-slate-400"}`}>{value}</span>
  );
}

export default function PricingComparisonTable() {
  return (
    <div className="max-w-4xl mx-auto mb-12">
      <div className="overflow-x-auto -mx-6 px-6 sm:mx-0 sm:px-0">
        <table className="w-full min-w-[520px] border-separate border-spacing-0">
          <caption className="sr-only">
            AICareerPivot compared with a human career coach and ChatGPT
          </caption>
          <thead>
            <tr>
              <th scope="col" className="text-left align-bottom p-4 w-2/5">
                <span className="text-xs uppercase tracking-widest text-slate-500">How we compare</span>
              </th>
              <th scope="col" className="p-4 text-center align-bottom">
                <span className="block text-sm font-semibold text-slate-300">Career Coach</span>
                <span className="block text-xs text-slate-500 mt-0.5">$750–$1,250</span>
              </th>
              <th scope="col" className="p-4 text-center align-bottom">
                <span className="block text-sm font-semibold text-slate-300">ChatGPT</span>
                <span className="block text-xs text-slate-500 mt-0.5">Free</span>
              </th>
              <th scope="col" className="p-3 text-center align-bottom">
                <div className="relative rounded-t-2xl bg-teal-950/30 border-x-2 border-t-2 border-teal-500 px-4 pt-6 pb-3 -mb-px">
                  <span className="absolute -top-3 left-1/2 -translate-x-1/2 whitespace-nowrap bg-teal-500 text-white text-[10px] font-bold px-3 py-1 rounded-full uppercase tracking-wider">
                    Best value
                  </span>
                  <span className="block text-sm font-bold text-teal-400">AICareerPivot</span>
                  <span className="block text-xs text-slate-400 mt-0.5">$19 one-time</span>
                </div>
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
                    className={`text-left p-4 text-sm text-slate-300 font-normal border-t border-slate-800 ${last ? "font-semibold text-white" : ""}`}
                  >
                    {row.feature}
                  </th>
                  <td className="p-4 text-center border-t border-slate-800">
                    <CellValue value={row.coach} />
                  </td>
                  <td className="p-4 text-center border-t border-slate-800">
                    <CellValue value={row.chatgpt} />
                  </td>
                  <td
                    className={`p-4 text-center bg-teal-950/30 border-x-2 border-teal-500 border-t border-t-teal-900/40 ${last ? "rounded-b-2xl border-b-2" : ""}`}
                  >
                    <CellValue value={row.us} accent />
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      </div>
      <p className="text-slate-500 text-xs text-center mt-4">
        A career coach costs 40–65× more and takes weeks. The real price is the
        raise you delay every month you don&apos;t pivot.
      </p>
    </div>
  );
}
