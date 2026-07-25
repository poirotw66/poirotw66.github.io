import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_TYPES = ['article', 'research', 'project'];
const ZH_STATUSES = new Set(['即將發布', '規劃中']);
const EN_STATUSES = new Set(['Coming next', 'Planned']);

const DATE_PATTERN =
  /\b\d{4}-\d{2}-\d{2}\b|\b\d{4}\/\d{1,2}\/\d{1,2}\b|\d{4}\s*年|\d{1,2}\s*月\s*\d{1,2}\s*日|\b(?:Jan(?:uary)?|Feb(?:ruary)?|Mar(?:ch)?|Apr(?:il)?|May|Jun(?:e)?|Jul(?:y)?|Aug(?:ust)?|Sep(?:tember)?|Oct(?:ober)?|Nov(?:ember)?|Dec(?:ember)?)\s+\d{1,2},?\s+\d{4}\b/i;

const FORBIDDEN_CLAIM_PATTERN =
  /合作夥伴|合作單位|已簽約|客戶案例|已完成|already shipped|already launched|partnered with|partnership with|client case/i;

const TYPE_TECH_HINTS = {
  article: /harness|evaluation|observability|permission|recovery|評測|可觀測|權限|復原|維運/i,
  research: /memory|retrieval|xMemory|GraphRAG|RAG|記憶|檢索|評估/i,
  project: /ingestion|hybrid|retrieval|guardrail|deploy|validation|混合|檢索|治理|部署|驗證/i,
};

function readRepo(...parts) {
  return fs.readFileSync(path.join(root, ...parts), 'utf8');
}

function fileExists(...parts) {
  return fs.existsSync(path.join(root, ...parts));
}

async function loadHomeRoadmapModule() {
  return import('../src/data/homeRoadmap.ts');
}

function assertNonEmptyString(value, label) {
  assert.equal(typeof value, 'string', `${label} must be a string`);
  assert.ok(value.trim().length > 0, `${label} must be non-empty`);
}

function collectCopyStrings(copy) {
  const parts = [copy.kicker, copy.title, copy.lead, copy.ctaLabel, copy.ctaHref];
  for (const item of copy.items) {
    parts.push(item.key, item.type, item.status, item.title, item.description);
  }
  return parts.join('\n');
}

function assertRoadmapCopyShape(copy, lang) {
  assertNonEmptyString(copy.kicker, `${lang}.kicker`);
  assertNonEmptyString(copy.title, `${lang}.title`);
  assertNonEmptyString(copy.lead, `${lang}.lead`);
  assertNonEmptyString(copy.ctaLabel, `${lang}.ctaLabel`);
  assertNonEmptyString(copy.ctaHref, `${lang}.ctaHref`);
  assert.ok(Array.isArray(copy.items), `${lang}.items must be an array`);
  assert.equal(copy.items.length, 3, `${lang}.items must have exactly 3 entries`);

  const types = copy.items.map((item) => item.type);
  assert.deepEqual(
    [...types].sort(),
    [...REQUIRED_TYPES].sort(),
    `${lang}.items must cover article, research, and project exactly once`,
  );

  const allowedStatuses = lang === 'en' ? EN_STATUSES : ZH_STATUSES;
  for (const item of copy.items) {
    assertNonEmptyString(item.key, `${lang} item.key`);
    assertNonEmptyString(item.type, `${lang} item.type`);
    assertNonEmptyString(item.status, `${lang} item.status`);
    assertNonEmptyString(item.title, `${lang} item.title`);
    assertNonEmptyString(item.description, `${lang} item.description`);
    assert.ok(
      allowedStatuses.has(item.status),
      `${lang} status "${item.status}" must be one of ${[...allowedStatuses].join(', ')}`,
    );
    assert.ok(
      TYPE_TECH_HINTS[item.type].test(`${item.title}\n${item.description}`),
      `${lang} ${item.type} copy must include technical markers for that lane`,
    );
  }
}

