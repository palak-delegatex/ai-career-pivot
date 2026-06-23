import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";
import { defaultLocale, locales, type Locale } from "@/i18n/config";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  keywords: string[];
  tldr?: string[];
}

export interface Post extends PostFrontmatter {
  slug: string;
  readingTime: string;
  excerpt: string;
  content: string;
  lastModified: string;
}

function blogFilePath(slug: string, locale: Locale = defaultLocale): string {
  if (locale === defaultLocale) return path.join(BLOG_DIR, `${slug}.mdx`);
  return path.join(BLOG_DIR, locale, `${slug}.mdx`);
}

function parsePost(
  slug: string,
  filePath: string,
  includeContent: true,
): Post;
function parsePost(
  slug: string,
  filePath: string,
  includeContent: false,
): Omit<Post, "content">;
function parsePost(
  slug: string,
  filePath: string,
  includeContent: boolean,
): Post | Omit<Post, "content"> {
  const raw = fs.readFileSync(filePath, "utf8");
  const { data, content } = matter(raw);
  const fm = data as PostFrontmatter;
  const stats = readingTime(content);
  const excerpt =
    content
      .replace(/#{1,6} .+\n/g, "")
      .replace(/\*\*|__|\*|_/g, "")
      .trim()
      .split("\n")
      .filter((l) => l.trim().length > 0 && !l.trim().startsWith("import "))[0]
      ?.slice(0, 160) ?? fm.description;

  const mtime = fs.statSync(filePath).mtime.toISOString().split("T")[0];

  const base = {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    keywords: fm.keywords ?? [],
    tldr: fm.tldr,
    readingTime: stats.text,
    excerpt,
    lastModified: mtime,
  };

  if (includeContent) return { ...base, content };
  return base;
}

export function getAllPosts(locale: Locale = defaultLocale): Omit<Post, "content">[] {
  const dir = locale === defaultLocale ? BLOG_DIR : path.join(BLOG_DIR, locale);

  if (!fs.existsSync(dir)) {
    if (locale === defaultLocale) return [];
    return getAllPosts(defaultLocale);
  }

  const files = fs.readdirSync(dir).filter((f) => f.endsWith(".mdx"));

  if (files.length === 0 && locale !== defaultLocale) {
    return getAllPosts(defaultLocale);
  }

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      return parsePost(slug, path.join(dir, filename), false);
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
}

export function getPost(slug: string, locale: Locale = defaultLocale): Post | null {
  const fp = blogFilePath(slug, locale);
  if (fs.existsSync(fp)) return parsePost(slug, fp, true);

  if (locale !== defaultLocale) {
    const enFp = blogFilePath(slug, defaultLocale);
    if (fs.existsSync(enFp)) return parsePost(slug, enFp, true);
  }

  return null;
}

export function getAvailableLocales(slug: string): Locale[] {
  return locales.filter((locale) => fs.existsSync(blogFilePath(slug, locale)));
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
