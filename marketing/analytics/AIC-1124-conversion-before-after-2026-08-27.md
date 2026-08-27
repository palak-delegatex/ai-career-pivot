# AIC-1124 — landing → free_upload_started: before/after the shipped conversion+CWV stack

**Date:** 2026-08-27 · **Owner:** CTO · **Parent:** c16 competitive cycle (AIC-1122)
**Dashboard:** 1809774 · **Funnel insight:** K6Lw61E5 · **Baseline:** ~1% (prior cycles)

## TL;DR — decisive result

**We cannot measure a before/after lift yet, and the reason IS the answer: TRAFFIC.**
The after-cohort is 1–2 days old and mathematically too small to detect any change at a
~1% baseline. This is not a tooling gap we can engineer around — it is the sample-size
(=traffic) constraint that 16 competitive cycles + every weekly review already identified.

**Go/no-go: NO-GO on further funnel-surface edits.** Freeze the funnel, let the
after-cohort accumulate a clean window, redirect effort to traffic (AIC-915 GEO cadence,
AIC-718 distribution). Confirmation re-pull folded into the weekly review line (~2026-09-09).

## 1. What shipped, and when (the "after" boundary)

| PR | Ship date | Change |
|----|-----------|--------|
| #245 (AIC-1097/1101) | 2026-08-25 | cut friction + flip on `/free?mode=upload` money path |
| #243 (AIC-1097) | 2026-08-25 | auto-start free snapshot on file select (remove a step) |
| #246 (AIC-1100) | 2026-08-25 | reduce mobile JS + halt always-on animations |
| #248 (AIC-1117) | 2026-08-26 | above-the-fold: collapse nav, outcome copy, single CTA |
| #249 (AIC-1110) | 2026-08-26 | preconnect analytics origins + trim below-fold image bytes |

**After-window as of today (2026-08-27): ~1–2 days.**

## 2. Why the measurement is premature (the math)

- Traffic ≈ **100 visitors/week ≈ 14 landing sessions/day** (per AIC-718 / AIC-1096 reads).
- Baseline landing → `free_upload_started` ≈ **1%** → expected ≈ **0.14 conversions/day**.
- The entire after-cohort so far ≈ **0–2 `free_upload_started` events.**
- To distinguish a real lift (e.g. 1% → 2%) from noise at conventional power you need
  **several hundred landing sessions per arm** → **~3–5 weeks** of accumulation at current
  traffic. A pull today would restate the pre-ship number ± noise, not inform a decision.

**The binding limitation on measurement is the same variable as the binding limitation on
the business: session volume. That is traffic.**

## 3. Data-path status this run

- **PostHog MCP: unreachable.** OAuth remote MCP (`mcp-remote`); absent in this headless run,
  consistent with AIC-1074 (08-22) and AIC-1096 (08-25) cycles. Repeated tool-search retries
  over ~30s surfaced no `posthog` tools.
- **No PostHog personal API key in env** → no curl fallback to the query API.
- **Net:** no fresh independent pull possible this heartbeat. Not a blocker for the decision
  (§2 makes the pull moot right now regardless of MCP), but noted.

## 4. Instrumentation audit — intact, no new work needed

The funnel this task asks to measure is already fully wired; nothing to instrument:

- `free_upload_started` fires at upload commit — `src/lib/tracking.ts:221`, called from
  `startAnalysis()` in `FreeUploadClient.tsx:288`, before the network round-trip so it counts
  everyone who commits.
- Landing = `$pageview`; funnel K6Lw61E5 on dashboard 1809774 already stitches
  `free_upload_started → free_results_viewed → … → payment_verified` on the anon distinct_id.

**Comparability caveat (flag when the real pull happens):** AIC-1097 moved the trigger point
from an explicit submit-click to **file-select auto-start** (`FreeUploadClient.tsx:384`). The
event now fires marginally *earlier* in the flow. So a naive before/after is slightly
confounded — a small "after" lift could be partly the earlier trigger, not purely reduced
friction. Interpret any sub-relative-50% lift with that in mind; a large lift would clear it.

## 5. Go/no-go decision

**NO-GO on further funnel-surface edits.** Rationale:

1. **We already shipped a full stack.** Continuing to edit the funnel before the after-cohort
   matures would confound the very readout this task exists to produce. Change freeze is the
   pre-condition for a clean measurement.
2. **The pre-existing binding constraint is traffic**, reaffirmed by §2's math and by 16
   competitive cycles + AIC-1074/1096 weekly reviews (activation ~1%, 0 paid/30d — starved,
   not broken). The bounce/CWV work already moved the needle it *could* move (73.7% → 65.7%,
   AIC-1096); the first-step activation gap is volume-bound.

**Redirect:** traffic is owned by **AIC-915** (daily GEO blog cadence, 110 posts live) and
**AIC-718** (distribution). No new CTO funnel tasks justified by this data.

## 6. Confirmation re-measure (deferred, not dropped)

- **Target date: ~2026-09-09** — gives a clean ≥2-week after window (ship = 08-25/26).
- **Owner path:** folded into the recurring weekly PostHog review (AIC-1096), whose next
  cycles (~08-31, ~09-07) give directional reads; the go/no-go-confirming pull is ~09-09 in a
  run where the OAuth MCP is reachable.
- **What to pull then:** landing → `free_upload_started` over 08-11→08-24 (before) vs
  08-27→09-09 (after), segmented mobile vs desktop; report relative lift + the §4 caveat.
- **Standing rule until then:** funnel surface frozen. If the 09-09 pull shows null lift, that
  is decisive confirmation the constraint is traffic and the freeze becomes permanent policy.
