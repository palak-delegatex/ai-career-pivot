import type { CaseStudy } from "@/lib/testimonials";

/**
 * HeroTestimonial (AIC-753)
 *
 * Featured case-study testimonial placed below the hero CTA. Answers
 * "will this work for me?" at the moment of highest intent with a concrete
 * role transition + timeline + comp metric. Data comes from a CaseStudy
 * (testimonials.ts) so the quote stays consistent with the rest of the site.
 */
export default function HeroTestimonial({ testimonial }: { testimonial: CaseStudy }) {
  return (
    <div className="max-w-md mx-auto text-left rounded-xl bg-slate-900/60 border border-slate-800 backdrop-blur-sm px-5 py-4">
      <blockquote className="text-sm text-slate-400 italic leading-relaxed mb-2.5">
        &ldquo;{testimonial.quote}&rdquo;
      </blockquote>
      <div className="flex items-center gap-2.5 pt-2.5 border-t border-slate-800/60">
        <div
          className={`w-8 h-8 rounded-full bg-gradient-to-br ${testimonial.gradient} flex items-center justify-center text-white text-[11px] font-bold shrink-0`}
        >
          {testimonial.initials}
        </div>
        <div className="min-w-0">
          <div className="text-sm font-semibold text-white">{testimonial.name}</div>
          <div className="flex flex-wrap items-center gap-x-2 gap-y-1 mt-0.5">
            <span className="text-[11px] px-2 py-0.5 rounded-md bg-slate-900/80 border border-slate-800 text-slate-500">
              {testimonial.role}
            </span>
            <span className="text-[11px] text-teal-400">{testimonial.timeline}</span>
            <span className="text-[11px] font-semibold text-emerald-400">{testimonial.keyMetric}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
