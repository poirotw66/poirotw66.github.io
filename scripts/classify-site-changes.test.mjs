import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';
import { classifyChangedFiles, classifySiteChanges, isPureProseEdit } from './classify-site-changes.mjs';

const header = '---\ntitle: Demo\nupdatedDate: 2026-10-20\n---\n';
const article = `${header}## Mechanism\n\nA small explanation.\n\n[Source](https://example.org/paper)\n`;
const contentPath = 'src/content/paperReading/example.md';

function repository(t, files = { [contentPath]: article }) {
  const cwd = fs.mkdtempSync(path.join(os.tmpdir(), 'site-change-'));
  t.after(() => fs.rmSync(cwd, { recursive: true, force: true }));
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', stdio: ['ignore', 'pipe', 'pipe'] }).trim();
  git('init', '-q');
  const write = (name, value) => {
    const target = path.join(cwd, name);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, value);
  };
  const commit = () => {
    git('add', '-A');
    git('-c', 'user.name=Fixture', '-c', 'user.email=fixture@example.org', 'commit', '-qm', 'Fixture');
    return git('rev-parse', 'HEAD');
  };
  for (const [name, value] of Object.entries(files)) write(name, value);
  return { cwd, write, git, commit, base: commit() };
}

test('plain bilingual prose may change while existing protected code, math and links stay identical', () => {
  for (const text of ['A small explanation.', '這是一段方法說明。']) {
    const before = `${header}## Heading\n\n${text}\n\n\`\`\`text\ncode content\n\`\`\`\n\n$$\nx + y\n$$\n\n[Paper](https://example.org/paper)\n`;
    assert.equal(isPureProseEdit(before, before.replace(text, 'A clearer method explanation.')), true);
  }
});

test('metadata, rendering syntax, protected blocks and large prose growth retain Lighthouse', () => {
  for (const changed of [
    article.replace('2026-10-20', '2026-10-30'),
    article.replace('## Mechanism', '## Evidence'),
    article.replace('A small explanation.', '**A clearer explanation.**'),
    article.replace('https://example.org/paper', 'https://example.org/revision'),
    article.replace('A small explanation.', '![Evidence](/figure.webp)'),
    article.replace('A small explanation.', '$x + y$'),
    article.replace('A small explanation.', '| Metric | Value |\n| --- | --- |'),
    article.replace('A small explanation.', 'A small explanation.\nAnother paragraph.'),
    article.replace('A small explanation.', 'Long explanation '.repeat(100)),
  ]) assert.equal(isPureProseEdit(article, changed), false, changed);
  for (const body of [
    '```text\nplain code\n```',
    '$$\nplain math\n$$',
    'A **bold** token and plain explanation.',
    'An address: person@example.org',
    'A link: www.example.org',
    'A setext heading\n====',
    '<script>\nplain code\n</script>',
  ]) {
    assert.equal(isPureProseEdit(header + body, header + body.replace('plain', 'changed').replace('person', 'other').replace('example.org', 'example.net').replace('A setext', 'Another setext')), false, body);
  }
});

test('prose and documentation skip only Lighthouse while homepage and unknown paths retain checks', () => {
  const result = classifyChangedFiles([
    { status: 'M', file: contentPath, before: article, after: article.replace('small', 'clearer') },
    { status: 'A', file: 'docs/review.md' },
    { status: 'M', file: 'ops/editorial/paper-radar/ledger.json' },
  ]);
  assert.deepEqual(result, { performance: false, homepage: false, proseOnly: [contentPath], fallback: false });
  for (const file of ['src/pages/en/index.astro', 'public/css/home.css', 'src/data/homeRoadmap.ts']) {
    assert.deepEqual(classifyChangedFiles([{ status: 'M', file }]), { performance: true, homepage: true, proseOnly: [], fallback: false });
  }
  for (const file of ['public/cover.webp', 'src/styles/article.css', 'src/utils/render.ts', 'new-config.ini', 'scripts/generate-body-images.mjs']) {
    assert.equal(classifyChangedFiles([{ status: 'M', file }]).performance, true, file);
  }
});

test('new, deleted, type-changed, renamed and malformed content changes cannot become prose-only skips', () => {
  for (const status of ['A', 'D', 'T']) {
    assert.equal(classifyChangedFiles([{ status, file: contentPath, before: article, after: article.replace('small', 'clearer') }]).performance, true, status);
  }
  assert.equal(classifyChangedFiles([{ status: 'D', file: contentPath }, { status: 'A', file: 'src/content/paperReading/renamed.md', after: article }]).performance, true);
  assert.equal(classifyChangedFiles([{ status: 'M', file: contentPath }]).performance, true);
  assert.equal(classifyChangedFiles([{ status: 'unexpected', file: contentPath }]).fallback, true);
});

test('workflow CLI emits GitHub output using committed Unicode paths without reading dirty edits', (t) => {
  const name = 'src/content/blog/en/unicode-測試.md';
  const repo = repository(t, { [name]: article });
  repo.write(name, article.replace('small', 'clearer'));
  const head = repo.commit();
  repo.write(name, article.replace('A small explanation.', '<script>dirty edit</script>'));
  const output = path.join(repo.cwd, 'output');
  execFileSync(process.execPath, [fileURLToPath(new URL('./classify-site-changes.mjs', import.meta.url))], {
    cwd: repo.cwd,
    env: { ...process.env, BASE_SHA: repo.base, HEAD_SHA: head, GITHUB_OUTPUT: output },
  });
  assert.equal(fs.readFileSync(output, 'utf8'), 'performance=false\nhomepage=false\n');
  for (const base of [undefined, '0'.repeat(40), 'f'.repeat(40), 'HEAD']) {
    assert.deepEqual(classifySiteChanges({ cwd: repo.cwd, base, head }), { performance: true, homepage: true, proseOnly: [], fallback: true });
  }
  assert.equal(classifySiteChanges({ cwd: path.join(repo.cwd, 'missing'), base: repo.base, head }).fallback, true);
  assert.deepEqual(classifySiteChanges({ cwd: repo.cwd, base: head, head }), { performance: false, homepage: false, proseOnly: [], fallback: false });
});
