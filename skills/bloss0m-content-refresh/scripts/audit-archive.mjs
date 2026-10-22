#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { createRequire } from 'node:module';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
let markdownModule;
try { markdownModule = createRequire(import.meta.url).resolve('@astrojs/markdown-remark'); }
catch { markdownModule = createRequire(path.join(root, 'package.json')).resolve('@astrojs/markdown-remark'); }
const { parseFrontmatter } = await import(pathToFileURL(markdownModule).href);
const collections = ['blog', 'paperReading', 'projects'];
const locales = ['zh', 'en'];
const format = process.argv.includes('--format=json') ? 'json' : 'text';

const isExternalSource = (href) => typeof href === 'string' && /^https?:\/\//.test(href) && !/^https?:\/\/(?:www\.)?bloss0m\.com(?:[/:?#]|$)/i.test(href);

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const { frontmatter, content: body } = parseFrontmatter(raw);
  const scalar = (key) => String(frontmatter[key] ?? '');
  const metadataLinks = [frontmatter.repoUrl, ...Object.values(frontmatter.paper?.links ?? {})].filter(isExternalSource);
  const markdownLinks = [...body.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)].map((item) => item[1]);
  const autolinks = [...body.matchAll(/<(https?:\/\/[^>]+)>/g)].map((item) => item[1]);
  const links = [...markdownLinks, ...autolinks];
  return {
    title: scalar('title'),
    pubDate: scalar('pubDate'),
    updatedDate: scalar('updatedDate'),
    category: scalar('category'),
    cluster: scalar('cluster'),
    internalLinks: links.filter((href) => /^\/(?:en\/)?(?:blog|paper-reading|projects)\//.test(href)).length,
    externalLinks: new Set([...links.filter(isExternalSource), ...metadataLinks]).size,
    metadataSourceLinks: metadataLinks.length,
  };
}

