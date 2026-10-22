import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { spawnSync } from 'node:child_process';

const script = fileURLToPath(new URL('./audit-archive.mjs', import.meta.url));

test('covers both languages and collections while exposing missing counterparts and paper links', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-audit-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const documents = {
    'blog/01-test.md': '[Paper](/paper-reading/01-test/)\n[Source](https://example.org/paper)',
    'blog/en/01-test.md': 'English text without reading links or sources.',
    'paperReading/01-test.md': '[Blog](/blog/01-test/)\n<https://example.org/paper>',
    'paperReading/en/01-test.md': '[Paper](/en/paper-reading/02-next/)\n<https://example.org/paper>',
    'projects/01-test.md': '[Paper](/paper-reading/01-test/)\n[Blog](/blog/01-test/)',
  };
  for (const [file, body] of Object.entries(documents)) {
    const target = path.join(root, 'src/content', file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, `---\ntitle: Test\ncategory: AI Engineering\n---\n${body}`);
  }
  const result = spawnSync(process.execPath, [script, '--format=json'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  assert.equal(report.postCount, 5);
  assert.deepEqual(report.collectionCounts, { blog: 2, paperReading: 2, projects: 1 });
  assert.deepEqual(report.localeCounts, { zh: 3, en: 2 });
  assert.equal(report.missingPairCount, 1);
  const find = (collection, locale) => report.priorities.find((row) => row.collection === collection && row.locale === locale);
  assert.equal(find('blog', 'zh').internalLinks, 1);
  assert.equal(find('paperReading', 'en').internalLinks, 1);
  assert.equal(find('paperReading', 'zh').externalLinks, 1);
  assert.ok(find('blog', 'en').repositoryPriority > find('blog', 'zh').repositoryPriority);
  assert.equal(find('projects', 'zh').missingPair, true);
  assert.equal(report.clusterMetadataGapCount, 2);
});

test('counts metadata sources and rendered reading links separately from navigation entrances', (t) => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'archive-render-test-'));
  t.after(() => fs.rmSync(root, { recursive: true, force: true }));
  const files = {
    'src/content/blog/01-core.md': '---\ntitle: Core\ncategory: AI Engineering\n---\nNo Markdown links.',
    'src/content/paperReading/02-paper.md': '---\ntitle: Paper\npaper:\n  links:\n    pdf: https://example.org/paper.pdf\n---\nPaper text.',
    'src/content/projects/ocr.md': '---\ntitle: OCR\nrepoUrl: https://github.com/example/ocr\n---\nProject text.',
    'src/utils/topicClusters.ts': "const clusters = [{ coreSlug: '01-core', childSlugs: [] }];",
    'dist/blog/01-core/index.html': '<main><a href="/paper-reading/02-paper/">Next</a><a href="https://www.bloss0m.com/projects/ocr/">Case</a></main>',
    'dist/paper-reading/02-paper/index.html': '<nav><a href="/blog/01-core/">Nav only</a></nav><main><a href="https://www.bloss0m.com/projects/ocr/">Case</a></main>',
    'dist/projects/ocr/index.html': '<main><p>OCR</p><a href="http://[">Malformed external link</a></main>',
    'dist/index.html': '<main><a href="/blog/01-core/">Featured</a></main>',
  };
  for (const [file, text] of Object.entries(files)) {
    const target = path.join(root, file);
    fs.mkdirSync(path.dirname(target), { recursive: true });
    fs.writeFileSync(target, text);
  }
  const result = spawnSync(process.execPath, [script, '--format=json', '--dist=dist'], { cwd: root, encoding: 'utf8' });
  assert.equal(result.status, 0, result.stderr);
  const report = JSON.parse(result.stdout);
  const find = (name) => report.priorities.find((row) => row.basename === name);
  assert.equal(find('01-core').internalLinks, 0);
  assert.equal(find('01-core').readingLinks, 2);
  assert.equal(find('01-core').sourceLinks, 0);
  assert.equal(find('01-core').navigationOrHubOnly, true);
  assert.equal(find('02-paper').sourceLinks, 1);
  assert.equal(find('02-paper').inboundReadingLinks, 1);
  assert.equal(find('ocr').sourceLinks, 1);
  assert.equal(find('ocr').inboundReadingLinks, 2);
  assert.equal(report.clusterMetadataGapCount, 0);
  assert.equal(report.inboundIsolatedCount, 1);
  assert.equal(report.missingRenderedCount, 0);
});
