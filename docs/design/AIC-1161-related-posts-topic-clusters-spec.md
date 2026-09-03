# AIC-1161/1166: Related Posts Module + Topic-Cluster Hub UX

Build-ready design spec for CTO handoff. Scope: reader-depth and organic reach for the 114-post blog. Does NOT touch the pre-auth landing-to-first-action funnel (frozen per AIC-1124).

---

## v2 Design Review (AIC-1166, 2026-09-03)

CTO shipped the functional version (AIC-1164). This section documents the design review of what was built, notes where the implementation diverged from v1 spec (all approved), and lists two minor refinements.

### Implementation vs. v1 spec — divergences (all approved)

| Spec v1 | CTO built | Design verdict |
|---|---|---|
| 7 topic clusters | 12 clusters (more granular) | **Approved.** Better classification precision; 12 is still scannable with horizontal pill nav. |
| `topic` frontmatter field, manual backfill | Pattern-based auto-classification via slug/title | **Approved.** Zero curation overhead; scales with daily GEO cadence (AIC-915). |
| 3 related posts, 3-col desktop grid | 4 related posts, 2×2 grid (`sm:grid-cols-2`) | **Approved.** 2×2 is more balanced at `max-w-2xl` (~672px); avoids tight 3-col (cards would be ~207px). |
| Restructure `/blog` with topic sections + filter bar | Separate `/blog/topics` hub + "Browse by topic" link on `/blog` | **Approved.** Lower risk; keeps flat chronological index intact; dedicated hub URL is a cleaner crawl target. |
| Client `TopicFilterBar` with `useState` + `scrollIntoView` | Zero-JS `<a href="#topic-{id}">` anchor nav | **Approved.** Server-rendered, no client bundle, fully crawlable. |
| `?topic={slug}` filtered view | All posts shown per cluster (no truncation) | **Approved for v1.** Better for SEO (all internal links visible). Can add progressive disclosure later if UX data shows the longest cluster (~33 posts) causes scan fatigue. |
| `card-glow` hover on related-post cards | Subtle `hover:border-teal-500/40 hover:bg-slate-900` | **Approved.** `card-glow` would be too loud for 4 adjacent cards; subtle border shift is appropriate. |

### UX assessment — approved elements

