# AIC-1234: "State of AI Career Pivots 2026" Data Page + Quotable StatBlock Visual System

Build-ready design spec for CTO handoff. Scope: TRAFFIC/discovery + GEO citability — NOT funnel/conversion (data-frozen per AIC-1124) and NOT feature-bloat (at parity).

Parent: AIC-1231 (c20 competitive-research lever). CTO implementation: [AIC-1233](/AIC/issues/AIC-1233).

---

## Problem

AI answer engines (ChatGPT, Perplexity, Gemini) preferentially cite pages that contain **original, fact-dense, quotable data nodes** — not opinion or advice. Social shares perform best when they contain screenshot-friendly stat cards with a clear number + source. We currently have zero original-data assets.

AIC-1200 defined a `StatBlock` component (Part 2) for the readiness tool and blog embeds. This spec extends that foundation into a full **data page** and adds the **copy/share affordance** that turns each stat into a citation and social loop anchor.

The three surfaces — data page, readiness result card, blog embeds — must share one `StatBlock` component and one visual DNA, not three independent implementations.

---

## Scope

### In scope

- **Data page**: `/research/ai-career-pivots-2026` — hero stat, section stat rows, methodology footer
- **StatBlock v2**: Extends AIC-1200 Part 2 with copy/share affordance, deep-link anchors, and structured data markup
- **Copy/share affordance**: Per-stat copy-quote and social share for AI-citation + social loops
- **Component contract**: Unified StatBlock across data page, readiness result, blog embeds, and PivotOnRamp (AIC-1208)
- **SEO/GEO**: Dataset JSON-LD, SpeakableSpecification, BreadcrumbList, `data-stat-*` attributes
- **Analytics**: PostHog events for page views, stat copies, stat shares

### Out of scope

- Funnel/conversion changes (frozen per AIC-1124)
- Email gates, login walls, paywalls
- Data sourcing/content — AIC-1199 (done) owns the figures; this spec designs the container
- Readiness tool redesign (AIC-1200, already specced)
- New charts or visualizations beyond stat tiles/hero numbers (the data is headline stats, not time-series — per dataviz skill form heuristic, the right form is stat tiles and a KPI row, not charts)

---

## Part 1: Data Page Layout

### 1.1 Route & URL structure

**URL:** `/research/ai-career-pivots-2026` (under `src/app/[locale]/research/ai-career-pivots-2026/`)

**Why this path:**
- `/research/` signals original data to both humans and AI engines (high information scent for citation queries)
- The year suffix makes it indexable as an annual reference — future editions at `/research/ai-career-pivots-2027`
- Avoids colliding with `/stats` (too generic) or `/blog/` (different content type)

**SEO metadata:**
- Title: "State of AI Career Pivots 2026 — Original Data & Statistics | AICareerPivot"
- Description: "Key statistics on AI career transitions in 2026: salary data, placement rates, readiness factors, and industry trends. Sourced, quotable, and updated."
- Canonical: `/{locale}/research/ai-career-pivots-2026`

### 1.2 Page composition

```
SiteNav
├── HeroStat section (single headline number — the page's anchor)
├── SectionStatRow × N (grouped stat blocks by topic)
├── MethodologyFooter (sources, methodology, citation guide)
├── DataPageFaq (BlogFaqAccordion reuse)
└── Footer
```

### 1.3 Hero stat section

**Design lens:** Hero Figure (dataviz skill: "the single number a dashboard leads with, ≥48px") + Inverted Pyramid (lead with the most quotable stat). Von Restorff — the hero number is the most visually distinct element on the entire page.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  ── breadcrumb: Home > Research > State of AI Career Pivots 2026         │
│                                                                          │
│  STATE OF AI CAREER PIVOTS 2026                                          │  ← text-xs text-teal-400
│                                                                          │    uppercase tracking-widest
│  The data behind the pivot.                                              │  ← font-heading (Source Serif 4)
│                                                                          │    text-3xl sm:text-4xl font-bold
│  Original statistics on AI career transitions —                          │    text-white
│  sourced, quotable, and citation-ready.                                  │  ← text-base sm:text-lg
│                                                                          │    text-slate-400 max-w-2xl
│  ┌────────────────────────────────────────────────────────────────────┐  │
│  │                                                                    │  │
│  │           ┌──── hero ring ────┐                                    │  │
│  │           │                   │                                    │  │
│  │           │      2.4M         │   2.4 million professionals        │  │  ← ScoreRing or HeroRing
│  │           │                   │   pivoted into AI-adjacent roles    │  │    size=160, no score arc
│  │           └───────────────────┘   in the past 12 months            │  │    just the number, centered
│  │                                                                    │  │
│  │           Source: Bureau of Labor Statistics, 2025                  │  │  ← text-xs text-slate-500
│  │                                                                    │  │
│  │           [Copy quote]  [Share ↗]                                  │  │  ← StatAction buttons
│  │                                                                    │  │
│  └────────────────────────────────────────────────────────────────────┘  │
│                                                                          │
│  ░░░░░░░░░░░░░░░░░░░░░░░░░░░░  (dot-grid texture, bg)                  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Hero number container:**
```
bg-card border border-slate-700 rounded-2xl
p-8 sm:p-12 lg:p-16
text-center
relative overflow-hidden
```

