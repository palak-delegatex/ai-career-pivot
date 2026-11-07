#!/usr/bin/env node
// Run with --build after next build to compare the emitted font contract.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { createHash } from 'node:crypto';

const root = 'src/app/fonts/inter';
const manifest = JSON.parse(fs.readFileSync(`${root}/manifest.json`, 'utf8'));
const hash = bytes => createHash('sha256').update(bytes).digest('hex');
assert.equal(manifest.fonts.length, 7);
assert.equal(new Set(manifest.fonts.map(font => font.subset)).size, 7);
for (const font of manifest.fonts) {
  const bytes = fs.readFileSync(`${root}/${font.file}`);
  assert.equal(bytes.subarray(0, 4).toString(), 'wOF2', font.file);
  assert.equal(bytes.length, font.bytes, font.file);
  assert.equal(hash(bytes), font.sha256, font.file);
}
assert.match(fs.readFileSync(`${root}/OFL.txt`, 'utf8'), /SIL OPEN FONT LICENSE Version 1.1/);
const loader = manifest.fonts.map(font => fs.readFileSync('src/app/fonts/inter-' + font.subset + '.ts', 'utf8')).join('\n');
assert.equal((loader.match(/preload: true/g) ?? []).length, 1);
assert.equal((loader.match(/preload: false/g) ?? []).length, 6);
assert.doesNotMatch(fs.readFileSync('src/app/[locale]/layout.tsx', 'utf8'), /\bInter\(/);

if (process.argv.includes('--build')) {
  const css = fs.readdirSync('.next/static/chunks').filter(file => file.endsWith('.css'))
    .map(file => fs.readFileSync(path.join('.next/static/chunks', file), 'utf8')).join('\n');
  const declarations = rule => Object.fromEntries(rule.slice(rule.indexOf('{') + 1, -1)
    .split(';').filter(Boolean).map(part => {
      const index = part.indexOf(':');
      return [part.slice(0, index).trim(), part.slice(index + 1).trim()];
    }));
  const unquote = value => value.replace(/["']/g, '');
  const allFaces = (css.match(/@font-face\{[^}]+\}/g) ?? []).map(declarations);
  const faces = allFaces.filter(face => unquote(face['font-family']) === 'Inter');
  assert.equal(faces.length, 21, 'Keep all seven subsets at each of 400, 500 and 600');
  const expected = new Set(manifest.fonts.flatMap(font => ['400', '500', '600']
    .map(weight => `${font.sha256}|${weight}|${font.unicodeRange.toUpperCase()}`)));
  for (const face of faces) {
    assert.equal(face['font-style'], 'normal');
    assert.equal(face['font-display'], 'swap');
    const url = unquote(face.src.match(/url\(([^)]+)\)/)?.[1] ?? '');
    assert.ok(url);
    const bytes = fs.readFileSync(path.join('.next/static/media', path.basename(url)));
    const key = `${hash(bytes)}|${face['font-weight']}|${face['unicode-range'].toUpperCase()}`;
    assert.ok(expected.delete(key), `Unexpected or duplicated face: ${key}`);
  }
  assert.equal(expected.size, 0);
  const variables = [...css.matchAll(/--font-inter:([^;}]+)/g)]
    .map(match => unquote(match[1]).replaceAll(' ', ''));
  assert.ok(variables.length > 0);
  for (const value of variables) assert.equal(value, 'Inter,InterFallback', 'Generated variables must reference the shared Inter faces');
  const fallback = allFaces.find(face => unquote(face['font-family']) === 'Inter Fallback');
  assert.ok(fallback);
  assert.equal(unquote(fallback.src), 'local(Arial)');
  for (const [property, expectedValue] of Object.entries({ 'ascent-override': 90.44, 'descent-override': 22.52, 'line-gap-override': 0, 'size-adjust': 107.12 })) {
    assert.equal(Number.parseFloat(fallback[property]), expectedValue, property);
  }
  const html = fs.readFileSync('.next/server/app/en/blog/muse-dots-grok-bot-opendots-career-skills-2026.html', 'utf8');
  const preloads = (html.match(/<link[^>]+>/g) ?? [])
    .filter(tag => tag.includes('rel="preload"') && tag.includes('as="font"'))
    .map(tag => tag.match(/href="([^"]+)"/)?.[1]);
  const interHashes = new Set(manifest.fonts.map(font => font.sha256));
  const loadedInter = preloads.map(url => hash(fs.readFileSync(path.join('.next/static/media', path.basename(url)))))
    .filter(value => interHashes.has(value));
  assert.deepEqual(loadedInter, [manifest.fonts.find(font => font.subset === 'latin').sha256], 'Only the unchanged Latin asset should be preloaded');
  assert.equal((html.match(/<h1\b/g) ?? []).length, 1);
  assert.ok(html.includes('href="/free?mode=upload"'));
  console.log('Built output passed: exact 21 Inter faces, seven identical font files, original fallback metrics, unchanged Latin-only preload, and article handoff.');
}
console.log('Inter asset integrity, OFL license and source checks passed.');
