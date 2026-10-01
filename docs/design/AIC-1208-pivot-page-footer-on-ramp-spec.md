# AIC-1208 — /pivot page footer on-ramp spec

**Status:** SHIPPED (AIC-1256). Replaces the generic footer CTA on every
`/pivot/[from]-to-[to]` page with a personalized, trust-loaded on-ramp into
`/readiness`.

> The original untracked spec draft was lost in a workspace reset before it was
> committed. This document reconstructs the intent and records what was actually
> built, per the AIC-1256 "commit the spec doc alongside the implementation"
> requirement.

## Problem

The 32+ programmatic `/pivot/[from]-to-[to]` pages are high-intent organic entry
points, but they ended with a generic "Start your free assessment" CTA pointing
at `/assessment`. Competitors (Teal, Final Round AI, Rezi, Jobscan) convert these
long-tail landings with a trust strip + a role-specific tool preview rather than
a generic button.

## Solution

Replace the footer CTA block in `src/app/[locale]/pivot/[slug]/page.tsx` with a
single personalized on-ramp module rendered on every pivot page (no per-page
authoring needed — copy is derived from `pivot.fromRole` / `pivot.toRole`).

### Module anatomy

1. **Eyebrow** — "Is this pivot realistic for you?"
2. **Role-specific headline** — "See how ready you are to go from {fromRole} to
   {toRole}." (personalized per slug)
3. **Honest sub-copy** — the readiness check runs the user's actual {fromRole}
   background against the {toRole} role; maps transferable skills, flags gaps,
   sketches a week-by-week plan; "No account to start."
4. **Tool preview** — three checkmark bullets of what the readiness assessment
   returns (a role-specific readiness score, the first skill gaps to close, a
   realistic timeline).
5. **Primary CTA** → `/readiness` ("Check your readiness — free →").
6. **Trust strip** — honest capability/sourcing signals only:
   `No account to start · Grounded in U.S. Bureau of Labor Statistics data ·
   Built on Claude`.

### Honesty constraints (AIC-860 / AIC-862 / AIC-1124 data-freeze)

- **No fabricated outcome numbers** (no "X% landed a job", no invented ratings).
  Signals are capability/sourcing claims we genuinely stand behind — the same
  ones in `src/lib/credibility.ts` (`CREDIBILITY_SIGNALS`).
- This is a **traffic/discovery** change (routing cold pivot-page traffic into
  the readiness tool), **not** a funnel-conversion edit. The funnel stays frozen.

### GEO / structure

The page's existing GEO structure is untouched: `Article` + `BreadcrumbList` +
`FAQPage` JSON-LD, TL;DR, transferable-skill chips, and the related-pivots
internal-link cluster all remain. The on-ramp only swaps the CTA block.

## Corpus expansion (shipped together)

Added 14 new high-intent pivot slugs to `src/content/pivots.ts` (real
search-demand role transitions), each with the full page payload (TL;DR,
body blocks, transferable skills, timeline, FAQ) so they render with identical
GEO structure and the new on-ramp:

real-estate-agent-to-data-analyst · chef-to-operations-manager ·
flight-attendant-to-customer-success-manager · paralegal-to-legal-operations-manager ·
pharmacy-technician-to-clinical-data-analyst · teacher-to-instructional-designer ·
recruiter-to-people-operations-manager · military-veteran-to-project-manager ·
truck-driver-to-logistics-coordinator · barista-to-sales-development-representative ·
librarian-to-ux-researcher · accountant-to-financial-systems-analyst ·
social-media-manager-to-product-marketing-manager · event-planner-to-program-manager

## Done criteria

- [x] Footer on-ramp live on every `/pivot` page (derived from slug — one module).
- [x] 14 new slugs added; render via `generateStaticParams` with full GEO structure.
- [x] Spec doc committed alongside the implementation.
- [ ] Prod-200 verification for a sampled existing slug + a new slug (post-merge,
      after Vercel deploy — recorded in the AIC-1256 issue comment).
