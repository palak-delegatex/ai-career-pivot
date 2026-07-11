# Directory-submission runner (AIC-809)

The automation half of the distribution pipeline (Option C on **AIC-800**). It submits
AICareerPivot to the **ToS-safe AI/SaaS directory backlog** — the pure listing sites.
It is **built and dry-run tested without a live key**; going live is a one-variable change.

> **Scope guardrail.** Reddit, forums, LinkedIn, Hacker News and Product Hunt are
> **deliberately excluded** — those stay on the human `OPERATOR-PASTE-KIT.md` (AIC-801)
> for ToS reasons. This runner only touches self-serve / account-listing directories.

## Files

| File | Role |
| --- | --- |
| `scripts/directory-submit-runner.mjs` | The runner (Node ESM CLI, zero deps) |
| `marketing/distribution/product-profile.json` | Canonical product copy — every value lifted from committed site metadata, no placeholders |
| `marketing/distribution/directories.json` | 20 per-directory adapters (submit URL, access level, ordered field plan) |
| `marketing/distribution/dry-run-output/dry-run-latest.{json,md}` | Latest rendered dry-run evidence |

## Dry-run (default — submits nothing)

```bash
node scripts/directory-submit-runner.mjs                 # all 20 directories
node scripts/directory-submit-runner.mjs --only dang-ai,toolify
```

For each directory it renders the **exact payload** (which product value goes in which
field) **and the exact browser-harness script that would run**, then writes both a JSON
and a Markdown log under `dry-run-output/`. It never opens a browser and never submits.

## Going live — the single runtime dependency

Live execution needs exactly one input, tracked on **AIC-800**:

```bash
export BROWSER_USE_API_KEY=...                                   # 1. the only new secret
printf '%s' "$BROWSER_USE_API_KEY" | browser-harness auth login --api-key-stdin   # 2. once
node scripts/directory-submit-runner.mjs --live --daemon aic809  # 3. fill + screenshot only
node scripts/directory-submit-runner.mjs --live --submit --daemon aic809  # 4. actually submit
```

Safety rails baked in:
- `--live` **aborts** with instructions if `BROWSER_USE_API_KEY` is unset (nothing submitted).
- Even with `--live`, the final submit button is **not** clicked unless `--submit` is also passed —
  so the first live pass is a visual fill-and-screenshot dry run against real pages.
- Uses the hosted headless path: `start_remote_daemon("aic809")` → run → `stop_remote_daemon`.
  This sidesteps the local-Chrome remote-debugging toggle that froze AIC-800.

The runner logic is identical if the board instead picks the **local-Chrome** lane — only the
daemon bootstrap line changes — so this is not wasted under either automation decision.

### Two task-specific helpers the live path calls

The generated scripts call `fill_field(label=, value=)` and `click_submit()`. These are thin
task-specific wrappers (per the browser-harness SKILL, task-specific helpers live in
`agent_helpers.py`). Reference implementations, built on documented primitives:

```python
def fill_field(label, value):
    # locate the input whose label/placeholder/name matches `label`, focus, type
    sel = js(f"""(() => {{
      const q = {label!r}.toLowerCase();
      const els = [...document.querySelectorAll('input,textarea')];
      const hit = els.find(e => (
        (e.labels && [...e.labels].some(l => l.innerText.toLowerCase().includes(q))) ||
        (e.placeholder||'').toLowerCase().includes(q) ||
        (e.name||'').toLowerCase().includes(q) ||
        (e.getAttribute('aria-label')||'').toLowerCase().includes(q)
      ));
      if (!hit) return null;
      const r = hit.getBoundingClientRect();
      return {{x: r.x + r.width/2, y: r.y + r.height/2}};
    }})()""")
    if not sel:
        print(f"  ! field not found for label={label!r} — screenshot for manual review")
        capture_screenshot(); return
    click_at_xy(sel['x'], sel['y'])
    type_text(value)

def click_submit():
    capture_screenshot()  # human/agent confirms the button before the coordinate click
    # find a submit-ish button, click its center
    sel = js("""(() => {
      const b = [...document.querySelectorAll('button,input[type=submit]')]
        .find(e => /submit|add|send|list|post/i.test(e.innerText||e.value||''));
      if (!b) return null; const r=b.getBoundingClientRect();
      return {x:r.x+r.width/2, y:r.y+r.height/2};
    })()""")
    if sel: click_at_xy(sel['x'], sel['y'])
```

Keeping label→input resolution in a helper (not hard-coded selectors) means a directory
that tweaks its form still works, and the runner config stays copy-only.

## Directories wired (20)

10 self-serve (open form) · 10 account (free signup first) · 0 approval-gated at submit time.
See `directories.json` for the per-directory field plan. Access level = the friction the runner
hits live; `account` directories need a one-time login the operator/agent completes in-session.

`futuretools · topai-tools · aiscout · easywithai · aitoolhunt · aixploria · insanelycooltools ·
aitoolsdirectory · dang-ai · toolify · futurepedia · uneed · openfuture · aitoolmall · saashub ·
saasworthy · alternativeto · startupstash · toolpilot · aitools-fyi`

> Submit URLs are the canonical known endpoints as of 2026-07-11. Live mode navigates and
> screenshots **before** filling, so a moved/renamed form surfaces immediately rather than
> silently misfiring.

## Gate

Do **not** provision or guess `BROWSER_USE_API_KEY`, and do **not** run `--live --submit`
until the board drops the key into the agent env (tracked on AIC-800). Dry-run is safe to run
anytime and is the proof this runner is ready.