**RelatedPosts module:**
- Placement after `BlogShareButtons`, before FAQ ✓ (Peak-End Rule — captures completion momentum)
- Full-area `<Link>` click target ✓ (Fitts's Law)
- Topic label as teal uppercase metadata badge ✓ (clear hierarchy: metadata → title → description → reading time)
- `line-clamp-2` on title and excerpt ✓ (consistent card heights)
- `related_post_clicked` event with source_slug, target_slug, position ✓
- "Keep reading" heading matches FAQ heading styling ✓ (system consistency)
- Server component with thin client leaf (`RelatedPostLink`) ✓ (minimal JS)

**Topics hub (`/blog/topics`):**
- Breadcrumb back-link to `/blog` ✓
- Anchor nav pills with post counts ✓ (Social Proof / volume signal)
- `flex-wrap gap-2` naturally adapts across viewports ✓
- `scroll-mt-20` accounts for fixed header ✓
- CollectionPage + ItemList JSON-LD structured data ✓
- Posts newest-first within each cluster ✓
- Section separators with `border-b border-slate-800` ✓

### Refinement 1: Related-post card vertical alignment

**Issue:** Reading time (`text-xs text-slate-500 mt-4`) in each card won't align across cards in the same row when excerpts wrap differently — even with `line-clamp-2`, text wrapping varies by title/excerpt length.

**Lens:** Gestalt Similarity — elements at the same level in a grid should align on a shared baseline for visual coherence.

**Fix:** Add `flex-1` to the excerpt `<p>` so it expands to fill available space, pushing reading time to the card bottom consistently.

```
// In RelatedPosts.tsx, change the excerpt <p>:
- <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-2">
+ <p className="mt-2 text-sm text-slate-400 leading-relaxed line-clamp-2 flex-1">
```

### Refinement 2: Topics hub — add 1-line post excerpts

**Issue:** Each post entry on `/blog/topics` shows only title + reading time. For a discovery-oriented hub, the title alone may not provide enough information scent to help a user decide whether to click — especially for less descriptive titles.

**Lens:** Information Scent — users follow scent trails; a brief excerpt gives them enough context to evaluate relevance without committing to a full page load.

**Fix:** Add a `line-clamp-1` excerpt below each post title on the hub.

```
// In blog/topics/page.tsx, within each <li>:
  <span className="text-lg font-semibold text-white group-hover:text-teal-400 transition-colors">
    {post.title}
  </span>
+ <span className="block text-sm text-slate-400 line-clamp-1 mt-0.5">
+   {post.excerpt}
+ </span>
  <span className="block text-sm text-slate-500 mt-1">
    {post.readingTime}
  </span>
```

This requires adding `excerpt` to the `TopicCluster.posts` type in `blog-topics.ts` (it's already available from `getAllPosts()`).

### Deferred (not blocking ship)

- **Sticky anchor nav on hub:** spec recommended it, CTO shipped non-sticky. Acceptable for v1. Revisit if analytics show low nav usage on the long page.
- **Progressive disclosure for large clusters:** the 33-post `pivot-by-profession` cluster is long. Can add "Show more" expansion later if scan fatigue is observed.
- **Topic badge using `Badge` component:** spec suggested `Badge variant="outline"`. CTO used inline `<span>` with matching styling. Functionally equivalent; saves a component import.

---

## 1. Topic Clusters (shared data model)

Both the related-posts module and the blog index hub depend on a shared topic taxonomy. Today the blog has zero formal categorization — `keywords[]` is free-form SEO text, not a controlled vocabulary.

### 1.1 Taxonomy: 7 topic clusters

| Slug | Label | Description | ~Post count |
|---|---|---|---|
| `pivot-by-industry` | Pivot by Industry | How to pivot from a specific industry or role into AI | ~33 |
| `ai-roles` | AI Roles & Job Market | What AI roles exist, which are hiring, role comparisons, job market reports | ~15 |
| `skills-credentials` | Skills & Credentials | Learning AI skills, certifications, bootcamps, portfolios, proving skills | ~12 |
| `job-search` | Job Search Playbook | Resume, cover letter, LinkedIn, networking, getting referred, remote jobs, scams | ~12 |
| `interview-hiring` | Interview & Negotiation | Interview prep, what hiring managers look for, salary negotiation | ~6 |
| `career-change` | Career Change Foundations | When and how to change careers, frameworks, timelines, overcoming anxiety | ~18 |
| `future-of-work` | AI & the Future of Work | AI disruption, agents, automation, what jobs are safe, the macro picture | ~14 |

**Why 7.** Miller's Law (7 +/- 2) — scannable at a glance without chunking overhead. Each label is distinct enough that a reader self-selects without reading descriptions.

### 1.2 Frontmatter addition

Add a required `topic` field to `PostFrontmatter` (single string, one of the 7 slugs above). CTO adds this to `src/lib/blog.ts` interface and backfills all 114 posts.

```
topic: "pivot-by-industry"
```

Posts that could fit two clusters get their _primary_ cluster only. The related-posts algorithm can still cross-link via keyword overlap.

### 1.3 Cluster-to-slug mapping (reference for CTO backfill)

<details>
<summary>pivot-by-industry (~33 posts)</summary>

All `how-to-pivot-from-*-to-ai-2026` posts plus:
- `how-to-pivot-from-tech-to-leadership`
- `how-to-pivot-into-ai-governance-career-2026`
- `how-to-pivot-from-software-engineering-to-ai-pm-2026`
</details>

<details>
<summary>ai-roles (~15 posts)</summary>

- `ai-job-titles-explained-career-changers-2026`
- `which-ai-roles-are-hiring-most-in-2026`
- `ai-careers-by-industry-2026`
- `ai-engineer-vs-ml-engineer-vs-data-scientist-2026`
- `what-does-an-ai-product-manager-do-2026`
- `what-does-an-ai-enablement-manager-do-2026`
- `how-to-break-into-ai-product-management-2026`
- `is-prompt-engineering-a-real-career-2026`
- `what-ai-adjacent-role-fits-your-background-2026`
- `why-ai-adjacent-roles-are-the-smartest-career-pivot`
- `companies-are-hiring-for-ai-roles-that-dont-say-ai-in-the-title`
- `can-you-get-an-ai-job-with-no-experience-2026`
- `ai-jobs-hiring-2026-without-coding`
- `ai-job-market-mid-2026-report`
- `how-to-get-a-job-at-an-ai-startup-non-technical-2026`
</details>

<details>
<summary>skills-credentials (~12 posts)</summary>

- `what-ai-skills-should-you-learn-first-2026`
- `ai-skills-that-get-you-hired-2026`
- `how-to-learn-ai-skills-while-working-full-time`
- `how-to-prove-ai-skills-without-degree-2026`
- `how-to-build-ai-portfolio-no-experience-2026`
- `should-you-get-an-ai-certification-2026`
- `the-8-ai-certifications-that-matter-for-career-pivots-2026`
- `is-an-ai-bootcamp-worth-it-2026`
- `do-you-need-to-code-to-get-an-ai-job-2026`
- `you-dont-need-to-code-to-work-in-ai`
- `how-to-become-ai-fluent-in-30-days-2026`
- `how-to-leverage-domain-expertise-for-ai-job-2026`
- `transferable-skills-career-change-guide`
</details>

<details>
<summary>job-search (~12 posts)</summary>

- `how-to-write-resume-for-ai-job-career-changer-2026`
- `how-to-write-cover-letter-for-ai-job-career-changer-2026`
- `how-to-get-past-ai-resume-screeners-2026`
- `how-to-optimize-linkedin-for-ai-jobs-2026`
- `how-to-get-referred-into-ai-job-2026`
- `how-to-network-into-ai-jobs-without-tech-background-2026`
- `how-to-network-into-ai-roles-2026`
- `how-to-find-remote-ai-jobs-career-changer-2026`
- `how-to-get-internal-transfer-into-ai-role-2026`
- `how-to-read-ai-job-description-2026`
- `how-to-spot-ai-job-scams-career-changer-2026`
- `career-change-resume-guide`
</details>

<details>
<summary>interview-hiring (~6 posts)</summary>

- `how-to-prepare-for-ai-job-interview-2026`
- `how-to-answer-how-do-you-use-ai-interview-2026`
- `how-to-pass-an-ai-conducted-interview-2026`
- `how-to-talk-about-non-technical-background-ai-interview-2026`
- `what-hiring-managers-look-for-in-ai-candidates-2026`
- `how-to-negotiate-first-ai-job-offer-career-changer-2026`
</details>

<details>
<summary>career-change (~18 posts)</summary>

- `career-change-at-35-complete-guide`
- `how-to-change-careers-at-40`
- `how-to-change-careers-with-a-family`
- `how-to-change-careers-without-going-back-to-school`
- `the-90-day-plan-to-pivot-into-an-ai-role-2026`
- `the-6-month-career-pivot-framework`
- `signs-you-need-a-career-change`
- `mid-career-crisis-what-to-do`
- `overcoming-career-change-anxiety`
- `is-it-too-late-to-pivot-into-ai-2026`
- `is-pivoting-into-ai-worth-it-2026-salary-math`
- `how-long-does-it-take-to-pivot-into-ai-career-2026`
- `how-to-transition-into-ai-without-quitting-your-job-2026`
- `how-to-use-ai-to-plan-career-pivot`
- `how-to-use-ai-tools-to-accelerate-career-pivot-2026`
- `best-ai-career-coaching-tools-2026`
- `ai-career-tools-vs-career-coach-2026`
- `can-chatgpt-help-you-switch-to-ai-career-2026`
- `best-careers-to-pivot-into`
- `how-to-explain-career-gap-when-pivoting-into-ai-2026`
- `what-salary-can-you-expect-first-ai-role-2026`
</details>

<details>
<summary>future-of-work (~14 posts)</summary>

- `ai-agents-are-your-new-coworkers`
- `ai-career-paradox-companies-need-your-experience`
- `ai-changing-jobs-faster-than-companies-can-adapt`
- `ai-reskilling-gap-companies-not-training-workers`
- `ai-two-track-economy-pwc-study-2026`
- `fobo-is-real-what-actually-determines-who-thrives`
- `what-jobs-are-safe-from-ai-2026`
- `will-ai-agents-take-your-job-2026`
- `worried-about-ai-taking-your-job-what-to-do-this-week`
- `what-to-do-when-your-company-is-replacing-your-job-with-ai-2026`
- `how-to-break-into-ai-when-agents-do-entry-level-work-2026`
- `how-to-pivot-into-ai-when-your-job-is-being-automated-2026`
- `your-boss-told-you-to-learn-ai-what-that-actually-means`
- `more-jobs-higher-bar-getting-hired-ai-role-2026`
</details>

---

## 2. Related Posts Module (end of article)

### 2.1 Placement

Insert after `<BlogShareButtons>` and before the FAQ section. The flow becomes:

```
Article body (MDX)
  ↓
BlogShareButtons
  ↓
★ RelatedPosts          ← NEW
  ↓
FAQ (if present)
```

**Why here:** The reader has finished the article and demonstrated engagement. Showing related content at this moment respects their investment (Peak-End Rule) and channels the energy of completion into the next read. Placing it before FAQ keeps FAQ as the natural end-of-page (FAQ serves SEO structured data and is a different intent — lookup, not browse).

### 2.2 Selection algorithm

```
getRelatedPosts(currentSlug, allPosts, count = 3):
  1. Exclude currentSlug
  2. Score each remaining post:
     a. Same `topic` as current post: +3 points
     b. Each shared keyword (case-insensitive exact match): +1 point
     c. Recency bonus: +1 if published within last 60 days
  3. Sort by score DESC, then by date DESC (tiebreaker)
  4. Return top `count` results
```

**Constraints:**
- Always return exactly 3 posts (the library has 114 posts; there will always be enough).
- If somehow fewer than 3 score > 0, pad with the most recent posts not already included.
- Pure server-side computation — no client JS. This runs in `getPost()` or at page render time.

**Why 3.** Choice Overload: 3 cards are enough to offer variety without decision fatigue. On mobile, 3 cards stack into a scrollable column without pushing the FAQ unreasonably far down. On desktop, 3 fills a row cleanly.

### 2.3 Component: `RelatedPosts`

Server component. No client-side JS needed.

**Props:**
```ts
interface RelatedPostsProps {
  posts: Array<{
    slug: string;
    title: string;
    description: string;
    readingTime: string;
    topic: string;
  }>;
}
```

**Structure:**
```
<section>                         ← not-prose, mt-14 (same spacing as FAQ)
  <h2>                            ← section heading
  <div grid>                      ← 3-column grid
    <RelatedPostCard /> × 3       ← individual cards
  </div>
</section>
```

### 2.4 Component: `RelatedPostCard`

Each card is a `<Link>` wrapping the existing `Card` component (size="sm"). Cards are fully clickable (Fitts's Law — large target area).

**Anatomy (top to bottom within card):**

```
┌─────────────────────────────┐
│  Topic badge                │  ← Badge variant="outline", text-xs
│                             │
│  Post title                 │  ← CardTitle, 2-line clamp
│  Description excerpt        │  ← CardDescription, 2-line clamp
│                             │
│  Reading time               │  ← text-xs text-muted-foreground
└─────────────────────────────┘
```

No images (the blog has no post images; adding them would be scope creep). No author (always "AICareerPivot Team"). No date (reading time is more actionable for deciding whether to click).

**Token usage:**
- Card background: `bg-card` (`#0f172a`)
- Card border: `ring-1 ring-foreground/10` (from Card defaults)
- Topic badge: `Badge variant="outline"` with `text-muted-foreground`
- Title: `font-heading text-sm font-medium` (Card `size="sm"` default)
- Description: `text-xs text-muted-foreground` with `line-clamp-2`
- Reading time: `text-xs text-muted-foreground`
- Hover: `card-glow` utility (existing teal glow effect) + `transition-colors` on title to `text-teal-400`

**Why no custom styles:** Every visual value maps to an existing token or component. Zero new colors, spacing values, or type sizes.

### 2.5 Responsive behavior

| Breakpoint | Layout | Card behavior |
|---|---|---|
| `< 640px` (mobile) | Single column, `flex flex-col gap-4` | Full width, stacked |
| `640px–1023px` (tablet) | 2-column grid, `grid-cols-2 gap-4` | Equal width |
| `≥ 1024px` (desktop) | 3-column grid, `grid-cols-3 gap-4` | Equal width, row of 3 |

The section is inside the existing `max-w-2xl mx-auto` article container. On desktop, the related posts section could optionally break out to `max-w-3xl` to give the 3-column layout more breathing room (same width as the blog index). This is a CTO judgment call — either works.

### 2.6 Section header copy

```
Heading: "Keep reading"
```

Short. Doesn't oversell. "Related posts" or "You might also like" sound algorithmic. "Keep reading" is an invitation that matches the reader's current momentum (Goal-Gradient effect — they just finished one article and are near completing their learning session).

Styling: `text-2xl font-bold tracking-tight mb-6` (mirrors the FAQ heading exactly).

### 2.7 States

| State | Behavior |
|---|---|
| **3 posts found** | Render the 3-card grid (normal case) |
| **< 3 posts found** | Pad with most-recent posts. Edge case only possible if library < 4 posts total. |
| **Error in scoring** | Fall back to 3 most-recent posts (excluding current). Never show 0 cards. |

No loading state needed — this is a server component rendering at build time (SSG). No skeleton.

### 2.8 Analytics event

Fire a `related_post_clicked` event (via the existing `BlogCtaLink` pattern or a new thin wrapper) with:
- `source_slug`: the article the reader came from
- `target_slug`: the related post they clicked
- `position`: 1, 2, or 3 (left to right / top to bottom)

This lets us measure pages/session lift in PostHog without touching the pre-auth funnel instrumentation.

---

## 3. Topic-Cluster Hub (blog index IA)

### 3.1 Problem with the current index

The current `/blog` page is a flat chronological list of 114 posts. At this volume:
- **Scanning is expensive.** A user looking for interview prep must scroll past 80+ unrelated posts (Information Scent failure).
- **Crawlers see a flat list.** No hub/spoke structure means no topical authority signal for search engines.
- **No re-entry path.** A reader who finishes one article and wants to explore a theme has no structured way back in.

### 3.2 New IA: hub-and-filter on `/blog`

The existing `/blog` page becomes a topic-hub. No new routes needed.

**Layout (top to bottom):**

```
SiteNav
  ↓
Page header (h1 + subtitle)       ← Keep existing copy
  ↓
★ Topic filter bar                ← NEW: horizontal pill row
  ↓
★ Topic section (repeated × 7)   ← NEW: one section per cluster
  ├── Section heading (h2)
  ├── Post list (articles)
  └── "View all N posts" link     ← Only if cluster has > 5 posts
  ↓
(repeat for each cluster)
```

### 3.3 Topic filter bar

A horizontal row of pill-shaped filter buttons at the top. One pill per cluster + an "All" pill.

**Behavior:**
- Default state: "All" is active — all 7 topic sections render on the page.
- Clicking a topic pill: smooth-scrolls to that section's heading (anchor `#topic-{slug}`). All sections remain visible. This is **scroll-to navigation**, not filtering/hiding.
- Active pill: `bg-primary text-primary-foreground` (`bg-teal-600 text-white`).
- Inactive pills: `bg-secondary text-secondary-foreground` (`bg-slate-800 text-gray-50`).

**Why scroll-to, not filter:**
1. Keeps all content in the DOM for crawlers (SEO — the whole point of this feature).
2. Simpler implementation (no client-side state management for filtering).
3. A reader arriving from search for "AI certifications" can scan the full page and discover adjacent topics they didn't know about (Serendipity > Precision for a content hub).

**Responsive:**
- Desktop: horizontal row, centered, `flex flex-wrap gap-2 justify-center`.
- Mobile: horizontal scroll (`overflow-x-auto`), `flex gap-2 flex-nowrap`. No wrapping — horizontal scroll with scroll-snap keeps the bar compact and thumb-friendly.

**Sticky:** The filter bar is `sticky top-0` with `bg-gray-950/95 backdrop-blur-sm` so it remains accessible as the reader scrolls through 114 posts. `z-10` to sit above content. Padding `py-3`.

**Component:** `TopicFilterBar` — client component (needs `onClick` for scroll-to and active-state tracking). Minimal JS — just `scrollIntoView({ behavior: 'smooth' })` and a `useState` for the active pill.

**Pill design:** Use existing `Button` component, `variant="secondary"`, `size="sm"`. Active state overrides to `variant="default"` (teal). No new component needed.

### 3.4 Topic sections

Each cluster renders as a distinct `<section>` with:

```
<section id="topic-{slug}">
  <h2>                          ← cluster label
  <p>                           ← cluster description (1 line, text-muted-foreground)
  <div>                         ← post list
    <article> × N               ← same article markup as current index
  </div>
  <Link>                        ← "View all N posts →" (only if showing truncated)
</section>
```

**Post display rules:**
- Show **5 posts per section** in the default "All" view.
- If a cluster has > 5 posts, show a "View all N posts in [Topic Label]" link that anchors to a scroll-expanded state or dedicated filtered view.
- Within each section, posts are sorted by `pinned` DESC, then `date` DESC (same as current).
- **Article markup is identical to today's index** — date, reading time, h2 title link, excerpt, "Read article" link. No redesign of the post row. Consistency with what exists; subtractive, not additive.

**Section spacing:** `mt-14` between sections (same rhythm as article sections on the post page). Sections separated by `border-b border-slate-800` (same as current post separators).

**Section heading:** `text-2xl font-bold tracking-tight` (h2). Uses `font-heading` (Source Serif 4). Below it, the description in `text-sm text-muted-foreground mb-6`.

### 3.5 "View all" expansion

For clusters with > 5 posts (currently: `pivot-by-industry` at ~33, `career-change` at ~18, `ai-roles` at ~15, `future-of-work` at ~14):

Option A (recommended): The "View all N posts" link sets a `?topic={slug}` URL param that filters the page to show only that cluster's posts — all of them, not just 5. This is a soft page state change (client-side), not a new route.

Option B (simpler): The link scrolls down and a `<details>` element reveals the remaining posts inline. Lower-tech but less clean for deep clusters like the 33 pivot guides.

**Recommendation: Option A.** It gives each cluster a shareable/bookmarkable URL (`/blog?topic=pivot-by-industry`), which is valuable for both users sharing links and crawlers. When `?topic` is set, the filter bar highlights the matching pill and only that section renders. The "All" pill clears the param.

### 3.6 SEO implications

- **Internal links:** Each section heading + every post link = dense internal linking from the hub. Every post gets at least one inbound link from `/blog`.
- **Anchor text:** Post titles are the anchor text (already good — descriptive, keyword-rich).
- **Crawlable:** All 7 sections with all posts (at least the top 5) render server-side. The `?topic` filtered views also render server-side (since `searchParams` are available in server components).
- **JSON-LD:** Keep the existing `CollectionPage` + `ItemList` schema. No changes needed — it already lists all posts.

### 3.7 Cluster count badge

Each pill in the filter bar shows the post count: `"AI Roles (15)"`. This gives the reader a sense of library depth (Social Proof / volume signal) and helps them prioritize which sections to explore.

---

## 4. Component summary for CTO

| Component | Type | File | New? |
|---|---|---|---|
| `RelatedPosts` | Server | `src/components/RelatedPosts.tsx` | New |
| `RelatedPostCard` | Server | Inline in `RelatedPosts.tsx` or separate | New |
| `TopicFilterBar` | Client | `src/components/TopicFilterBar.tsx` | New |
| `getRelatedPosts()` | Utility | `src/lib/blog.ts` | New function |
| `TOPIC_CLUSTERS` | Constant | `src/lib/blog.ts` | New constant |
| `PostFrontmatter.topic` | Type | `src/lib/blog.ts` | Field addition |

**Existing components reused (no modifications):**
- `Card`, `CardHeader`, `CardTitle`, `CardDescription`, `CardContent` (size="sm")
- `Badge` (variant="outline")
- `Button` (variant="secondary" / "default", size="sm")
- `card-glow` CSS utility

### 4.1 Token reference for implementation

| Element | Token / class |
|---|---|
| Section heading | `text-2xl font-bold tracking-tight font-heading` |
| Card background | `bg-card` (via Card component) |
| Card hover | `card-glow` utility class |
| Topic badge text | `text-muted-foreground` via Badge `variant="outline"` |
| Description text | `text-xs text-muted-foreground line-clamp-2` |
| Reading time | `text-xs text-muted-foreground` |
| Title hover color | `group-hover:text-teal-400` (use `--accent` token) |
| Filter pill active | `bg-primary text-primary-foreground` |
| Filter pill inactive | `bg-secondary text-secondary-foreground` |
| Filter bar sticky bg | `bg-gray-950/95 backdrop-blur-sm` |
| Section separator | `border-b border-slate-800` (matches current) |

### 4.2 i18n keys needed

| Key | English value |
|---|---|
| `blog.post.keepReading` | `"Keep reading"` |
| `blog.index.viewAll` | `"View all {count} posts in {topic}"` |
| `blog.index.allTopics` | `"All"` |
| `blog.topics.pivot-by-industry` | `"Pivot by Industry"` |
| `blog.topics.ai-roles` | `"AI Roles & Job Market"` |
| `blog.topics.skills-credentials` | `"Skills & Credentials"` |
| `blog.topics.job-search` | `"Job Search Playbook"` |
| `blog.topics.interview-hiring` | `"Interview & Negotiation"` |
| `blog.topics.career-change` | `"Career Change Foundations"` |
| `blog.topics.future-of-work` | `"AI & the Future of Work"` |

Plus short descriptions for each cluster (used in section subheadings).

---

## 5. Design decisions log

| Decision | Rationale | Lens |
|---|---|---|
| 3 related posts, not 4 or 6 | Avoids choice overload; fills a row on desktop; stacks cleanly on mobile | Choice Overload, Miller's Law |
| No images on cards | Blog has no post images; adding would require 114 image assets (scope creep) | Occam's Razor |
| "Keep reading" heading | Matches reader momentum; avoids algorithmic-sounding labels | Goal-Gradient, Peak-End Rule |
| Scroll-to nav, not hide/show filter | Keeps all content in DOM for crawlers; enables serendipitous discovery | SEO, Information Scent |
| `?topic` param for deep clusters | Shareable/bookmarkable; server-renderable for SEO | Jakob's Law (URLs = expectations) |
| Sticky filter bar | 114 posts = long page; reader needs persistent navigation | Recognition over Recall |
| card-glow on hover | Reuses existing decorative utility; signals interactivity | Affordance, Aesthetic-Usability |
| Same article row markup in index | Subtractive design — no redesign of what works; system consistency | Design System Health |
| Server components for related posts | No client JS for a static content recommendation | Doherty Threshold, Tesler's Law |
| Topic count on pills | Volume signal builds confidence in library depth | Social Proof |
| `topic` frontmatter (not auto-clustering) | Deterministic, editable, no ML dependency; CTO can backfill in one pass | Occam's Razor, Postel's Law |

---

## 6. Out of scope

- Post thumbnail images (no image assets exist; would require 114 new images)
- Client-side search or full-text filtering (overkill for 114 posts; consider at 500+)
- Personalized recommendations (no user model exists)
- Changes to the pre-auth funnel or landing-to-first-action flow (frozen per AIC-1124)
- New routes (no `/blog/topic/[slug]` — the `?topic` param on `/blog` is sufficient)
- RSS feed (separate concern, not in scope)

---

## 7. Acceptance criteria

- [ ] `topic` field added to `PostFrontmatter` and all 114 posts backfilled
- [ ] `RelatedPosts` renders 3 cards at end of every blog post (after share buttons, before FAQ)
- [ ] Cards use existing `Card size="sm"` with `card-glow` hover, showing topic badge + title + description + reading time
- [ ] `related_post_clicked` analytics event fires with source_slug, target_slug, position
- [ ] Blog index shows 7 topic sections with posts grouped by cluster
- [ ] Sticky filter bar with pill-per-topic scrolls to the matching section
- [ ] `?topic={slug}` filters to a single cluster (all posts, not just top 5)
- [ ] All copy uses i18n keys (not hardcoded English)
- [ ] Mobile: related cards stack vertically; filter bar scrolls horizontally
- [ ] Desktop: related cards in 3-column grid; filter bar wraps naturally
- [ ] No new CSS custom properties, colors, or type sizes introduced
- [ ] Lighthouse accessibility audit passes (contrast, labels, keyboard nav)
