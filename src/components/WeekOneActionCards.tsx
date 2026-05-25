"use client";

type WeekOneAction = {
  title: string;
  instruction: string;
  timeEstimate: string;
  difficulty?: "easy" | "medium" | "hard";
};

const difficultyConfig = {
  easy: { label: "Easy", className: "bg-emerald-900/40 border-emerald-700/40 text-emerald-300" },
  medium: { label: "Medium", className: "bg-amber-900/40 border-amber-700/40 text-amber-300" },
  hard: { label: "Hard", className: "bg-red-900/40 border-red-700/40 text-red-300" },
};

export default function WeekOneActionCards({ actions }: { actions: WeekOneAction[] }) {
  const top3 = actions.slice(0, 3);

  return (
    <div className="bg-slate-800/60 border border-slate-700 rounded-2xl p-5">
      <h3 className="text-sm font-bold text-teal-400 mb-4">Week 1 Priority Actions</h3>
      <div className="space-y-3">
        {top3.map((action, i) => (
          <div
            key={i}
            className="flex gap-4 bg-slate-900/50 border border-slate-700/60 border-l-2 border-l-teal-500 rounded-xl p-4"
          >
            <div className="shrink-0 w-8 h-8 rounded-full bg-teal-600/20 border border-teal-500/40 flex items-center justify-center">
              <span className="text-teal-400 font-bold text-sm">{i + 1}</span>
            </div>

            <div className="flex-1 min-w-0">
              <p className="font-semibold text-white text-sm leading-snug mb-1">{action.title}</p>
              <p className="text-slate-400 text-xs leading-relaxed mb-2">{action.instruction}</p>
              <div className="flex items-center gap-2 flex-wrap">
                <span className="text-xs bg-slate-700/60 border border-slate-600/50 text-slate-400 px-2 py-0.5 rounded-full">
                  ⏱ {action.timeEstimate}
                </span>
                {action.difficulty && (
                  <span className={`text-xs border px-2 py-0.5 rounded-full ${difficultyConfig[action.difficulty].className}`}>
                    {difficultyConfig[action.difficulty].label}
                  </span>
                )}
                <span className="ml-auto text-slate-600 text-sm">○</span>
              </div>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
