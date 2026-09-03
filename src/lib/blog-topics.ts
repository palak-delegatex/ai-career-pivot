import { getAllPosts, type Post } from "@/lib/blog";

type PostMeta = Omit<Post, "content">;

/**
 * Topic-cluster taxonomy for the blog (AIC-1160).
 *
 * Why pattern-based instead of a `tags:` frontmatter field: only ~9 of the 113
 * published posts carry tags, and the GEO blog cadence (AIC-915) adds posts
 * daily without them. Classifying by slug/title/keyword patterns means every
 * new post is auto-assigned to a cluster the moment it lands — no manual
 * curation, no drift, no per-post frontmatter chore. This is the internal-
 * linking / hub-spoke lever: it powers both the end-of-post "Related posts"
 * module and the /blog/topics hub, turning 113 orphan pages into a linked graph
 * for crawlers and readers (organic-traffic lever, NOT the frozen funnel).
 */
export interface Topic {
  /** URL-safe cluster id (used as the /blog/topics#<id> anchor). */
  id: string;
  /** Human label shown on the hub and in the related-posts heading. */
  label: string;
  /** One-line descriptive blurb — also used as the hub section intro. */
  description: string;
  /**
   * Lowercased substrings matched against a post's slug, title, and keywords.
   * A post joins the topic if ANY pattern hits. Order the topics array from
   * most specific to most general so `primaryTopic` picks the best fit.
   */
  patterns: string[];
}

/**
 * Ordered most-specific → most-general. `primaryTopic()` returns the first
 * topic a post matches, so keep narrow clusters (interviews, salary) above
 * broad ones (job-market, career-change) to avoid a broad cluster swallowing a
 * post that has a sharper home.
 */
export const TOPICS: Topic[] = [
  {
    id: "pivot-by-profession",
    label: "Career Pivots by Profession",
    description:
      "Step-by-step guides for moving into AI from a specific field — finance, teaching, marketing, healthcare, law, and 25+ more.",
    patterns: ["how-to-pivot-from-"],
  },
  {
    id: "interviews",
    label: "AI Job Interviews",
    description:
      "How to prepare for, answer, and pass interviews for AI roles — including AI-conducted interviews and the \"how do you use AI?\" question.",
    patterns: [
      "interview",
      "how-do-you-use-ai",
      "what-hiring-managers-look-for",
    ],
  },
  {
    id: "resume-ats",
    label: "Resumes, ATS & Job Descriptions",
    description:
      "Writing a resume that lands AI-role interviews, beating AI resume screeners, and decoding AI job descriptions.",
    patterns: [
      "resume",
      "ats",
      "resume-screener",
      "read-ai-job-description",
      "spot-ai-job-scams",
    ],
  },
  {
    id: "salary-negotiation",
    label: "Salary & Negotiation",
    description:
      "What AI-adjacent roles actually pay, whether the pivot is worth it, and how to negotiate your first AI offer.",
    patterns: ["salary", "worth-it", "negotiate", "offer"],
  },
  {
    id: "networking-job-search",
    label: "Networking & Landing the Job",
    description:
      "LinkedIn, referrals, remote roles, internal transfers, and networking your way into AI jobs — with or without a tech background.",
    patterns: [
      "network",
      "linkedin",
      "referred",
      "remote-ai-jobs",
      "internal-transfer",
      "job-at-an-ai-startup",
    ],
  },
  {
    id: "skills-learning",
    label: "AI Skills & Learning",
    description:
      "The AI skills employers pay for, how to become AI-fluent, whether you need to code, and how to prove your skills without a degree.",
    patterns: [
      "ai-skills",
      "ai-fluent",
      "learn-ai",
      "need-to-code",
      "you-dont-need-to-code",
      "prompt-engineering",
      "prove-ai-skills",
      "ai-portfolio",
      "leverage-domain-expertise",
      "use-ai-tools-to-accelerate",
      "use-ai-to-plan",
      "can-chatgpt-help",
    ],
  },
  {
    id: "certifications",
    label: "Certifications & Bootcamps",
    description:
      "Whether AI certifications and bootcamps are worth it for career-changers — and which ones actually matter.",
    patterns: ["certification", "bootcamp"],
  },
  {
    id: "roles-explained",
    label: "AI Roles Explained",
    description:
      "What AI product managers, enablement managers, and engineers actually do — plus which AI-adjacent role fits your background.",
    patterns: [
      "what-does-an-ai",
      "ai-product-management",
      "engineer-vs",
      "ai-job-titles",
      "ai-adjacent-role",
      "which-ai-roles",
      "ai-governance",
      "roles-are-the-smartest",
    ],
  },
  {
    id: "job-security-automation",
    label: "Job Security & Automation",
    description:
      "Navigating AI anxiety — which jobs are safe, what to do if your role is being automated, and working alongside AI agents.",
    patterns: [
      "safe-from-ai",
      "take-your-job",
      "taking-your-job",
      "being-automated",
      "replacing-your-job",
      "agents-do-entry-level",
      "agents-are-your-new-coworkers",
      "fobo",
      "reskilling-gap",
      "two-track-economy",
      "changing-jobs-faster",
      "career-paradox",
    ],
  },
  {
    id: "market-trends",
    label: "AI Job Market & Trends",
    description:
      "Where the AI hiring market is heading in 2026 — reports, industry breakdowns, and which roles are hiring most.",
    patterns: [
      "job-market",
      "hiring-2026",
      "hiring-most",
      "careers-by-industry",
      "more-jobs-higher-bar",
      "companies-are-hiring",
      "coaching-tools",
      "career-tools-vs-career-coach",
    ],
  },
  {
    id: "getting-started",
    label: "Getting Started with an AI Pivot",
    description:
      "First steps for anyone considering the jump — no experience, timelines, whether it's too late, and pivoting without quitting.",
    patterns: [
      "no-experience",
      "how-long-does-it-take",
      "too-late",
      "without-quitting",
      "transition-into-ai",
      "90-day-plan",
      "break-into-ai",
      "explain-career-gap",
      "over-40-career-changer",
      "get-an-ai-job-over-40",
    ],
  },
  {
    id: "career-change-fundamentals",
    label: "Career-Change Fundamentals",
    description:
      "The timeless mechanics of changing careers — transferable skills, doing it with a family or mid-career, and beating the anxiety.",
    patterns: [
      "career-change",
      "change-careers",
      "transferable-skills",
      "best-careers-to-pivot",
      "signs-you-need",
      "mid-career-crisis",
      "career-change-anxiety",
      "6-month-career-pivot",
      "tech-to-leadership",
      "boss-told-you-to-learn-ai",
    ],
  },
];

