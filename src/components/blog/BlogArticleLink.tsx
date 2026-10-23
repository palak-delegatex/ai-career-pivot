"use client";
import type { ComponentProps } from "react";
import { Link } from "@/i18n/navigation";
import { blogLinkInfo } from "@/lib/blog-links";
import { trackCtaClicked } from "@/lib/tracking";
export default function BlogArticleLink({ blogSlug, href = "", children, ...props }: ComponentProps<"a"> & { blogSlug: string }) {
  const info = blogLinkInfo(href);
  const onClick: ComponentProps<"a">["onClick"] = (event) => {
    props.onClick?.(event);
    if (!event.defaultPrevented && info.product) {
      trackCtaClicked({ cta_text: event.currentTarget.textContent?.trim() || href,
        cta_location: "blog_inline", destination: href, blog_slug: blogSlug });
    }
  };
  if (!info.internal || info.localized) return <a {...props} href={href} onClick={onClick}>{children}</a>;
  return <Link {...props} href={href} onClick={onClick}>{children}</Link>;
}