test('homeRoadmap module exports bilingual zh and en copy', async () => {
  const mod = await loadHomeRoadmapModule();
  assert.ok(mod.homeRoadmap, 'homeRoadmap export is required');
  assert.ok(mod.homeRoadmap.zh, 'homeRoadmap.zh is required');
  assert.ok(mod.homeRoadmap.en, 'homeRoadmap.en is required');
});

test('homeRoadmap zh copy matches the roadmap item contract', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  assertRoadmapCopyShape(homeRoadmap.zh, 'zh');
});

test('homeRoadmap en copy matches the roadmap item contract', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  assertRoadmapCopyShape(homeRoadmap.en, 'en');
});

test('homeRoadmap zh and en share stable keys, types, and order', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  const zhKeys = homeRoadmap.zh.items.map((item) => item.key);
  const enKeys = homeRoadmap.en.items.map((item) => item.key);
  const zhTypes = homeRoadmap.zh.items.map((item) => item.type);
  const enTypes = homeRoadmap.en.items.map((item) => item.type);

  assert.deepEqual(enKeys, zhKeys, 'item keys must match across languages in the same order');
  assert.deepEqual(enTypes, zhTypes, 'item types must match across languages in the same order');
});

test('homeRoadmap copy never includes concrete calendar dates', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  for (const lang of ['zh', 'en']) {
    const blob = collectCopyStrings(homeRoadmap[lang]);
    assert.equal(
      DATE_PATTERN.test(blob),
      false,
      `${lang} roadmap copy must not contain concrete dates; found match in: ${blob}`,
    );
  }
});

test('homeRoadmap copy never invents partnerships or completed outcomes', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  for (const lang of ['zh', 'en']) {
    const blob = collectCopyStrings(homeRoadmap[lang]);
    assert.equal(
      FORBIDDEN_CLAIM_PATTERN.test(blob),
      false,
      `${lang} roadmap copy must not invent partners or completed outcomes`,
    );
  }
});

test('homeRoadmap CTA points at the existing engineering writing lane', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  assert.equal(homeRoadmap.zh.ctaHref, '/blog/?lane=engineering');
  assert.equal(homeRoadmap.en.ctaHref, '/blog/?lane=engineering');
});

test('homeRoadmap statuses stay within the planned non-date vocabulary', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  for (const item of homeRoadmap.zh.items) {
    assert.ok(ZH_STATUSES.has(item.status));
  }
  for (const item of homeRoadmap.en.items) {
    assert.ok(EN_STATUSES.has(item.status));
  }
});

test('homeRoadmap published state is recursively immutable', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  assert.equal(Object.isFrozen(homeRoadmap), true, 'root must be frozen');
  assert.equal(Object.isFrozen(homeRoadmap.zh), true, 'zh copy must be frozen');
  assert.equal(Object.isFrozen(homeRoadmap.en), true, 'en copy must be frozen');
  assert.equal(Object.isFrozen(homeRoadmap.zh.items), true, 'zh items must be frozen');
  assert.equal(Object.isFrozen(homeRoadmap.en.items), true, 'en items must be frozen');
  for (const lang of ['zh', 'en']) {
    for (const item of homeRoadmap[lang].items) {
      assert.equal(Object.isFrozen(item), true, `${lang} item ${item.key} must be frozen`);
    }
  }

  assert.throws(() => {
    homeRoadmap.zh.items[0].status = 'MUTATED';
  }, TypeError);
  assert.notEqual(homeRoadmap.zh.items[0].status, 'MUTATED');
});

