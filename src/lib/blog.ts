import fs from "fs";
import path from "path";
import matter from "gray-matter";
import readingTime from "reading-time";

const BLOG_DIR = path.join(process.cwd(), "src/content/blog");

export interface PostFrontmatter {
  title: string;
  description: string;
  date: string;
  keywords: string[];
  tldr?: string[];
  pinned?: boolean;
}

export interface Post extends PostFrontmatter {
  slug: string;
  readingTime: string;
  excerpt: string;
  content: string;
  lastModified: string;
}

export function getAllPosts(): Omit<Post, "content">[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const filePath = path.join(BLOG_DIR, filename);
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

      return {
        slug,
        title: fm.title,
        description: fm.description,
        date: fm.date,
        keywords: fm.keywords ?? [],
        tldr: fm.tldr,
        pinned: fm.pinned ?? false,
        readingTime: stats.text,
        excerpt,
        lastModified: mtime,
      };
    })
    .sort((a, b) => {
      if (a.pinned && !b.pinned) return -1;
      if (!a.pinned && b.pinned) return 1;
      return a.date < b.date ? 1 : -1;
    });
}

export function getPost(slug: string): Post | null {
  const filepath = path.join(BLOG_DIR, `${slug}.mdx`);
  if (!fs.existsSync(filepath)) return null;

  const raw = fs.readFileSync(filepath, "utf8");
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

  const mtime = fs.statSync(filepath).mtime.toISOString().split("T")[0];

  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    keywords: fm.keywords ?? [],
    tldr: fm.tldr,
    readingTime: stats.text,
    excerpt,
    content,
    lastModified: mtime,
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
