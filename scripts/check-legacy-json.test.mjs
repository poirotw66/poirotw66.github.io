import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { encodeSearchItems } from '../public/js/search-index-codec.js';
import { checkLegacyJson } from './check-legacy-json.mjs';

function fixture(t) {
  const dist = fs.mkdtempSync(path.join(os.tmpdir(), 'legacy-json-'));
  t.after(() => fs.rmSync(dist, { recursive: true, force: true }));
  const write = (file, data) => {
    const target = path.join(dist, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, typeof data === 'string' ? data : JSON.stringify(data));
  };
  for (const prefix of ['', 'en/']) {
    const items = [
      { type: 'blog', title: 'Guide', description: 'Evidence', url: `/${prefix}blog/guide/`, date: '2026-10-01T00:00:00.000Z', tags: ['RAG'], category: 'AI' },
      { type: 'paperReading', title: 'Paper', description: 'Method', url: `/${prefix}paper-reading/paper/`, date: '2026-09-01T00:00:00.000Z', tags: [], category: 'AI' },
    ];
    write(`${prefix}search/index.json`, items);
    write(`${prefix}search/data.json`, encodeSearchItems(items));
    write(`${prefix}search/index.html`, '<script>fetch("/search/data.json")</script>');
    write(`${prefix}paper-reading/index.html`, '<main>Archive</main>');
    write(`${prefix}paper-reading/data/essence.json`, { paper: [['Problem', 'A question']] });
    write(`${prefix}paper-reading/data/essence/paper.json`, [['Problem', 'A question']]);
  }
  write('js/reader.js', 'fetch(`/paper-reading/data/essence/${slug}.json`)');
  return { dist, write };
}

test('legacy payloads retain fields, order, and complete bilingual per-note coverage', (t) => {
  const { dist } = fixture(t);
  assert.deepEqual(checkLegacyJson(dist), [
    { language: 'zh', searchItems: 2, essenceNotes: 1 },
    { language: 'en', searchItems: 2, essenceNotes: 1 },
  ]);
});

test('a changed legacy search field or order fails compatibility validation', (t) => {
  const { dist, write } = fixture(t);
  const file = 'en/search/index.json';
  const items = JSON.parse(fs.readFileSync(path.join(dist, file), 'utf8'));
  write(file, items.toReversed());
  assert.throws(() => checkLegacyJson(dist), /legacy fields or item order diverged/);
  items[0].title = 'Unexpected change';
  write(file, items);
  assert.throws(() => checkLegacyJson(dist), /legacy fields or item order diverged/);
});

test('missing notes and changed essence text fail instead of silently dropping data', (t) => {
  const { dist, write } = fixture(t);
  write('paper-reading/data/essence.json', {});
  assert.throws(() => checkLegacyJson(dist), /coverage differs/);
  write('paper-reading/data/essence.json', { paper: [['Problem', 'Changed question']] });
  assert.throws(() => checkLegacyJson(dist), /legacy essence differs for paper/);
});

test('missing legacy endpoints fail even when the active compact endpoint exists', (t) => {
  const { dist } = fixture(t);
  fs.unlinkSync(path.join(dist, 'search/index.json'));
  assert.throws(() => checkLegacyJson(dist), /ENOENT/);
});

test('inline and bundled reader code cannot reintroduce legacy bulk requests', (t) => {
  const { dist, write } = fixture(t);
  write('search/index.html', '<script>fetch("/search/index.json")</script>');
  assert.throws(() => checkLegacyJson(dist), /must not fetch legacy bulk JSON/);
  write('search/index.html', '<main>Search</main>');
  write('_astro/reader.js', 'fetch("/en/paper-reading/data/essence.json")');
  assert.throws(() => checkLegacyJson(dist), /must not fetch legacy bulk JSON/);
});
