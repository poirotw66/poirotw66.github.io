import test from 'node:test';
import assert from 'node:assert/strict';
import { createSearchIndex, searchItems } from '../public/js/search-match.js';

const post = (title, overrides = {}) => ({
  type: 'blog', title, description: '', tags: [], category: '',
  date: '2026-11-01T00:00:00.000Z', url: `/blog/${encodeURIComponent(title)}/`, ...overrides,
});
const titles = (items, query, type) => searchItems(createSearchIndex(items), query, type).map((item) => item.title);

test('all keywords must match, even when they occur in different fields or order', () => {
  const items = [post('RAG guide', { description: 'Quality evaluation' }), post('Evaluation guide'), post('RAG only')];
  for (const query of ['RAG evaluation', 'evaluation RAG', 'rag 評測', '檢索增強評測', 'ＲＡＧ　評測']) {
    assert.deepEqual(titles(items, query), ['RAG guide'], query);
  }
});

test('Chinese, simplified Chinese and full English phrases find the same concept', () => {
  const items = [post('檢索增強指南'), post('RAG in practice'), post('Retrieval-Augmented Generation'), post('Other')];
  for (const query of ['RAG', '檢索增強', '检索增强生成', 'retrieval augmented generation', 'Retrieval-Augmented Generation']) {
    assert.deepEqual(titles(items, query), items.slice(0, 3).map((item) => item.title));
  }
});

test('multiword aliases stay together instead of requiring their component words', () => {
  assert.deepEqual(titles([post('MCP evaluation'), post('A model using a protocol')], 'model context protocol 評估'), ['MCP evaluation']);
  assert.deepEqual(titles([post('LLM 智能體')], 'large language models AI agents'), ['LLM 智能體']);
  assert.deepEqual(titles([post('Enterprise governance')], '企業 治理'), ['Enterprise governance']);
});

test('title relevance wins over newer description or tag matches', () => {
  const items = [
    post('New notes', { description: 'RAG evaluation' }),
    post('Tagged notes', { tags: ['RAG', 'Evaluation'] }),
    post('RAG guide', { description: 'evaluation', date: '2025-01-01' }),
    post('RAG evaluation guide', { date: '2024-01-01' }),
  ];
  assert.deepEqual(titles(items, 'RAG evaluation'), ['RAG evaluation guide', 'RAG guide', 'Tagged notes', 'New notes']);
});

test('tags outrank category and description matches when title relevance ties', () => {
  assert.deepEqual(titles([
    post('Description', { description: 'RAG' }), post('Category', { category: 'RAG' }), post('Tags', { tags: ['RAG'] }),
  ], 'rag'), ['Tags', 'Category', 'Description']);
});

test('equivalent or repeated keywords do not inflate relevance', () => {
  const items = [post('RAG', { tags: ['Evaluation'] }), post('Evaluation', { description: 'RAG' })];
  assert.deepEqual(titles(items, 'RAG 檢索增強 rag evaluation evaluation'), titles(items, 'RAG evaluation'));
});

test('short Latin aliases do not match unrelated substrings', () => {
  const items = [post('Storage and fragments'), post('Reagents in biology'), post('RAG-Anything'), post('AI agents')];
  assert.deepEqual(titles(items, 'rag'), ['RAG-Anything']);
  assert.deepEqual(titles(items, 'agent'), ['AI agents']);
});

test('ordinary keywords retain substring matching for partial typing and tool names', () => {
  assert.deepEqual(titles([post('AgentBench'), post('OpenWiki')], 'Agen'), ['AgentBench']);
  assert.deepEqual(titles([post('OpenWiki')], 'wiki'), ['OpenWiki']);
});

test('type filtering applies before ranking and unknown combinations return no results', () => {
  const items = [post('RAG'), post('RAG system', { type: 'projects' }), post('檢索增強論文', { type: 'paperReading' })];
  assert.deepEqual(titles(items, '檢索增強', 'projects'), ['RAG system']);
  assert.deepEqual(titles(items, 'RAG unknown'), []);
  assert.deepEqual(titles(items, 'evaluation', 'paperReading'), []);
});

test('empty queries and relevance ties preserve incoming chronological order without mutation', () => {
  const items = [post('RAG newer'), post('RAG older'), post('A project', { type: 'projects' })];
  const before = structuredClone(items);
  assert.deepEqual(titles(items, ''), items.map((item) => item.title));
  assert.deepEqual(titles(items, '   ', 'projects'), ['A project']);
  assert.deepEqual(titles(items, 'rag'), ['RAG newer', 'RAG older']);
  assert.deepEqual(items, before);
});
