import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_ROOT = path.join(process.cwd(), "src/content/blog");

// The default locale's posts live flat in `src/content/blog/*.mdx`; localized
// posts live in a per-locale subdirectory `src/content/blog/<locale>/*.mdx`
// (AIC-665). A localized flagship post is only published once its native
// reviewer flips `draft: false` and it is copied into that subdirectory.
const DEFAULT_LOCALE = "en";

// Drafts render in dev/preview so reviewers can proofread, but are excluded
// from production builds.
const INCLUDE_DRAFTS = process.env.NODE_ENV !== "production";

function blogDir(locale: string): string {
  return locale === DEFAULT_LOCALE ? BLOG_ROOT : path.join(BLOG_ROOT, locale);
}

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  keywords: string[];
  tldr?: string[];
  /**
   * Answer-first Q&A pairs. Rendered as a visible FAQ section and emitted as
   * FAQPage JSON-LD for GEO / rich results. CMO supplies copy per post.
   */
  faq?: { question: string; answer: string }[];
  pinned?: boolean;
  /** BCP-47 locale of the post; defaults to the site default locale. */
  locale?: string;
  /** When true, excluded from production. Used for pending native review. */
  draft?: boolean;
}

export interface Post extends PostFrontmatter {
  slug: string;
  readingTime: string;
  excerpt: string;
  content: string;
  lastModified: string;
}

function deriveExcerpt(content: string, fallback: string): string {
  return (
    content
      .replace(/#{1,6} .+\n/g, "")
      .replace(/\*\*|__|\*|_/g, "")
      .trim()
      .split("\n")
      .filter(
        (l) => l.trim().length > 0 && !l.trim().startsWith("import "),
      )[0]
      ?.slice(0, 160) ?? fallback
  );
}

function readPost(dir: string, filename: string, locale: string): Post {
  const slug = filename.replace(/\.mdx$/, "");
  const filePath = path.join(dir, filename);
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const stats = readingTime(content);
  const mtime = fs.statSync(filePath).mtime.toISOString().split("T")[0];

  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    keywords: fm.keywords ?? [],
    tldr: fm.tldr,
    faq: fm.faq,
    pinned: fm.pinned ?? false,
    locale: fm.locale ?? locale,
    draft: fm.draft ?? false,
    readingTime: stats.text,
    excerpt: deriveExcerpt(content, fm.description),
    content,
    lastModified: mtime,
  };
}

/** True when a post should be listed/rendered in the current environment. */
function isVisible(post: Pick<Post, "draft">): boolean {
  return INCLUDE_DRAFTS || !post.draft;
}

export function getAllPosts(
  locale: string = DEFAULT_LOCALE,
): Omit<Post, "content">[] {
  const dir = blogDir(locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => {
      // eslint-disable-next-line @typescript-eslint/no-unused-vars
      const { content, ...rest } = readPost(dir, filename, locale);
      return rest;
    })
    .filter(isVisible)
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.date < b.date ? 1 : -1;
    });
}

export function getPost(
  slug: string,
  locale: string = DEFAULT_LOCALE,
): Post | null {
  const dir = blogDir(locale);
  const filepath = path.join(dir, `${slug}.mdx`);
  if (!fs.existsSync(filepath)) return null;

  const post = readPost(dir, `${slug}.mdx`, locale);
  // Draft posts are not resolvable in production (returns 404 upstream).
  if (!isVisible(post)) return null;
  return post;
}

export function getAllSlugs(locale: string = DEFAULT_LOCALE): string[] {
  const dir = blogDir(locale);
  if (!fs.existsSync(dir)) return [];

  return fs
    .readdirSync(dir)
    .filter((f) => f.endsWith(".mdx"))
    .map((filename) => readPost(dir, filename, locale))
    .filter(isVisible)
    .map((post) => post.slug);
}