/**
 * Haystack for pattern matching = lowercased slug + title only. We deliberately
 * exclude `keywords`: they're broad SEO phrases ("resume", "ai skills") that
 * leak a post into three unrelated clusters. Slugs here are long and
 * descriptive ("how-to-pivot-from-finance-to-ai-2026"), so slug+title gives a
 * clean, predictable single home. Keyword overlap is still used — but only as
 * the related-posts tiebreak in getRelatedPosts, not for cluster membership.
 */
function haystack(post: PostMeta): string {
  return `${post.slug} ${post.title}`.toLowerCase();
}

/** All topics a post matches (may be empty; usually 1–2). */
export function topicsForPost(post: PostMeta): Topic[] {
  const hay = haystack(post);
  return TOPICS.filter((t) => t.patterns.some((p) => hay.includes(p)));
}

/**
 * The single best-fit topic for a post — the first matched topic in TOPICS
 * order (most-specific first). Falls back to the general getting-started
 * cluster so every post has a home on the hub. Never returns undefined.
 */
export function primaryTopic(post: PostMeta): Topic {
  return topicsForPost(post)[0] ?? TOPICS.find((t) => t.id === "getting-started")!;
}

export interface RelatedPost {
  slug: string;
  title: string;
  excerpt: string;
  readingTime: string;
  /** Label of the topic that connected this post — used as anchor context. */
  topicLabel: string;
}

/**
 * Related posts for the end-of-article module. Scores every other post by
 * shared-topic count (strong signal) then shared-keyword count (tiebreak), and
 * falls back to most-recent posts when a thin post has too few topical
 * neighbours — so the module is never empty. `limit` defaults to 4.
 */
export function getRelatedPosts(slug: string, limit = 4): RelatedPost[] {
  const posts = getAllPosts();
  const current = posts.find((p) => p.slug === slug);
  if (!current) return [];

  const currentTopics = new Set(topicsForPost(current).map((t) => t.id));
  const currentKeywords = new Set(
    (current.keywords ?? []).map((k) => k.toLowerCase()),
  );

  const scored = posts
    .filter((p) => p.slug !== slug)
    .map((p) => {
      const topics = topicsForPost(p);
      const sharedTopics = topics.filter((t) => currentTopics.has(t.id));
      const sharedKeywords = (p.keywords ?? []).filter((k) =>
        currentKeywords.has(k.toLowerCase()),
      ).length;
      return {
        post: p,
        topics,
        sharedTopicCount: sharedTopics.length,
        sharedKeywords,
        score: sharedTopics.length * 10 + sharedKeywords,
      };
    })
    .sort((a, b) => {
      if (b.score !== a.score) return b.score - a.score;
      // Tiebreak on recency (newer first).
      return a.post.date < b.post.date ? 1 : -1;
    });

  return scored.slice(0, limit).map((s) => {
    // Prefer a topic the current post shares; otherwise the candidate's own
    // primary topic — this is the anchor context the module surfaces.
    const shared = s.topics.find((t) => currentTopics.has(t.id));
    const topicLabel = (shared ?? primaryTopic(s.post)).label;
    return {
      slug: s.post.slug,
      title: s.post.title,
      excerpt: s.post.excerpt,
      readingTime: s.post.readingTime,
      topicLabel,
    };
  });
}

export interface TopicCluster extends Topic {
  posts: {
    slug: string;
    title: string;
    excerpt: string;
    date: string;
    readingTime: string;
  }[];
}

/**
 * Every topic with its member posts, for the /blog/topics hub. Each post is
 * assigned to its PRIMARY topic only (no duplication across sections), so the
 * hub is a clean partition of all 113 posts. Empty topics are dropped; posts
 * within a topic are newest-first; topics are ordered by size (largest first)
 * so the hub leads with the deepest clusters.
 */
export function getClustersWithPosts(): TopicCluster[] {
  const posts = getAllPosts();
  const byTopic = new Map<string, TopicCluster["posts"]>();
  for (const t of TOPICS) byTopic.set(t.id, []);

  for (const post of posts) {
    const topic = primaryTopic(post);
    byTopic.get(topic.id)!.push({
      slug: post.slug,
      title: post.title,
      excerpt: post.excerpt,
      date: post.date,
      readingTime: post.readingTime,
    });
  }

  return TOPICS.map((t) => ({
    ...t,
    posts: (byTopic.get(t.id) ?? []).sort((a, b) =>
      a.date < b.date ? 1 : -1,
    ),
  }))
    .filter((c) => c.posts.length > 0)
    .sort((a, b) => b.posts.length - a.posts.length);
}
