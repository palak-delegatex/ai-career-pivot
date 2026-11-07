#!/usr/bin/env node
// Focused regression check for PR #283. Uses the same MDX defaults as the blog route.
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import matter from 'gray-matter';
import { compileMDX } from 'next-mdx-remote/rsc';
import { renderToStaticMarkup } from 'react-dom/server';

const slug = 'muse-dots-grok-bot-opendots-career-skills-2026';
const { data, content } = matter(fs.readFileSync(`src/content/blog/${slug}.mdx`, 'utf8'));
for (const key of ['title', 'description', 'date', 'updated']) assert.equal(typeof data[key], 'string', key);
assert.equal(data.pinned, false, 'The flagship guide must remain the featured article');
assert.ok(data.tldr.length >= 3 && data.faq.length >= 3);
assert.ok(data.updated >= data.date);
assert.doesNotMatch(content, /^# /m, 'The route already supplies the article H1');
assert.doesNotMatch(content, /^\|/m, 'The current route does not enable GFM tables');
const { content: compiled } = await compileMDX({ source: content });
const html = renderToStaticMarkup(compiled);
assert.equal((html.match(/<h3>.*(?:Meta Muse|OpenAI dots|Grok Bot|CopilotKit OpenDots)/g) ?? []).length, 4);
assert.ok(html.includes('href="/free?mode=upload"'), 'Resume promise must open upload mode');
assert.ok(!html.includes('href="/free"'), 'Do not send the resume promise to the posting-check default');
assert.ok(html.includes('supported claims divided by checked claims'));
assert.ok(html.includes('not a customer case study'));
assert.ok(html.includes('separate paid product'));
const freeRoute = fs.readFileSync('src/app/[locale]/free/page.tsx', 'utf8');
assert.ok(freeRoute.includes('mode === "upload" ? "upload" : "quickcheck"'), 'Verify the direct-upload contract');
const internalLinks = [...content.matchAll(/\]\((\/[^)]+)\)/g)].map(m => m[1]);
for (const href of internalLinks) {
  const pathname = href.split(/[?#]/)[0];
  const target = pathname.startsWith('/blog/')
    ? path.join('src/content/blog', `${pathname.slice(6)}.mdx`)
    : path.join('src/app/[locale]', pathname, 'page.tsx');
  assert.ok(fs.existsSync(target), `Missing internal destination: ${href}`);
}
for (const host of ['about.fb.com', 'help.openai.com', 'docs.x.ai', 'www.copilotkit.ai', 'github.com/CopilotKit/OpenDots']) {
  assert.ok(html.includes(`https://${host}`), `Missing primary source: ${host}`);
}
console.log(`Agent blog regression checks passed: compiled MDX, four product sections, ${internalLinks.length} internal destinations, direct upload handoff, frontmatter and evidence labels.`);
