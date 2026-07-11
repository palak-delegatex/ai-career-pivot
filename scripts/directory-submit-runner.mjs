#!/usr/bin/env node
/**
 * directory-submit-runner.mjs — AIC-809 (Option C automation half of AIC-800)
 *
 * Submits AICareerPivot to the ToS-safe AI/SaaS directory backlog. Reddit,
 * forums, LinkedIn, Hacker News and Product Hunt are NOT handled here — they
 * stay on the human OPERATOR-PASTE-KIT.md (AIC-801) for ToS reasons.
 *
 * Data sources (no placeholders):
 *   - marketing/distribution/product-profile.json   (canonical product copy)
 *   - marketing/distribution/directories.json        (per-directory adapters)
 *
 * Modes:
 *   --dry-run  (DEFAULT) Render the exact payload + the exact browser-harness
 *              script that WOULD run for each directory. Submits nothing.
 *              Writes a JSON + Markdown log under the --out dir.
 *   --live     Drive browser-harness for real. GATED: requires
 *              BROWSER_USE_API_KEY in env AND the explicit --live flag.
 *              Even in --live it only fills + screenshots; it does NOT click the
 *              final submit button unless --submit is ALSO passed.
 *
 * Usage:
 *   node scripts/directory-submit-runner.mjs                 # dry-run all
 *   node scripts/directory-submit-runner.mjs --only dang-ai,toolify
 *   node scripts/directory-submit-runner.mjs --live --daemon aic809   # (needs key)
 *   node scripts/directory-submit-runner.mjs --live --submit --daemon aic809
 *
 * The single runtime dependency for live execution is documented in
 * marketing/distribution/DIRECTORY-RUNNER.md.
 */

import { readFileSync, writeFileSync, mkdirSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, resolve, join } from "node:path";
import { spawnSync } from "node:child_process";

const __dirname = dirname(fileURLToPath(import.meta.url));
const ROOT = resolve(__dirname, "..");
const DIST = join(ROOT, "marketing", "distribution");

// ---------------------------------------------------------------- args
function parseArgs(argv) {
  const a = {
    live: false,
    submit: false,
    only: null,
    daemon: "aic809",
    out: join(DIST, "dry-run-output"),
  };
  for (let i = 0; i < argv.length; i++) {
    const t = argv[i];
    if (t === "--live") a.live = true;
    else if (t === "--dry-run") a.live = false;
    else if (t === "--submit") a.submit = true;
    else if (t === "--only") a.only = (argv[++i] || "").split(",").map((s) => s.trim()).filter(Boolean);
    else if (t === "--daemon") a.daemon = argv[++i];
    else if (t === "--out") a.out = resolve(argv[++i]);
    else if (t === "--help" || t === "-h") a.help = true;
  }
  return a;
}

// ---------------------------------------------------------------- field resolution
// Every role maps to real committed copy — see product-profile.json.
const FIELD_LABEL = {
  productName: "Product / tool name",
  websiteUrl: "Website URL",
  tagline: "Tagline",
  shortDescription: "Short description",
  mediumDescription: "Description",
  longDescription: "Full description",
  category: "Category",
  pricing: "Pricing",
  email: "Contact email",
  twitter: "Twitter / X",
  logoUrl: "Logo URL",
  tags: "Tags / keywords",
};

function resolveField(role, dir, profile) {
  switch (role) {
    case "productName": return profile.name;
    case "websiteUrl": return profile.url;
    case "tagline": return profile.tagline;
    case "shortDescription": return profile.blurbs.short;
    case "mediumDescription": return profile.blurbs.medium;
    case "longDescription": return profile.blurbs.long;
    case "category": return dir.category || profile.primaryCategory;
    case "pricing": return `${profile.pricing} — ${profile.pricingDetail}`;
    case "email": return profile.contactEmail;
    case "twitter": return profile.twitter;
    case "logoUrl": return profile.logoUrl;
    case "tags": return profile.tags.join(", ");
    default: throw new Error(`Unknown field role: ${role}`);
  }
}

