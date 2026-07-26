import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import {
  HOME_CASE_STUDY_SLUGS,
  homeCaseStudyDetails,
  homeJourney,
} from '../src/data/homeBrand.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('homepage case studies have matched bilingual evidence fields', () => {
  assert.deepEqual(HOME_CASE_STUDY_SLUGS, [
    'agentic-rag',
    'ocr-automation',
    'agentic-ai-platform',
  ]);

  for (const lang of ['zh', 'en']) {
    for (const slug of HOME_CASE_STUDY_SLUGS) {
      const detail = homeCaseStudyDetails[lang][slug];
      for (const field of ['problem', 'solution', 'result', 'role']) {
        assert.equal(typeof detail[field], 'string');
        assert.ok(detail[field].trim().length > 0, `${lang}.${slug}.${field} must not be empty`);
      }
    }
  }
});

test('homepage journey preserves the same four-stage structure in both languages', () => {
  assert.equal(homeJourney.zh.stages.length, 4);
  assert.equal(homeJourney.en.stages.length, 4);
  assert.deepEqual(
    homeJourney.en.stages.map((stage) => stage.phase),
    homeJourney.zh.stages.map((stage) => stage.phase),
  );
});

test('homepage follows the brand narrative from promise to proof to conversion', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const trust = source.indexOf('<HomeTrustBar');
  const focus = source.indexOf('id="focus"');
  const cases = source.indexOf('id="showcase"');
  const roadmap = source.indexOf('<HomeRoadmap');
  const writing = source.indexOf('id="writing"');
  const cta = source.indexOf('<CtaBlock');

  assert.match(source, /value:\s*'98\.0%'/);
  assert.match(source, /value:\s*'19'/);
  assert.match(source, /value:\s*'5\+'/);
  assert.match(source, /value:\s*publicBuildCount/);
  assert.match(source, /<HomeCaseStudy/);
  assert.ok([trust, focus, cases, roadmap, writing, cta].every((position) => position !== -1));
  assert.ok(trust < focus, 'public engineering proof must immediately support the hero promise');
  assert.ok(focus < roadmap, 'technical frontiers must lead into current research and builds');
  assert.ok(roadmap < cases, 'current research must precede finished implementation evidence');
  assert.ok(cases < writing, 'finished implementations must precede public insights');
  assert.ok(writing < cta, 'the speaking and exchange CTA must close the homepage');
});

test('Huahua is framed as a bilingual research trail guide, not a decorative mascot', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  assert.match(source, /Huahua guides readers through Bloss0m’s research trails/);
  assert.match(source, /花花負責導覽 Bloss0m 的研究路徑/);
  assert.match(source, /Research trail guide/);
  assert.match(source, /研究路徑導覽/);
});

test('homepage positions Justin for public engineering, speaking, and technical exchange', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  assert.match(source, /public research and build log/);
  assert.match(source, /公開研究與實作基地/);
  assert.match(source, /Invite me to speak or exchange ideas/);
  assert.match(source, /邀請演講或技術交流/);
  assert.doesNotMatch(source, /independent studio/);
  assert.doesNotMatch(source, /工程工作室/);
});
