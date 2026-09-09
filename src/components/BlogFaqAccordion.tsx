"use client";

import {
  Accordion,
  AccordionItem,
  AccordionTrigger,
  AccordionContent,
} from "@/components/ui/accordion";
import type { FaqItem } from "@/lib/blog";

/**
 * Accessible FAQ accordion for blog posts (AIC-1196, spec AIC-1195). Renders the
 * human-visible counterpart to the FAQPage JSON-LD so the schema and the page
 * mirror each other, and carries the `.blog-faq` class that the speakable
 * SpeakableSpecification (AIC-1192) points at.
 *
 * Uses the Radix-backed shadcn Accordion so keyboard nav (Enter/Space toggle,
 * arrow/Home/End move), focus rings, and ARIA (role=region, aria-expanded,
 * aria-controls) come for free. `type="multiple"` lets readers keep several
 * answers open at once (Tesler's Law); all items start collapsed (progressive
 * disclosure). Reduced-motion users get instant open/close via the gate in
 * globals.css.
 */
export default function BlogFaqAccordion({ items }: { items: FaqItem[] }) {
  return (
    <Accordion type="multiple" className="border-t border-slate-800">
      {items.map((item, i) => (
        <AccordionItem
          key={i}
          value={`faq-${i}`}
          className="border-b border-slate-800"
        >
          <AccordionTrigger className="text-base text-white">
            {item.question}
          </AccordionTrigger>
          <AccordionContent className="text-sm text-slate-300 leading-relaxed">
            {item.answer}
          </AccordionContent>
        </AccordionItem>
      ))}
    </Accordion>
  );
}
