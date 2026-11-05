import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { HOME_CASE_STUDY_SLUGS, HOME_FEATURED_BLOG_SLUGS, HOME_READER_PICKS, homeCaseStudyDetails } from '../src/data/homeBrand.ts';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const readRepo = (...parts) => fs.readFileSync(path.join(root, ...parts), 'utf8');

test('homepage case studies keep a matched bilingual problem, method, and outcome', () => {
  assert.deepEqual(HOME_CASE_STUDY_SLUGS, ['agentic-rag', 'ocr-automation', 'agentic-ai-platform']);
  for (const lang of ['zh', 'en']) for (const slug of HOME_CASE_STUDY_SLUGS) {
    const detail = homeCaseStudyDetails[lang][slug];
    for (const field of ['problem', 'solution', 'result']) assert.ok(detail[field].trim(), `${lang}.${slug}.${field}`);
  }
});

test('homepage puts reading before case studies and subscription after the lab', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const positions = [
    source.indexOf('id="hero"'), source.indexOf('<HomeLatestUpdates'),
    source.indexOf('<HomeReadingPicks'), source.indexOf('id="showcase"'),
    source.indexOf('<HomePlayableNow'), source.indexOf('<FollowWriting'),
  ];
  assert.ok(positions.every((value) => value !== -1));
  assert.deepEqual([...positions].sort((a, b) => a - b), positions);
  assert.doesNotMatch(source, /<HomeRoadmap|id="writing"|home-thesis/);
  assert.match(source, /const latestWriting = allBlogPosts\.slice\(0, 3\)/);
});

test('engineering curation keeps the platform trilogy and reader picks resolve in both languages', () => {
  assert.deepEqual(HOME_FEATURED_BLOG_SLUGS, [
    '38-financial-genai-platform-engineering',
    '39-enterprise-agentic-ai-governance',
    '93-agentic-ai-platform-contract',
  ]);
  for (const slug of [...HOME_FEATURED_BLOG_SLUGS, ...HOME_READER_PICKS.map((pick) => pick.slug)]) {
    assert.ok(fs.existsSync(path.join(root, 'src', 'content', 'blog', `${slug}.md`)));
    assert.ok(fs.existsSync(path.join(root, 'src', 'content', 'blog', 'en', `${slug}.md`)));
  }
});

test('hero opens reading and the showcase preserves its three proof signals', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  for (const value of ["'98.0%'", "'19'", "'5+'"]) assert.match(source, new RegExp(`value: ${value.replace(/[+.]/g, '\\$&')}`));
  assert.match(source, /href="#updates" class="btn btn-primary"/);
  assert.match(source, /href="#start-here"/);
  assert.match(source, /home-author-note/);
  assert.match(source, /id="showcase"[\s\S]*<HomeTrustBar/);
});

test('case studies preserve the interactive flagship plus compact layouts', () => {
  const page = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const card = readRepo('src', 'components', 'HomeCaseStudy.astro');
  assert.match(page, /const \[featuredProject, \.\.\.secondaryProjects\] = projects/);
  assert.match(page, /<HomeRagExplorer lang=\{lang\}/);
  assert.match(page, /variant="compact"/);
  assert.doesNotMatch(card, /detail\.role|detail\.evidence/);
});

test('the reusable collaboration component offers three concrete formats', () => {
  const source = readRepo('src', 'components', 'HomeCollaborationCta.astro');
  assert.match(source, /Technical talks/);
  assert.match(source, /Architecture exchange/);
  assert.match(source, /Research collaboration/);
  assert.match(source, /技術演講/);
  assert.equal((source.match(/class="btn btn-primary"/g) || []).length, 1);
});
