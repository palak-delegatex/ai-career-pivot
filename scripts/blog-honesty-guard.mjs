#!/usr/bin/env node
/**
 * blog-honesty-guard.mjs — AIC-1063 (hardening from the PR #230 post-mortem)
 *
 * The AIC-1033 blog publish pipeline auto-merges child `blog/*` PRs to prod on
 * `issue_children_completed`. Before AIC-1063 that merge guard checked only
 * slug-not-on-main + single-purpose + mergeable — it had NO content-honesty
 * gate. On 2026-08-05 three "do-not-resurrect" drafts rode a completion to prod
 * via PR #230; the AIC-1061 audit later cleared them, but only by luck. This
 * script turns that post-mortem lesson into a durable pre-merge check.
 *
 * Fabricated proof reaching prod is our highest-severity risk class (FTC
 * exposure; see AIC-889 fabricated-testimonials incident). The hard rule that
 * governs the honest-proof surfaces (src/lib/credibility.ts, src/lib/honest-proof.ts)
 * is: never claim an own-product/user OUTCOME, never present a named individual
 * as a real customer, never cite an unsupported specific stat. This guard scans
 * the ADDED/CHANGED blog markdown of a PR for those exact patterns.
 *
 * Design constraint (from the ticket): must NOT slow cadence. Clean posts merge
 * unchanged. So every rule is high-precision — calibrated to ZERO findings
 * across the 103 already-audited live posts in src/content/blog. A finding
 * therefore means "a human/CEO should eyeball this before it ships," not "this
 * is definitely fabricated." On a finding the AIC-1033 cycle HOLDS the merge
 * and comments for review instead of auto-shipping.
 *
 * Exit codes:
 *   0  clean — safe to auto-merge
 *   1  one or more honesty findings — HOLD the merge, request human/CEO review
 *   2  usage / IO error
 *
 * Usage:
 *   # Scan the blog files a branch adds/changes vs a base ref (the merge case):
 *   node scripts/blog-honesty-guard.mjs --base origin/main
 *
 *   # Scan explicit files (e.g. from `gh pr diff --name-only`):
 *   node scripts/blog-honesty-guard.mjs src/content/blog/foo.mdx
 *
 *   # Prove zero false-positives across the whole live corpus:
 *   node scripts/blog-honesty-guard.mjs --corpus
 *
 *   # JSON output for the pipeline to parse:
 *   node scripts/blog-honesty-guard.mjs --base origin/main --json
 */

