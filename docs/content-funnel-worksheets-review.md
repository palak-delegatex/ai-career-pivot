# Career planning content and worksheet handoff

## Intent and scope

Improve the existing `/blog/how-to-use-ai-to-plan-career-pivot` reader journey, then support two narrower tasks: writing a career-pivot experiment and comparing evidence with a job posting. These are editorial/product-fit hypotheses, not validated search-volume opportunities or measured conversion improvements.

The supplied October 29–November 4 analysis reported 197 filtered visitors (136 in the preceding week), 32 visitors to the planning article, and sparse tracked actions. Those figures were not independently queried in this content task. Missing tracking prevents treating low event counts as proof that no conversions occurred.

## What changed

- Retained the high-traffic article's URL and original publication date; added a real revision date. Kept five usable prompts, removed unsupported model comparisons, invented benchmarking implications, broad outcome/statistical claims, and claims about product behavior that were not established by the current code.
- Replaced its in-body paid/waitlist CTAs with explicit free resume-snapshot invitations. Distinguished the posting-only quick-check from personalized resume analysis and the paid roadmap. No timing promises, automatic follow-up promises, or hiring predictions.
- Added a plan-template article and a skills-gap worksheet article, each with clearly labeled fictional examples, reciprocal links, an existing tracked CTA, and an ungated static download.
- Added links from the existing planning article to both guides/downloads. The guides are automatically discoverable through the existing blog/sitemap content enumeration; no pinned-post or related-post ranking changes.
- CareerOneStop and O*NET references were verified against their official pages. They support only the bounded descriptions of those resources, not product outcomes.

## Measurement

`FreeSnapshotCTA` uses `BlogCtaLink`, which emits `cta_clicked` with `blog_slug`, `cta_location=blog_free_snapshot`, CTA text and destination when client analytics is available. Both CTAs in the planning article intentionally share text/location, so current events identify article-level intent, not which placement was clicked.

This PR now changes the shared `FreeSnapshotCTA` destination from `/free` to `/free?mode=upload`, matching its resume-upload promise directly. Main already supports that server-side mode. This one-line correction is included here so these articles do not depend on PR #287's separate interactive journey changes. Existing click attribution remains unchanged except for the truthful destination.

For a future readout, compare per-article visitors and tracked CTA clickers, then inspect the same-session path to `free_upload_started` and rendered free-result events using the same internal/test/bot exclusions. Keep counts alongside rates and describe attribution gaps. Downloads and plain Markdown links do not gain a dedicated event in this change; do not count them as tracked conversions. No analytics configuration or paid-conversion metric was changed here.

## Existing work and Paperclip

#283, #285, #286 and #290 are merged as of the November 8 release review. #287 and #288 remain separate pending work. #286 already corrects the over-40 article to `/quiz` and the job-description article to the posting quick-check; those files were left unchanged. #287 covers contextual handoffs for other selected articles, not this planning article. #288's checkout recovery work remains on its independent branch.

Paperclip health still fails to connect at the configured `http://127.0.0.1:3100`; no current issue/agent state could be read and no coordination messages were delivered. When restored, ask the CMO to reconcile this draft with the content queue, and the CTO to validate event continuity with #287/#288. No settings or credentials were changed.

## Verification

- Repository honesty guard: three changed/new articles scanned, zero findings.
- All three MDX bodies compiled and server-rendered with a CTA stub; required frontmatter verified.
- Every Markdown internal article/download link resolves to an existing repository file.
- CSV verified as eight columns and five blank editable rows; Markdown worksheet exists and matches its article.
- `git diff --check` passed.
- The only shared UI change is the resume CTA destination described above. No new interaction, pricing, entitlement, analytics configuration, or provider call is added.
- November 8 release checks: independent content/component review, all three MDX bodies, eight-column CSV and all 21 generated locale article pages passed in the combined integration build. Standalone verification is recorded in the PR release update; hydrated interaction and conversion lift are not claimed.
