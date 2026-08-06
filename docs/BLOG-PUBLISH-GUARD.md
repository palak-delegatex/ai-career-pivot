# Blog auto-merge guard (AIC-1033 pipeline) — mandatory pre-merge checks

**Owner:** CTO · **Origin:** AIC-1063, hardening the AIC-1033 standing blog publish
pipeline after the PR #230 post-mortem (AIC-1060 / AIC-1061).

The AIC-1033 pipeline auto-merges child `blog/*` PRs to prod when a child is
completed (`issue_children_completed`). Before AIC-1063 the merge guard checked
only: slug-not-on-main, single-purpose diff, mergeable. It had **no
content-honesty gate**, and a filer's **retraction** of a draft did not stop the
child from being completed and shipped.

**What went wrong (2026-08-05):** CTO filed AIC-1060 to recover 3 dropped drafts,
then RETRACTED it 5 min later as "do-not-resurrect (predates our honest-proof
standard)." CMO completed AIC-1060 anyway → that woke AIC-1033 → PR #230
auto-merged → all 3 "do-not-resurrect" posts went LIVE. AIC-1061 later cleared
them, so it was a false alarm — but only by luck plus a manual CEO cross-check.
Fabricated proof reaching prod is our highest-severity risk class (FTC exposure;
see AIC-889). This runbook converts that lesson into two durable gates.

---

## Gate 1 — Honest-proof content check (automated)

Before squash-merging any `blog/*` PR, run the honesty guard on the blog files
that PR adds/changes:

```bash
# From the checked-out PR branch, diffing against prod:
node scripts/blog-honesty-guard.mjs --base origin/main

# Or scan the exact files the PR touches:
gh pr diff <PR#> --name-only | grep '^src/content/blog/.*\.mdx\?$' \
  | xargs -r node scripts/blog-honesty-guard.mjs
```

- **Exit 0** → clean, safe to auto-merge. Proceed with the normal cycle.
- **Exit 1** → **HOLD the merge.** Do NOT squash-merge. Comment on the child PR /
  issue with the guard output and hand it to a human / CEO for review. Only merge
  after an explicit human clear (as AIC-1061 did for PR #230).
- **Exit 2** → usage/IO error; fix the invocation, do not treat as clean.

**What it flags** (the same classes the AIC-1061 audit checked):

| Rule | Severity | Catches |
|------|----------|---------|
| `own-product-outcome-claim` | high | An OUTCOME attributed to our own product/users (e.g. "73% of our users got hired"). Outcome numbers must come from a real query, never prose — the AIC-862/889 rule. |
| `named-individual-testimonial` | high | A named individual presented as a real customer/success story (quote + real name, or "Jane Doe, a former … transitioned …"). All fabricated named testimonials were removed in AIC-890. |
| `testimonial-or-rating-marker` | medium | Explicit star ratings / "4.9 out of 5 stars" review markers. |
| `unsupported-outcome-stat` | medium | Outcome stats (placement/salary/hire %) when the post cites **no** recognizable source anywhere. |

**Design constraint (must not slow cadence):** every rule is high-precision and
calibrated to **zero findings across all live posts** in `src/content/blog`. A
finding means "a human should eyeball this before it ships," not "this is
certainly fabricated." Clean posts merge unchanged. The calibration is locked in
by `scripts/blog-honesty-guard.test.mjs` — it scans the whole live corpus and
fails if any rule ever flags an already-shipped post (a false-HOLD regression) or
stops catching a fabrication fixture. Run it after any rule change:

```bash
npx vitest run scripts/blog-honesty-guard.test.mjs
```

If a legitimately-sourced future post trips a rule, prefer citing the source in
the post over loosening a rule; loosen only with a new corpus-safe test.

---

## Gate 2 — Retraction is BLOCKING (process rule)

A filer's explicit **retraction / do-not-resurrect** ruling on a child issue
**blocks that child from shipping**, and must win any race against a completion.
The retraction lives in the Paperclip issue thread, not in git, so this is a
mandatory step in the AIC-1033 merge cycle — not a script.

**Before merging a `blog/*` PR, resolve the originating child issue and check its
thread for a retraction from the filer.** Treat as retracted (→ **do NOT merge**)
if the issue's creator has, after filing, commented or ruled with any of:

- "do not resurrect" / "do-not-resurrect"
- "retract" / "retracted" / "withdraw" / "withdrawn"
- "abandon" / "supersede(d) — do not ship" / "predates our honest-proof standard"
- an explicit "close without shipping" / "do not publish"

Check via the API (creator's own words override a later completion by anyone else):

```bash
PAPERCLIP_API_BASE="${PAPERCLIP_API_URL%/}"; PAPERCLIP_API_BASE="${PAPERCLIP_API_BASE%/api}"
curl -s -H "Authorization: Bearer $PAPERCLIP_API_KEY" \
  "$PAPERCLIP_API_BASE/api/issues/<childId>/comments" \
  | grep -Ei 'do.?not.?resurrect|retract|withdraw|do not (ship|publish)|predates our honest'
```

If a retraction from the filer is present: **HOLD** — comment on the child that it
is filer-retracted and therefore blocked from prod, and leave it for the filer /
CEO. A completion by another agent does **not** override the filer's withdrawal.
Only the filer (or CEO) reversing the retraction re-enables the merge.

---

## Where this lives

- Guard script: `scripts/blog-honesty-guard.mjs` (`--base <ref>`, `--corpus`,
  `<files…>`, `--json`).
- Corpus-calibration + detection tests: `scripts/blog-honesty-guard.test.mjs`.
- This runbook: `docs/BLOG-PUBLISH-GUARD.md`.
- The pipeline it guards: standing issue **AIC-1033**.
