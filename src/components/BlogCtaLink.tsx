"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackCtaClicked } from "@/lib/tracking";

// Client wrapper for the in-content blog CTAs (AIC-821). The blog post page is a
// server component, so its CTAs were plain <Link>s that emitted no `cta_clicked`
// event — the blog→/free and blog→/pricing intent leg was invisible in the funnel
// even though blog is our highest-traffic surface. This fires the canonical
// `cta_clicked` event (same shape the pricing/hero CTAs use) on click, tagged with
// the CTA location and the post slug for per-post attribution.
export default function BlogCtaLink({
  href,
  ctaText,
  ctaLocation,
  blogSlug,
  className,
  children,
}: {
  href: string;
  ctaText: string;
  ctaLocation: string;
  blogSlug?: string;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={href}
      className={className}
      onClick={() =>
        trackCtaClicked({
          cta_text: ctaText,
          cta_location: ctaLocation,
          destination: href,
          blog_slug: blogSlug,
        })
      }
    >
      {children}
    </Link>
  );
}
