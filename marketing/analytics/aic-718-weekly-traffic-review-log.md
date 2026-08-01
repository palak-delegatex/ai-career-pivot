# AIC-718 — Weekly Traffic Review Log (AIC-439 growth loop)

Source of truth for the recurring PostHog weekly review. Project **381452** (DelegateX),
read live via the PostHog MCP. Gates: **Wk4 ≥75 pv/wk & ≥15% organic · Wk8 ≥180 & 25% · Wk12 ≥360 & 35%.**

Gate action on a Week-4 pageview miss: escalate a paid-pilot budget request to CEO — but only
when organic growth is *failing*. When organic is compounding and the pv gate is within reach on a
positive slope, hold spend and re-gate the following week (incrementality / budget discipline).

---

## 2026-08-01 — measurement RESTORED; strong organic recovery

**Access note:** Live PostHog read restored via the PostHog MCP (project 381452). The prior
"human-gated measurement" blocker (Chrome remote-debug / missing API key) is resolved — the weekly
review is now self-serviceable each cycle. All numbers below are real reads, not estimates.

### Traffic (last 7 days: 2026-07-25 → 2026-08-01)
| Metric | 7d | 30d |
|---|---|---|
| Pageviews | **68** | 299 |
| Visitors | 42 | 195 |
| Sessions | 48 | 219 |
| Avg session duration | 163s | 105s |
| Bounce rate | 60.4% | 73.1% |

Baseline (last real read 2026-07-05): **~19 pv/wk**, ~6% organic, UTM 100% null.
→ **~3.6x pageviews** and organic share **~6% → ~28.6%** since baseline.

### Channel mix (7d, share of visitors)
| Channel | Visitors | Share |
|---|---|---|
| Direct | 24 | 57.1% |
| **Organic Search** | **12** | **28.6%** |
| AI (answer engines) | 3 | 7.1% |
| Referral | 2 | 4.8% |
| Organic Video | 1 | 2.4% |

### Referring domains (7d)
$direct 62% · **google.com 19%** · msn.com 4.8% · bing.com 2.4% (11 pv) · **youraitoolshop.com** (referral/backlink) · **github.com** (awesome-list PRs) · qwant.com · copilot.microsoft.com · youtube.com

### UTM sources (7d) — AIC-719 capture fix confirmed working
null 88% (legitimate direct+organic) · **copilot.com 7.1%** · **chatgpt.com 4.8%**.
No campaign-tagged distribution traffic yet (external social/directory slots remain human-gated), but
UTM is no longer 100% null — AI-engine referrals now attribute.

### Top pages (7d) — blog/GEO is the engine
`/` (home) 18 pv · `/blog/ai-jobs-hiring-2026-without-coding` · `/blog/career-change-at-35-complete-guide` · `/blog/best-ai-career-coaching-tools-2026` · `/blog/how-to-use-ai-to-plan-career-pivot` + 6 more blog posts. Blog aggregate >½ of traffic.

### Gate check (Week-4: ≥75 pv/wk & ≥15% organic)
- **Organic share: 28.6% — PASS** (decisively; ~1.9x the 15% threshold).
- **Pageviews: 68 pv/wk — technical MISS vs 75** (91% of target), but on a steep positive slope (3.6x baseline) with organic overperforming and AI-engine + backlink channels newly live.

### Decision: on-track — do NOT trigger paid-pilot escalation this cycle
Rationale: the paid-pilot escalation exists to rescue *failing* organic growth. Organic is
compounding (3.6x traffic, 28.6% organic, AI-answer-engine citations + github/directory backlinks
landing). Spending paid budget 7 pageviews short of gate, against that slope, fails incrementality
and budget-discipline tests. **Trigger condition for next cycle:** if the next weekly read shows
pv/wk still <75 AND organic share flat/declining, escalate the paid pilot to CEO with CAC assumptions.

### Instrumentation gap found (→ CTO child)
The share-loop events named in the playbook review step — `assessment_shared` and
`content_share_clicked` — **do not exist** in project 381452's event schema. The viral/share loop is
currently **unmeasurable** (viral coefficient can't be computed). Filed as a CTO child to instrument
share events on the assessment share card + blog share CTAs.

### Distribution shipped this cycle
- **PR #159 (MERGED)** — GEO comparison article `ai-career-tools-vs-career-coach-2026.mdx`
  (AI career tools vs a career coach). Answer-first + faq/tldr for AI-answer-engine citation; primary
  CTA → /assessment (share-loop entry). Satisfies "≥1 asset/week to /assessment."
- External community/directory slots (Reddit/LinkedIn/X) remain human-gated (operator paste-kit lane).

**Next review:** ~2026-08-08 (weekly). Measurement now self-serviceable via PostHog MCP.
