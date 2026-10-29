import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeSearchState, readSearchState, writeSearchState } from '../public/js/search-state.js';

test('search links round-trip query, type and result page while preserving unrelated state', () => {
  const url = writeSearchState('https://www.bloss0m.com/en/search/?campaign=reader#results', { query: ' RAG & agents ', type: 'paperReading', page: 3 });
  assert.deepEqual(readSearchState(url), { query: 'RAG & agents', type: 'paperReading', page: 3 });
  assert.equal(url.searchParams.get('campaign'), 'reader');
  assert.equal(url.hash, '#results');
  assert.equal(url.pathname, '/en/search/');
});

test('invalid or excessive state has bounded canonical defaults', () => {
  assert.deepEqual(readSearchState('https://example.com/search/?type=unknown&page=-8'), { query: '', type: 'all', page: 1 });
  for (const page of ['1.5', 'Infinity', '1e3', '999999999999999999999']) assert.equal(normalizeSearchState({ page }).page, 1);
  assert.equal(normalizeSearchState({ page: 1000 }).page, 100);
  assert.equal(normalizeSearchState({ query: 'x'.repeat(1000) }).query.length, 500);
});

test('default state removes only owned params and duplicate values are canonicalized', () => {
  const url = writeSearchState('https://example.com/search/?q=test&q=other&type=blog&page=2&campaign=a&campaign=b#top', {});
  assert.equal(url.search, '?campaign=a&campaign=b');
  assert.equal(url.hash, '#top');
  assert.equal(writeSearchState(url, readSearchState(url)).href, url.href);
});
