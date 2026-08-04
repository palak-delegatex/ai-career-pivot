"use client";

import { useCallback, useState } from "react";
import { trackContentShareClicked, type ShareChannel } from "@/lib/tracking";

/**
 * Blog / content share CTA (AIC-909). The blog post page is a server component,
 * so it had no share UI at all and the content→share leg of the AIC-439 viral
 * loop was invisible. This client component renders LinkedIn / X / copy buttons
 * that share the post URL (UTM-tagged so the inbound visitor's $pageview
 * attributes back to the share channel) and fires the `content_share_clicked`
 * event so the CMO can measure the loop. Mirrors ShareResultButtons.
 */
export default function BlogShareButtons({
  slug,
  title,
}: {
  slug: string;
  title: string;
}) {
  const [copied, setCopied] = useState(false);

  const shareUrl = useCallback(
    (utmSource: string) => {
      const origin =
        typeof window !== "undefined" ? window.location.origin : "https://ai-career-pivot.com";
      const url = new URL(`${origin}/blog/${slug}`);
      url.searchParams.set("utm_source", utmSource);
      url.searchParams.set("utm_medium", "social");
      url.searchParams.set("utm_campaign", "content_share");
      return url.toString();
    },
    [slug],
  );

  const onShare = useCallback(
    (channel: Exclude<ShareChannel, "native" | "other">) => {
      trackContentShareClicked({ share_channel: channel, content_slug: slug, page: "blog" });

      if (channel === "copy_link") {
        navigator.clipboard?.writeText(shareUrl("copy")).then(() => {
          setCopied(true);
          setTimeout(() => setCopied(false), 2000);
        });
        return;
      }

      const utmSource = channel === "x" ? "twitter" : "linkedin";
      const link = shareUrl(utmSource);
      const intent =
        channel === "linkedin"
          ? `https://www.linkedin.com/sharing/share-offsite/?url=${encodeURIComponent(link)}`
          : `https://twitter.com/intent/tweet?text=${encodeURIComponent(title)}&url=${encodeURIComponent(link)}`;
      window.open(intent, "_blank", "noopener,noreferrer,width=600,height=600");
    },
    [slug, title, shareUrl],
  );

  const base =
    "inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-semibold transition-colors";

  return (
    <div className="flex flex-wrap items-center gap-3 not-prose mt-12 pt-8 border-t border-slate-800">
      <span className="text-slate-400 text-sm">Found this useful? Share it:</span>
      <button
        onClick={() => onShare("linkedin")}
        className={`${base} bg-[#0a66c2] hover:bg-[#0955a5] text-white`}
        aria-label="Share on LinkedIn"
      >
        in LinkedIn
      </button>
      <button
        onClick={() => onShare("x")}
        className={`${base} bg-black hover:bg-slate-800 text-white`}
        aria-label="Share on X"
      >
        𝕏 Post
      </button>
      <button
        onClick={() => onShare("copy_link")}
        className={`${base} bg-slate-700 hover:bg-slate-600 text-white`}
        aria-label="Copy share link"
      >
        {copied ? "✓ Copied" : "Copy link"}
      </button>
    </div>
  );
}
