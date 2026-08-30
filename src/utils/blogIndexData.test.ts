import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkBlogIndexItems,
  createBlogIndexManifest,
} from './blogIndexPagination.ts';

function item(id: string) {
  return {
    id,
    title: id,
    description: '',
    category: 'Practice Notes',
    tags: [],
    lanes: [],
    href: `/blog/${id}/`,
    date: '2026/01/01',
    dateIso: '2026-01-01',
    coverVariant: 'engineering',
    coverLabel: 'AI Engineering',
    coverNumber: id,
  };
}

test('chunks the archive without changing item order', () => {
  assert.deepEqual(chunkBlogIndexItems([1, 2, 3, 4, 5], 2), [[1, 2], [3, 4], [5]]);
});

test('rejects an invalid page size', () => {
  assert.throws(() => chunkBlogIndexItems([1], 0), RangeError);
  assert.throws(() => chunkBlogIndexItems([1], 1.5), RangeError);
});

test('creates localized manifests with the first page embedded', () => {
  const items = ['a', 'b', 'c', 'd', 'e'].map(item);

  assert.deepEqual(createBlogIndexManifest(items, 'zh', 2), {
    version: 1,
    total: 5,
    pageSize: 2,
    items: items.slice(0, 2),
    pages: ['/blog/data/2.json', '/blog/data/3.json'],
  });
  assert.deepEqual(createBlogIndexManifest(items, 'en', 2).pages, [
    '/en/blog/data/2.json',
    '/en/blog/data/3.json',
  ]);
});