**Hero number typography:**
```
font-heading text-6xl sm:text-7xl lg:text-8xl font-bold text-white
tabular-nums tracking-tight
```

Note: The dataviz skill recommends sans for hero figures ("never a serif face"). Our brand uses Source Serif 4 (`font-heading`) as the impact/display face across all surfaces — readiness tool (AIC-1200), blog headings, landing page. Keeping serif here for brand consistency; the hero number reads as "our voice" not "decoration" because the serif IS our heading face.

**Hero label:**
```
text-lg sm:text-xl text-slate-300 leading-relaxed max-w-md mx-auto mt-4
```

**Background texture:** Reuse `.dot-grid` class (already in globals.css) as a subtle background pattern inside the hero container. Apply as `::before` pseudo-element with `opacity-30`.

### 1.4 Section stat rows

**Design lens:** Chunking — group stats by topic so the reader processes one cluster at a time (Miller's Law). Gestalt Proximity — tight spacing within groups, generous spacing between groups. KPI Row (dataviz skill: "a handful of headline numbers → KPI row of stat tiles, not a grouped bar chart").

Each section has a topic heading + a row of 2-4 StatBlock components.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  SALARY & COMPENSATION                                                   │  ← section eyebrow
│                                                                          │    text-xs text-teal-400
│  What AI career changers earn                                            │    uppercase tracking-widest
│                                                                          │  ← font-heading text-xl
│                                                                          │    sm:text-2xl font-bold
│                                                                          │    text-white mb-6
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐                   │
│  │              │  │              │  │              │                   │
│  │  $127K       │  │  +34%        │  │  $89K        │                   │
│  │  median AI   │  │  salary lift │  │  median      │                   │
│  │  role salary │  │  for career  │  │  entry-level │                   │
│  │  (2025)      │  │  pivoters    │  │  AI role     │                   │
│  │              │  │              │  │              │                   │
│  │  BLS '25     │  │  Indeed '25  │  │  BLS '25     │                   │
│  │              │  │              │  │              │                   │
│  │  [⎘] [↗]    │  │  [⎘] [↗]    │  │  [⎘] [↗]    │                   │
│  └──────────────┘  └──────────────┘  └──────────────┘                   │
│                                                                          │
│  ──────────────────────────────────────────────────────────────────────  │
│                                                                          │
│  READINESS & PREPARATION                                                 │
│                                                                          │
│  How preparation changes outcomes                                        │
│                                                                          │
│  ┌──────────────┐  ┌──────────────┐  ┌──────────────┐  ┌────────────┐  │
│  │              │  │              │  │              │  │            │  │
│  │  78%         │  │  3.2x        │  │  62%         │  │  < 6 mo   │  │
│  │  smoother    │  │  faster      │  │  complete    │  │  median    │  │
│  │  transitions │  │  placement   │  │  pivot       │  │  time to   │  │
│  │  with        │  │  for prepared│  │  within      │  │  first AI  │  │
│  │  readiness   │  │  changers    │  │  12 months   │  │  role      │  │
│  │  assessment  │  │              │  │              │  │  offer     │  │
│  │              │  │              │  │              │  │            │  │
│  │  BLS '25     │  │  Indeed '25  │  │  LinkedIn    │  │  Indeed    │  │
│  │              │  │              │  │              │  │            │  │
│  │  [⎘] [↗]    │  │  [⎘] [↗]    │  │  [⎘] [↗]    │  │  [⎘] [↗]  │  │
│  └──────────────┘  └──────────────┘  └──────────────┘  └────────────┘  │
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Suggested section topics** (CTO to populate from AIC-1199 data):

| # | Section | Expected stat count |
|---|---------|-------------------|
| 1 | Salary & Compensation | 3-4 stats |
| 2 | Readiness & Preparation | 3-4 stats |
| 3 | Industry Demand | 2-3 stats |
| 4 | Skills & Learning | 2-3 stats |
| 5 | Career Outcomes | 2-3 stats |

**Section container:**
```
py-12 sm:py-16
border-t border-slate-800
```

Sections are separated by a thin `border-t border-slate-800` rule (Gestalt: common region). No card wrapper on the section itself — the stat blocks are the cards.

**Section eyebrow pattern** (matches KeyTakeaways and AIC-1200 section headers):
```
text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mb-2
```

**Section heading:**
```
font-heading text-xl sm:text-2xl font-bold text-white mb-6
```

**Stat grid within section:**
```
grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-4 sm:gap-6
```

When a section has exactly 3 stats, the grid naturally fills 3 columns at `lg`. When it has 4, all four fill at `xl` and wrap to 2×2 at `lg`. When it has 2, they sit in a 2-col layout at `sm+`.

### 1.5 Methodology & source footer

**Design lens:** Trust signals — a methodology section elevates the page from "blog post with numbers" to "citable reference." Emotional trust (Norman's reflective level) — transparent sourcing builds confidence in the data.

```
┌──────────────────────────────────────────────────────────────────────────┐
│                                                                          │
│  METHODOLOGY & SOURCES                                                   │  ← eyebrow pattern
│                                                                          │
│  Where this data comes from                                              │  ← section heading
│                                                                          │
│  All statistics on this page are sourced from publicly available         │  ← text-sm text-slate-300
│  government and industry reports. We do not fabricate or extrapolate      │    leading-relaxed
│  data. Each stat block links to its original source. Figures were         │    max-w-prose
│  last verified in {month} 2026.                                          │
│                                                                          │
│  ── Sources ─────────────────────────────────────────────────────────   │
│                                                                          │
│  • Bureau of Labor Statistics, Occupational Outlook Handbook, 2025       │  ← text-sm text-slate-400
│  • Indeed Hiring Lab, AI Roles Report, Q1 2025                           │    list-disc
│  • LinkedIn Economic Graph, Career Transitions Data, 2025                │
│  • World Economic Forum, Future of Jobs Report, 2025                     │
│                                                                          │
│  ── How to cite this page ───────────────────────────────────────────   │
│                                                                          │
│  ┌──────────────────────────────────────────────────────────────────┐   │
│  │  AICareerPivot. "State of AI Career Pivots 2026."               │   │  ← bg-slate-900/80
│  │  ai-career-pivot.vercel.app/research/ai-career-pivots-2026.     │   │    border border-slate-700/50
│  │  Accessed {date}.                                                │   │    rounded-xl p-4
│  │                                                     [Copy ⎘]    │   │    font-mono text-sm
│  └──────────────────────────────────────────────────────────────────┘   │    text-slate-300
│                                                                          │
│  Last updated: September 2026                                            │  ← text-xs text-slate-500
│                                                                          │
└──────────────────────────────────────────────────────────────────────────┘
```

**Citation block container:**
```
bg-slate-900/80 border border-slate-700/50 rounded-xl p-4 sm:p-6
font-mono text-sm text-slate-300 leading-relaxed
relative
```

The "[Copy]" button in the citation block copies the full citation string to clipboard (same UX as the per-stat copy button, see Part 2).

### 1.6 FAQ section

Reuse `BlogFaqAccordion` with CSS class `data-page-faq` for speakable JSON-LD.

**Questions:**
1. Where does the data on this page come from?
2. How often is this data updated?
3. Can I cite these statistics?
4. What is an "AI-adjacent" role?
5. How is "career pivot" defined in this data?

Answers to be written by CMO for GEO optimization. CTO implementation accepts these as a static array.

---

## Part 2: Quotable StatBlock v2 — The Unified Visual System

### 2.1 Extending AIC-1200

AIC-1200 Part 2 defined `StatBlock` with: `value`, `label`, `source`, `sourceUrl`, `trend`, `trendLabel`, `size`, `accent`. This spec **extends** that component — it does not replace it. All AIC-1200 properties remain valid.

### 2.2 Component API (extended)

```tsx
interface StatBlockProps {
  // === AIC-1200 base props (unchanged) ===
  value: string              // "78%", "3.2x", "14,000+", "$127K"
  label: string              // "of career changers report smoother transitions"
  source?: string            // "Bureau of Labor Statistics, 2025"
  sourceUrl?: string         // URL for the source link
  trend?: "up" | "down" | "neutral"
  trendLabel?: string        // "+12% YoY"
  size?: "sm" | "md" | "lg"  // default "md"
  accent?: "teal" | "emerald" | "amber"  // default "teal"

  // === v2 extensions (this spec) ===
  shareable?: boolean        // Show copy/share buttons. Default false.
  shareText?: string         // Override share text. Default: auto-generated from value + label + source.
  anchor?: string            // Override the auto-generated id. Default: slugified from label.
  align?: "left" | "center"  // Default "left". Center for PivotOnRamp context.
  as?: "figure" | "div"      // Semantic wrapper. Default "figure" (citation-friendly).
}
```

### 2.3 Visual layout with copy/share affordance

**Design lens:** Fitts's Law — copy/share buttons are revealed on hover/focus, keeping the stat clean for screenshots and print. Recognition over Recall — the clipboard icon is universally understood. Reciprocity — giving users a frictionless way to cite the stat earns link-backs and citations.

**Default state (no hover):**

```
┌─────────────────────────────────────────┐
│                                         │
│  78%                                    │  ← value: font-heading
│                                         │    size-dependent text class
│  of career changers who assess their    │    tabular-nums font-bold text-white
│  readiness first report a smoother      │  ← label: size-dependent text class
│  transition                             │    text-slate-300 leading-relaxed
│                                         │
│  ↑ +12% YoY                            │  ← trend (unchanged from AIC-1200)
│                                         │
│  Source: Bureau of Labor Statistics      │  ← source (unchanged from AIC-1200)
│                                         │
└─────────────────────────────────────────┘
```

**Hover/focus state (shareable=true):**

```
┌─────────────────────────────────────────┐
│                                    ┌──┐ │
│  78%                               │⎘ │ │  ← copy-quote button
│                                    └──┘ │    appears top-right on hover
│  of career changers who assess their    │    (absolute positioned)
│  readiness first report a smoother      │
│  transition                             │
│                                         │
│  ↑ +12% YoY                            │
│                                         │
│  Source: Bureau of Labor Statistics      │
│                                    ┌──┐ │
│                                    │↗ │ │  ← share button
│                                    └──┘ │    appears bottom-right on hover
└─────────────────────────────────────────┘
```

**Action buttons spec:**

| Button | Icon | Label (sr-only) | Action |
|--------|------|-----------------|--------|
| Copy quote | `ClipboardCopy` (lucide) | "Copy statistic" | Copies formatted quote to clipboard |
| Share | `Share2` (lucide) | "Share statistic" | Opens share popover (LinkedIn / X / Copy link) |

**Button tokens (both):**
```
absolute
h-8 w-8
flex items-center justify-center
rounded-lg
bg-slate-800/80 backdrop-blur-sm
border border-slate-700/50
text-slate-400
hover:text-teal-400 hover:border-teal-500/40
transition-opacity duration-200
opacity-0 group-hover:opacity-100 focus:opacity-100
```

The StatBlock container gets `group relative` to enable hover-reveal.

**Copy format (clipboard text):**

```
"{value} — {label}" — {source} (via AICareerPivot: {pageUrl}#{anchor})
```

Example:
```
"78% — of career changers who assess their readiness first report a smoother transition" — Bureau of Labor Statistics, 2025 (via AICareerPivot: ai-career-pivot.vercel.app/research/ai-career-pivots-2026#stat-smoother-transitions)
```

This format is designed for:
- AI engines to parse the quoted value and attribution
- Social media paste that includes the source
- Deep-link back to the specific stat on the page

**Copy confirmation:** On click, the icon briefly swaps to a checkmark (`Check` lucide icon, `text-emerald-400`) for 1.5s, then reverts. Matches the existing copy-to-clipboard pattern across the app.

### 2.4 Share popover

**Design lens:** Hick's Law — exactly 3 share options, no overwhelming choice. Jakob's Law — matches the share pattern from AIC-1200 readiness results (LinkedIn / X / Copy Link).

When the share button is clicked, a small popover appears anchored to the button:

```
┌────────────────────────┐
│  Share this stat        │  ← text-xs text-slate-400 mb-2
│                         │
│  [in] LinkedIn          │  ← icon + label rows
│  [𝕏] X / Twitter       │    text-sm text-slate-200
│  [🔗] Copy link         │    hover:text-teal-400
│                         │
└────────────────────────┘
```

**Popover container:**
```
absolute right-0 bottom-full mb-2
bg-slate-900 border border-slate-700
rounded-xl p-3 shadow-xl
min-w-[180px]
z-10
```

**Share text template:**
```
{value} {label}. Source: {source}. See all stats: {pageUrl}
```

**LinkedIn share URL:**
```
https://www.linkedin.com/sharing/share-offsite/?url={pageUrl}%23{anchor}
```

**X share URL:**
```
https://twitter.com/intent/tweet?text={encodeURIComponent(shareText)}&url={pageUrl}%23{anchor}
```

**Copy link:** Copies `{pageUrl}#{anchor}` — the deep-link to this specific stat.

**UTM params:** All share links append `?utm_source={platform}&utm_medium=social&utm_campaign=data_page_stat_share`.

### 2.5 Deep-link anchors

Every StatBlock with `shareable=true` gets an `id` attribute derived from the label:

```
id="stat-{slugified-label}"
```

Example: `id="stat-smoother-transitions"` for "of career changers who assess their readiness first report a smoother transition".

The `anchor` prop overrides the auto-generated slug when the label is too long or ambiguous.

When the page loads with a `#stat-*` hash:
1. Scroll to the stat block (smooth scroll via `scroll-behavior: smooth` already in globals.css)
2. Briefly highlight the stat block with a `ring-2 ring-teal-500/60` pulse animation (1s, once)
3. This makes deep-linked stats visually findable after scroll

**Highlight animation:**
```css
@keyframes stat-highlight {
  0% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0.4); }
  50% { box-shadow: 0 0 0 4px rgba(20, 184, 166, 0.3); }
  100% { box-shadow: 0 0 0 0 rgba(20, 184, 166, 0); }
}
```

Gated by `prefers-reduced-motion: no-preference` (match AIC-1100 pattern).

### 2.6 Structured data markup

**Per stat block (HTML):**

```html
<figure
  class="stat-block group relative"
  id="stat-smoother-transitions"
  data-stat-value="78%"
  data-stat-label="smoother transitions"
  data-stat-source="Bureau of Labor Statistics, 2025"
  itemscope
  itemtype="https://schema.org/Observation"
>
  <div class="stat-value" itemprop="value">78%</div>
  <figcaption class="stat-label" itemprop="name">
    of career changers who assess their readiness first report a smoother transition
  </figcaption>
  <cite class="stat-source">
    <span itemprop="observedBy">Bureau of Labor Statistics</span>, 2025
  </cite>
</figure>
```

The `data-stat-*` attributes (from AIC-1200) plus `Observation` microdata give AI engines two extraction paths. The `stat-block` CSS class is the speakable JSON-LD contract.

**Page-level JSON-LD:**

```json
{
  "@context": "https://schema.org",
  "@type": "Dataset",
  "name": "State of AI Career Pivots 2026",
  "description": "Original statistics on AI career transitions, salary data, placement rates, and readiness factors.",
  "url": "https://ai-career-pivot.vercel.app/research/ai-career-pivots-2026",
  "creator": {
    "@type": "Organization",
    "name": "AICareerPivot"
  },
  "temporalCoverage": "2025/2026",
  "license": "https://creativecommons.org/licenses/by/4.0/",
  "distribution": {
    "@type": "DataDownload",
    "encodingFormat": "text/html",
    "contentUrl": "https://ai-career-pivot.vercel.app/research/ai-career-pivots-2026"
  }
}
```

Plus: `BreadcrumbList`, `SpeakableSpecification` (targeting `.stat-block` and `.data-page-faq`), and `FAQPage` schemas — all reusing existing `schema.ts` helpers.

### 2.7 Size variants (refined from AIC-1200)

| Size | Value text | Label text | Source text | Container padding | Use case |
|------|-----------|-----------|-------------|-------------------|----------|
| `sm` | `text-3xl` | `text-sm` | `text-xs` | `p-4` | PivotOnRamp proof strip, blog embeds |
| `md` | `text-5xl` | `text-base` | `text-xs` | `p-6` | Data page section rows |
| `lg` | `text-7xl` | `text-lg` | `text-sm` | `p-8 sm:p-10` | Data page hero area (if not using HeroStat) |

All sizes: `font-heading` (Source Serif 4) for the value, `font-sans` (Inter) for label/source.

### 2.8 Accent system (unchanged from AIC-1200)

Left border accent via `border-l-4`:

| Accent | Border | Trend up | Trend down |
|--------|--------|----------|------------|
| `teal` (default) | `border-l-teal-500` | `text-emerald-400` | `text-red-400` |
| `emerald` | `border-l-emerald-500` | `text-emerald-400` | `text-red-400` |
| `amber` | `border-l-amber-500` | `text-emerald-400` | `text-red-400` |

Trend arrows: `↑` for up, `↓` for down, `→` for neutral. Text color follows direction, not accent — **up is always emerald, down is always red** (the dataviz skill's "color = direction × whether up is good" rule).

---

## Part 3: The Unified Component System

### 3.1 One StatBlock, four surfaces

The same `StatBlock` component renders across all four contexts with different prop combinations:

| Surface | Size | Shareable | Align | Container context |
|---------|------|-----------|-------|-------------------|
| Data page section rows | `md` | `true` | `left` | `bg-card border border-slate-700 rounded-xl` cell |
| Readiness result card | `sm` | `false` | `left` | Inline within result view (AIC-1200 §1.5) |
| Blog embed (MDX) | `sm` | `false` | `left` | Full article width, `my-8` vertical margin |
| PivotOnRamp proof strip | `sm` | `false` | `center` | `bg-slate-800/50 rounded-xl p-4 text-center` (AIC-1208) |

### 3.2 Grid wrapper: StatSection

For the data page, a helper server component wraps a group of stat blocks:

```tsx
interface StatSectionProps {
  eyebrow: string        // "SALARY & COMPENSATION"
  heading: string        // "What AI career changers earn"
  children: ReactNode    // StatBlock components
  columns?: 2 | 3 | 4   // Default 3
}
```

**Renders as:**
```html
<section class="py-12 sm:py-16 border-t border-slate-800" aria-labelledby="{slug}-heading">
  <p class="text-xs font-semibold font-sans text-teal-400 uppercase tracking-widest mb-2">{eyebrow}</p>
  <h2 id="{slug}-heading" class="font-heading text-xl sm:text-2xl font-bold text-white mb-6">{heading}</h2>
  <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-{columns} gap-4 sm:gap-6">
    {children}
  </div>
</section>
```

### 3.3 Stat block card cell

On the data page, each StatBlock is wrapped in a card cell:

```
bg-card border border-slate-700 rounded-xl
hover:border-slate-600
transition-colors duration-200
```

This wrapper is the data page's concern — `StatBlock` itself has no background (composable, per AIC-1200 §2.3). When used in blog embeds, the blog's article container is the surface. When used in PivotOnRamp, that module provides its own cell styling.

### 3.4 HeroStat component

A specialized variant for the page hero — not a separate component, but a composition:

```tsx
<div className="bg-card border border-slate-700 rounded-2xl p-8 sm:p-12 lg:p-16 text-center relative overflow-hidden">
  <div className="dot-grid absolute inset-0 opacity-30" aria-hidden="true" />
  <div className="relative">
    <p className="font-heading text-6xl sm:text-7xl lg:text-8xl font-bold text-white tabular-nums tracking-tight">
      {heroValue}
    </p>
    <p className="text-lg sm:text-xl text-slate-300 leading-relaxed max-w-md mx-auto mt-4">
      {heroLabel}
    </p>
    <p className="text-xs text-slate-500 mt-3">
      Source: <a href={sourceUrl} className="underline hover:text-slate-400">{source}</a>
    </p>
    {/* Copy/share buttons centered below */}
    <StatActions value={heroValue} label={heroLabel} source={source} anchor="hero" pageUrl={pageUrl} />
  </div>
</div>
```

This is **not** a StatBlock — it's a one-off composition for the page hero. The dataviz skill says "exactly one hero figure per view" — this is it.

---

## Part 4: Dynamic OG Image

### 4.1 Route

**Route:** `src/app/api/og/research/route.tsx`

Follows the existing OG image pattern (AIC-1200 §1.6).

**Query params:** `?title=State+of+AI+Career+Pivots+2026&stat=2.4M&label=professionals+pivoted`

### 4.2 Layout

```
┌──────────────────────────────────────────────────────────────┐
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  (teal accent bar)       │
│                                                              │
│  AICAREERPIVOT                                               │  ← text-sm teal
│                                                              │
│  State of AI Career                                          │  ← Source Serif 4, 48px
│  Pivots 2026                                                 │    white, bold
│                                                              │
│       ┌───────────────────────────────────────┐              │
│       │                                       │              │
│       │  2.4M professionals pivoted into      │              │  ← stat callout card
│       │  AI-adjacent roles in 12 months       │              │    bg dark, border
│       │                                       │              │    value: Source Serif, 56px
│       │  Source: BLS, 2025                    │              │
│       └───────────────────────────────────────┘              │
│                                                              │
│  ░░░░░░░░░░░░░░░░░░░░░░░  (dot grid texture)               │
│                                                              │
│  See all stats → ai-career-pivot.vercel.app/research         │  ← footer CTA
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Size:** 1200×630 (standard OG).
**Fonts:** Load via `loadGoogleFont()` from `src/lib/og-fonts.ts` (Inter + Source Serif 4).

---

## Part 5: Analytics Events

| Event | Fires when | Properties |
|-------|-----------|-----------|
| `data_page_viewed` | Page loads | `page_url`, `section_count`, `stat_count` |
| `data_stat_copied` | Copy-quote button clicked | `stat_anchor`, `stat_value`, `stat_label`, `section` |
| `data_stat_shared` | Share popover option clicked | `stat_anchor`, `stat_value`, `channel` (linkedin/x/copy_link), `section` |
| `data_citation_copied` | Citation block copy clicked | `citation_text` |
| `data_page_faq_opened` | FAQ accordion item expanded | `question_index`, `question_text` |

---

## Part 6: Responsive Behavior

| Viewport | Layout adjustments |
|----------|-------------------|
| Desktop (≥ 1024px) | `max-w-4xl` centered container. Hero stat full-width within container. Stat grids 3-4 columns. Copy/share buttons on hover. |
| Tablet (640-1023px) | Same container, reduced padding. Stat grids 2 columns. Copy/share on hover. |
| Mobile (< 640px) | Full-width with `px-4`. Hero number drops to `text-6xl`. Stat grids stack to 1 column. Copy/share buttons **always visible** (no hover on touch — `@media (hover: none)` shows them at reduced opacity). Touch targets ≥ 48px. |

**Mobile touch affordance:** On `@media (hover: none)`, the copy/share buttons render at `opacity-60` permanently instead of hover-reveal. This ensures touch users can access them without requiring a hover state.

---

## Part 7: Accessibility Checklist

- [ ] All stat blocks use `<figure>` with `aria-labelledby` or `aria-label` combining value + label
- [ ] Copy/share buttons have `aria-label` ("Copy statistic: 78% smoother transitions")
- [ ] Share popover is keyboard-navigable (Escape closes, Tab through options)
- [ ] Deep-link highlight animation respects `prefers-reduced-motion`
- [ ] Color is never the only indicator — trend direction conveyed by arrow glyph + label
- [ ] Source links are distinguishable from body text (underlined)
- [ ] Heading hierarchy: `<h1>` page title, `<h2>` per section, no skipped levels
- [ ] All interactive elements have visible focus indicators (`ring-teal-500`)
- [ ] Touch targets ≥ 48px on all interactive elements (WCAG 2.5.8)

---

## Component Inventory for CTO Handoff

### New components to build

| Component | Type | File path | Notes |
|-----------|------|-----------|-------|
| `StatActions` | Client ("use client") | `src/components/StatActions.tsx` | Copy/share buttons + popover. Client for clipboard API + popover state. |
| `StatSection` | Server | `src/components/StatSection.tsx` | Section wrapper (eyebrow + heading + grid). |

### Components to extend

| Component | File | Change |
|-----------|------|--------|
| `StatBlock` | `src/components/StatBlock.tsx` | Add `shareable`, `shareText`, `anchor`, `align`, `as` props per §2.2. Render `StatActions` when `shareable=true`. Add `id`, `data-stat-*`, microdata attributes. |

### Existing components to reuse (no changes needed)

| Component | File | Usage |
|-----------|------|-------|
| `BlogFaqAccordion` | `src/components/blog/BlogFaqAccordion.tsx` | FAQ section |
| `SiteNav` | `src/components/SiteNav.tsx` | Page navigation |
| `Footer` | `src/components/Footer.tsx` | Page footer |
| `breadcrumbSchema` | `src/lib/schema.ts` | SEO breadcrumbs |
| `speakableSchema` | `src/lib/schema.ts` | Speakable JSON-LD |
| `loadGoogleFont` | `src/lib/og-fonts.ts` | OG image fonts |

### New routes

| Route | Type | Purpose |
|-------|------|---------|
| `src/app/[locale]/research/ai-career-pivots-2026/page.tsx` | Server page | Data page |
| `src/app/api/og/research/route.tsx` | API route | Dynamic OG image |

### Tokens used (all existing, no new tokens)

- Colors: `--primary` (teal-600), `--accent` (teal-400), `--card` (#0f172a), `--border` (#334155), `--background` (#030712), `--muted-foreground` (#94a3b8)
- Typography: `--font-heading` (Source Serif 4), `--font-sans` (Inter), `--font-mono` (JetBrains Mono)
- Radii: `--radius-xl` (0.7rem), `--radius-2xl` (0.9rem)
- Spacing: Tailwind default scale
- Existing utility: `.dot-grid` (globals.css line 245)

### Coordination with CTO (AIC-1233)

The CTO is building both `/readiness` (AIC-1200 spec) and the data page. This spec adds:

1. **StatBlock must be built ONCE** and shared across `/readiness` result, `/research/ai-career-pivots-2026`, blog MDX embeds, and PivotOnRamp (AIC-1208). The base API is from AIC-1200 Part 2; this spec's v2 extensions layer on top.
2. **StatActions is a new client component** that the CTO builds alongside StatBlock. It's the only client JS on the data page.
3. **StatSection is a thin server wrapper** — can be inlined if the CTO prefers.
4. **The data page route and OG image** are new and self-contained.

The CTO should implement StatBlock first (it unblocks all four surfaces), then the data page, then the OG image.

---

## Acceptance Criteria

1. `/research/ai-career-pivots-2026` loads as a standalone, indexable page with correct meta tags
2. Hero stat section renders with the headline number, label, source, and copy/share affordance
3. Section stat rows group stats by topic with eyebrow + heading + responsive grid
4. Every stat block on the data page has a deep-link anchor (`#stat-{slug}`)
5. Copy-quote copies formatted citation text including source and page URL
6. Share popover offers LinkedIn, X, and Copy Link with correct UTM params
7. Methodology footer includes source list and copyable citation block
8. `StatBlock` component works in all four contexts: data page, readiness result, blog embed, PivotOnRamp
9. OG image generates at `/api/og/research?title=...&stat=...&label=...`
10. JSON-LD validates (Dataset, BreadcrumbList, FAQPage, SpeakableSpecification)
11. WCAG AA accessibility: focus indicators, keyboard navigation, reduced-motion, color-independent
12. Mobile: stat grids stack, copy/share buttons always visible (no hover dependency), touch targets ≥ 48px
13. No email gate, no login wall, no paywall — free discovery only
14. No fabricated data — all stat values traceable to a source (AIC-860 constraint)
15. All analytics events fire with correct properties

---

## Design Lenses Applied

| Lens | Application |
|------|------------|
| Inverted Pyramid | Hero stat leads with the most quotable number; page front-loads data |
| Von Restorff | Hero number is 6xl-8xl — the most visually distinct element on the page |
| Chunking | Stats grouped by topic section; value → label → source = 3-level hierarchy |
| Miller's Law | 3-4 stats per section stays within working memory |
| Gestalt Proximity | Tight spacing within sections, generous spacing between |
| Gestalt Common Region | Section border-t separates topic clusters |
| Information Scent | Section eyebrows + headings signal what data follows |
| Aesthetic-Usability | Polished stat cards build trust in the data quality |
| Trust Signals (Norman reflective) | Methodology footer + visible sources = credibility |
| Reciprocity | Frictionless copy/share → earns citations and link-backs |
| Fitts's Law | Copy/share buttons are accessible on hover (desktop) and always visible (mobile) |
| Hick's Law | Share popover has exactly 3 options |
| Recognition over Recall | Clipboard/share icons are universally understood |
| Jakob's Law | Layout follows the convention of data report pages (hero stat, sections, methodology) |
| WCAG POUR | Full accessibility checklist §7 |
| Dataviz: Form heuristic | Headline stats → stat tiles + KPI rows, not charts (dataviz skill §choosing-a-form) |
| Dataviz: Text wears text tokens | Values use `text-white`, labels use `text-slate-300` — series color is only on accent borders, never on text |

---

## Revision History

| Date | Rev | Change |
|------|-----|--------|
| 2026-09-16 | v1 | Initial spec — data page layout + StatBlock v2 with copy/share + CTO handoff |
