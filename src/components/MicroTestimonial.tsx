import type { Testimonial } from "@/lib/testimonials";

/**
 * MicroTestimonial (AIC-844 / design AIC-840)
 *
 * Compact single-quote proof for placement directly at a decision point
 * (checkout, free-tool upgrade CTA). Social proof at the exact moment of
 * highest intent — a real member outcome in the buyer's own shoes, kept small
 * so it reinforces the CTA without competing with it. Sources from the shared
 * `testimonials` list so quotes never drift from the success-stories page.
 */
export default function MicroTestimonial({
  testimonial,
  className = "",
}: {
  testimonial: Testimonial;
  className?: string;
}) {
  return (
    <figure
      className={`flex items-start gap-2.5 rounded-lg border border-slate-700/50 bg-slate-800/40 p-3 text-left ${className}`}
    >
      <div
        className={`flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-gradient-to-br ${testimonial.gradient} text-[10px] font-bold text-white`}
        aria-hidden="true"
      >
        {testimonial.initials}
      </div>
      <blockquote className="min-w-0">
        <p className="text-xs leading-snug text-slate-300">
          &ldquo;{testimonial.quote}&rdquo;
        </p>
        <figcaption className="mt-1 text-[11px] text-slate-500">
          <span className="font-semibold text-slate-400">
            {testimonial.name}
          </span>{" "}
          · {testimonial.role}
        </figcaption>
      </blockquote>
    </figure>
  );
}