function renderPayload(dir, profile) {
  const fields = dir.fields.map((role) => {
    const value = resolveField(role, dir, profile);
    if (value == null || value === "") throw new Error(`Empty value for role "${role}" in ${dir.slug}`);
    return { role, label: FIELD_LABEL[role] || role, value };
  });
  return { slug: dir.slug, name: dir.name, submitUrl: dir.submitUrl, access: dir.access, category: dir.category, fields };
}

// ---------------------------------------------------------------- browser-harness script generation
function py(s) { return JSON.stringify(String(s)); } // safe python string literal (JSON is valid py for str)

function buildHarnessScript(payload, { submit }) {
  const lines = [];
  lines.push(`# browser-harness script for ${payload.name} (${payload.slug})`);
  lines.push(`new_tab(${py(payload.submitUrl)})`);
  lines.push(`wait_for_load()`);
  lines.push(`ensure_real_tab()`);
  lines.push(`print("== " + ${py(payload.name)} + " submit page ==")`);
  lines.push(`print(page_info())`);
  lines.push(`capture_screenshot()  # before — confirms the form is present / not moved`);
  lines.push(`# Field plan — match each label to its input and type the value:`);
  for (const f of payload.fields) {
    lines.push(`fill_field(label=${py(f.label)}, value=${py(f.value)})  # role=${f.role}`);
  }
  lines.push(`capture_screenshot()  # after fill — verify values landed`);
  if (submit) {
    lines.push(`click_submit()  # LIVE SUBMIT (enabled via --submit)`);
    lines.push(`wait_for_load()`);
    lines.push(`capture_screenshot()  # confirmation`);
  } else {
    lines.push(`# submit intentionally NOT clicked (pass --submit to enable)`);
  }
  return lines.join("\n");
}

// ---------------------------------------------------------------- rendering helpers
function printPayload(p) {
  const gate = p.access === "self-serve" ? "open form" : p.access === "account" ? "free login first" : "moderation queue";
  console.log(`\n── ${p.name}  [${p.slug}]`);
  console.log(`   URL:      ${p.submitUrl}`);
  console.log(`   Access:   ${p.access} (${gate})`);
  console.log(`   Payload:`);
  for (const f of p.fields) {
    const v = f.value.length > 100 ? f.value.slice(0, 97) + "..." : f.value;
    console.log(`     • ${f.label.padEnd(22)} ${v}`);
  }
}

function toMarkdown(payloads, meta) {
  const l = [];
  l.push(`# Directory-submission dry-run — ${meta.stamp}`);
  l.push("");
  l.push(`Runner: \`scripts/directory-submit-runner.mjs\`  ·  Mode: **dry-run** (nothing submitted)`);
  l.push(`Directories: **${payloads.length}**  ·  self-serve: ${meta.selfServe}  ·  account: ${meta.account}  ·  approval: ${meta.approval}`);
  l.push("");
  l.push(`> Reddit / forums / LinkedIn / HN / Product Hunt are excluded by design — see OPERATOR-PASTE-KIT.md (AIC-801).`);
  l.push("");
  for (const p of payloads) {
    l.push(`## ${p.name} — \`${p.slug}\``);
    l.push(`- **Submit URL:** ${p.submitUrl}`);
    l.push(`- **Access:** ${p.access}`);
    l.push("");
    l.push(`| Field | Value |`);
    l.push(`| --- | --- |`);
    for (const f of p.fields) l.push(`| ${f.label} | ${String(f.value).replace(/\n/g, " ").replace(/\|/g, "\\|")} |`);
    l.push("");
    l.push(`<details><summary>browser-harness script that would run</summary>\n\n\`\`\`python\n${p._harness}\n\`\`\`\n</details>`);
    l.push("");
  }
  return l.join("\n");
}

