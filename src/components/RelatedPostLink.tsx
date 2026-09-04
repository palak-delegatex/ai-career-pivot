"use client";

import Link from "next/link";
import type { ReactNode } from "react";
import { trackRelatedPostClicked } from "@/lib/tracking";

// Thin client wrapper for a related-posts card (AIC-1164). RelatedPosts is a
// server component, so — mirroring BlogCtaLink — this is the only client leaf:
// it fires the `related_post_clicked` event on click for pages/session
// attribution, then behaves as a normal <Link>. The whole card is the click
// target (Fitts's Law); the card markup is passed as `children` from the server.
export default function RelatedPostLink({
  slug,
  sourceSlug,
  position,
  className,
  children,
}: {
  slug: string;
  sourceSlug: string;
  position: number;
  className?: string;
  children: ReactNode;
}) {
  return (
    <Link
      href={`/blog/${slug}`}
      className={className}
      onClick={() =>
        trackRelatedPostClicked({
          source_slug: sourceSlug,
          target_slug: slug,
          position,
        })
      }
    >
      {children}
    </Link>
  );
}
