#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const blogDir = path.join(root, 'src/content/blog');
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
    internalLinks: links.filter((href) => /^\/(?:en\/)?(?:blog|projects)\//.test(href)).length,
    externalLinks: links.filter((href) => /^https?:\/\//.test(href)).length,
  };
}

const rows = fs.readdirSync(blogDir)
  .filter((name) => /\.(md|mdx)$/.test(name))
  .map((name) => {
    const data = parse(path.join(blogDir, name));
    const reasons = [];
    let repositoryPriority = 0;
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
    if (!data.cluster && ['Enterprise AI', 'AI Engineering', 'Cloud & Platform'].includes(data.category)) {
      repositoryPriority += 1;
      reasons.push('core engineering post has no frontmatter cluster');
    }
    if (data.category === 'Industry Pulse') {
      repositoryPriority += 1;
      reasons.push('time-sensitive industry signal');
    }
    return { basename: name.replace(/\.(md|mdx)$/, ''), ...data, repositoryPriority, reasons };
  })
  .sort((a, b) => b.repositoryPriority - a.repositoryPriority || a.basename.localeCompare(b.basename));

const report = {
  generatedAt: new Date().toISOString(),
  postCount: rows.length,
  isolatedCount: rows.filter((row) => row.internalLinks < 2).length,
  missingSourceCount: rows.filter((row) => row.externalLinks === 0).length,
  clusterMetadataGapCount: rows.filter((row) => row.reasons.includes('core engineering post has no frontmatter cluster')).length,
  priorities: rows.slice(0, 15),
};

if (format === 'json') {
  console.log(JSON.stringify(report, null, 2));
} else {
  console.log(`Bloss0m archive: ${report.postCount} Traditional Chinese posts`);
  console.log(`Isolation candidates: ${report.isolatedCount}`);
  console.log(`Missing-source candidates: ${report.missingSourceCount}`);
  console.log(`Cluster metadata gaps: ${report.clusterMetadataGapCount}`);
  console.log('');
  console.log('Top repository-only review candidates:');
  for (const row of report.priorities) {
    console.log(`- ${row.basename} [${row.repositoryPriority}] ${row.reasons.join('; ')}`);
  }
  console.log('');
  console.log('Combine this report with Search Console and analytics before deciding merges, redirects, or retirement.');
}
