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

Current main sends that component to `/free`, whose initial mode is the posting quick-check; readers can choose resume upload. Copy explicitly names the resume-upload option. PR #287 changes the component destination to `/free?mode=upload`; the same copy remains accurate there. This PR does not duplicate the component change.

For a future readout, compare per-article visitors and tracked CTA clickers, then inspect the same-session path to `free_upload_started` and rendered free-result events using the same internal/test/bot exclusions. Keep counts alongside rates and describe attribution gaps. Downloads and plain Markdown links do not gain a dedicated event in this change; do not count them as tracked conversions. No analytics configuration or paid-conversion metric was changed here.

## Existing work and Paperclip

Verified #283 and #285–#288 remain open. #286 already corrects the over-40 article to `/quiz` and the job-description article to the posting quick-check; those files were left unchanged. #287 covers contextual handoffs for other selected articles, not this planning article. #288's checkout recovery work remains on its independent branch.

Paperclip health still fails to connect at the configured `http://127.0.0.1:3100`; no current issue/agent state could be read and no coordination messages were delivered. When restored, ask the CMO to reconcile this draft with the content queue, and the CTO to validate event continuity with #287/#288. No settings or credentials were changed.

## Verification

- Repository honesty guard: three changed/new articles scanned, zero findings.
- All three MDX bodies compiled and server-rendered with a CTA stub; required frontmatter verified.
- Every Markdown internal article/download link resolves to an existing repository file.
- CSV verified as eight columns and five blank editable rows; Markdown worksheet exists and matches its article.
- `git diff --check` passed.
- No new UI, routing, or analytics code. Full browser/product integration and conversion lift are not claimed. Keep in draft for editorial review and live destination QA before merge.
