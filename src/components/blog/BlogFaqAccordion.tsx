"use client";

// FAQ accordion (AIC-1194, design AIC-1193). Replaces the flat, non-interactive
// FAQ rendering with an accessible Radix-backed accordion. Humans see the same
// Q&A the FAQPage JSON-LD (server-side in page.tsx) exposes.
//
// The `.faq-accordion` class is a stable contract with AIC-1192 Speakable
// JSON-LD (targeted by cssSelector) — do NOT rename it or move it off the
// outermost <section>. Keyboard nav, aria-expanded/controls, and
// prefers-reduced-motion are handled natively by @radix-ui/react-accordion.

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/blog";

interface BlogFaqAccordionProps {
  items: FaqItem[]; // post.faq array
  heading?: string; // i18n override
}

export default function BlogFaqAccordion({
  items,
  heading = "Frequently Asked Questions",
}: BlogFaqAccordionProps) {
  if (!items || items.length === 0) return null;

  return (
    <section className="faq-accordion mt-14 not-prose" aria-labelledby="faq-heading">
      <h2 id="faq-heading" className="text-2xl font-bold tracking-tight mb-6 text-white">
        {heading}
      </h2>
      <Accordion type="multiple" className="border-t border-slate-700">
        {items.map((item, i) => (
          <AccordionItem key={i} value={`faq-${i}`}>
            <AccordionTrigger className="text-base py-5">{item.question}</AccordionTrigger>
            <AccordionContent className="text-slate-300">{item.answer}</AccordionContent>
          </AccordionItem>
        ))}
      </Accordion>
    </section>
  );
}
