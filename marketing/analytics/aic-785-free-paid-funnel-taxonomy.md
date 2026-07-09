# AIC-785 — Canonical free→paid conversion funnel

**Owner:** CTO (instrumentation) · **Coordinate with:** CMO analytics (AIC-760, AIC-743/744)
**Dashboard:** PostHog 1809774 · **Status:** shipped 2026-07-09

## Why this exists

The AIC-618 free-tier funnel (`/free` → `/free-results` → UpgradeComparisonSheet →
`/pricing` → checkout) shipped end-to-end, but was instrumented piecemeal — a
couple of ad-hoc events per PR — with **no coherent funnel view**. Competitive
read (Jobright/Teal/Huntr): we're at/above feature parity; our only structural
gap is a *measured, optimized* free→paid path. This doc defines the single
canonical event chain and the one funnel insight built on it.

## The canonical chain (6 ordered steps)

| # | Event | Fires where | Added by |
|---|-------|-------------|----------|
| 1 | `free_upload_started` | `/free` — resume submit intent (FreeUploadClient) | **AIC-785 (new)** |
| 2 | `free_results_viewed` | `/free-results` — snapshot rendered (FreeResultsClient) | **AIC-785 (new)** |
| 3 | `upgrade_sheet_opened` | `/free-results` — comparison drawer opened | AIC-777 (reused) |
| 4 | `pricing_viewed` | `/pricing` — page mount | AIC-742/744 (reused) |
| 5 | `checkout_started` | `/pricing` — checkout form submit | existing (reused) |
| 6 | `payment_verified` | Stripe webhook (authoritative) + client success page | AIC-739 (reused) |

Only **steps 1–2 were new**. Everything downstream already existed — per the
issue's "reuse/rename, don't duplicate" constraint, no new events were added for
3–6. All client events share the anonymous PostHog `distinct_id`; step 6 is
stitched server-side via Stripe metadata (`posthogDistinctId`) so the funnel
closes without an `identify()` call.

### Step property reference

- `free_upload_started` → `{ has_file: boolean }`
- `free_results_viewed` → `{ path_count: number, top_match_score: number }`
- `upgrade_sheet_opened` → `{ source: string, target_role?: string }`
- `pricing_viewed` → `{ source: string }`
- `checkout_started` → `{ plan: string, has_discount: boolean, cta_location?: string }`
- `payment_verified` → `{ session_id: string, source: "stripe_webhook" | "client_success_page" }`
  - **De-dupe:** count the `stripe_webhook` copy only; the client copy drops on
    adblock/redirect-fail and would double-count. (Documented in `tracking.ts`.)

## Branch/skip notes (important for reading the funnel)

The path is **not strictly linear** — the funnel insight is ordered but allows
users to skip steps:

- Step 3 (`upgrade_sheet_opened`) is **optional**: a free user can go straight
  from `/free-results` to `/pricing` via the sticky CTA without opening the sheet.
- Step 4 (`pricing_viewed`) can also be entered directly from the homepage/nav,
  i.e. outside the free flow. Segment by `source` when isolating the free funnel.
- The sheet's own CTA click is `upgrade_sheet_cta_clicked` (AIC-777) — a
  sub-signal *between* steps 3 and 4, not a funnel step itself.

Because of this, the PostHog funnel is configured with **"any order" off but
"steps can be skipped"** semantics (sequential, non-strict) so real drop-off is
visible without inflating exits at the optional sheet step.

## The one optimization shipped (AIC-785 item 3)

**Change:** the UpgradeComparisonSheet primary CTA ("Get Full Report — $19") now
deep-links to `/pricing#get-report` instead of `/pricing`.

**Rationale (highest-confidence, single change):** a user who clicks that CTA has
*already* seen a personalized free-vs-paid comparison and chosen the Report plan
inside the sheet. Landing them at the **top** of a three-tier pricing page forces
them to re-decide across Free/Report/Lifetime and scroll to reach the checkout —
a redundant decision step (Hick's Law) on the highest-intent segment. The anchor
drops them directly onto the $19 Report checkout form. Low-risk: a hash link +
`scroll-mt-24` on the Report card; no money-path/checkout logic changed.

**How we'll know it worked:** compare the `upgrade_sheet_opened → pricing_viewed
→ checkout_started` conversion legs before/after ship in the funnel below. If the
sheet→checkout rate rises without a Lifetime-mix shift, the fix landed. If it
regresses, revert is a one-line href change (no flag teardown needed).

## PostHog funnel insight

Built on dashboard 1809774 as a 6-step ordered conversion funnel over the events
above, 14-day window, `filterTestAccounts: true`, so the CMO's weekly review
(AIC-732/743) can see exactly where free users drop.

- **Insight:** "Free→Paid Conversion Funnel (AIC-785)" — short-id `xnaCi1t0`
- **URL:** https://us.posthog.com/project/381452/insights/xnaCi1t0
- **Order type:** `ordered` (sequence enforced, intermediate events allowed) so the
  optional sheet step doesn't inflate drop-off (see branch/skip notes above).

Data will populate as the newly-instrumented top-of-funnel events accrue; the
downstream 4 steps already have history.
