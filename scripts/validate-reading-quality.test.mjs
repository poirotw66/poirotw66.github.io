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

// Positive and negative behavioral cases: content, units and association matter.
test('attribution, limits and primary sources work with natural headings in both languages', () => {
 const bodies=[
  '作者報告此方法在指定資料集改善準確率，Table 2 支持此有限主張。\n\n本文的工程推論是先核對相同資料與比較條件，再考慮採用；這項建議不是作者測過的部署結果。\n\n這項證據不能推論其他資料的成效，因為比較沒有涵蓋那些條件。\n\n## 一手來源\n\n[完整論文](https://example.org/paper)',
  'The authors report an accuracy improvement on the measured dataset (Table 2).\n\nOur engineering interpretation is to verify that same workload before adoption; this recommendation is not a measured deployment result.\n\nThis does not establish effectiveness on other datasets because those conditions were not compared.\n\n## Original sources\n\n[Full paper](https://example.org/paper)',
 ];
 for(const body of bodies){const c=validatePaperReadingFile({basename:'105-natural.md',frontmatter:seriesFrontmatter,body,filePath:'/tmp/natural.md'}).summary.coverage;assert.equal(c.evidenceMap,true);assert.equal(c.limitation,true);assert.equal(c.primarySources,true);}
});
test('labels and empty source sections cannot supply missing coverage',()=>{
 const body='## Evidence map author claims\n\n## Dataset baseline accuracy GPU\n\n## Limitations ablation\n\n## Artifact accessible\n\n## Engineering\n\n## Primary sources\n\nA generic input maps to output. Figure 1, Table 2, Section 3.';
 const r=validatePaperReadingFile({basename:'105-labels.md',frontmatter:seriesFrontmatter,body,filePath:'/tmp/labels.md',publicationReview:true});
 assert.equal(r.summary.coverage.evidenceMap,false);assert.equal(r.summary.coverage.limitation,false);assert.equal(r.summary.coverage.primarySources,false);assert.ok(r.warnings.length);
});
test('removing the substantive attribution, limit or sources leaves a missing function',()=>{
 const body=validPaperReadingBody;
 for(const [key,re] of [['evidenceMap',/## Reader question and evidence map[\s\S]*?(?=## Method)/],['limitation',/## Ablation and limitations[\s\S]*?(?=## Artifact)/],['primarySources',/## Primary sources[\s\S]*/]]){
  const r=validatePaperReadingFile({basename:'105-removed.md',frontmatter:seriesFrontmatter,body:body.replace(re,''),filePath:'/tmp/removed.md'});
  assert.equal(r.summary.coverage[key],false,key);
 }
});
function pairNumbers(a,b){return validatePaperReadingPair({id:'105-units',zhBody:a,enBody:b,publicationReview:true}).warnings.join('\n');}
test('the exact ninety-second navigation heading is not an experimental quantity', () => {
 const result=pairNumbers('## 90 秒掌握論文 / The paper in 90 seconds\n\nOn SyntheticBench, accuracy is 90%.','## The paper in 90 seconds\n\nOn SyntheticBench, accuracy is 90%.');
 assert.doesNotMatch(result,/quantitative claims differ/);
 for(const heading of ['90 秒掌握論文','90 秒地圖']) assert.doesNotMatch(pairNumbers(`## ${heading}\n\nAccuracy on SyntheticBench is 90%.`,'## Paper in 90 seconds\n\nAccuracy on SyntheticBench is 90%.'),/quantitative claims differ/);
 assert.match(pairNumbers('## Latency improves to 90 seconds\n','## Latency improves to 80 seconds\n'),/quantitative claims differ/);
 const missing=validatePaperReadingFile({basename:'105-heading.md',frontmatter:seriesFrontmatter,body:'## Latency improves to 90 seconds\n',filePath:'/tmp/heading.md',publicationReview:true});
 assert.match(missing.errors.join('\n'),/Unconditioned numerical performance claim/);
});
test('an unrelated throughput sentence or list item cannot label a speedup', () => {
 for(const separator of [' ','\n- ']) {
  const a=`Memory bandwidth leaves spare arithmetic capacity.${separator}On SyntheticBench, Model-A is 3.4X faster than baseline.`;
  const b=`Memory bandwidth leaves spare arithmetic throughput.${separator}On SyntheticBench, Model-A is 3.4X faster than baseline.`;
  assert.doesNotMatch(pairNumbers(a,b),/quantitative/);
 }
});
test('sentence-local metrics expose swapped claims even within a multi-metric paragraph', () => {
 for(const separator of [' ','\n- ','；']) {
  const a=`Model-A accuracy on SyntheticBench is 90%.${separator}Recall is 80%.`;
  const b=`Model-A recall on SyntheticBench is 90%.${separator}Accuracy is 80%.`;
  assert.match(pairNumbers(a,b),/quantitative metric association/);
 }
});
test('partial repeated metric labels do not invent a conflict, but complete contradictions still fail', () => {
 assert.doesNotMatch(pairNumbers('Accuracy on SyntheticBench is 90%.\n\nThe result is 90%.','Accuracy on SyntheticBench is 90%.\n\nAccuracy is 90%.'),/metric association/);
 assert.doesNotMatch(pairNumbers('Model-A 成功率是 37.08%,其他 tier 有不同成本折衷。','Model-A rate is 37.08%, while other tiers have accuracy-cost trade-offs.'),/metric association/);
 assert.match(pairNumbers('Accuracy is 90%. Recall is 90%.','Accuracy is 90%. Precision is 90%.'),/metric association/);
});
test('hyphenated duration, minutes and signed percentage points normalize equivalently',()=>{
 for(const [a,b] of [['影片為100秒。','A 100-second video.'],['延遲為60000毫秒。','Latency on the dataset is 1 minute.'],['淨勝為−16.7個百分點。','Net win is -16.7 percentage-points.']])assert.doesNotMatch(pairNumbers(a,b),/quantitative claims differ/);
});
test('different values, duration units, signs and percent-vs-points remain different',()=>{
 for(const [a,b] of [['100秒','1000 seconds'],['100秒','100 minutes'],['-16.7%','+16.7%'],['16.7%','16.7 percentage points']])assert.match(pairNumbers(a,b),/quantitative claims differ/);
});
test('repeated equal numbers cannot conceal an omitted claim',()=>{
 assert.match(pairNumbers('Dataset A accuracy is 90%.\n\nDataset B accuracy is 90%.','Dataset A accuracy is 90%.'),/quantitative claims differ/);
});
test('explicit model and metric association changes remain blockers',()=>{
 for(const [a,b,kind] of [['Model-A accuracy on SyntheticBench is 90%.','Model-B accuracy on SyntheticBench is 90%.','model'],['Model-A accuracy on SyntheticBench is 90%.','Model-A recall on SyntheticBench is 90%.','metric'],['GPT-5 accuracy on SyntheticBench is 90%.','GPT-6 accuracy on SyntheticBench is 90%.','model']])assert.match(pairNumbers(a,b),new RegExp('quantitative '+kind+' association'));
});
test('omitting measurement conditions is not repaired by an equal bilingual number',()=>{
 assert.match(pairNumbers('On SyntheticBench, Model-A accuracy improves to 90% compared with baseline.','Accuracy improves to 90%.'),/lacks measurement conditions/);
});

test('artifact availability needs visible content rather than an as-of heading alone',()=>{
 const body=validPaperReadingBody.replace(/As of 2026-08-09[^\n]+/,'').replace('## Artifact and reproducibility','## Artifact accessible as of 2026');
 assert.equal(validatePaperReadingFile({basename:'105-artifact.md',frontmatter:seriesFrontmatter,body,filePath:'/tmp/artifact.md',publicationReview:true}).summary.coverage.artifact,false);
});
test('explicitly unknown or nonexistent context cannot scope a numerical result',()=>{
 const body='The dataset is not known and the baseline does not exist. Accuracy improves by 90%.';
 const r=validatePaperReadingFile({basename:'105-unknown.md',frontmatter:seriesFrontmatter,body,filePath:'/tmp/unknown.md',publicationReview:true});
 assert.match(r.errors.join('\n'),/Unconditioned numerical performance claim/);
});
