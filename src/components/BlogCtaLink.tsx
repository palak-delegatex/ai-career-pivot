"use client";

import { Link } from "@/i18n/navigation";
import { useEffect, useRef } from "react";
import type { ReactNode } from "react";
import { trackCtaClicked, trackBlogCtaViewed } from "@/lib/tracking";

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
  trackImpression = false,
}: {
  href: string;
  ctaText: string;
  ctaLocation: string;
  blogSlug?: string;
  className?: string;
  children: ReactNode;
  trackImpression?: boolean;
}) {
  const ref = useRef<HTMLAnchorElement>(null);
  const viewed = useRef(new Set<string>());
  useEffect(() => {
    if (!trackImpression || !ref.current || typeof IntersectionObserver === "undefined") return;
    const key = JSON.stringify([blogSlug, ctaLocation, href]);
    if (viewed.current.has(key)) return;
    const observer = new IntersectionObserver((entries) => {
      if (viewed.current.has(key) || !entries.some((entry) => entry.isIntersecting && entry.intersectionRatio >= 0.5)) return;
      viewed.current.add(key);
      trackBlogCtaViewed({ cta_location: ctaLocation, destination: href, blog_slug: blogSlug });
      observer.disconnect();
    }, { threshold: 0.5 });
    observer.observe(ref.current);
    return () => observer.disconnect();
  }, [trackImpression, ctaLocation, href, blogSlug]);
  return (
    <Link
      ref={ref}
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
