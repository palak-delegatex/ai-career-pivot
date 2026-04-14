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
}

export interface Post extends PostFrontmatter {
  slug: string;
  readingTime: string;
  excerpt: string;
  content: string;
}

export function getAllPosts(): Omit<Post, "content">[] {
  const files = fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"));

  return files
    .map((filename) => {
      const slug = filename.replace(/\.mdx$/, "");
      const raw = fs.readFileSync(path.join(BLOG_DIR, filename), "utf8");
      const { data, content } = matter(raw);
      const fm = data as PostFrontmatter;
      const stats = readingTime(content);
      const excerpt =
        content
          .replace(/#{1,6} .+\n/g, "")
          .replace(/\*\*|__|\*|_/g, "")
          .trim()
          .split("\n")
          .filter((l) => l.trim().length > 0)[0]
          ?.slice(0, 160) ?? fm.description;

      return {
        slug,
        title: fm.title,
        description: fm.description,
        date: fm.date,
        keywords: fm.keywords ?? [],
        readingTime: stats.text,
        excerpt,
      };
    })
    .sort((a, b) => (a.date < b.date ? 1 : -1));
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
      .filter((l) => l.trim().length > 0)[0]
      ?.slice(0, 160) ?? fm.description;

  return {
    slug,
    title: fm.title,
    description: fm.description,
    date: fm.date,
    keywords: fm.keywords ?? [],
    readingTime: stats.text,
    excerpt,
    content,
  };
}

export function getAllSlugs(): string[] {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((f) => f.endsWith(".mdx"))
    .map((f) => f.replace(/\.mdx$/, ""));
}
