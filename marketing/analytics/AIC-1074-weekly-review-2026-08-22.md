# AIC-1074 — Weekly PostHog Analytics Review — 2026-08-22

**Source:** PostHog project 381452 (DelegateX / Default project), live MCP reads.
**Windows:** trailing 30 days (2026-07-23 → 2026-08-22 UTC) for funnel/feature volume; trailing 7 days for web KPIs (period-over-period). 30d used for the funnel because weekly volume is too low for a stable read.
**Goal context:** data-driven feature prioritization toward $1k MRR (parent AIC-718 distribution loop / AIC-914 weekly-feature line).

## 1. Web KPIs — last 7d vs prior 7d (test accounts excluded)

| Metric | This week | Prev | Δ |
|--------|-----------|------|---|
| Visitors | 89 | 72 | **+24%** |
| Pageviews | 123 | 115 | +7% |
| Sessions | 99 | 94 | +5% |
| Avg session duration | 82s | 130s | **−37%** |
| Bounce rate | **73.7%** | 67.0% | **+10% (worse)** |

Visitors up (blog/GEO cadence working on the traffic side), but **bounce rose to 73.7% and session duration fell 37%** — the incoming visitors are engaging *less*, not more. This is the loudest new signal this week.

## 2. Activation → revenue funnel (unordered, 30d)

| Step | Event | People | Conv. from top |
|------|-------|--------|----------------|
| 1 | `$pageview` (landed) | 293 | 100% |
| 2 | `free_upload_started` | 3 | **1.02%** |
| 3 | `free_results_viewed` | 2 | 0.68% |
| 4 | `checkout_started` | 0 | 0% |
| 5 | `payment_verified` | 0 | **0%** |

**Zero paid conversions in the last 30 days.** Over a 90d window checkout/payment *do* fire (`checkout_started` = 21, `payment_verified` = 7), so this is not an instrumentation gap — the last month simply produced no revenue events. The bottleneck is unchanged and unambiguous: **~99% of visitors never start the free tool.** Everything downstream is starved, not broken.

## 3. Feature usage (30d, raw event counts)

`honest_proof_shown` 10 · `feature_showcase_viewed` 10 · `pricing_viewed` 9 · `cta_clicked` 7 · `free_upload_started` 7 · `locked_report_preview_viewed` 3 · `free_results_viewed` 3 · `email_gate_shown` 2 · `free_time_to_aha` 2 · `pricing_plan_selected` 2 · `scroll_depth` 28 · `$rageclick` 1

**Read:** no feature is "broken by disuse" — every surface fires; usage is low because *funnel-top traffic that activates is low*. `pricing_viewed` 9 → `pricing_plan_selected` 2 is the only healthy-looking mid-funnel ratio and it's on a cohort too small to act on. Adding features would not move the number.

## 4. Errors / UX health

- **`$exception` = 0 captured** — but exception autocapture (error tracking) is **not enabled** in this project, so this is a *blind spot*, not a clean bill of health. We currently cannot answer "what's the client-side error rate?" — see task below.
- `$rageclick` = 1 in 30d → no meaningful rage signal at this volume.
- Session replay is enabled; at ~89 visitors/wk the recording sample is too thin to surface a systemic UX defect this cycle.

## 5. Prioritization decision — refuse feature bloat

Consistent with every prior weekly review (AIC-914, AIC-718) and competitive cycle (c1–c12): **the constraint is traffic + top-of-funnel activation + bounce, NOT feature gaps.** No new product features justified by this data.

The loudest actionable signal — bounce 73.7% / session duration −37% — is **already owned and in flight**, so we do not duplicate it:
- **AIC-1066** (Designer): cut the ~78% bounce, above-the-fold value.
- **AIC-1067** (CTO): fix poor LCP/CWV on home / `/pricing` / `/free`. Landing now (commits: SSR-rendered `/pricing` checkout #234, dropped JetBrains Mono preload #233, AVIF q50 home hero #232). Next week's bounce number is the readout on whether these helped.

**One genuinely-new, non-bloat action from this review:** enable `$exception` autocapture so future reviews can actually measure error rate (item 4 of this ticket is currently unanswerable). Small config change, pure data-quality win. → child issue created under AIC-1074.

## 6. North-star metrics to watch next cycle

1. **Bounce rate** (73.7% → target <65%) — direct readout of AIC-1066/1067.
2. **landing → `free_upload_started`** (currently ~1.0%) — the activation step that starves everything downstream.
3. **`payment_verified`** — 0 in last 30d; any non-zero is progress toward $1k MRR.

*Next review: ~2026-08-29 (weekly cadence). Re-pull the 7d web KPIs, the 5-step funnel, and the feature-usage table; check whether AIC-1066/1067 moved bounce.*
