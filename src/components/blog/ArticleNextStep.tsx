import { getTranslations } from "next-intl/server";
import BlogCtaLink from "@/components/BlogCtaLink";
import { articleNextSteps, blogOffers } from "@/lib/blog-next-steps";

export default async function ArticleNextStep({ slug, placement }: {
  slug: string; placement: "after_takeaways" | "article_end";
}) {
  const intent = articleNextSteps[slug];
  if (!intent) return null;
  const t = await getTranslations("blog.nextStep");
  const id = `next-step-${placement}`;
  return (
    <aside aria-labelledby={id} className="my-8 rounded-xl border border-teal-800 bg-teal-950/40 p-5 not-prose">
      <h2 id={id} className="text-lg font-semibold text-white">{t(`${intent}.heading`)}</h2>
      <p className="mt-2 text-sm leading-relaxed text-slate-300">{t(`${intent}.description`)}</p>
      <BlogCtaLink href={blogOffers[intent].destination} ctaText={t(`${intent}.label`)}
        ctaLocation={`blog_${placement}`} blogSlug={slug} trackImpression
        className="mt-3 inline-flex min-h-[44px] max-w-full items-center rounded-lg bg-teal-400 px-4 py-3 font-semibold text-slate-950 hover:bg-teal-300 focus-visible:outline-2 focus-visible:outline-offset-4 focus-visible:outline-teal-300">
        {t(`${intent}.label`)}
      </BlogCtaLink>
    </aside>
  );
}
