import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { spawnSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

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
    body: validPaperReadingBody.repeat(10),
    filePath: '/tmp/03-test.md',
  });
  assert.equal(result.errors.length, 0);
  assert.equal(result.warnings.length, 0, result.warnings.join('\n'));
});

test('advises on short body without replacing content checks', () => {
  const result = validatePaperReadingFile({
    basename: '03-test.md',
    frontmatter: seriesFrontmatter,
    body: validPaperReadingBody.slice(0, 500),
    filePath: '/tmp/03-test.md',
  });
  assert.match(result.advisories.join('\n'), /detailed-note floor/);
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
  assert.match(result.advisories.join('\n'), /information score/);
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
  const result = spawnSync(process.execPath, [fileURLToPath(new URL('./validate-reading-quality.mjs', import.meta.url))], {
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

const theoryBody = `
## Why can local views disagree?

The previous approach is insufficient because it conflates a local observation with a global state.
We define a state as a set of observations and a relation between them; the relation maps local views into constraints on the shared state (Definition 1).

Assume the observations are finite and the relation is transitive. The proof derives the conclusion because each consistent extension preserves the relation; Theorem 2 therefore supports the bounded claim.
For example, consider two local views of one object: one observes its identity and the other its position. Combining them preserves identity only under the stated assumption (Section 3).

## What would break the argument?

A counterexample with an inconsistent observation shows why the assumption is necessary. This limitation does not prove robustness to noisy observations. Engineers should not adopt the conclusion when that premise fails.

## What can the reader inspect?

As of 2026-10-29, no code or dataset is associated with this theoretical argument; the proof and definitions are accessible in the primary source. Paper evidence, author claims and our engineering judgment are separated here.

Primary sources: [Synthetic source](https://example.com/theory)
`;

test('theory uses assumptions and reasoning without fabricated experiments', () => {
  const result = validatePaperReadingFile({ basename:'105-theory.md', frontmatter:seriesFrontmatter+'\npaperType: theoretical', body:theoryBody, filePath:'/tmp/theory.md', locale:'en' });
  assert.deepEqual(result.errors, []);
  assert.deepEqual(result.warnings, []);
  assert.ok(result.advisories.length > 0); // short, yet content-complete; semantic review still required
});

test('a theoretical label cannot hide missing assumptions and argument', () => {
  const result = validatePaperReadingFile({ basename:'105-theory.md', frontmatter:seriesFrontmatter+'\npaperType: theoretical', body:validPaperReadingBody, filePath:'/tmp/theory.md', locale:'en' });
  assert.match(result.warnings.join('\n'), /theoretical assumptions and reasoning/);
});

test('numerical performance without any setting or comparator still fails', () => {
  const result = validatePaperReadingFile({ basename:'105-unscoped.md', frontmatter:seriesFrontmatter, publicationReview:true, body:'The method improves accuracy by 90%.\n\nTable 2 supports the claim.\n\nThis is a limitation engineers should understand.', filePath:'/tmp/unscoped.md', locale:'en' });
  assert.match(result.errors.join('\n'), /Unconditioned numerical performance claim/);
});

test('matched measurement context is accepted without claiming scientific verification', () => {
  const body = validPaperReadingBody + '\n\nOn the SyntheticBench dataset, accuracy improves from 40% to 50% compared with the baseline under the same task budget (Table 2).';
  const result = validatePaperReadingFile({ basename:'105-scoped.md', frontmatter:seriesFrontmatter, body, filePath:'/tmp/scoped.md', locale:'en' });
  assert.equal(result.errors.length, 0);
});

test('bilingual omission of the argument remains a blocker, length ratio is only advice', () => {
  const result = validatePaperReadingPair({ id:'105-theory', zhBody:theoryBody, enBody:'A short observation with no supporting argument.', zhPaperType:'theoretical', enPaperType:'theoretical' });
  assert.match(result.warnings.join('\n'), /bilingual.*(?:coverage|teaching)/);
  assert.match(result.advisories.join('\n'), /body-length ratio/);
});

test('conceptual design requires definitions, relations, grounded example and boundary', () => {
  const result = validatePaperReadingFile({ basename:'105-concept.md', frontmatter:seriesFrontmatter+'\npaperType: conceptual', body:theoryBody, filePath:'/tmp/concept.md', locale:'en' });
  assert.deepEqual(result.warnings, []);
  const missing = validatePaperReadingFile({ basename:'105-concept.md', frontmatter:seriesFrontmatter+'\npaperType: conceptual', body:'This is a conceptual design paper. It is interesting.', filePath:'/tmp/concept.md', locale:'en' });
  assert.ok(missing.warnings.length > 0);
});

test('comments and code cannot provide evidence context or a mechanism', () => {
  const body='## Why?\n\nOnly a bare assertion.\n\n<!--\n'+theoryBody+'\n-->\n```\n'+validPaperReadingBody+'\n```';
  const result=validatePaperReadingFile({basename:'105-empty.md',frontmatter:seriesFrontmatter,body,filePath:'/tmp/empty.md',locale:'en'});
  assert.match(result.warnings.join('\n'), /mechanism|anchors/);
});


test('a detached numerical claim cannot borrow an unrelated experiment context', () => {
  const result=validatePaperReadingFile({basename:'105-detached.md',frontmatter:seriesFrontmatter,body:validPaperReadingBody+'\n\nThe method improves accuracy by 90%.',filePath:'/tmp/detached.md',locale:'en',publicationReview:true});
  assert.match(result.errors.join('\n'), /Unconditioned numerical performance claim/);
});

test('Chinese multiples, fullwidth percent and latency/throughput units are checked', () => {
  for(const claim of ['OCR 解碼加速 3.94 倍。','準確率提升 90％。','Latency is 10 ms.','Throughput is 400 tokens per second.']) {
    const result=validatePaperReadingFile({basename:'105-number.md',frontmatter:seriesFrontmatter,body:claim,filePath:'/tmp/number.md',locale:'en',publicationReview:true});
    assert.match(result.errors.join('\n'), /Unconditioned numerical performance claim/,claim);
  }
});

test('a missing bilingual numerical result blocks a new publication review', () => {
  const body=validPaperReadingBody+'\n\nOn the SyntheticBench dataset, accuracy improves from 40% to 90% compared with the baseline (Table 2).';
  const result=validatePaperReadingPair({id:'105-omitted',zhBody:body,enBody:validPaperReadingBody,publicationReview:true});
  assert.match(result.warnings.join('\n'), /bilingual quantitative claims differ/);
});

test('measurement spelling differences do not create a bilingual omission', () => {
  const a=validPaperReadingBody+'\n\nOn the dataset, the baseline has 10 ms latency and throughput is 400 tokens/s. Accuracy improves from 40% to 90%.';
  const b=validPaperReadingBody+'\n\nOn the dataset, the baseline has 10 milliseconds latency and throughput is 400 tokens per second. Accuracy improves from 40％ to 90 percent.';
  assert.doesNotMatch(validatePaperReadingPair({id:'105-equivalent',zhBody:a,enBody:b,publicationReview:true}).warnings.join('\n'),/quantitative/);
});


test('unknown context or a fabricated anchor cannot supply conditions', () => {
  for(const extra of ['Dataset and baseline are unspecified; accuracy improves by 90%.','The method improves accuracy by 90% (Table 99).']) {
    const result=validatePaperReadingFile({basename:'105-unverified.md',frontmatter:seriesFrontmatter,body:validPaperReadingBody+'\n\n## A different result\n\n'+extra,filePath:'/tmp/unverified.md',locale:'en',publicationReview:true});
    assert.match(result.errors.join('\n'),/Unconditioned numerical performance claim/,extra);
  }
});


test('a numerical claim in a heading still needs nearby measurement conditions', () => {
 const result=validatePaperReadingFile({basename:'105-heading.md',frontmatter:seriesFrontmatter,body:validPaperReadingBody+'\n\n## Accuracy improves by 90%\n',filePath:'/tmp/heading.md',locale:'en',publicationReview:true});
 assert.match(result.errors.join('\n'),/Unconditioned numerical performance claim/);
});

test('equivalent seconds and milliseconds preserve bilingual quantities', () => {
 const a=validPaperReadingBody+'\n\nOn the dataset, latency is 1 s.';
 const b=validPaperReadingBody+'\n\nOn the dataset, latency is 1000 ms.';
 assert.doesNotMatch(validatePaperReadingPair({id:'105-time',zhBody:a,enBody:b,publicationReview:true}).warnings.join('\n'),/quantitative/);
});
