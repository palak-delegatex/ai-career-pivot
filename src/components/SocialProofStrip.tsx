import type { Testimonial } from "@/lib/testimonials";

interface Metric {
  value: string;
  label: string;
}

interface SocialProofStripProps {
  testimonial: Testimonial;
  metrics: Metric[];
  variant?: "default" | "compact" | "minimal" | "featured";
  className?: string;
}

export default function SocialProofStrip({
  testimonial,
  metrics,
  variant = "default",
  className = "",
}: SocialProofStripProps) {
  if (variant === "minimal") {
    return (
      <div className={`flex items-center gap-3 text-xs text-slate-400 ${className}`}>
        <div
          className={`w-6 h-6 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-[10px] shrink-0`}
        >
          {testimonial.initials}
        </div>
        <p className="italic line-clamp-1">&ldquo;{testimonial.quote}&rdquo;</p>
      </div>
    );
  }

  if (variant === "compact") {
    return (
      <div
        className={`bg-slate-800/40 border border-slate-700/40 rounded-xl p-4 flex items-center gap-4 ${className}`}
      >
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-xs shrink-0`}
        >
          {testimonial.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-xs text-slate-300 italic line-clamp-2">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <p className="text-[10px] text-slate-500 mt-1">
            {testimonial.name} — {testimonial.role}
          </p>
        </div>
      </div>
    );
  }

  return (
    <div
      className={`bg-slate-800/40 border border-slate-700/40 rounded-xl p-5 ${
        variant === "featured" ? "ring-1 ring-teal-700/30" : ""
      } ${className}`}
    >
      <div className="flex items-start gap-4 mb-4">
        <div
          className={`w-10 h-10 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white font-bold text-sm shrink-0`}
        >
          {testimonial.initials}
        </div>
        <div className="flex-1 min-w-0">
          <p className="text-sm text-slate-300 italic leading-relaxed">
            &ldquo;{testimonial.quote}&rdquo;
          </p>
          <p className="text-xs text-slate-500 mt-2">
            {testimonial.name} — {testimonial.role}
          </p>
        </div>
      </div>

      {metrics.length > 0 && (
        <div className="flex items-center gap-4 pt-3 border-t border-slate-700/30">
          {metrics.map((m) => (
            <div key={m.label} className="flex-1 text-center">
              <p className="text-sm font-bold text-teal-400">{m.value}</p>
              <p className="text-[10px] text-slate-500 uppercase tracking-wider mt-0.5">
                {m.label}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
