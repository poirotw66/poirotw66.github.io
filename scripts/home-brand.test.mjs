import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME_CASE_STUDY_SLUGS, homeCaseStudyDetails } from '../src/data/homeBrand.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('homepage case studies keep a matched bilingual problem, method, and outcome', () => {
  assert.deepEqual(HOME_CASE_STUDY_SLUGS, ['agentic-rag', 'ocr-automation', 'agentic-ai-platform']);
  for (const lang of ['zh', 'en']) for (const slug of HOME_CASE_STUDY_SLUGS) {
    const detail = homeCaseStudyDetails[lang][slug];
    for (const field of ['problem', 'solution', 'result']) assert.ok(detail[field].trim(), `${lang}.${slug}.${field}`);
  }
});

test('homepage follows exactly five visual sections from promise to conversion', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const positions = [
    source.indexOf('id="hero"'), source.indexOf('id="focus"'), source.indexOf('id="showcase"'),
    source.indexOf('<HomeLatestUpdates'), source.indexOf('<HomeCollaborationCta'),
  ];
  assert.ok(positions.every((value) => value !== -1));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(source, /<HomeRoadmap|id="writing"|home-thesis/);
  assert.match(source, /slice\(0, 2\)/);
});

test('Hero integrates three proof signals and a functional bilingual Huahua guide', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  for (const value of ["'98.0%'", "'19'", "'5+'"]) assert.match(source, new RegExp(`value: ${value.replace(/[+.]/g, '\\$&')}`));
  assert.match(source, /Start here with Huahua/);
  assert.match(source, /從花花導覽開始/);
  assert.match(source, /hero-guide-link/);
  assert.match(source, /How do enterprise Agents stay controllable/);
  assert.match(source, /企業 Agent 如何維持可控/);
  assert.match(source, /<HomeTrustBar[\s\S]*<\/section>/);
});

test('Focus is problem-oriented and case studies use one featured plus two compact layouts', () => {
  const page = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const card = readRepo('src', 'components', 'HomeCaseStudy.astro');
  assert.match(page, /const problemPaths = isEn/);
  assert.match(page, /class="home-problem-list"/);
  assert.match(page, /class="home-problem-index"/);
  assert.match(page, /const \[featuredProject, \.\.\.secondaryProjects\] = projects/);
  assert.match(page, /variant="featured"/);
  assert.match(page, /variant="compact"/);
  assert.doesNotMatch(card, /detail\.role|detail\.evidence/);
});

test('homepage exposes one collaboration action with three concrete formats', () => {
  const source = readRepo('src', 'components', 'HomeCollaborationCta.astro');
  assert.match(source, /Technical talks/);
  assert.match(source, /Architecture exchange/);
  assert.match(source, /Research collaboration/);
  assert.match(source, /技術演講/);
  assert.equal((source.match(/class="btn btn-primary"/g) || []).length, 1);
});
