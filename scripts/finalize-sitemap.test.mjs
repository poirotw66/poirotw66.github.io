import test from 'node:test';
import assert from 'node:assert/strict';

import {
  buildEntries,
  distPathForUrl,
  isNoindex,
  parseLocs,
  readPageDate,
  renderSitemap,
  zhPathOf,
} from './finalize-sitemap.mjs';

const ORIGIN = 'https://www.bloss0m.com';

const article = (published, modified) =>
  `<html><head><script type="application/ld+json">{"@type":"Article","datePublished":"${published}"${
    modified ? `,"dateModified":"${modified}"` : ''
  }}</script></head></html>`;

const noindexPage = '<html><head><meta name="robots" content="noindex, follow" /></head></html>';
const plainPage = '<html><head><title>Hub</title></head></html>';

function fixture(pages) {
  return (url) => pages[new URL(url).pathname];
}

test('parses loc values out of a sitemap document', () => {
  const xml = `<urlset><url><loc>${ORIGIN}/</loc></url><url><loc>${ORIGIN}/blog/</loc></url></urlset>`;

  assert.deepEqual(parseLocs(xml), [`${ORIGIN}/`, `${ORIGIN}/blog/`]);
});

test('detects the robots noindex directive only when present', () => {
  assert.equal(isNoindex(noindexPage), true);
  assert.equal(isNoindex('<meta name="robots" content="index, follow" />'), false);
  assert.equal(isNoindex(plainPage), false);
});

test('prefers dateModified over datePublished', () => {
  assert.equal(readPageDate(article('2026-01-01', '2026-05-05')), '2026-05-05');
  assert.equal(readPageDate(article('2026-01-01')), '2026-01-01');
  assert.equal(readPageDate(plainPage), undefined);
});

test('maps sitemap URLs onto built files', () => {
  assert.equal(distPathForUrl(`${ORIGIN}/`, '/dist'), '/dist/index.html');
  assert.equal(distPathForUrl(`${ORIGIN}/blog/x/`, '/dist'), '/dist/blog/x/index.html');
  assert.equal(distPathForUrl(`${ORIGIN}/blog/x`, '/dist'), '/dist/blog/x/index.html');
  assert.equal(distPathForUrl(`${ORIGIN}/feed.xml`, '/dist'), '/dist/feed.xml');
});

test('pairs an English route back to its Chinese counterpart', () => {
  assert.equal(zhPathOf('/en/blog/x/'), '/blog/x/');
  assert.equal(zhPathOf('/en/'), '/');
  assert.equal(zhPathOf('/blog/x/'), '/blog/x/');
});

test('withholds index.html duplicates and non-HTML endpoints', () => {
  const { entries, dropped } = buildEntries(
    [`${ORIGIN}/blog/x/`, `${ORIGIN}/blog/x/index.html`, `${ORIGIN}/blog/index.json`, `${ORIGIN}/feed.xml`],
    fixture({
      '/blog/x/': article('2026-01-01'),
      '/blog/x/index.html': article('2026-01-01'),
      '/blog/index.json': '{"posts":[]}',
      '/feed.xml': '<?xml version="1.0"?>',
    }),
  );

  assert.deepEqual(
    entries.map((entry) => entry.loc),
    [`${ORIGIN}/blog/x/`],
  );
  assert.deepEqual(dropped, [
    `${ORIGIN}/blog/x/index.html`,
    `${ORIGIN}/blog/index.json`,
    `${ORIGIN}/feed.xml`,
  ]);
});

test('withholds noindex pages and pages missing from the build', () => {
  const { entries, dropped } = buildEntries(
    [`${ORIGIN}/blog/x/`, `${ORIGIN}/search/`, `${ORIGIN}/gone/`],
    fixture({ '/blog/x/': article('2026-01-01'), '/search/': noindexPage }),
  );

  assert.deepEqual(
    entries.map((entry) => entry.loc),
    [`${ORIGIN}/blog/x/`],
  );
  assert.deepEqual(dropped, [`${ORIGIN}/search/`, `${ORIGIN}/gone/`]);
});

test('hubs inherit the newest lastmod below their path', () => {
  const { entries } = buildEntries(
    [`${ORIGIN}/`, `${ORIGIN}/blog/`, `${ORIGIN}/blog/old/`, `${ORIGIN}/blog/new/`],
    fixture({
      '/': plainPage,
      '/blog/': plainPage,
      '/blog/old/': article('2026-01-01'),
      '/blog/new/': article('2026-08-01'),
    }),
  );
  const lastmodByLoc = Object.fromEntries(entries.map((entry) => [entry.loc, entry.lastmod]));

  assert.equal(lastmodByLoc[`${ORIGIN}/blog/`], '2026-08-01');
  assert.equal(lastmodByLoc[`${ORIGIN}/`], '2026-08-01');
  assert.equal(lastmodByLoc[`${ORIGIN}/blog/old/`], '2026-01-01');
});

test('annotates hreflang alternates only when both languages are submitted', () => {
  const { entries } = buildEntries(
    [`${ORIGIN}/blog/paired/`, `${ORIGIN}/en/blog/paired/`, `${ORIGIN}/blog/zh-only/`],
    fixture({
      '/blog/paired/': article('2026-01-01'),
      '/en/blog/paired/': article('2026-01-01'),
      '/blog/zh-only/': article('2026-01-01'),
    }),
  );
  const byLoc = Object.fromEntries(entries.map((entry) => [entry.loc, entry]));

  assert.deepEqual(byLoc[`${ORIGIN}/en/blog/paired/`].links, [
    { hreflang: 'zh-Hant', href: `${ORIGIN}/blog/paired/` },
    { hreflang: 'en', href: `${ORIGIN}/en/blog/paired/` },
    { hreflang: 'x-default', href: `${ORIGIN}/blog/paired/` },
  ]);
  assert.equal(byLoc[`${ORIGIN}/blog/zh-only/`].links, undefined);
});

test('an English page whose Chinese twin is withheld gets no alternates', () => {
  const { entries } = buildEntries([`${ORIGIN}/blog/t/`, `${ORIGIN}/en/blog/t/`], fixture({
    '/blog/t/': noindexPage,
    '/en/blog/t/': article('2026-01-01'),
  }));

  assert.equal(entries.length, 1);
  assert.equal(entries[0].links, undefined);
});

test('renders lastmod and hreflang into the sitemap document', () => {
  const xml = renderSitemap([
    {
      loc: `${ORIGIN}/blog/x/`,
      lastmod: '2026-08-01',
      links: [{ hreflang: 'en', href: `${ORIGIN}/en/blog/x/` }],
    },
  ]);

  assert.match(xml, /xmlns:xhtml="http:\/\/www\.w3\.org\/1999\/xhtml"/);
  assert.match(xml, /<lastmod>2026-08-01<\/lastmod>/);
  assert.match(
    xml,
    /<xhtml:link rel="alternate" hreflang="en" href="https:\/\/www\.bloss0m\.com\/en\/blog\/x\/"\/>/,
  );
});

test('escapes XML-significant characters in URLs', () => {
  const xml = renderSitemap([{ loc: `${ORIGIN}/blog/a&b/` }]);

  assert.match(xml, /<loc>https:\/\/www\.bloss0m\.com\/blog\/a&amp;b\/<\/loc>/);
});
