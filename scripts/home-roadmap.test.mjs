import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');

const REQUIRED_TYPES = ['article', 'research', 'project'];
const ZH_STAGES = new Set(['內容整理中', '研究驗證中', '參考實作設計中']);
const EN_STAGES = new Set(['Editorial synthesis', 'Research validation', 'Reference design']);
const ISO_DATE_PATTERN = /^\d{4}-\d{2}-\d{2}$/;

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
  const parts = [
    copy.kicker,
    copy.title,
    copy.lead,
    copy.updatedLabel,
    copy.stageLabel,
    copy.progressLabel,
    copy.resourcesLabel,
    copy.ctaLabel,
    copy.ctaHref,
  ];
  for (const item of copy.items) {
    parts.push(item.key, item.type, item.stage, item.title, item.description, item.weeklyProgress);
    for (const resource of item.resources) {
      parts.push(resource.type, resource.label, resource.href);
    }
  }
  return parts.join('\n');
}

function assertRoadmapCopyShape(copy, lang) {
  assertNonEmptyString(copy.kicker, `${lang}.kicker`);
  assertNonEmptyString(copy.title, `${lang}.title`);
  assertNonEmptyString(copy.lead, `${lang}.lead`);
  assertNonEmptyString(copy.updatedLabel, `${lang}.updatedLabel`);
  assertNonEmptyString(copy.stageLabel, `${lang}.stageLabel`);
  assertNonEmptyString(copy.progressLabel, `${lang}.progressLabel`);
  assertNonEmptyString(copy.resourcesLabel, `${lang}.resourcesLabel`);
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

  const allowedStages = lang === 'en' ? EN_STAGES : ZH_STAGES;
  for (const item of copy.items) {
    assertNonEmptyString(item.key, `${lang} item.key`);
    assertNonEmptyString(item.type, `${lang} item.type`);
    assertNonEmptyString(item.stage, `${lang} item.stage`);
    assert.match(item.updatedAt, ISO_DATE_PATTERN, `${lang} item.updatedAt must be ISO YYYY-MM-DD`);
    assertNonEmptyString(item.title, `${lang} item.title`);
    assertNonEmptyString(item.description, `${lang} item.description`);
    assertNonEmptyString(item.weeklyProgress, `${lang} item.weeklyProgress`);
    assert.ok(Array.isArray(item.resources) && item.resources.length > 0, `${lang} item.resources must not be empty`);
    assert.ok(
      allowedStages.has(item.stage),
      `${lang} stage "${item.stage}" must be one of ${[...allowedStages].join(', ')}`,
    );
    assert.ok(
      TYPE_TECH_HINTS[item.type].test(`${item.title}\n${item.description}`),
      `${lang} ${item.type} copy must include technical markers for that lane`,
    );
    for (const resource of item.resources) {
      assertNonEmptyString(resource.type, `${lang} resource.type`);
      assertNonEmptyString(resource.label, `${lang} resource.label`);
      assert.match(resource.href, /^(?:\/|https:\/\/)/, `${lang} resource.href must be site-relative or HTTPS`);
    }
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

test('homeRoadmap prose contains no accidental dates outside structured updatedAt fields', async () => {
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

test('homeRoadmap CTA points at the bilingual Studio update center', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  assert.equal(homeRoadmap.zh.ctaHref, '/now/');
  assert.equal(homeRoadmap.en.ctaHref, '/now/');
});

test('homeRoadmap stages stay within the operational vocabulary', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  for (const item of homeRoadmap.zh.items) {
    assert.ok(ZH_STAGES.has(item.stage));
  }
  for (const item of homeRoadmap.en.items) {
    assert.ok(EN_STAGES.has(item.stage));
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
      assert.equal(Object.isFrozen(item.resources), true, `${lang} item ${item.key} resources must be frozen`);
      for (const resource of item.resources) {
        assert.equal(Object.isFrozen(resource), true, `${lang} item ${item.key} resource must be frozen`);
      }
    }
  }

  assert.throws(() => {
    homeRoadmap.zh.items[0].stage = 'MUTATED';
  }, TypeError);
  assert.notEqual(homeRoadmap.zh.items[0].stage, 'MUTATED');
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

test('HomeRoadmap.astro renders stage, date, progress, and resources as visible content', () => {
  const source = readRepo('src', 'components', 'HomeRoadmap.astro');
  assert.match(source, /item\.stage/);
  assert.match(source, /item\.updatedAt/);
  assert.match(source, /item\.weeklyProgress/);
  assert.match(source, /item\.resources/);
  assert.equal(
    /stage[^;{]*only.*color|color-only/i.test(source),
    false,
    'stage must remain textual',
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

test('HomePageContent mounts HomeRoadmap before finished implementation evidence', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  assert.match(source, /import\s+HomeRoadmap\s+from\s+['"][^'"]*HomeRoadmap\.astro['"]/);
  assert.match(source, /<HomeRoadmap[\s\S]*?lang=\{lang\}/);

  const focusIdx = source.indexOf('id="focus"');
  const roadmapIdx = source.search(/<HomeRoadmap\b/);
  const showcaseIdx = source.indexOf('id="showcase"');
  assert.ok(focusIdx !== -1, 'focus section must remain');
  assert.ok(roadmapIdx !== -1, 'HomeRoadmap mount must exist');
  assert.ok(showcaseIdx !== -1, 'showcase section must remain');
  assert.ok(focusIdx < roadmapIdx, 'Roadmap must follow the technical frontiers');
  assert.ok(roadmapIdx < showcaseIdx, 'Finished implementations must follow current research');
});

test('HomePageContent assigns brand-narrative decorative indexes', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const roadmapMount = source.search(/<HomeRoadmap\b/);
  assert.ok(roadmapMount !== -1, 'HomeRoadmap mount must exist');
  assert.match(source, /id=["']showcase["'][\s\S]{0,400}index=["']03["']/);
  assert.match(source, /id=["']writing["'][\s\S]{0,400}index=["']04["']/);
});

test('HomePageContent keeps the Hero promise and studio roles above Roadmap', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  const heroIdx = source.indexOf('id="hero"');
  const studioRoleIdx = source.indexOf('hero-studio-signature');
  const roadmapIdx = source.indexOf('<HomeRoadmap');
  assert.ok(heroIdx !== -1 && heroIdx < roadmapIdx, 'Hero must stay above Roadmap');
  assert.ok(studioRoleIdx !== -1 && studioRoleIdx < roadmapIdx, 'Studio roles must stay above Roadmap');
});

test('homepage removes the dense in-page jump navigation from the Hero', () => {
  const source = readRepo('src', 'components', 'pages', 'HomePageContent.astro');
  assert.doesNotMatch(source, /HomeSectionNav/);
  assert.doesNotMatch(source, /HomeStartHere/);
});

test('home-scroll-hash SECTION_IDS follows the brand narrative', () => {
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

test('roadmap resources point only at published bilingual content routes', async () => {
  const { homeRoadmap } = await loadHomeRoadmapModule();
  const expectedRoutes = new Set([
    '/blog/13-harness-engineering-reading-map/',
    '/paper-reading/06-beyond-rag-for-agent/',
    '/blog/65-enterprise-rag-guide/',
    '/projects/agentic-rag/',
  ]);
  for (const lang of ['zh', 'en']) {
    const hrefs = homeRoadmap[lang].items.flatMap((item) => item.resources.map((resource) => resource.href));
    assert.deepEqual(new Set(hrefs), expectedRoutes);
  }
  assert.equal(fileExists('src', 'content', 'blog', '13-harness-engineering-reading-map.md'), true);
  assert.equal(fileExists('src', 'content', 'blog', 'en', '13-harness-engineering-reading-map.md'), true);
  assert.equal(fileExists('src', 'content', 'paperReading', '06-beyond-rag-for-agent.md'), true);
  assert.equal(fileExists('src', 'content', 'paperReading', 'en', '06-beyond-rag-for-agent.md'), true);
});
