import type { PivotPlan } from "@/lib/intake";

const difficultyColor = {
  low: "text-emerald-400",
  medium: "text-amber-400",
  high: "text-red-400",
};

const difficultyBg = {
  low: "bg-emerald-900/30 border-emerald-700/40",
  medium: "bg-amber-900/30 border-amber-700/40",
  high: "bg-red-900/30 border-red-700/40",
};

function Badge({ value }: { value: "low" | "medium" | "high" }) {
  return (
    <span className={`inline-block px-2 py-0.5 rounded-full border text-xs font-medium capitalize ${difficultyBg[value]} ${difficultyColor[value]}`}>
      {value}
    </span>
  );
}

function CompareRow({ label, values }: { label: string; values: React.ReactNode[] }) {
  return (
    <div className="grid gap-px" style={{ gridTemplateColumns: `140px repeat(${values.length}, 1fr)` }}>
      <div className="py-3 px-3 text-xs text-slate-500 font-medium flex items-center">{label}</div>
      {values.map((v, i) => (
        <div key={i} className="py-3 px-3 border-l border-slate-700/50 flex items-center">{v}</div>
      ))}
    </div>
  );
}

export default function PathComparison({ plans }: { plans: PivotPlan[] }) {
  const plansWithTradeoffs = plans.filter((p) => p.tradeoffs);
  if (plansWithTradeoffs.length < 2) return null;

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl overflow-hidden">
      <div className="px-5 py-4 border-b border-slate-700">
        <h3 className="text-sm font-bold text-slate-200">Path Comparison</h3>
        <p className="text-xs text-slate-500 mt-0.5">Side-by-side trade-offs across all paths</p>
      </div>

      {/* Header row */}
      <div
        className="grid bg-slate-900/40"
        style={{ gridTemplateColumns: `140px repeat(${plansWithTradeoffs.length}, 1fr)` }}
      >
        <div className="py-3 px-3" />
        {plansWithTradeoffs.map((p, i) => (
          <div key={i} className="py-3 px-3 border-l border-slate-700/50">
            <p className="text-xs font-bold text-teal-400 truncate">{p.targetRole}</p>
            <p className="text-[10px] text-slate-500 truncate">{p.targetIndustry}</p>
          </div>
        ))}
      </div>

      <div className="divide-y divide-slate-700/40">
        <CompareRow
          label="Difficulty"
          values={plansWithTradeoffs.map((p) => <Badge key={p.targetRole} value={p.tradeoffs!.difficulty} />)}
        />
        <CompareRow
          label="Risk Level"
          values={plansWithTradeoffs.map((p) => <Badge key={p.targetRole} value={p.tradeoffs!.riskLevel} />)}
        />
        <CompareRow
          label="Time to First Role"
          values={plansWithTradeoffs.map((p) => (
            <span key={p.targetRole} className="text-xs text-slate-300">{p.tradeoffs!.timeToFirstRole}</span>
          ))}
        />
        <CompareRow
          label="Income (Near-term)"
          values={plansWithTradeoffs.map((p) => (
            <span key={p.targetRole} className="text-xs text-amber-300">{p.tradeoffs!.incomeImpactNear}</span>
          ))}
        />
        <CompareRow
          label="Income (Long-term)"
          values={plansWithTradeoffs.map((p) => (
            <span key={p.targetRole} className="text-xs text-emerald-300">{p.tradeoffs!.incomePotentialLong}</span>
          ))}
        />
        <CompareRow
          label="Pros"
          values={plansWithTradeoffs.map((p) => (
            <ul key={p.targetRole} className="space-y-1">
              {p.tradeoffs!.pros.map((pro, j) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-slate-300">
                  <span className="text-emerald-500 shrink-0 mt-0.5">+</span>
                  {pro}
                </li>
              ))}
            </ul>
          ))}
        />
        <CompareRow
          label="Cons"
          values={plansWithTradeoffs.map((p) => (
            <ul key={p.targetRole} className="space-y-1">
              {p.tradeoffs!.cons.map((con, j) => (
                <li key={j} className="flex items-start gap-1.5 text-xs text-slate-400">
                  <span className="text-red-500 shrink-0 mt-0.5">−</span>
                  {con}
                </li>
              ))}
            </ul>
          ))}
        />
      </div>
    </div>
  );
}
