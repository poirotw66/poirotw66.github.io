import test from 'node:test';
import assert from 'node:assert/strict';
import { encodeSearchItems, decodeSearchItems } from '../public/js/search-index-codec.js';

const item = { type: 'paperReading', title: 'A paper', description: 'Method and evidence', url: '/paper-reading/test/', date: '2026-10-22T00:00:00.000Z', tags: ['RAG', 'Evaluation'], category: 'AI Systems' };

test('compact search payload preserves every reader-visible field and item order', () => {
  const items = [item, { ...item, type: 'blog', title: 'A guide', url: '/blog/test/' }];
  const encoded = encodeSearchItems(items);
  assert.deepEqual(decodeSearchItems(encoded), items);
  assert.equal(encoded.dates.length, 1);
  assert.equal(encoded.tags.length, 2);
  assert.deepEqual(decodeSearchItems(items), items);
  assert.deepEqual(decodeSearchItems(encodeSearchItems([])), []);
});

test('malformed payloads and invalid dictionary references fail instead of returning partial results', () => {
  for (const change of [
    (data) => { data.version = 2; },
    (data) => { data.items[0][0] = -1; },
    (data) => { data.items[0][4] = 100; },
    (data) => { data.items[0][5] = [999]; },
    (data) => { data.items[0][1] = null; },
  ]) {
    const data = encodeSearchItems([item]);
    change(data);
    assert.throws(() => decodeSearchItems(data));
  }
});
