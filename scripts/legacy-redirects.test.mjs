import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';

import { TAG_SLUG_MAP } from '../src/utils/tag.ts';
import {
  CONTENT_MOVES,
  buildLegacyRedirects,
  redirectsFromMixedCaseFilenames,
  redirectsFromTagMap,
  withLocalizedPairs,
} from '../src/data/legacyRedirects.mjs';

const paperFilenames = fs
  .readdirSync(path.resolve('src/content/paperReading'))
  .filter((name) => name.endsWith('.md'));

test('pairs each Chinese redirect with an English twin', () => {
  assert.deepEqual(withLocalizedPairs({ '/blog/old/': '/blog/new/' }), {
    '/blog/old/': '/blog/new/',
    '/en/blog/old/': '/en/blog/new/',
  });
});

test('maps Chinese tag archives onto ASCII slugs', () => {
  const redirects = redirectsFromTagMap({ 論文閱讀: 'paper-reading', rag: 'rag' });
  assert.equal(redirects['/blog/tag/論文閱讀/'], '/blog/tag/paper-reading/');
  assert.equal(redirects['/blog/tag/rag/'], undefined);
});

test('emits mixed-case paper filename redirects onto lowercase URLs', () => {
  const redirects = redirectsFromMixedCaseFilenames(
    ['04-RAG-MCP.md', '08-osreward-agent-evaluation.md'],
    '/paper-reading/',
  );
  assert.equal(redirects['/paper-reading/04-RAG-MCP/'], '/paper-reading/04-rag-mcp/');
  assert.equal(redirects['/paper-reading/08-osreward-agent-evaluation/'], undefined);
});

test('keeps known blog and paper moves', () => {
  assert.equal(
    CONTENT_MOVES['/blog/81-cloudflare-open-agentic-internet/'],
    '/blog/86-cloudflare-open-agentic-internet/',
  );
  assert.equal(
    CONTENT_MOVES['/blog/07-alexnet-paper-reading-part-1/'],
    '/paper-reading/01-alexnet-paper-reading-part-1/',
  );
  assert.equal(
    CONTENT_MOVES['/paper-reading/07-graph-rag-vs-rag/'],
    '/paper-reading/07-graphrag-vs-rag/',
  );
});

test('production redirect table covers tags, mixed-case papers, and both languages', () => {
  const redirects = buildLegacyRedirects({ tagSlugMap: TAG_SLUG_MAP, paperFilenames });

  assert.equal(redirects['/blog/tag/論文閱讀/'], '/blog/tag/paper-reading/');
  assert.equal(redirects['/en/blog/tag/論文閱讀/'], '/en/blog/tag/paper-reading/');
  assert.equal(redirects['/paper-reading/04-RAG-MCP/'], '/paper-reading/04-rag-mcp/');
  assert.equal(redirects['/en/paper-reading/04-RAG-MCP/'], '/en/paper-reading/04-rag-mcp/');
  assert.equal(
    redirects['/en/blog/81-cloudflare-open-agentic-internet/'],
    '/en/blog/86-cloudflare-open-agentic-internet/',
  );
  assert.ok(Object.keys(redirects).length > 50);
});
