#!/usr/bin/env node
import assert from 'node:assert/strict';
import fs from 'node:fs';
import matter from 'gray-matter';
import { serialize } from 'next-mdx-remote/serialize';

const slugs = ['career-change-skills-gap-worksheet', 'career-pivot-plan-template', 'how-to-use-ai-to-plan-career-pivot'];
const locales = ['en', 'es', 'hi', 'pt-BR', 'fr', 'de', 'ja'];
for (const slug of slugs) {
  const { data, content } = matter(fs.readFileSync(`src/content/blog/${slug}.mdx`, 'utf8'));
  for (const key of ['title', 'description', 'date']) assert.equal(typeof data[key], 'string', `${slug}: ${key}`);
  assert.doesNotMatch(content, /^# /m, `${slug}: no duplicate H1`);
  await serialize(content);
  const links = [...content.matchAll(/\]\((\/[^)]+)\)/g)].map(match => match[1]);
  for (const link of links) {
    if (link.startsWith('/worksheets/')) assert.ok(fs.existsSync(`public${link}`), link);
    if (link.startsWith('/blog/')) assert.ok(fs.existsSync(`src/content${link}.mdx`), link);
  }
  if (process.argv.includes('--build')) {
    for (const locale of locales) {
      const html = fs.readFileSync(`.next/server/app/${locale}/blog/${slug}.html`, 'utf8');
      assert.equal((html.match(/<h1\b/g) ?? []).length, 1, `${locale}/${slug}`);
      assert.ok(html.includes(`lang="${locale}"`));
      for (const link of links.filter(link => link.startsWith('/worksheets/'))) {
        assert.ok(html.includes(`href="${link}"`), `${locale}/${slug}: ${link}`);
        assert.ok(!html.includes(`href="/${locale}${link}"`), 'Do not localize static files');
      }
      assert.match(html, /href="\/(?:en\/|es\/|hi\/|pt-BR\/|fr\/|de\/|ja\/)?free\?mode=upload"/, `${locale}/${slug}: direct upload CTA`);
    }
  }
}
console.log(`Worksheet articles passed: ${slugs.length} compiled, internal/download links checked${process.argv.includes('--build') ? ', 21 emitted pages and upload CTAs verified' : ''}.`);