import { readFileSync, existsSync, readdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join, relative } from "node:path";
import { execFileSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const BLOG_DIR = join(ROOT, "src", "content", "blog");

// --------------------------------------------------------------- honesty rules
//
// Each rule is { id, severity, describe(match), test(sentence) -> match|null }.
// Rules run per-sentence so an anchor and its outcome must actually co-occur —
// the single biggest source of false positives is matching an ownership phrase
// in one paragraph against an unrelated stat three paragraphs away.
//
// Source-cue allowlist: a specific stat is only flagged when NOTHING in its
// sentence attributes it to a real, checkable source. Kept generous on purpose
// (a missed borderline stat is cheap; a false HOLD burns cadence).
const SOURCE_CUE =
  /\b(BLS|Bureau of Labor|OEWS|Anthropic|Claude|Stripe|PwC|McKinsey|BCG|Boston Consulting|Gartner|Deloitte|Forrester|Microsoft|Deutsche Bank|Goldman|Morgan|IBM|Amazon|Nvidia|Salesforce|LinkedIn|Indeed|Glassdoor|Work Trend Index|World Economic Forum|WEF|O\*?NET|Pew|Statista|Census|OECD|IMF|Stanford|MIT|Harvard|Challenger|according to|reported by|per (a|the)\b|study|studies|survey|surveys|report|reports|analysts?|research|index (finds?|shows?)|data (from|shows?|suggests?)|found that|source:|sources:|https?:\/\/|\.gov|\.edu)\b/i;

// Anchors that tie a claim to OUR product / OUR users specifically.
const OWN_PRODUCT_ANCHOR =
  /\b(our\s+(users?|customers?|clients?|members?|students?|subscribers?)|AICareerPivot|ai-?career-?pivot(?:\.com)?|(?:with|using|on|through)\s+our\s+(tool|platform|product|app|service)|users?\s+of\s+our\b)\b/i;

// Outcome signals — the "results" half of a claim.
const OUTCOME_SIGNAL =
  /\b(\d{1,3}%|landed (a|the|their)|got hired|were hired|get hired\b(?!.*\bhow\b)|got (a|their) (job|role|offer)|salary (increase|bump|jump|boost)|pay (raise|bump)|placement rate|success rate|hire rate|average (increase|salary|raise)|helped [^.]{0,40}\b(land|get|find|earn|secure)\b|thousands of (users|people|career changers) who)\b/i;

// A proper personal name: "Firstname Lastname" or "Firstname, a/an <role>".
const PROPER_NAME =
  /\b([A-Z][a-z]{2,}\s+[A-Z][a-z]{2,}|[A-Z][a-z]{2,},\s+(a|an|former|ex-)\b)/;

// Testimonial framing that presents a person as a real, quoted/successful case.
const TESTIMONIAL_FRAME =
  /(["“][^"”]{20,}["”]\s*[—–-]\s*[A-Z]|[—–-]\s*[A-Z][a-z]+ [A-Z][a-z]+,\s+(former|ex-|a |an )|\b(says?|said|recalls?|shared with us|told us|explains? that)\s+[A-Z][a-z]{2,}\b|\b[A-Z][a-z]{2,},\s+(a|an|former|ex-)[^.]{0,60}\b(landed|pivoted|transitioned|switched|now works|got hired|doubled|tripled|increased (her|his|their) salary)\b)/;

// Explicit star / numeric rating markers. Deliberately NARROW: a quoted phrase
// followed by an em-dash is ordinary editorial punctuation, not a testimonial,
// so it is NOT matched here — named testimonials are caught by the rule above.
const TESTIMONIAL_MARKER =
  /(★{2,}|⭐{2,}|\b(rated|scored)\s+\d(\.\d)?\s*(out of|\/)\s*5\b|\b\d(\.\d)?\s*(out of|\/)\s*5\s+stars?\b|\b\d(\.\d)?\s+star\s+(rating|review)\b)/i;

const RULES = [
  {
    id: "own-product-outcome-claim",
    severity: "high",
    describe: () =>
      "Attributes a specific OUTCOME to our own product/users — the exact fabricated-outcome pattern AIC-862/889 forbid. Every outcome number must come from a real query, never prose.",
    test(sentence) {
      if (OWN_PRODUCT_ANCHOR.test(sentence) && OUTCOME_SIGNAL.test(sentence)) {
        return sentence.match(OWN_PRODUCT_ANCHOR)[0];
      }
      return null;
    },
  },
  {
    id: "named-individual-testimonial",
    severity: "high",
    describe: () =>
      "Presents a named individual as a real customer/success story. We removed all fabricated named testimonials in AIC-890; new ones must not reappear.",
    test(sentence) {
      if (PROPER_NAME.test(sentence) && TESTIMONIAL_FRAME.test(sentence)) {
        return sentence.match(TESTIMONIAL_FRAME)[0].slice(0, 80);
      }
      return null;
    },
  },
  {
    id: "testimonial-or-rating-marker",
    severity: "medium",
    describe: () =>
      "Contains an explicit testimonial block or star/rating marker attributed to a person — verify it is real and consented before shipping.",
    test(sentence) {
      const m = sentence.match(TESTIMONIAL_MARKER);
      return m ? m[0].slice(0, 80) : null;
    },
  },
  {
    id: "unsupported-outcome-stat",
    severity: "medium",
    describe: () =>
      "States specific outcome statistics (hiring/salary/success %) but the post cites NO recognizable source ANYWHERE. Cite a real source (BLS, a named study/org, a URL) or soften to qualitative.",
    // Document-level: real posts source their market stats at the post/footer
    // level (a "Sources:" line, a named org), not per-sentence. We only flag an
    // outcome-framed stat when the WHOLE post lacks any source cue — the actual
    // fabrication smell. `ctx.docSourced` is computed once per file.
    test(sentence, ctx) {
      if (ctx.docSourced) return null;
      // A % tied to an OUTCOME (a premium, a rate, or people getting hired) —
      // not just any % near a pay word (negotiation ranges are advice, not a
      // fabricated result).
      const outcomePremium = /\b\d{1,3}(?:\.\d+)?%\s*(?:more|higher|premium)\b/i;
      const outcomeRate = /\b\d{1,3}(?:\.\d+)?%\s*(?:placement|success|hire|hiring)\s*rate\b/i;
      const outcomeGotJob =
        /\b\d{1,3}(?:\.\d+)?%[^.]{0,30}\b(?:got hired|were hired|landed (?:a|their)|got (?:a|their) (?:job|offer|role)|salary premium)\b/i;
      // A proportion OF A POPULATION achieving something ("87% of career changers…").
      const statFirst =
        /\b(of\s+)?(career changers?|job seekers|graduates?)[^.]{0,40}\b\d{1,3}(\.\d+)?%|\b\d{1,3}(\.\d+)?%\s+of\s+(career changers?|job seekers|graduates?)\b/i;
      if (
        outcomePremium.test(sentence) ||
        outcomeRate.test(sentence) ||
        outcomeGotJob.test(sentence) ||
        statFirst.test(sentence)
      ) {
        const m = sentence.match(/\b\d{1,3}(\.\d+)?%/);
        return m ? m[0] : "stat";
      }
      return null;
    },
  },
];

// --------------------------------------------------------------- scanning core

/** Strip YAML frontmatter so title/description don't double-count. */
function stripFrontmatter(text) {
  if (text.startsWith("---")) {
    const end = text.indexOf("\n---", 3);
    if (end !== -1) return text.slice(text.indexOf("\n", end + 1) + 1);
  }
  return text;
}

/** Split body into sentence-ish units for co-occurrence precision. */
function toSentences(body) {
  return body
    // treat line breaks and list items as unit boundaries too
    .split(/(?<=[.!?])\s+|\n{1,}|(?:^|\n)[-*]\s+/m)
    .map((s) => s.trim())
    .filter(Boolean);
}

export function scanContent(text) {
  const body = stripFrontmatter(text);
  const sentences = toSentences(body);
  // Document-level context shared across per-sentence rules.
  const ctx = { docSourced: SOURCE_CUE.test(body) };
  const findings = [];
  for (const sentence of sentences) {
    for (const rule of RULES) {
      const match = rule.test(sentence, ctx);
      if (match) {
        findings.push({
          rule: rule.id,
          severity: rule.severity,
          match,
          why: rule.describe(match),
          excerpt: sentence.length > 200 ? sentence.slice(0, 197) + "…" : sentence,
        });
      }
    }
  }
  return findings;
}

export function scanFile(path) {
  return scanContent(readFileSync(path, "utf8"));
}

// --------------------------------------------------------------- file discovery

/** Blog files a branch adds/changes vs a base ref (the auto-merge case). */
function changedBlogFiles(base) {
  let out;
  try {
    out = execFileSync(
      "git",
      ["diff", "--name-only", "--diff-filter=d", `${base}...HEAD`],
      { cwd: ROOT, encoding: "utf8" }
    );
  } catch {
    // fall back to a two-dot diff if the merge-base form fails
    out = execFileSync("git", ["diff", "--name-only", "--diff-filter=d", base], {
      cwd: ROOT,
      encoding: "utf8",
    });
  }
  return out
    .split("\n")
    .map((s) => s.trim())
    .filter((p) => p.startsWith("src/content/blog/") && /\.mdx?$/.test(p))
    .map((p) => join(ROOT, p));
}

function corpusFiles() {
  return readdirSync(BLOG_DIR)
    .filter((f) => /\.mdx?$/.test(f))
    .map((f) => join(BLOG_DIR, f));
}

// --------------------------------------------------------------- CLI

function parseArgs(argv) {
  const a = { base: null, corpus: false, json: false, files: [] };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--base") a.base = argv[++i];
    else if (t === "--corpus") a.corpus = true;
    else if (t === "--json") a.json = true;
    else if (t === "--help" || t === "-h") a.help = true;
    else a.files.push(resolve(t));
  }
  return a;
}

function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 45).join("\n").replace(/^ \* ?/gm, ""));
    process.exit(0);
  }

  let files = [];
  if (args.corpus) files = corpusFiles();
  else if (args.base) files = changedBlogFiles(args.base);
  else if (args.files.length) files = args.files;
  else {
    console.error("usage: blog-honesty-guard.mjs [--base <ref> | --corpus | <files...>] [--json]");
    process.exit(2);
  }

  const report = [];
  for (const f of files) {
    if (!existsSync(f)) continue;
    const findings = scanFile(f);
    if (findings.length) report.push({ file: relative(ROOT, f), findings });
  }

  if (args.json) {
    console.log(JSON.stringify({ scanned: files.length, flagged: report }, null, 2));
    process.exit(report.length ? 1 : 0);
  }

  if (!files.length) {
    console.log("No blog files to scan — nothing to gate.");
    process.exit(0);
  }
  if (!report.length) {
    console.log(`✓ Honesty guard clean — ${files.length} blog file(s) scanned, 0 findings. Safe to auto-merge.`);
    process.exit(0);
  }

  console.log(`✗ Honesty guard HOLD — ${report.length} of ${files.length} file(s) flagged. Do NOT auto-merge; request human/CEO review.\n`);
  for (const { file, findings } of report) {
    console.log(`  ${file}`);
    for (const fnd of findings) {
      console.log(`    [${fnd.severity}] ${fnd.rule} — matched: ${JSON.stringify(fnd.match)}`);
      console.log(`      ${fnd.why}`);
      console.log(`      ↳ "${fnd.excerpt}"`);
    }
    console.log("");
  }
  process.exit(1);
}

// Run as CLI only (keep exports importable by the test).
if (process.argv[1] && resolve(process.argv[1]) === resolve(fileURLToPath(import.meta.url))) {
  main();
}
