#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const collections = ['blog', 'paperReading', 'projects'];
const locales = ['zh', 'en'];
const format = process.argv.includes('--format=json') ? 'json' : 'text';

function parse(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`Malformed frontmatter: ${file}`);
  const [, frontmatter, body] = match;
  const scalar = (key) => {
    const value = frontmatter.match(new RegExp(`^${key}:\\s*["']?([^\\n"']*)["']?\\s*$`, 'm'));
    return value?.[1]?.trim() ?? '';
  };
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
    externalLinks: links.filter((href) => /^https?:\/\//.test(href)).length,
  };
}

const documents = collections.flatMap((collection) => locales.flatMap((locale) => {
  const directory = path.join(root, 'src/content', collection, ...(locale === 'en' ? ['en'] : []));
  if (!fs.existsSync(directory)) return [];
  return fs.readdirSync(directory, { withFileTypes: true })
    .filter((entry) => entry.isFile() && /\.(md|mdx)$/.test(entry.name))
    .map((entry) => ({ collection, locale, name: entry.name, file: path.relative(root, path.join(directory, entry.name)) }));
}));
const identities = new Set(documents.map(({ collection, locale, name }) => `${collection}/${locale}/${name.replace(/\.(md|mdx)$/, '')}`));
const rows = documents.map(({ collection, locale, name, file }) => {
  const data = parse(path.join(root, file));
  const basename = name.replace(/\.(md|mdx)$/, '');
  const missingPair = !identities.has(`${collection}/${locale === 'zh' ? 'en' : 'zh'}/${basename}`);
  const reasons = [];
  let repositoryPriority = 0;
  if (missingPair) {
    repositoryPriority += 4;
    reasons.push('missing language counterpart');
  }
  if (data.internalLinks === 0) {
    repositoryPriority += 4;
    reasons.push('no internal reading path');
  } else if (data.internalLinks === 1) {
    repositoryPriority += 2;
    reasons.push('only one internal reading path');
  }
  if (data.externalLinks === 0) {
    repositoryPriority += 2;
    reasons.push('no external source link');
  }
  if (collection === 'blog' && !data.cluster && ['Enterprise AI', 'AI Engineering', 'Cloud & Platform'].includes(data.category)) {
    repositoryPriority += 1;
    reasons.push('core engineering post has no frontmatter cluster');
  }
  if (collection === 'blog' && data.category === 'Industry Pulse') {
    repositoryPriority += 1;
    reasons.push('time-sensitive industry signal');
  }
  return { collection, locale, file, basename, ...data, missingPair, repositoryPriority, reasons };
})
  .sort((a, b) => b.repositoryPriority - a.repositoryPriority || a.file.localeCompare(b.file));

const report = {
  generatedAt: new Date().toISOString(),
  postCount: rows.length,
  coverage: { collections, locales, unit: 'language file', links: 'outgoing links only; not an inbound orphan audit' },
  collectionCounts: Object.fromEntries(collections.map((collection) => [collection, rows.filter((row) => row.collection === collection).length])),
  localeCounts: Object.fromEntries(locales.map((locale) => [locale, rows.filter((row) => row.locale === locale).length])),
  missingPairCount: rows.filter((row) => row.missingPair).length,
  isolatedCount: rows.filter((row) => row.internalLinks < 2).length,
  missingSourceCount: rows.filter((row) => row.externalLinks === 0).length,
  clusterMetadataGapCount: rows.filter((row) => row.reasons.includes('core engineering post has no frontmatter cluster')).length,
  priorities: rows.slice(0, 15),
};

if (format === 'json') {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Bloss0m archive: ${report.postCount} language files across Blog, Paper Reading, and Projects (zh/en)`);
  console.log(`Missing language counterparts: ${report.missingPairCount}`);
  console.log(`Outgoing-link isolation candidates: ${report.isolatedCount}`);
  console.log(`Missing-source candidates: ${report.missingSourceCount}`);
  console.log(`Cluster metadata gaps: ${report.clusterMetadataGapCount}`);
  console.log('');
  console.log('Top repository-only review candidates:');
  for (const row of report.priorities) {
    console.log(`- ${row.file} [${row.repositoryPriority}] ${row.reasons.join('; ')}`);
  }
  console.log('');
  console.log('Combine this report with Search Console and analytics before deciding merges, redirects, or retirement.');
}
