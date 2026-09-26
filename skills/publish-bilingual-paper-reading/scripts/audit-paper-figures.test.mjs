import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./audit-paper-figures.mjs', import.meta.url));
const image = (id) => `![Figure ${id}](https://example.org/figure-${id}.png)`;
const caption = (id) => `Figure ${id}, Section 2. [Original](https://example.org/paper#S2.F${id}). License: CC BY.`;
const figure = (id) => `${image(id)}\n\n${caption(id)}\n\n`;

function audit(t, zh, en = zh, options = []) {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-figures-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const dir = path.join(root, 'src/content/paperReading');
  fs.mkdirSync(path.join(dir, 'en'), { recursive: true });
  for (const [locale, body] of [['', zh], ['en', en]]) {
    fs.writeFileSync(path.join(dir, locale, '99-fixture.md'), `---\ntitle: fixture\n---\n${body}`);
  }
  return spawnSync(process.execPath, [script, '--strict', '--min-body-figures', '3', ...options, '99-fixture'], { cwd: root, encoding: 'utf8' });
}

test('accepts three distinct paired figures with their own captions', (t) => {
  const result = audit(t, [1, 2, 3].map(figure).join(''));
  assert.equal(result.status, 0, result.stderr);
});

test('repeated placements cannot satisfy the distinct-figure floor', (t) => {
  const result = audit(t, figure(1).repeat(3));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /distinct body figures.*found 1/);
});

test('a later figure caption cannot supply an earlier missing caption', (t) => {
  const result = audit(t, image(1) + '\n\n' + figure(2) + figure(3));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /figure 1: caption must/);
});

test('provenance in a later paragraph cannot supply a caption', (t) => {
  const result = audit(t, image(1) + '\n\nUnrelated prose.\n\n' + caption(1) + '\n\n' + figure(2) + figure(3));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /figure 1: caption must/);
});

test('commented and fenced images do not count', (t) => {
  const result = audit(t, figure(1) + '<!--\n' + figure(2) + '-->\n```markdown\n' + figure(3) + '```');
  assert.equal(result.status, 1);
  assert.match(result.stderr, /distinct body figures.*found 1/);
});

test('preserves bilingual path checks', (t) => {
  const result = audit(t, [1, 2, 3].map(figure).join(''), [1, 2, 4].map(figure).join(''));
  assert.equal(result.status, 1);
  assert.match(result.stderr, /paths differ/);
});

test('allows adjacent panels of one figure without counting them as distinct figures', (t) => {
  const panels = image(1) + '\n\n' + image(1).replace('figure-1.png', 'figure-1-panel-b.png') + '\n\n' + caption(1) + '\n\n';
  const complete = audit(t, panels + figure(2) + figure(3));
  assert.equal(complete.status, 0, complete.stderr);
  const incomplete = audit(t, panels + figure(2));
  assert.equal(incomplete.status, 1);
  assert.match(incomplete.stderr, /distinct body figures.*found 2/);
});

test('accepts named introduction anchors and scholarly reproduction notes', (t) => {
  const body = [1, 2, 3].map(figure).join('').replaceAll('Section 2', 'Introduction').replaceAll('License: CC BY.', 'Scholarly reproduction is permitted.');
  const result = audit(t, body);
  assert.equal(result.status, 0, result.stderr);
});

test('preserves explicit no-figure exceptions and rejects an undocumented bypass', (t) => {
  const exception = '<!-- paper-reading-no-body-figures: No reusable figures. -->';
  assert.equal(audit(t, exception).status, 0);
  assert.equal(audit(t, '', '', ['--allow-no-body-figures']).status, 1);
});
