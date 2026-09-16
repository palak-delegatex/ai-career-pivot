# AIC-1200: AI Career Pivot Readiness Tool + Quotable Stat-Block UX

Build-ready design spec for CTO handoff. Scope: TRAFFIC/discovery — free top-of-funnel. Does NOT touch the pre-auth funnel (frozen per AIC-1124) and is NOT feature-bloat (at parity).

Parent: AIC-1197 (c19 competitive-research lever).

---

## Problem

The discovery landscape for career-pivot / AI-job-readiness queries is dominated by interactive assessments. High-intent queries like "am I ready for an AI career", "career pivot readiness quiz", "AI job risk assessment" drive volume and AI-engine citations. We have a career quiz at `/quiz` (AIC-833) but it solves a different intent (role matching, not readiness assessment). We lack:

1. A discovery-optimized, shareable, indexable readiness tool that captures the "am I ready?" intent cluster.
2. A quotable stat-block module that makes data pages citation-friendly for AI engines and social sharing.

---

## Scope

### In scope
- **Readiness tool**: `/readiness` route — 5-question interactive assessment → instant result with shareable score card
- **Result card**: Screenshot-friendly, OG-image-powered, social-share-ready
- **Stat-block module**: Reusable `StatBlock` component for data/stat pages and blog embeds
- **SEO**: Quiz JSON-LD, FAQPage schema, breadcrumbs, speakable markup
- **Analytics**: PostHog events for starts, completions, shares

### Out of scope
- Email gates, login walls, paid upsells on the result (free discovery only)
- Changes to existing `/quiz` (AIC-833) — different intent, coexists
- Funnel/conversion changes (frozen per AIC-1124)

---

## Part 1: AI Career Pivot Readiness Tool

### 1.1 Route & page structure

**URL:** `/readiness` (under `src/app/[locale]/readiness/`)

**Page composition:**
```
SiteNav
├── Hero section (answer-first: headline + context)
├── ReadinessAssessment (client component — the interactive tool)
│   ├── Question flow (5 steps)
│   └── Result view (inline, no navigation away)
├── ReadinessFaq (BlogFaqAccordion reuse)
└── Footer
```

**SEO metadata:**
- Title: "AI Career Pivot Readiness Assessment — Free Quiz | AICareerPivot"
- Description: "Find out if you're ready to pivot into an AI career. 5 quick questions, instant results, no signup required."
- Canonical: `/{locale}/readiness`

### 1.2 Answer-first hero

**Design lens:** Inverted Pyramid + Information Scent — lead with the value proposition so searchers and AI engines hit the answer immediately.

```
┌─────────────────────────────────────────────────────┐
│                                                     │
│  ── breadcrumb: Home > Readiness Assessment         │
│                                                     │
│  How Ready Are You for an                           │  ← font-heading (Source Serif 4)
│  AI Career Pivot?                                   │    text-4xl sm:text-5xl font-bold
│                                                     │    text-white
│  5 questions. 60 seconds. Instant results.          │  ← text-lg text-slate-400
│  No signup required.                                │
│                                                     │
│  ┌─ teal-500 left border accent ────────────────┐   │
│  │ 78% of career changers who assess their       │   │  ← KeyTakeaways-style callout
│  │ readiness first report a smoother transition.  │   │    bg-slate-900/80 rounded-xl
│  └──────────────────────────────────────────────┘   │
│                                                     │
└─────────────────────────────────────────────────────┘
```

