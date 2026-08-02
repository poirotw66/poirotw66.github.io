import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { homeRoadmap } from '../src/data/homeRoadmap.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('current-work data keeps stable bilingual keys and structured evidence', () => {
  assert.deepEqual(Object.keys(homeRoadmap).sort(), ['en', 'zh']);
  assert.deepEqual(homeRoadmap.zh.items.map((item) => item.key), homeRoadmap.en.items.map((item) => item.key));
  for (const lang of ['zh', 'en']) {
    assert.equal(homeRoadmap[lang].ctaHref, '/now/');
    for (const item of homeRoadmap[lang].items) {
      assert.match(item.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
      for (const field of ['key', 'stage', 'title', 'description', 'weeklyProgress']) assert.ok(item[field].trim());
      assert.ok(item.resources.length > 0);
    }
  }
});

test('published current-work data is recursively immutable', () => {
  assert.equal(Object.isFrozen(homeRoadmap), true);
  for (const lang of ['zh', 'en']) {
    assert.equal(Object.isFrozen(homeRoadmap[lang].items), true);
    for (const item of homeRoadmap[lang].items) assert.equal(Object.isFrozen(item.resources), true);
  }
});

test('compact updates component renders one current item and two supplied posts', () => {
  const source = readRepo('src', 'components', 'HomeLatestUpdates.astro');
  assert.match(source, /id="updates"/);
  assert.match(source, /const current = roadmap\.items\[0\]/);
  assert.match(source, /posts\.map/);
  assert.match(source, /Latest research and engineering updates/);
  assert.match(source, /最新研究與工程動態/);
  assert.match(source, /toLocalizedPath\('\/now\/'/);
});

test('homepage and scroll tracking use the same five-section order', () => {
  const page = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const script = readRepo('public', 'js', 'home-scroll-hash.js');
  const ids = [...script.matchAll(/'([^']+)'/g)].map((match) => match[1]).slice(0, 5);
  assert.deepEqual(ids, ['hero', 'focus', 'showcase', 'updates', 'cta']);
  assert.match(page, /index="01"/);
  assert.match(page, /index="02"/);
  assert.match(readRepo('src', 'components', 'HomeLatestUpdates.astro'), /index="03"/);
  assert.doesNotMatch(page, /HomeSectionNav|HomeStartHere/);
});

test('homepage CSS is centralized, responsive, and free of retired section selectors', () => {
  const css = readRepo('public', 'css', 'home.css');
  assert.match(css, /\.page-home \.home-updates-grid/);
  assert.match(css, /\.page-home \.home-collaboration/);
  assert.match(css, /@media\(max-width:640px\)/);
  assert.doesNotMatch(css, /home-roadmap|home-thesis|home-featured-writing/);
  assert.equal(Buffer.byteLength(css), fs.statSync(path.join(root, 'public', 'css', 'home.css')).size);
});

test('zh and en homepage routes share HomePageContent', () => {
  assert.match(readRepo('src', 'pages', 'index.astro'), /HomePageContent[\s\S]*lang="zh"/);
  assert.match(readRepo('src', 'pages', 'en', 'index.astro'), /HomePageContent[\s\S]*lang="en"/);
});
