#!/usr/bin/env node
/**
 * i18n catalog parity check (AIC-668).
 *
 * `messages/en.json` is the source of truth. Every other locale catalog must:
 *   1. Contain every key present in en.json (no MISSING keys).
 *   2. Not contain keys absent from en.json (no EXTRA / stale keys).
 *   3. Use the same ICU interpolation arguments per key (no ARG drift, e.g.
 *      a `{year}` placeholder dropped or renamed during translation).
 *
 * Exits non-zero on any violation so it can gate CI. Run:
 *   node scripts/check-i18n-parity.mjs
 *   npm run i18n:check
 */
import { readFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { dirname, join } from "node:path";

const ROOT = join(dirname(fileURLToPath(import.meta.url)), "..");
const MESSAGES_DIR = join(ROOT, "messages");

// Keep in sync with src/i18n/routing.ts `locales`.
const DEFAULT_LOCALE = "en";
const LOCALES = ["en", "es", "hi", "pt-BR", "fr", "de", "ja"];

/** Flatten a nested message object into dot-path -> string value. */
function flatten(obj, prefix = "") {
  const out = {};
  for (const [key, value] of Object.entries(obj)) {
    const path = prefix ? `${prefix}.${key}` : key;
    if (value && typeof value === "object" && !Array.isArray(value)) {
      Object.assign(out, flatten(value, path));
    } else {
      out[path] = value;
    }
  }
  return out;
}

/** Extract ICU argument names ({name}, {count, plural, ...}) from a string. */
function icuArgs(value) {
  if (typeof value !== "string") return new Set();
  const args = new Set();
  const re = /\{\s*([a-zA-Z0-9_]+)\s*[,}]/g;
  let m;
  while ((m = re.exec(value)) !== null) args.add(m[1]);
  return args;
}

function load(locale) {
  const raw = readFileSync(join(MESSAGES_DIR, `${locale}.json`), "utf8");
  return flatten(JSON.parse(raw));
}

const source = load(DEFAULT_LOCALE);
const sourceKeys = Object.keys(source);
const problems = [];

for (const locale of LOCALES) {
  if (locale === DEFAULT_LOCALE) continue;

  let target;
  try {
    target = load(locale);
  } catch (err) {
    problems.push(`[${locale}] failed to load catalog: ${err.message}`);
    continue;
  }

  const targetKeys = new Set(Object.keys(target));
  const missing = sourceKeys.filter((k) => !targetKeys.has(k));
  const extra = [...targetKeys].filter((k) => !(k in source));

  if (missing.length) {
    problems.push(
      `[${locale}] missing ${missing.length} key(s):\n    ${missing.join("\n    ")}`,
    );
  }
  if (extra.length) {
    problems.push(
      `[${locale}] has ${extra.length} stale key(s) not in en.json:\n    ${extra.join("\n    ")}`,
    );
  }

  // ICU argument parity for keys present in both.
  const argDrift = [];
  for (const key of sourceKeys) {
    if (!targetKeys.has(key)) continue;
    const a = icuArgs(source[key]);
    const b = icuArgs(target[key]);
    const dropped = [...a].filter((x) => !b.has(x));
    const added = [...b].filter((x) => !a.has(x));
    if (dropped.length || added.length) {
      argDrift.push(
        `      ${key}: en{${[...a].join(",")}} vs ${locale}{${[...b].join(",")}}`,
      );
    }
  }
  if (argDrift.length) {
    problems.push(
      `[${locale}] ICU argument drift in ${argDrift.length} key(s):\n${argDrift.join("\n")}`,
    );
  }
}

if (problems.length) {
  console.error("✗ i18n catalog parity check FAILED\n");
  console.error(problems.join("\n\n"));
  console.error(
    `\n${problems.length} problem group(s). Source of truth: messages/${DEFAULT_LOCALE}.json (${sourceKeys.length} keys).`,
  );
  process.exit(1);
}

console.log(
  `✓ i18n catalog parity OK — ${LOCALES.length} locales, ${sourceKeys.length} keys each, ICU args aligned.`,
);
