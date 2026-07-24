import test from 'node:test';
import assert from 'node:assert/strict';

import { classifyStatus, extractExternalUrls } from './check-external-links.mjs';

test('extracts and deduplicates external URLs without trailing punctuation', () => {
  const urls = extractExternalUrls(
    '[Paper](https://example.org/paper?q=1). See https://example.org/paper?q=1.',
  );
  assert.deepEqual(urls, ['https://example.org/paper?q=1']);
});

test('preserves balanced parentheses in URLs', () => {
  const urls = extractExternalUrls('See https://example.org/wiki/Agent_(AI).');
  assert.deepEqual(urls, ['https://example.org/wiki/Agent_(AI)']);
});

test('does not absorb adjacent CJK prose or Markdown emphasis', () => {
  const urls = extractExternalUrls(
    '[來源](https://example.org/paper)（官方） and [English](https://example.com/post)**.',
  );
  assert.deepEqual(urls, ['https://example.org/paper', 'https://example.com/post']);
});

test('ignores URLs in code samples and reserved local hostnames', () => {
  const urls = extractExternalUrls(`
\`\`\`js
fetch('https://api.example.com/mock');
\`\`\`
\`https://client-agent.local/hook\`
https://example.org/real
  `);
  assert.deepEqual(urls, ['https://example.org/real']);
});

test('classifies permanent failures separately from bot restrictions', () => {
  assert.equal(classifyStatus(204), 'ok');
  assert.equal(classifyStatus(301), 'ok');
  assert.equal(classifyStatus(403), 'reachable');
  assert.equal(classifyStatus(429), 'reachable');
  assert.equal(classifyStatus(404), 'failed');
  assert.equal(classifyStatus(404, 'https://www.kaggle.com/competitions/titanic'), 'reachable');
  assert.equal(classifyStatus(503), 'failed');
});
