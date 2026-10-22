import test from 'node:test';
import assert from 'node:assert/strict';
import { createPaperArchiveLoader } from '../public/js/paper-archive-loader.js';

const rows = (page) => Array.from({ length: page === 5 ? 7 : 24 }, (_, i) => ({ slug: `paper-${(page - 1) * 24 + i}` }));
const initialSlugs = Array.from({ length: 24 }, (_, i) => `paper-${i}`);

for (const failure of ['HTTP 404', 'HTTP 500', 'Network disconnected']) {
  test(`retains successful pages and retries only missing data after ${failure}`, async () => {
    const calls = new Map();
    let failing = true;
    const loader = createPaperArchiveLoader({
      totalPages: 5, totalCount: 103, pageSize: 24, initialSlugs,
      fetchPage: async (page) => {
        calls.set(page, (calls.get(page) ?? 0) + 1);
        if (page === 3 && failing) throw new Error(failure);
        return rows(page);
      },
    });
    await assert.rejects(loader.loadAll());
    assert.equal(loader.snapshot().loadedCount, 79);
    assert.equal(loader.snapshot().complete, false);
    assert.equal(loader.snapshot().failed, true);
    failing = false;
    await loader.loadAll();
    assert.equal(loader.snapshot().loadedCount, 103);
    assert.equal(loader.snapshot().complete, true);
    assert.equal(loader.snapshot().failed, false);
    assert.deepEqual([...calls.entries()], [[2, 1], [3, 2], [4, 1], [5, 1]]);
  });
}

test('concurrent search and load-more share requests and preserve page order', async () => {
  const calls = [];
  const resolvers = new Map();
  const loader = createPaperArchiveLoader({
    totalPages: 5, totalCount: 103, pageSize: 24, initialSlugs,
    fetchPage: (page) => { calls.push(page); return new Promise((resolve) => resolvers.set(page, resolve)); },
  });
  const more = loader.loadNext();
  const searchA = loader.loadAll();
  const searchB = loader.loadAll();
  await Promise.resolve();
  assert.deepEqual(calls, [2, 3, 4, 5]);
  for (const page of [5, 3, 4, 2]) resolvers.get(page)(rows(page));
  await Promise.all([more, searchA, searchB]);
  assert.deepEqual(loader.snapshot().pages.map(([page]) => page), [2, 3, 4, 5]);
  assert.equal(loader.snapshot().loadedCount, 103);
  assert.equal(loader.snapshot().loading, false);
});

test('invalid, empty, truncated, and duplicate responses never count as loaded', async () => {
  for (const invalid of [{}, [], rows(2).slice(1), rows(2).map(() => ({ slug: initialSlugs[0] }))]) {
    const loader = createPaperArchiveLoader({ totalPages: 2, totalCount: 48, pageSize: 24, initialSlugs, fetchPage: async () => invalid });
    await assert.rejects(loader.loadNext());
    assert.equal(loader.snapshot().loadedCount, 24);
    assert.equal(loader.snapshot().complete, false);
  }
});
