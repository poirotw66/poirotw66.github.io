import test from 'node:test';
import assert from 'node:assert/strict';
import {
  chunkPaperIndexItems,
} from '../src/utils/paperReadingPagination.ts';

test('chunkPaperIndexItems correctly partitions arrays', () => {
  const items = Array.from({ length: 74 }, (_, i) => i + 1);
  const chunks = chunkPaperIndexItems(items, 24);
  assert.equal(chunks.length, 4);
  assert.equal(chunks[0].length, 24);
  assert.equal(chunks[1].length, 24);
  assert.equal(chunks[2].length, 24);
  assert.equal(chunks[3].length, 2);
  assert.equal(chunks[0][0], 1);
  assert.equal(chunks[3][1], 74);
});

test('chunkPaperIndexItems handles edge cases', () => {
  assert.deepEqual(chunkPaperIndexItems([], 24), []);
  assert.throws(() => chunkPaperIndexItems([1], 0), RangeError);
  assert.throws(() => chunkPaperIndexItems([1], -5), RangeError);
});