test('HomeRoadmap.astro exposes section#roadmap with scroll-anchor semantics', () => {
  assert.equal(fileExists('src', 'components', 'HomeRoadmap.astro'), true);
  const source = readRepo('src', 'components', 'HomeRoadmap.astro');
  assert.match(source, /id=["']roadmap["']/);
  assert.match(source, /home-scroll-anchor/);
  assert.match(source, /home-section-shell/);
  assert.match(source, /SectionHeading/);
  assert.match(source, /<h3[\s>]/);
  assert.match(source, /lang/);
});

test('HomeRoadmap.astro uses decorative index 02 on SectionHeading', () => {
  const source = readRepo('src', 'components', 'HomeRoadmap.astro');
  assert.match(source, /SectionHeading[\s\S]{0,200}index=["']02["']/);
});

test('HomeRoadmap.astro renders status as visible text, not color-only cues', () => {
  const source = readRepo('src', 'components', 'HomeRoadmap.astro');
  assert.match(source, /item\.status|status/);
  assert.equal(
    /status[^;{]*only.*color|color-only/i.test(source),
    false,
    'status must remain textual',
  );
});

test('Roadmap styles live in home.css with design tokens and no component style block', () => {
  const component = readRepo('src', 'components', 'HomeRoadmap.astro');
  const homeCss = readRepo('public', 'css', 'home.css');
  assert.equal(/<style[\s>]/.test(component), false, 'HomeRoadmap.astro must not embed page CSS');
  assert.match(homeCss, /\.page-home\s+\.home-roadmap-grid/);
  assert.match(homeCss, /\.page-home\s+\.home-roadmap-status/);
  assert.match(homeCss, /var\(--surface-card\)|var\(--surface\)/);
  assert.match(homeCss, /var\(--border\)/);
  assert.match(homeCss, /var\(--text(?:-muted)?\)/);
  assert.match(homeCss, /min-width:\s*0/);
  assert.equal(
    /#(?:6[Dd]28[Dd]9|7[Cc]3[Aa][Ee][Dd]|8[Bb]5[Cc][Ff]6)\b/.test(homeCss),
    false,
    'must not introduce generic AI purple hex colors',
  );
});

test('HomeRoadmap.astro keeps a single CTA', () => {
  const source = readRepo('src', 'components', 'HomeRoadmap.astro');
  assert.match(source, /ctaLabel|ctaHref|btn/);
  assert.equal((source.match(/class="btn /g) || []).length, 1);
});

test('zh and en homepage routes still share HomePageContent', () => {
  const zh = readRepo('src', 'pages', 'index.astro');
  const en = readRepo('src', 'pages', 'en', 'index.astro');
  assert.match(zh, /HomePageContent/);
  assert.match(en, /HomePageContent/);
  assert.match(zh, /lang=["']zh["']/);
  assert.match(en, /lang=["']en["']/);
});

test('HomePageContent mounts HomeRoadmap between focus and showcase', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  assert.match(source, /import\s+HomeRoadmap\s+from\s+['"][^'"]*HomeRoadmap\.astro['"]/);
  assert.match(source, /<HomeRoadmap[\s\S]*?lang=\{lang\}/);

  const focusIdx = source.indexOf('id="focus"');
  const roadmapIdx = source.search(/<HomeRoadmap\b/);
  const showcaseIdx = source.indexOf('id="showcase"');
  assert.ok(focusIdx !== -1, 'focus section must remain');
  assert.ok(roadmapIdx !== -1, 'HomeRoadmap mount must exist');
  assert.ok(showcaseIdx !== -1, 'showcase section must remain');
  assert.ok(focusIdx < roadmapIdx, 'Roadmap must follow focus');
  assert.ok(roadmapIdx < showcaseIdx, 'Roadmap must precede showcase');
});

test('HomePageContent assigns Roadmap decorative index 02 and shifts later sections', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const roadmapMount = source.search(/<HomeRoadmap\b/);
  assert.ok(roadmapMount !== -1, 'HomeRoadmap mount must exist');
  assert.match(source, /id=["']showcase["'][\s\S]{0,400}index=["']03["']/);
  assert.match(source, /id=["']writing["'][\s\S]{0,400}index=["']04["']/);
});

test('HomePageContent keeps Hero CTAs and Start Here above Roadmap', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const heroIdx = source.indexOf('id="hero"');
  const startHereIdx = source.search(/start-here|kickerStart|startHere/i);
  const roadmapIdx = source.indexOf('<HomeRoadmap');
  assert.ok(heroIdx !== -1 && heroIdx < roadmapIdx, 'Hero must stay above Roadmap');
  assert.ok(startHereIdx !== -1 && startHereIdx < roadmapIdx, 'Start Here must stay above Roadmap');
});

test('HomeSectionNav includes roadmap for both languages between focus and projects', () => {
  const source = readRepo('src', 'components', 'HomeSectionNav.astro');
  const itemsMatch = source.match(/const items = isEn\s*\?([\s\S]*?);/);
  assert.ok(itemsMatch, 'HomeSectionNav items definition must exist');
  const itemsSource = itemsMatch[1];
  const enBlockMatch = itemsSource.match(/^\s*\[([\s\S]*?)\]\s*:/);
  const zhBlockMatch = itemsSource.match(/:\s*\[([\s\S]*?)\]\s*$/);
  assert.ok(enBlockMatch, 'English nav items array must exist');
  assert.ok(zhBlockMatch, 'Chinese nav items array must exist');

  for (const [label, block] of [
    ['en', enBlockMatch[1]],
    ['zh', zhBlockMatch[1]],
  ]) {
    assert.match(block, /id:\s*['"]roadmap['"]/, `${label} nav must include roadmap`);
    const focusPos = block.search(/id:\s*['"]focus['"]/);
    const roadmapPos = block.search(/id:\s*['"]roadmap['"]/);
    const showcasePos = block.search(/id:\s*['"]showcase['"]/);
    assert.ok(focusPos !== -1 && roadmapPos !== -1 && showcasePos !== -1, `${label} nav order anchors missing`);
    assert.ok(focusPos < roadmapPos && roadmapPos < showcasePos, `${label} nav order must be focus → roadmap → showcase`);
  }
});

test('home-scroll-hash SECTION_IDS includes roadmap between focus and showcase', () => {
  const source = readRepo('public', 'js', 'home-scroll-hash.js');
  const match = source.match(/SECTION_IDS\s*=\s*\[([^\]]+)\]/);
  assert.ok(match, 'SECTION_IDS array must exist');
  const ids = match[1]
    .split(',')
    .map((part) => part.trim().replace(/['"]/g, ''))
    .filter(Boolean);
  const focusIdx = ids.indexOf('focus');
  const roadmapIdx = ids.indexOf('roadmap');
  const showcaseIdx = ids.indexOf('showcase');
  assert.ok(focusIdx !== -1, 'focus must remain tracked');
  assert.ok(roadmapIdx !== -1, 'roadmap must be tracked for hash and aria-current');
  assert.ok(showcaseIdx !== -1, 'showcase must remain tracked');
  assert.equal(roadmapIdx, focusIdx + 1, 'roadmap must sit immediately after focus');
  assert.equal(showcaseIdx, roadmapIdx + 1, 'showcase must sit immediately after roadmap');
});

test('package.json exposes an isolated home roadmap test script', () => {
  const pkg = JSON.parse(readRepo('package.json'));
  assert.equal(typeof pkg.scripts['test:home-roadmap'], 'string');
  assert.match(pkg.scripts['test:home-roadmap'], /home-roadmap\.test\.mjs/);
  assert.equal(typeof pkg.scripts['test:home-roadmap:render'], 'string');
});

test('PR CI runs home roadmap contract and render gates', () => {
  const workflow = readRepo('.github', 'workflows', 'pr-check.yml');
  const lines = workflow.split(/\r?\n/).map((line) => line.trim());
  const unitIdx = lines.indexOf('npm run test:home-roadmap');
  const buildIdx = lines.indexOf('npm run build');
  const renderIdx = lines.indexOf('npm run test:home-roadmap:render');
  assert.ok(unitIdx !== -1, 'PR CI must run npm run test:home-roadmap');
  assert.ok(buildIdx !== -1, 'PR CI must run npm run build');
  assert.ok(renderIdx !== -1, 'PR CI must run npm run test:home-roadmap:render');
  assert.ok(unitIdx < buildIdx, 'contract test must run in the unit-test step before build');
  assert.ok(buildIdx < renderIdx, 'render matrix must run after build');
});

test('roadmap work does not invent unpublished content routes in HomeRoadmap', () => {
  assert.equal(fileExists('src', 'components', 'HomeRoadmap.astro'), true);
  const source = readRepo('src', 'components', 'HomeRoadmap.astro');
  assert.equal(
    /href=\{[^}]*item\.(url|href|link)/.test(source),
    false,
    'roadmap items must not deep-link through unpublished per-item routes',
  );
});