**Tokens:**
- Background: `bg-background` (#030712)
- Container: `max-w-2xl mx-auto px-4 sm:px-6 pt-24 pb-12`
- Breadcrumb: reuse `breadcrumbSchema()` from `src/lib/schema.ts`

### 1.3 Question flow

**Design lens:** Goal-Gradient Effect — show progress to motivate completion. Hick's Law — limit choices per question to 4-5 options. Miller's Law — 5 questions stays within working memory.

**5 questions, each on a single screen with animated transition:**

| # | Question | Input type | Options |
|---|----------|-----------|---------|
| 1 | What's your current career stage? | Single-select button grid | Early career (0-3 yr) · Mid-career (4-10 yr) · Senior (10+ yr) · Career break / returning |
| 2 | How much AI/tech exposure do you have? | Single-select button grid | None — completely new · Some — used AI tools at work · Moderate — built with AI/data · Deep — AI/ML is my field |
| 3 | What's driving your pivot? | Multi-select (pick up to 2) | Job at risk from automation · Want higher earning potential · Passionate about AI · Current role is a dead end |
| 4 | How much time can you invest weekly? | Single-select button grid | < 5 hours · 5-10 hours · 10-20 hours · Full-time learner |
| 5 | When do you want to make the switch? | Single-select button grid | Within 3 months · 3-6 months · 6-12 months · Just exploring |

**Question card layout:**

```
┌──────────────────────────────────────────────────┐
│                                                  │
│  Step 2 of 5         ████████░░░░░░░░░ 40%       │  ← StepIndicator pattern
│                                                  │
│  How much AI/tech exposure                       │  ← text-xl font-semibold text-white
│  do you have?                                    │
│                                                  │
│  ┌──────────────────────────────────────────┐    │
│  │  None — completely new                    │    │  ← button: bg-slate-800 border
│  └──────────────────────────────────────────┘    │    border-slate-700 rounded-xl
│  ┌──────────────────────────────────────────┐    │    p-4 text-left
│  │  Some — used AI tools at work             │    │    hover:border-teal-500/60
│  └──────────────────────────────────────────┘    │    hover:bg-slate-800/80
│  ┌──────────────────────────────────────────┐    │
│  │  Moderate — built with AI/data            │    │  ← selected state:
│  └──────────────────────────────────────────┘    │    border-teal-500 bg-teal-500/10
│  ┌──────────────────────────────────────────┐    │    ring-1 ring-teal-500/30
│  │  Deep — AI/ML is my field                 │    │
│  └──────────────────────────────────────────┘    │
│                                                  │
│              ┌────────────────┐                  │
│              │   Continue →   │                  │  ← Button variant="default"
│              └────────────────┘                  │    (primary teal, disabled until
│                                                  │     selection made)
│  ← Back                                         │  ← Button variant="ghost" text-sm
│                                                  │
└──────────────────────────────────────────────────┘
```

**Container:** `bg-card` (#0f172a) `border border-slate-700 rounded-2xl p-6 sm:p-8`

**Transition:** Slide left/right with `AnimatePresence` from framer-motion (match existing `AssessmentClient.tsx` pattern). Duration 300ms, ease-out. Reduced-motion: instant swap (respect `prefers-reduced-motion`, matches AIC-1100 work).

**Progress bar:** Linear progress bar across the top of the card. `bg-slate-700` track, `bg-teal-500` fill, `h-1 rounded-full`, width transitions with `transition-all duration-500`.

**Accessibility:**
- `role="group"` on each question with `aria-labelledby` pointing to question text
- `role="radiogroup"` for single-select, checkbox group for multi-select
- Focus ring: `ring-teal-500` (matches `--ring` token)
- Button options: minimum 44px touch target height (Fitts's Law / WCAG 2.5.8)
- Keyboard: arrow keys navigate options, Enter/Space selects, Tab moves to Continue

### 1.4 Scoring model

Pure client-side, rule-based (no API call needed — same pattern as `/quiz`). No server round-trip means instant results (Doherty Threshold).

**Dimension scores (0-100 each):**

| Dimension | Label | Driven by questions |
|-----------|-------|-------------------|
| `experience` | Experience Foundation | Q1 (career stage) + Q2 (AI exposure) |
| `motivation` | Motivation Alignment | Q3 (pivot drivers) |
| `commitment` | Time Commitment | Q4 (weekly hours) |
| `urgency` | Timeline Readiness | Q5 (switch timeline) + Q4 |

**Overall readiness score:** Weighted average — Experience 30%, Motivation 25%, Commitment 25%, Urgency 20%.

**Tier thresholds (reuse existing color banding):**

| Score | Tier | Color | Badge |
|-------|------|-------|-------|
| ≥ 80 | Ready to Pivot | `emerald-400` | "You're ready" |
| 60-79 | Strong Foundation | `teal-400` | "Almost there" |
| 40-59 | Building Momentum | `amber-400` | "Getting started" |
| < 40 | Exploring | `slate-400` | "Early days" |

### 1.5 Result view — the shareable score card

**Design lens:** Peak-End Rule — the result is the peak moment; invest heavily here. Von Restorff — the score should be the most visually distinct element on the page. Social Proof — the share CTA turns results into referral loops.

The result replaces the question card inline (no page navigation). Smooth expand animation.

```
┌──────────────────────────────────────────────────────────────────┐
│                                                                  │
│  Your AI Career Pivot Readiness                                  │  ← text-sm text-teal-400
│                                                                  │    uppercase tracking-widest
│         ┌─────────┐                                              │
│         │         │                                              │
│         │   74%   │  Strong Foundation                           │  ← ScoreRing (size=128)
│         │         │  Readiness Score                             │    + tier badge
│         └─────────┘                                              │
│                                                                  │
│  ┌─ quotable one-liner ──────────────────────────────────────┐   │
│  │ "You have a strong foundation for an AI career pivot.      │   │  ← bg-slate-900/60
│  │  Your mid-career experience is your biggest asset —        │   │    border-l-4 border-l-teal-500
│  │  focus on deepening AI exposure to close the gap."         │   │    rounded-lg p-4
│  └───────────────────────────────────────────────────────────┘   │    font-serif text-slate-200
│                                                                  │    italic
│  ── Dimension Breakdown ──────────────────────────────────────   │
│                                                                  │
│  Experience Foundation           ████████████████░░░░  78%       │  ← horizontal bar
│  Motivation Alignment            ██████████████████░░  88%       │    bg-slate-700 track
│  Time Commitment                 ████████████░░░░░░░░  58%       │    colored fill per tier
│  Timeline Readiness              ██████████████░░░░░░  65%       │    h-2 rounded-full
│                                                                  │
│  ── What This Means ─────────────────────────────────────────   │
│                                                                  │
│  ✓ Strong: Your career experience translates well              │  ← text-emerald-400 check
│  ✓ Strong: High motivation — clear reasons to pivot             │    text-sm text-slate-300
│  △ Build: Increase weekly learning time for faster results      │  ← text-amber-400 triangle
│  △ Build: Set a concrete target date to maintain momentum       │
│                                                                  │
│  ┌────────────────────────────────────────────────────────────┐  │
│  │              Share Your Results                             │  │
│  │                                                            │  │
│  │  [LinkedIn]  [X / Twitter]  [Copy Link]                   │  │  ← ShareResultButtons pattern
│  └────────────────────────────────────────────────────────────┘  │
│                                                                  │
│  ── Next Steps ──────────────────────────────────────────────   │
│                                                                  │
│  ┌──────────────────┐  ┌──────────────────┐                    │
│  │ 📄 Get Your Free │  │ 🎯 Find Your     │                    │  ← 2-col CTA cards
│  │ AI Career        │  │ Best AI Role     │                    │    link to /free and /quiz
│  │ Snapshot         │  │ Match            │                    │    bg-slate-800
│  │                  │  │                  │                    │    border-slate-700
│  │ → Upload Resume  │  │ → Take the Quiz  │                    │    hover:border-teal-500/40
│  └──────────────────┘  └──────────────────┘                    │
│                                                                  │
└──────────────────────────────────────────────────────────────────┘
```

**Container:** Same `bg-card border border-slate-700 rounded-2xl` as the question card but with more padding: `p-6 sm:p-10`.

**Score ring:** Reuse `ScoreRing` component (size=128, label="Readiness", animated=true). Same color banding as existing components.

**Quotable one-liner:** Generated client-side from a template map keyed on tier + strongest/weakest dimension. This is the text that AI engines and social shares will quote. Wrap in a `<blockquote>` with `class="readiness-quote"` (speakable JSON-LD contract).

**Dimension bars:** `h-2 rounded-full` with colored fill matching dimension score tier. Track: `bg-slate-700`. Label: `text-sm text-slate-300` left, `text-sm tabular-nums text-slate-400` right.

**Strengths/growth areas:** Max 2 strengths (highest dimensions ≥ 60) + max 2 growth areas (lowest dimensions < 60). If all dimensions are ≥ 60, show top 2 as strengths and bottom 1 as "refine further".

**Share buttons:** Reuse the `ShareResultButtons` pattern (LinkedIn / X / Copy). UTM campaign: `readiness_share`. Share text template: "I scored {score}% on the AI Career Pivot Readiness Assessment — {tier_label}. Find out your score:"

**Next-step CTAs:** Two cards linking to `/free` (resume upload) and `/quiz` (role matching). No paywall, no signup push. These are horizontal internal links that keep users in the discovery funnel.

### 1.6 Dynamic OG image for results

**Route:** `src/app/api/og/readiness/route.tsx`

Follows the existing report OG image pattern (`src/app/[locale]/report/[id]/opengraph-image.tsx`).

**Query params:** `?score=74&tier=strong-foundation`

```
┌──────────────────────────────────────────────────────────────┐
│ ▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔▔  (teal accent bar)       │
│                                                              │
│  AICAREERPIVOT                                               │  ← text-sm teal
│                                                              │
│  AI Career Pivot                                             │  ← Source Serif 4, 48px
│  Readiness Score                                             │    white, bold
│                                                              │
│       ┌───────────┐                                          │
│       │           │                                          │
│       │    74%    │    Strong Foundation                     │  ← SVG score ring
│       │           │    "You have a strong foundation          │    (radius=92, stroke=14)
│       └───────────┘     for an AI career pivot."             │    + tier text + quote
│                                                              │
│  ░░░░░░░░░░░░░░░░░░░░░  (dot grid texture)                 │
│                                                              │
│  Take the free assessment → ai-career-pivot.vercel.app       │  ← footer CTA
│                                                              │
└──────────────────────────────────────────────────────────────┘
```

**Size:** 1200×630 (standard OG).
**Fonts:** Load via `loadGoogleFont()` from `src/lib/og-fonts.ts` (Inter + Source Serif 4).
**Color tiers:** Match the result card — emerald/teal/amber/slate gradient backgrounds per tier.

### 1.7 Shareable result URL

**Pattern:** `/readiness?r={encoded_result}`

The result is encoded as a short base64 string containing the 4 dimension scores (4 bytes → ~6 chars base64). When the page loads with `?r=`, it skips the questions and renders the result directly. This makes every result URL:
- **Shareable** — paste the link, see the result
- **Indexable** — the base `/readiness` page (no params) shows the assessment start
- **Privacy-safe** — no PII in the URL, just 4 numeric scores

The OG image URL is derived from the same params: `/api/og/readiness?score={overall}&tier={tier}`.

### 1.8 Structured data (JSON-LD)

Emit on the `/readiness` page:

1. **BreadcrumbList** — Home > AI Career Pivot Readiness Assessment (reuse `breadcrumbSchema()`)
2. **Quiz schema** (`@type: "Quiz"`) with `about`, `educationalLevel`, `assesses` properties
3. **FAQPage** — from the ReadinessFaq section (reuse pattern from blog posts)
4. **SpeakableSpecification** — target `.readiness-quote` and `.readiness-faq` CSS classes

### 1.9 Analytics events

| Event | Fires when | Properties |
|-------|-----------|-----------|
| `readiness_assessment_started` | User answers Q1 | `source` (direct/blog/quiz) |
| `readiness_assessment_step` | Each question answered | `step`, `question_id`, `answer_value` |
| `readiness_assessment_completed` | Result rendered | `score`, `tier`, `dimensions` (object) |
| `readiness_result_shared` | Share button clicked | `channel` (linkedin/x/copy), `score`, `tier` |
| `readiness_cta_clicked` | Next-step CTA clicked | `cta_target` (free/quiz), `score` |

### 1.10 FAQ section

Reuse `BlogFaqAccordion` component with CSS class `readiness-faq` for speakable JSON-LD.

**Questions:**
1. What does the AI Career Pivot Readiness score measure?
2. How is my readiness score calculated?
3. Do I need to sign up to take the assessment?
4. Can I retake the assessment?
5. What should I do after getting my results?
6. Is my data stored or shared?

Answers should be written by CMO for GEO optimization. The CTO implementation should accept these as a static array (same pattern as blog post FAQ frontmatter).

### 1.11 Responsive behavior

| Viewport | Layout adjustments |
|----------|-------------------|
| Desktop (≥ 1024px) | `max-w-2xl` centered. Score ring + tier badge side-by-side. Next-step CTAs in 2-col grid. |
| Tablet (640-1023px) | Same as desktop but with reduced padding. |
| Mobile (< 640px) | Full-width card with `px-4`. Score ring centered above tier text (stacked). Next-step CTAs stack to single column. Question options full-width. Touch targets ≥ 48px. |

### 1.12 Accessibility checklist

- [ ] All interactive elements have visible focus indicators (`ring-teal-500`)
- [ ] Question groups use `role="radiogroup"` with `aria-labelledby`
- [ ] Progress bar uses `role="progressbar"` with `aria-valuenow/min/max`
- [ ] Score ring uses `role="meter"` (matches PreviewScoreRing pattern)
- [ ] Color is never the only indicator — tier labels accompany color changes
- [ ] Reduced motion: disable slide transitions, use instant swap
- [ ] Contrast: all text meets WCAG AA (teal-400 on slate-900 = 7.2:1 ✓)
- [ ] Screen reader: result quote is in a `<blockquote>` with descriptive `aria-label`

---

## Part 2: Quotable Stat-Block Module

### 2.1 Purpose

A reusable `StatBlock` component that renders a single statistic as a visually prominent, quotable, citation-friendly block. Designed for:
- The CTO's sibling data/stats page (AIC-1197 tree)
- Blog post embeds (via MDX components prop)
- Landing page sections
- AI-engine citation (speakable, structured)

### 2.2 Component API

```tsx
interface StatBlockProps {
  value: string          // "78%", "3.2x", "14,000+", "$127K"
  label: string          // "of career changers report smoother transitions"
  source?: string        // "Bureau of Labor Statistics, 2025"
  sourceUrl?: string     // URL for the source link
  trend?: "up" | "down" | "neutral"
  trendLabel?: string    // "+12% YoY"
  size?: "sm" | "md" | "lg"  // default "md"
  accent?: "teal" | "emerald" | "amber"  // default "teal"
}
```

### 2.3 Visual layout

**Design lens:** Von Restorff — the number is the most visually distinct element. Chunking — value + label + source form a clear three-level hierarchy. Aesthetic-Usability — polish builds trust in the data.

```
┌─────────────────────────────────────────┐
│                                         │
│  78%                                    │  ← value: font-heading (Source Serif 4)
│                                         │    text-5xl font-bold text-white
│  of career changers who assess their    │    tabular-nums
│  readiness first report a smoother      │  ← label: text-base text-slate-300
│  transition                             │    leading-relaxed max-w-[28ch]
│                                         │
│  ── trend arrow ↑ +12% YoY             │  ← trend: text-sm
│                                         │    up=text-emerald-400
│  Source: Bureau of Labor Statistics      │    down=text-red-400
│                                         │  ← source: text-xs text-slate-500
│                                         │    if sourceUrl, render as <a>
└─────────────────────────────────────────┘
```

**Size variants:**

| Size | Value text | Label text | Container padding |
|------|-----------|-----------|-------------------|
| `sm` | `text-3xl` | `text-sm` | `p-4` |
| `md` | `text-5xl` | `text-base` | `p-6` |
| `lg` | `text-7xl` | `text-lg` | `p-8 sm:p-10` |

**Container:** No background or border by default (composable — parent controls the card surface). When used standalone, wrap in a `Card` component.

**Accent:** A thin left border `border-l-4` in the accent color (matches `KeyTakeaways` pattern):
- `teal`: `border-l-teal-500`
- `emerald`: `border-l-emerald-500`
- `amber`: `border-l-amber-500`

### 2.4 Stat-block grid

For the data page, stat blocks compose into a responsive grid:

```
┌─────────────────────────────────────────────────────────────────┐
│                                                                 │
│  Key Numbers                                                    │  ← text-xs text-teal-400
│                                                                 │    uppercase tracking-widest
│  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────┐  │
│  │                  │  │                  │  │              │  │
│  │  78%             │  │  3.2x            │  │  $127K       │  │
│  │  smoother        │  │  faster job      │  │  median AI   │  │
│  │  transitions     │  │  placement       │  │  role salary │  │
│  │                  │  │                  │  │              │  │
│  │  ↑ +12% YoY     │  │  ↑ +0.8x YoY    │  │  ↑ +8% YoY  │  │
│  │  Source: BLS     │  │  Source: Indeed   │  │  Source: BLS │  │
│  │                  │  │                  │  │              │  │
│  └──────────────────┘  └──────────────────┘  └──────────────┘  │
│                                                                 │
└─────────────────────────────────────────────────────────────────┘
```

**Grid:** `grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 sm:gap-6`

Each cell: `bg-card border border-slate-700 rounded-xl` (reuse Card tokens).

### 2.5 Quotability features

**Citation-friendly markup:**
```html
<figure class="stat-block" data-stat-value="78%" data-stat-label="smoother transitions">
  <div class="stat-value">78%</div>
  <figcaption class="stat-label">of career changers who assess...</figcaption>
  <cite class="stat-source">Bureau of Labor Statistics, 2025</cite>
</figure>
```

The `stat-block` CSS class is the speakable JSON-LD contract (same pattern as `.key-takeaways` and `.faq-accordion`).

**`data-stat-*` attributes** enable AI engines to extract structured values without parsing visual layout.

**Stable anchors:** Each stat block gets an `id` derived from the label slug: `id="stat-smoother-transitions"`. This enables deep-linking and citation: `ai-career-pivot.vercel.app/stats#stat-smoother-transitions`.

### 2.6 Blog embed variant

For use inside MDX blog posts via the components prop (same pattern as `FreeSnapshotCTA`):

```mdx
<StatBlock value="78%" label="of career changers report smoother transitions" source="BLS, 2025" />
```

In blog context, the stat block renders inline with `my-8` vertical margin, full article width, and the `sm` size variant by default.

### 2.7 Dark mode

The design is dark-first (matching the existing system). All tokens reference CSS custom properties. No light-mode variant needed currently, but the token structure supports it via the existing `:root` / `.dark` pattern in globals.css.

---

## Part 3: Integration — Readiness Result + Stat Block as one system

The readiness result card and stat blocks share visual DNA so they read as one design system:

| Element | Shared pattern |
|---------|---------------|
| Score display | `ScoreRing` with consistent color banding (emerald/teal/amber/red) |
| Number typography | `font-heading` (Source Serif 4), `tabular-nums`, bold |
| Accent color | `border-l-4 border-l-teal-500` left accent |
| Container | `bg-card border border-slate-700 rounded-xl` |
| Section headers | `text-xs text-teal-400 uppercase tracking-widest` |
| Source attribution | `text-xs text-slate-500` with optional link |

This ensures the data page stats and the readiness result feel like siblings, not unrelated components.

---

## Component inventory for CTO handoff

### New components to build

| Component | Type | File path |
|-----------|------|-----------|
| `ReadinessAssessment` | Client ("use client") | `src/components/ReadinessAssessment.tsx` |
| `ReadinessResult` | Client (child of above) | `src/components/ReadinessResult.tsx` |
| `StatBlock` | Server | `src/components/StatBlock.tsx` |

### Existing components to reuse

| Component | File | Usage |
|-----------|------|-------|
| `ScoreRing` | `src/components/ScoreRing.tsx` | Result score display |
| `ShareResultButtons` | `src/components/ShareResultButtons.tsx` | Result sharing (extend UTM campaign) |
| `BlogFaqAccordion` | `src/components/blog/BlogFaqAccordion.tsx` | FAQ section |
| `Button` | `src/components/ui/button.tsx` | Continue/Back, option buttons |
| `Card` | `src/components/ui/card.tsx` | Stat-block grid cells |
| `SiteNav` | `src/components/SiteNav.tsx` | Page navigation |
| `breadcrumbSchema` | `src/lib/schema.ts` | SEO breadcrumbs |
| `speakableSchema` | `src/lib/schema.ts` | Speakable JSON-LD |
| `loadGoogleFont` | `src/lib/og-fonts.ts` | OG image fonts |

### New routes

| Route | Type | Purpose |
|-------|------|---------|
| `src/app/[locale]/readiness/page.tsx` | Server page | Assessment page |
| `src/app/api/og/readiness/route.tsx` | API route | Dynamic OG image |

### Tokens used (all existing, no new tokens)

- Colors: `--primary` (teal-600), `--accent` (teal-400), `--card`, `--border`, `--muted-foreground`
- Typography: `--font-heading` (Source Serif 4), `--font-sans` (Inter)
- Radii: `--radius-xl` (0.7rem), `--radius-2xl` (0.9rem)
- Spacing: Tailwind default scale (p-4, p-6, p-8, gap-4, gap-6)

---

## Acceptance criteria

1. `/readiness` loads as a standalone, indexable page with correct meta tags
2. 5-question flow completes in under 60 seconds with animated transitions
3. Result card displays score ring, tier badge, dimension breakdown, quotable one-liner, and share buttons
4. Shared result URL (`?r=`) renders the result directly without retaking the assessment
5. OG image generates correctly at `/api/og/readiness?score=X&tier=Y` for all 4 tiers
6. `StatBlock` renders in all 3 sizes with optional trend and source
7. Stat-block grid composes correctly at mobile/tablet/desktop breakpoints
8. All analytics events fire with correct properties
9. JSON-LD validates (Quiz, BreadcrumbList, FAQPage, SpeakableSpecification)
10. WCAG AA accessibility: focus indicators, role attributes, color-independent, reduced-motion safe
11. No email gate, no login wall, no paywall on result — free top-of-funnel only
12. Score ring color banding matches existing components (emerald ≥ 80, teal ≥ 60, amber ≥ 40, red < 40)

---

## Design lenses applied

| Lens | Application |
|------|------------|
| Inverted Pyramid | Hero leads with value prop; result leads with score |
| Goal-Gradient Effect | Progress bar motivates completion |
| Hick's Law | 4-5 options per question, no overwhelming choice |
| Miller's Law | 5 questions total — within working memory |
| Peak-End Rule | Result card is the emotional peak; heavy investment here |
| Von Restorff | Score number is the most visually distinct element |
| Doherty Threshold | Client-side scoring = instant results (< 100ms) |
| Fitts's Law | Large touch targets (≥ 48px), full-width option buttons |
| Social Proof | Share loop turns results into referral signal |
| Information Scent | FAQ provides scent for search/AI discovery |
| Chunking | Value → label → source = clear three-level hierarchy |
| Aesthetic-Usability | Polished result card builds trust in the assessment |
| Gestalt Proximity | Dimension bars grouped together; CTAs grouped together |
| WCAG POUR | Full accessibility checklist in §1.12 |
| Jakob's Law | Quiz flow matches mental model of online assessments |
| Postel's Law | Accept any input (all options valid); be precise in output |

---

## Revision history

| Date | Rev | Change |
|------|-----|--------|
| 2026-09-09 | v1 | Initial spec — readiness tool + stat-block module |
