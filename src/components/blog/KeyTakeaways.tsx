// Key Takeaways box (AIC-1194, design AIC-1193). Answer-first, quotable summary
// block that generative/voice engines surface. The `.key-takeaways` class is a
// stable contract with AIC-1192 Speakable JSON-LD (targeted by cssSelector) —
// do NOT rename it or move it off the outermost <section>.
//
// Static server component: no interactivity, no motion.

interface KeyTakeawaysProps {
  items: string[]; // post.tldr array
  heading?: string; // i18n override, default "Key Takeaways"
}

export default function KeyTakeaways({ items, heading = "Key Takeaways" }: KeyTakeawaysProps) {
  if (!items || items.length === 0) return null;

  return (
    <section
      className="key-takeaways mb-10 bg-slate-900/80 border border-slate-700/50 border-l-4 border-l-teal-500 rounded-xl p-4 sm:p-6 not-prose"
      aria-labelledby="key-takeaways-heading"
    >
      <h2
        id="key-takeaways-heading"
        className="text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mb-4"
      >
        {heading}
      </h2>
      <ol className="space-y-3 list-none">
        {items.map((point, i) => (
          <li key={i} className="flex items-start gap-3">
            <span
              className="text-teal-400 text-sm font-semibold shrink-0 mt-0.5 tabular-nums"
              aria-hidden="true"
            >
              {i + 1}.
            </span>
            <span className="text-sm text-slate-200 leading-relaxed">{point}</span>
          </li>
        ))}
      </ol>
    </section>
  );
}
