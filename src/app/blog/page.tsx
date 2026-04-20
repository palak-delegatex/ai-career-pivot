import type { Metadata } from "next";
import Link from "next/link";
import { getAllPosts } from "@/lib/blog";
import SiteNav from "@/components/SiteNav";

export const metadata: Metadata = {
  title: "Blog — Career Pivot Guides & Resources",
  description:
    "Actionable guides for professionals ready to change careers. Real frameworks for career pivots, industry switches, and navigating change with a family.",
  alternates: {
    canonical: "https://ai-career-pivot.com/blog",
  },
  openGraph: {
    url: "https://ai-career-pivot.com/blog",
    title: "Blog — Career Pivot Guides & Resources",
    description:
      "Actionable guides for professionals ready to change careers.",
  },
};

export default function BlogIndex() {
  const posts = getAllPosts();

  return (
    <div className="min-h-screen bg-gray-950 text-white">
      <SiteNav />
      <main className="py-16 px-6">
      <div className="max-w-3xl mx-auto">
        <h1 className="text-4xl font-extrabold mb-3 tracking-tight">
          Career Pivot Blog
        </h1>
        <p className="text-slate-400 text-lg mb-12">
          Practical guides for professionals navigating career transitions.
        </p>

        <div className="flex flex-col gap-10">
          {posts.map((post) => (
            <article key={post.slug} className="border-b border-slate-800 pb-10">
              <time className="text-sm text-slate-500">
                {new Date(post.date).toLocaleDateString("en-US", {
                  year: "numeric",
                  month: "long",
                  day: "numeric",
                })}
                {" · "}
                {post.readingTime}
              </time>
              <h2 className="text-2xl font-bold mt-2 mb-3">
                <Link
                  href={`/blog/${post.slug}`}
                  className="hover:text-teal-400 transition-colors"
                >
                  {post.title}
                </Link>
              </h2>
              <p className="text-slate-400 leading-relaxed mb-4">
                {post.excerpt}
              </p>
              <Link
                href={`/blog/${post.slug}`}
                className="text-teal-400 font-medium hover:text-teal-300 transition-colors"
              >
                Read article →
              </Link>
            </article>
          ))}
        </div>
      </div>
      </main>
    </div>
  );
}
