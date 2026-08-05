# AIC-914 — Weekly PostHog Feature/Funnel Review — 2026-08-04

**Source:** PostHog project 381452 (DelegateX / Default project), live MCP reads.
**Window:** trailing 30 days, 2026-07-06 → 2026-08-05 (UTC). 30d used (not 7d) because weekly volume is too low for a stable funnel read.
**Goal context:** data-driven feature prioritization toward $1k MRR (parent AIC-815 / AIC-718 distribution loop).

## 1. Activation → revenue funnel (unordered, 30d)

| Step | Event | People | Conv. from top |
|------|-------|--------|----------------|
| 1 | `$pageview` (landed) | 272 | 100% |
| 2 | `free_upload_started` | 7 | **2.57%** |
| 3 | `free_results_viewed` | 6 | 2.21% |
| 4 | `cta_clicked` | 3 | 1.10% |
| 5 | `checkout_started` | 1 | 0.37% |
| 6 | `payment_verified` | 1 | 0.37% |

(Raw event counts corroborate: `free_upload_started` = 10 events / **5 unique users**; `payment_verified` = 2 events / 2 users.)

**The bottleneck is the very first step.** 272 visitors → only ~5–7 ever start the free tool. Everything downstream (results → CTA → checkout → pay) converts *reasonably* for the tiny cohort that makes it in. We are not losing people at pricing or checkout — **we lose ~97% before they try the product at all.**

## 2. Feature usage (30d, unique users)

Most-used real product surfaces:
- `pricing_viewed` 9 · `feature_showcase_viewed` 11 · `feature_showcase_tab_changed`/`cta_clicked` ~6
- `free_upload_started` 5 · `free_results_viewed` 3 · `ai_insights_received` 1
- `onboarding_started`/`onboarding_completed` = 1 each · tour funnel `tour_started` 2 → `tour_completed` 1 (near-zero; activation is `/free`, not a formal onboarding)
- Warm-intro / upgrade-sheet / locked-report surfaces: 1 user each — too little traffic to read.

**Read:** no feature is "broken by low usage" — usage is low because *traffic into the funnel top is low*. Adding features would not move the number; getting more of the 272 to press "start" would.

## 3. Errors / UX health

- **`$exception` = 0** captured in 30d → no crash/JS-error problem. Stability is fine.
- **`order_persist_failed` = 1** → the known `orders.recovery_email_sent_at` column drift (AIC-869). Real but rare; already tracked, blocks checkout-recovery email only.
- `$rageclick` / `$dead_click` = 0 → no obvious UX rage signal at this volume.
- `$autocapture` shows 187 events but only 13 users (vs 272 pageview users) → autocapture is sparse/likely internal; not a signal source here.

## 4. Prioritization decision

Consistent with every competitive-research cycle (c1–c10) and the AIC-718 distribution read: **the constraint is traffic + top-of-funnel activation, NOT feature gaps.** We decline new-feature bloat.

Two levers, in order:

1. **Top-of-funnel activation (on-site, highest-leverage we control):** lift landing → `free_upload_started` from 2.6%. The already-built value-before-signup work targets exactly this and is stuck in review:
   - **AIC-830** — anon ATS quick-check on `/free` (PR #129) — show value before asking for upload/signup.
   - **AIC-859** — `/free` aha ring + role personalization + proof placement (PR #140).
   Landing these to prod and watching the landing→`free_upload_started` rate is the single most data-justified action. → follow-up child created under AIC-914.
2. **Traffic ceiling:** 272 visitors/30d caps absolute revenue. Owned by AIC-718 (referral/share loop = highest-leverage next; CTO child 23580be3). No new action here; measurement is live.

## 5. North-star metric to watch next cycle

`landing → free_upload_started` conversion (currently **2.6%**). If the AIC-830/859 activation work ships, this is the number that must move. Downstream funnel (results→CTA→checkout→pay) is already acceptable and should not be re-optimized until the top step improves.

*Next review: ~2026-08-11 (weekly cadence). Re-pull the same 6-step funnel + event-usage table.*
