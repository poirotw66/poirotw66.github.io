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
  assert.match(source, /Huahua maps the trail from emerging signals to engineering evidence/);
  assert.match(source, /花花標記從前沿訊號走到工程證據的研究路徑/);
  assert.match(source, /Research trail guide/);
  assert.match(source, /研究路徑導覽/);
});

test('homepage positions Justin for public engineering, speaking, and technical exchange', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  assert.match(source, /public AI engineering lab/);
  assert.match(source, /公開 AI 工程實驗室/);
  assert.match(source, /Invite me to speak or connect/);
  assert.match(source, /邀請演講或技術交流/);
  assert.doesNotMatch(source, /independent studio/);
  assert.doesNotMatch(source, /工程工作室/);
});

test('contact page publishes verified bilingual speaking history', () => {
  const source = readRepo('src', 'components', 'pages', 'ContactContent.astro');
  const officialLinks = [
    'https://pretalx.coscup.org/coscup-2025/speaker/YQF8FJ/',
    'https://cloudsummit.ithome.com.tw/2026/session/4597',
    'https://aienterprise.ithome.com.tw/2026/speaker/2228',
  ];

  for (const href of officialLinks) {
    assert.equal(source.split(href).length - 1, 1, `${href} must be shared by both locales`);
  }

  assert.match(source, /Selected talks/);
  assert.match(source, /代表演講/);
  assert.match(source, /GenAI Workflow：打造智能化技術趨勢洞察系統/);
  assert.match(source, /金融業生成式 AI 平台工程：以雲端原生架構打造可擴展的 Agentic AI 中樞/);
  assert.match(source, /金融級 Enterprise Agentic AI 架構設計：從 PoC 到 Agentic Operating System/);
  assert.equal(
    source.split("toLocalizedPath('/projects/trendscope/', lang)").length - 1,
    1,
    'COSCUP talk must link to the bilingual TrendScope implementation',
  );
  assert.equal(
    source.split("toLocalizedPath('/blog/38-financial-genai-platform-engineering/', lang)").length - 1,
    1,
    'Cloud Summit talk must link to the related bilingual article',
  );
  assert.equal(
    source.split("toLocalizedPath('/blog/39-enterprise-agentic-ai-governance/', lang)").length - 1,
    1,
    'AI Enterprise talk must link to the related bilingual article',
  );
});