// ---------------------------------------------------------------- live execution
function runHarness(script) {
  const r = spawnSync("browser-harness", { input: script, encoding: "utf8" });
  if (r.error) throw r.error;
  if (r.stdout) process.stdout.write(r.stdout);
  if (r.stderr) process.stderr.write(r.stderr);
  return r.status === 0;
}

// ---------------------------------------------------------------- main
function main() {
  const args = parseArgs(process.argv.slice(2));
  if (args.help) {
    console.log(readFileSync(fileURLToPath(import.meta.url), "utf8").split("\n").slice(1, 34).join("\n").replace(/^\/\*\*?|\*\/|^ \* ?/gm, ""));
    return;
  }

  const profile = JSON.parse(readFileSync(join(DIST, "product-profile.json"), "utf8"));
  const cfg = JSON.parse(readFileSync(join(DIST, "directories.json"), "utf8"));
  let dirs = cfg.directories;
  if (args.only) dirs = dirs.filter((d) => args.only.includes(d.slug));
  if (!dirs.length) { console.error("No directories matched --only filter."); process.exit(1); }

  const payloads = dirs.map((d) => {
    const p = renderPayload(d, profile);
    p._harness = buildHarnessScript(p, { submit: args.submit });
    return p;
  });

  const meta = {
    stamp: new Date().toISOString(),
    selfServe: payloads.filter((p) => p.access === "self-serve").length,
    account: payloads.filter((p) => p.access === "account").length,
    approval: payloads.filter((p) => p.access === "approval").length,
  };

  console.log(`AICareerPivot directory-submission runner`);
  console.log(`Product: ${profile.name} — ${profile.url}`);
  console.log(`Mode: ${args.live ? "LIVE" : "DRY-RUN"}   Directories: ${payloads.length}   (self-serve ${meta.selfServe} / account ${meta.account} / approval ${meta.approval})`);

  if (!args.live) {
    for (const p of payloads) printPayload(p);
    mkdirSync(args.out, { recursive: true });
    const jsonPath = join(args.out, "dry-run-latest.json");
    const mdPath = join(args.out, "dry-run-latest.md");
    writeFileSync(jsonPath, JSON.stringify({ meta, product: profile.name, url: profile.url, payloads }, null, 2));
    writeFileSync(mdPath, toMarkdown(payloads, meta));
    console.log(`\n✅ DRY-RUN complete. Nothing submitted.`);
    console.log(`   Rendered ${payloads.length} directory payloads + browser-harness scripts.`);
    console.log(`   → ${jsonPath}`);
    console.log(`   → ${mdPath}`);
    console.log(`\nTo go live: set BROWSER_USE_API_KEY, run \`browser-harness auth login --api-key-stdin\` once, then re-run with --live.`);
    return;
  }

  // ---- LIVE gate --------------------------------------------------
  if (!process.env.BROWSER_USE_API_KEY) {
    console.error(`\n⛔ --live requires BROWSER_USE_API_KEY in env (tracked on AIC-800). Aborting; nothing submitted.`);
    console.error(`   1) export BROWSER_USE_API_KEY=...`);
    console.error(`   2) printf '%s' "$BROWSER_USE_API_KEY" | browser-harness auth login --api-key-stdin`);
    console.error(`   3) re-run this command`);
    process.exit(2);
  }
  console.log(`\nStarting remote browser-harness daemon "${args.daemon}"...`);
  if (!runHarness(`start_remote_daemon(${py(args.daemon)})`)) {
    console.error("Failed to start remote daemon. Aborting."); process.exit(3);
  }
  let ok = 0, fail = 0;
  for (const p of payloads) {
    console.log(`\n▶ ${p.name} (${p.slug}) — ${args.submit ? "FILL + SUBMIT" : "FILL only"}`);
    const success = runHarness(`import os\nos.environ.setdefault("BU_NAME", ${py(args.daemon)})\n` + p._harness);
    if (success) ok++; else fail++;
  }
  runHarness(`stop_remote_daemon(${py(args.daemon)})`);
  console.log(`\nLIVE run done. ok=${ok} fail=${fail} submit=${args.submit}`);
}

main();
