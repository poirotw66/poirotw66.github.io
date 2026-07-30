import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { homeRoadmap } from '../src/data/homeRoadmap.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');
const exists = (...parts) => fs.existsSync(path.join(root, ...parts));

test('Currently Building publishes operational fields with bilingual parity', () => {
  const zhItems = homeRoadmap.zh.items;
  const enItems = homeRoadmap.en.items;

  assert.deepEqual(enItems.map((item) => item.key), zhItems.map((item) => item.key));
  for (let index = 0; index < zhItems.length; index += 1) {
    for (const item of [zhItems[index], enItems[index]]) {
      assert.match(item.updatedAt, /^\d{4}-\d{2}-\d{2}$/);
      assert.ok(item.stage.length > 0);
      assert.ok(item.weeklyProgress.length > 0);
      assert.ok(item.resources.length > 0);
    }
    assert.deepEqual(
      enItems[index].resources.map((resource) => resource.href),
      zhItems[index].resources.map((resource) => resource.href),
    );
  }
});

test('Studio update center exposes its current follow mechanisms honestly', () => {
  const source = readRepo('src', 'components', 'pages', 'NowContent.astro');
  assert.match(source, /FOLLOW THE WORK|持續追蹤/);
  assert.match(source, /Use RSS for new writing, GitHub for source changes, or email for the small digest pilot/);
  assert.match(source, /透過 RSS 追蹤新文章、GitHub 查看程式變化，或加入小規模 Email 摘要測試/);
  assert.match(source, /Follow RSS|訂閱 RSS/);
  assert.match(source, /Email pilot|Email 測試名單/);
  assert.match(source, /https:\/\/github\.com\/poirotw66/);
  assert.match(source, /newsletterHref/);
  assert.match(source, /getPostsForLane\(allBlogPosts,\s*'pulse'\)/);
  assert.match(source, /toLocalizedPath\('\/feed\.xml'/);
});

test('zh and en update center routes share NowContent', () => {
  assert.equal(exists('src', 'pages', 'now.astro'), true);
  assert.equal(exists('src', 'pages', 'en', 'now.astro'), true);
  assert.match(readRepo('src', 'pages', 'now.astro'), /NowContent[\s\S]*lang=["']zh["']/);
  assert.match(readRepo('src', 'pages', 'en', 'now.astro'), /NowContent[\s\S]*lang=["']en["']/);
});

test('RSS renderer and localized endpoints preserve the RSS contract', () => {
  const renderer = readRepo('src', 'utils', 'rss.ts');
  assert.match(renderer, /<\?xml version="1\.0" encoding="UTF-8"\?>/);
  assert.match(renderer, /<rss version="2\.0"/);
  assert.match(renderer, /escapeXml\(post\.data\.title\)/);
  assert.match(renderer, /toLocalizedPath\(`\/blog\/\$\{blogSlug\(post\)\}\/`, lang\)/);
  assert.match(renderer, /toLocalizedPath\('\/feed\.xml', lang\)/);
  assert.equal(exists('src', 'pages', 'feed.xml.ts'), true);
  assert.equal(exists('src', 'pages', 'en', 'feed.xml.ts'), true);
  assert.match(readRepo('src', 'pages', 'feed.xml.ts'), /renderBlogRss\(posts,\s*'zh'/);
  assert.match(readRepo('src', 'pages', 'en', 'feed.xml.ts'), /renderBlogRss\(posts,\s*'en'/);
});
