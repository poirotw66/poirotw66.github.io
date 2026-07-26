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

test('homepage mounts dynamic trust, evidence-led cases, and journey in brand order', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const trust = source.indexOf('<HomeTrustBar');
  const cases = source.indexOf('id="showcase"');
  const journey = source.indexOf('<HomeJourney');
  const writing = source.indexOf('id="writing"');

  assert.match(source, /value:\s*allBlogPosts\.length/);
  assert.match(source, /value:\s*mainProjectCount/);
  assert.match(source, /value:\s*allPaperReadings\.length/);
  assert.match(source, /value:\s*publicBuildCount/);
  assert.match(source, /<HomeCaseStudy/);
  assert.ok(trust !== -1 && cases !== -1 && journey !== -1 && writing !== -1);
  assert.ok(trust < cases, 'trust proof must appear before case studies');
  assert.ok(cases < journey, 'journey must follow evidence-led case studies');
  assert.ok(journey < writing, 'journey must precede the long-form writing feed');
});

test('home section navigation exposes proof, current work, case studies, and journey bilingually', () => {
  const source = readRepo('src', 'components', 'HomeSectionNav.astro');
  for (const id of ['trust', 'roadmap', 'showcase', 'journey']) {
    assert.ok((source.match(new RegExp(`id: ['"]${id}['"]`, 'g')) ?? []).length >= 2);
  }
});
