import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';

import {
  bannedPartOneBody,
  thinPaperBody,
  validBlogDeepReadBody,
  validPaperReadingBody,
} from './fixtures/reading-quality-fixtures.mjs';
import {
  validateBlogDeepReadFile,
  validatePaperReadingFile,
  validatePaperReadingPair,
  validateReadingQuality,
} from './validate-reading-quality.mjs';

const seriesFrontmatter = `title: "Test"
series:
  id: test
  part: 1
  totalParts: 1
paper:
  links:
    pdf: "https://arxiv.org/pdf/0000.00000.pdf"`;

test('passes valid paperReading body with anchors and limits', () => {
  const result = validatePaperReadingFile({
    basename: '03-test.md',
    frontmatter: seriesFrontmatter,
    body: validPaperReadingBody,
    filePath: '/tmp/03-test.md',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0, result.warnings.join('\n'));
});

test('fails banned 第一部分 heading', () => {
  const result = validatePaperReadingFile({
    basename: '99-test.md',
    frontmatter: seriesFrontmatter,
    body: bannedPartOneBody,
    filePath: '/tmp/99-test.md',
  });
  assert.match(result.errors.join('\n'), /Banned heading pattern/);
});

test('fails thin paper without anchors', () => {
  const result = validatePaperReadingFile({
    basename: '99-test.md',
    frontmatter: seriesFrontmatter,
    body: thinPaperBody,
    filePath: '/tmp/99-test.md',
  });
  assert.match(result.warnings.join('\n'), /locatable evidence anchors/);
});

test('legacy multipart metadata no longer skips content-quality rules', () => {
  const legacyFrontmatter = seriesFrontmatter.replace('totalParts: 1', 'totalParts: 2');
  const result = validatePaperReadingFile({
    basename: '01-alexnet-paper-reading-part-1.md',
    frontmatter: legacyFrontmatter,
    body: thinPaperBody,
    filePath: '/tmp/01-alexnet-paper-reading-part-1.md',
  });
  assert.equal(result.errors.length, 0);
  assert.match(result.warnings.join('\n'), /locatable evidence anchors/);
});

test('non-legacy part-numbered files fail the single-article rule', () => {
  const result = validatePaperReadingFile({
    basename: '99-new-paper-part-1.md',
    frontmatter: seriesFrontmatter.replace('totalParts: 1', 'totalParts: 2'),
    body: validPaperReadingBody,
    filePath: '/tmp/99-new-paper-part-1.md',
  });
  assert.match(result.errors.join('\n'), /must not use -part-N/);
});

test('reports missing evidence, experiment, artifact, and engineering coverage together', () => {
  const result = validatePaperReadingFile({
    basename: '99-test.md',
    frontmatter: seriesFrontmatter,
    body: `${thinPaperBody}\n\nSee Figure 1, Table 2, and §3.`,
    filePath: '/tmp/99-test.md',
  });
  const warnings = result.warnings.join('\n');
  assert.match(warnings, /evidence map/);
  assert.match(warnings, /experimental setup/);
  assert.match(warnings, /artifact availability/);
  assert.match(warnings, /engineering implications/);
});

test('checks bilingual coverage and information density', () => {
  const result = validatePaperReadingPair({
    id: '99-test',
    zhBody: validPaperReadingBody,
    enBody: '## Summary\n\nSee Figure 1.',
  });
  assert.match(result.warnings.join('\n'), /bilingual coverage mismatch/);
  assert.match(result.warnings.join('\n'), /information score/);
});

test('recursively validates English paper-reading files', () => {
  const temp = fs.mkdtempSync(path.join(os.tmpdir(), 'reading-quality-'));
  const paperDir = path.join(temp, 'paperReading');
  const blogDir = path.join(temp, 'blog');
  fs.mkdirSync(path.join(paperDir, 'en'), { recursive: true });
  fs.mkdirSync(blogDir, { recursive: true });
  const document = (body) => `---\n${seriesFrontmatter}\n---\n\n${body}`;
  fs.writeFileSync(path.join(paperDir, '99-test.md'), document(validPaperReadingBody));
  fs.writeFileSync(
    path.join(paperDir, 'en', '99-test.md'),
    document(`${validPaperReadingBody}\n\nTODO translate evidence.`),
  );
  try {
    const result = validateReadingQuality({ paperReadingDir: paperDir, blogDir });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /TODO placeholder/);
  } finally {
    fs.rmSync(temp, { recursive: true, force: true });
  }
});

test('CLI executes through a cross-platform file URL check', () => {
  const result = spawnSync(process.execPath, ['scripts/validate-reading-quality.mjs'], {
    cwd: path.resolve('.'),
    encoding: 'utf8',
  });
  assert.equal(result.status, 0, result.stderr);
  assert.match(result.stdout, /Reading quality validation passed/);
});

test('validates blog deep-read when 原文出處 present', () => {
  const result = validateBlogDeepReadFile({
    body: validBlogDeepReadBody,
    filePath: '/tmp/blog.md',
  });
  assert.equal(result.errors.length, 0);
});

test('repo paperReading files pass check', () => {
  const result = validateReadingQuality();
  assert.equal(result.ok, true, result.errors.join('\n'));
});
