import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  ENGINEERING_PICKS,
  HOME_FEATURED_BLOG_SLUGS,
} from '../src/data/homeBrand.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('starter picks keep concept guides 64/65 ahead of reading maps', () => {
  const lanes = readRepo('src', 'utils', 'blogLanes.ts');
  assert.match(lanes, /'64-ai-agent-guide'/);
  assert.match(lanes, /'65-enterprise-rag-guide'/);
  assert.match(lanes, /'91-agent-method-foundation-reading-map'/);
  assert.match(lanes, /'92-rag-method-foundation-reading-map'/);
  const starterBlock = lanes.slice(lanes.indexOf('STARTER_PICKS'), lanes.indexOf('const ENGINEERING_TAG_HINTS'));
  const starterIndex64 = starterBlock.indexOf("'64-ai-agent-guide'");
  const starterIndex91 = starterBlock.indexOf("'91-agent-method-foundation-reading-map'");
  assert.ok(starterIndex64 < starterIndex91);
});

test('engineering lane leads with the platform trilogy then reading maps', () => {
  assert.deepEqual(ENGINEERING_PICKS.slice(0, 3), [...HOME_FEATURED_BLOG_SLUGS]);
  assert.deepEqual(ENGINEERING_PICKS.slice(3), [
    '91-agent-method-foundation-reading-map',
    '92-rag-method-foundation-reading-map',
  ]);
  for (const slug of ENGINEERING_PICKS) {
    assert.ok(fs.existsSync(path.join(root, 'src', 'content', 'blog', `${slug}.md`)));
    assert.ok(fs.existsSync(path.join(root, 'src', 'content', 'blog', 'en', `${slug}.md`)));
  }
});

test('blog lanes wire engineering curation into lane ordering', () => {
  const lanes = readRepo('src', 'utils', 'blogLanes.ts');
  assert.match(lanes, /ENGINEERING_PICKS/);
  assert.match(lanes, /laneId === 'engineering'/);
});

test('blog hub engineering teaser shows three platform trilogy cards', () => {
  const source = readRepo('src', 'components', 'BlogHubLanes.astro');
  assert.match(source, /laneId === 'engineering' \? 3 : 1/);
});