const documents = collections.flatMap((collection) => locales.flatMap((locale) => {
  const directory = path.join(root, 'src/content', collection, ...(locale === 'en' ? ['en'] : []));
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
    .map((entry) => ({ collection, locale, name: entry.name, file: path.relative(root, path.join(directory, entry.name)) }));
}));
const distArg = process.argv.find((arg) => arg.startsWith('--dist='))?.slice(7);
const dist = distArg ? path.resolve(root, distArg) : null;
if (dist && !fs.existsSync(dist)) throw new Error(`Build directory not found: ${dist}`);
const routeFor = ({ collection, locale, name }) => `/${locale === 'en' ? 'en/' : ''}${collection === 'paperReading' ? 'paper-reading' : collection}/${name.replace(/\.(md|mdx)$/, '').toLowerCase()}/`;
const readingGraph = new Map();
const allEntrances = new Set();
const canonicalRoute = (href) => {
  if (/^https?:\/\//.test(href)) {
    try {
      const url = new URL(href);
      if (!['bloss0m.com', 'www.bloss0m.com'].includes(url.hostname)) return null;
      href = url.pathname;
    } catch { return null; }
  }
  if (!href.startsWith('/') || href.startsWith('//')) return null;
  try { return decodeURIComponent(href.split(/[?#]/, 1)[0]).replace(/index\.html$/, '').toLowerCase(); } catch { return null; }
};
if (dist) {
  const walk = (directory) => fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => entry.isDirectory() ? walk(path.join(directory, entry.name)) : [path.join(directory, entry.name)]);
  const known = new Set(documents.map(routeFor));
  for (const file of walk(dist).filter((file) => file.endsWith('.html'))) {
    const html = fs.readFileSync(file, 'utf8');
    if (/http-equiv=["']refresh/i.test(html)) continue;
    const source = `/${path.relative(dist, file).split(path.sep).join('/').replace(/index\.html$/, '')}`.toLowerCase();
    const links = (text) => new Set([...text.matchAll(/<a\b[^>]*\bhref=["']([^"']+)["']/gi)].map((match) => canonicalRoute(match[1])).filter((route) => known.has(route) && route !== source));
    for (const target of links(html)) allEntrances.add(target);
    const main = html.match(/<main\b[^>]*>([\s\S]*?)<\/main>/i)?.[1] ?? '';
    if (known.has(source)) readingGraph.set(source, { outgoing: links(main), externalSources: new Set([...main.matchAll(/<a\b[^>]*\bhref=["'](https?:\/\/[^"']+)["']/gi)].map((match) => match[1]).filter(isExternalSource)).size });
  }
}
const inbound = new Map();
for (const [source, { outgoing }] of readingGraph) for (const target of outgoing) {
  if (!inbound.has(target)) inbound.set(target, new Set());
  inbound.get(target).add(source);
}
const clusterFile = path.join(root, 'src/utils/topicClusters.ts');
const clusterSource = fs.existsSync(clusterFile) ? fs.readFileSync(clusterFile, 'utf8') : '';
const clusterSlugs = new Set([
  ...[...clusterSource.matchAll(/coreSlug:\s*'([^']+)'/g)].map((match) => match[1]),
  ...[...clusterSource.matchAll(/childSlugs:\s*\[([\s\S]*?)\]/g)].flatMap((match) => [...match[1].matchAll(/'([^']+)'/g)].map((item) => item[1])),
]);
const identities = new Set(documents.map(({ collection, locale, name }) => `${collection}/${locale}/${name.replace(/\.(md|mdx)$/, '')}`));
const rows = documents.map(({ collection, locale, name, file }) => {
  const data = parse(path.join(root, file));
  const basename = name.replace(/\.(md|mdx)$/, '');
  const missingPair = !identities.has(`${collection}/${locale === 'zh' ? 'en' : 'zh'}/${basename}`);
  const rendered = readingGraph.get(routeFor({ collection, locale, name }));
  const readingLinks = rendered ? rendered.outgoing.size : data.internalLinks;
  const sourceLinks = rendered ? Math.max(rendered.externalSources, data.externalLinks) : data.externalLinks;
  const reasons = [];
  let repositoryPriority = 0;
  if (missingPair) {
    repositoryPriority += 4;
    reasons.push('missing language counterpart');
  }
  if (readingLinks === 0) {
    repositoryPriority += 4;
    reasons.push('no internal reading path');
  } else if (readingLinks === 1) {
    repositoryPriority += 2;
    reasons.push('only one internal reading path');
  }
  if (sourceLinks === 0) {
    repositoryPriority += 2;
    reasons.push('no external source link');
  }
  if (collection === 'blog' && !data.cluster && !clusterSlugs.has(basename.toLowerCase()) && ['Enterprise AI', 'AI Engineering', 'Cloud & Platform'].includes(data.category)) {
    repositoryPriority += 1;
    reasons.push('core engineering post has no frontmatter cluster');
  }
  if (collection === 'blog' && data.category === 'Industry Pulse') {
    repositoryPriority += 1;
    reasons.push('time-sensitive industry signal');
  }
  return { collection, locale, file, basename, ...data, readingLinks, sourceLinks, renderedLinksAvailable: Boolean(rendered), inboundReadingLinks: rendered ? (inbound.get(routeFor({ collection, locale, name }))?.size ?? 0) : null, navigationOrHubOnly: rendered ? !inbound.has(routeFor({ collection, locale, name })) && allEntrances.has(routeFor({ collection, locale, name })) : null, missingPair, repositoryPriority, reasons };
})
  .sort((a, b) => b.repositoryPriority - a.repositoryPriority || a.file.localeCompare(b.file));

const report = {
  generatedAt: new Date().toISOString(),
  postCount: rows.length,
  coverage: { collections, locales, unit: 'language file', links: dist ? 'Markdown + metadata sources; built main-content article link graph; navigation/hub entrances reported separately' : 'Markdown outgoing links + metadata sources; inbound coverage unavailable without --dist=dist' },
  collectionCounts: Object.fromEntries(collections.map((collection) => [collection, rows.filter((row) => row.collection === collection).length])),
  localeCounts: Object.fromEntries(locales.map((locale) => [locale, rows.filter((row) => row.locale === locale).length])),
  missingPairCount: rows.filter((row) => row.missingPair).length,
  isolatedCount: rows.filter((row) => row.readingLinks < 2).length,
  missingSourceCount: rows.filter((row) => row.sourceLinks === 0).length,
  clusterMetadataGapCount: rows.filter((row) => row.reasons.includes('core engineering post has no frontmatter cluster')).length,
  inboundIsolatedCount: dist ? rows.filter((row) => row.renderedLinksAvailable && row.inboundReadingLinks === 0).length : null,
  navigationOrHubOnlyCount: dist ? rows.filter((row) => row.navigationOrHubOnly).length : null,
  missingRenderedCount: dist ? rows.filter((row) => !row.renderedLinksAvailable).length : null,
  priorities: rows.slice(0, 15),
};

if (format === 'json') {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Bloss0m archive: ${report.postCount} language files across Blog, Paper Reading, and Projects (zh/en)`);
  console.log(`Missing language counterparts: ${report.missingPairCount}`);
  console.log(`Outgoing reading-link candidates: ${report.isolatedCount}`);
  console.log(`Missing-source candidates: ${report.missingSourceCount}`);
  console.log(`Cluster metadata gaps: ${report.clusterMetadataGapCount}`);
  if (dist) console.log(`No inbound article links: ${report.inboundIsolatedCount}; navigation/hub only: ${report.navigationOrHubOnlyCount}; pages missing from build: ${report.missingRenderedCount}`);
  console.log('');
  console.log('Top repository-only review candidates:');
  for (const row of report.priorities) {
    console.log(`- ${row.file} [${row.repositoryPriority}] ${row.reasons.join('; ')}`);
  }
  console.log('');
  console.log('Combine this report with Search Console and analytics before deciding merges, redirects, or retirement.');
}
