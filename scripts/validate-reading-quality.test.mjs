import test from 'node:test';
import assert from 'node:assert/strict';

import {
  bannedPartOneBody,
  thinPaperBody,
  validBlogDeepReadBody,
  validPaperReadingBody,
} from './fixtures/reading-quality-fixtures.mjs';
import {
  validateBlogDeepReadFile,
  validatePaperReadingFile,
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
  assert.match(result.errors.join('\n'), /source anchors/);
});

test('legacy part file skips totalParts and anchor rules', () => {
  const legacyFrontmatter = seriesFrontmatter.replace('totalParts: 1', 'totalParts: 2');
  const result = validatePaperReadingFile({
    basename: '01-alexnet-paper-reading-part-1.md',
    frontmatter: legacyFrontmatter,
    body: thinPaperBody,
    filePath: '/tmp/01-alexnet-paper-reading-part-1.md',
  });
  assert.equal(result.errors.length, 0);
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
