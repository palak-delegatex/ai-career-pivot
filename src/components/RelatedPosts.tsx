import { getTranslations } from "next-intl/server";
import { getRelatedPosts } from "@/lib/blog-topics";
import RelatedPostLink from "@/components/RelatedPostLink";

// End-of-article "Keep reading" module (AIC-1164). Server component: it computes
// topically-related posts at build time (SSG) via getRelatedPosts — shared-topic
// score, then shared-keyword tiebreak, with a recency fallback so it is never
// empty (see src/lib/blog-topics.ts). This is the internal-linking / reader-depth
// lever (organic-traffic, NOT the frozen funnel): every one of the 113 posts
// gains 4 descriptive, keyword-rich inbound links to its topical neighbours.
//
// Rendered after BlogShareButtons and before the FAQ on the post page. Each card
// is a full-area RelatedPostLink (client leaf) that fires related_post_clicked.
export default async function RelatedPosts({ slug }: { slug: string }) {
  const related = getRelatedPosts(slug, 4);
  if (related.length === 0) return null;

  const t = await getTranslations("blog");

  return (
    <section className="mt-14 not-prose">
      <h2 className="text-2xl font-bold tracking-tight mb-6">
        {t("post.keepReading")}
      </h2>
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {related.map((post, i) => (
          <RelatedPostLink
            key={post.slug}
            slug={post.slug}
            sourceSlug={slug}
            position={i + 1}
            className="group flex flex-col h-full rounded-xl border border-slate-800 bg-slate-900/60 p-5 transition-colors hover:border-teal-500/40 hover:bg-slate-900"
          >
            <span className="text-xs font-semibold uppercase tracking-widest text-teal-400 mb-2">
              {post.topicLabel}
            </span>
            <h3 className="text-base font-semibold text-white leading-snug transition-colors group-hover:text-teal-400 line-clamp-2">
              {post.title}
            </h3>
            <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-2">
              {post.excerpt}
            </p>
            <span className="mt-4 text-xs text-slate-500">
              {post.readingTime}
            </span>
          </RelatedPostLink>
        ))}
      </div>
    </section>
  );
}
