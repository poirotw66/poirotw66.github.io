import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { PAPER_READING_PATHS } from './paperReadingPaths.ts';

test('every Paper Reading article belongs to exactly one valid reading path', () => {
  const contentDir = path.resolve('src/content/paperReading');
  const articleSlugs = fs
    .readdirSync(contentDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/i, '').toLowerCase())
    .sort();
  const pathSlugs = PAPER_READING_PATHS.flatMap((readingPath) => readingPath.slugs).sort();

  assert.equal(new Set(pathSlugs).size, pathSlugs.length, 'reading paths must not reuse an article');
  assert.deepEqual(pathSlugs, articleSlugs);
});
