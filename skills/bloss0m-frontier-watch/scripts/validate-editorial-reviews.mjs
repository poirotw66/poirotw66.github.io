#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const reviewDir = path.join(root, 'ops', 'editorial', 'editorial-reviews');
const templatePath = path.join(reviewDir, 'review-template.md');
const errors = [];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const allowedStatuses = new Set(['pending-editorial-review', 'insufficient-signal', 'approved', 'closed']);

if (!fs.existsSync(templatePath)) errors.push('missing editorial review template');

const files = fs.existsSync(reviewDir)
  ? fs.readdirSync(reviewDir).filter((name) => /^\d{4}-W\d{2}\.md$/.test(name))
  : [];

function scalar(frontmatter, key) {
  const match = frontmatter.match(new RegExp(`^\\s*${key}:\\s*["']?([^"'\\r\\n]+)["']?\\s*$`, 'm'));
  return match?.[1]?.trim();
}

for (const file of files) {
  const fullPath = path.join(reviewDir, file);
  const source = fs.readFileSync(fullPath, 'utf8');
  const frontmatterMatch = source.match(/^---\r?\n([\s\S]*?)\r?\n---/);
  const label = path.relative(root, fullPath);
  if (!frontmatterMatch) {
    errors.push(`${label}: missing YAML frontmatter`);
    continue;
  }
  const frontmatter = frontmatterMatch[1];
  const week = scalar(frontmatter, 'week');
  const generatedAt = scalar(frontmatter, 'generatedAt');
  const status = scalar(frontmatter, 'status');
  const blogCandidates = Number(scalar(frontmatter, 'blogCandidates'));
  const paperCandidates = Number(scalar(frontmatter, 'paperCandidates'));
  const deepReadCandidates = Number(scalar(frontmatter, 'deepReadCandidates'));
  const publicationSlots = Number(scalar(frontmatter, 'publicationSlots'));
  const totalCandidates = blogCandidates + paperCandidates;

  if (`${week}.md` !== file) errors.push(`${label}: week must match filename`);
  if (!isoDate.test(generatedAt || '')) errors.push(`${label}: generatedAt must use YYYY-MM-DD`);
  if (!allowedStatuses.has(status)) errors.push(`${label}: unsupported status ${status}`);
  for (const [key, value] of Object.entries({ blogCandidates, paperCandidates, deepReadCandidates, publicationSlots })) {
    if (!Number.isInteger(value) || value < 0) errors.push(`${label}: ${key} must be a non-negative integer`);
  }
  if (totalCandidates > 10) errors.push(`${label}: total candidates must not exceed 10`);
  if (status === 'insufficient-signal' && totalCandidates >= 5) errors.push(`${label}: insufficient-signal requires fewer than 5 candidates`);
  if (status !== 'insufficient-signal' && (totalCandidates < 5 || totalCandidates > 10)) {
    errors.push(`${label}: ${status} requires 5–10 total candidates`);
  }
  if (deepReadCandidates > 2 || deepReadCandidates > paperCandidates) errors.push(`${label}: deepReadCandidates must be <= 2 and <= paperCandidates`);
  if (publicationSlots > 4) errors.push(`${label}: publicationSlots must not exceed 4`);
  if (status === 'pending-editorial-review' && (publicationSlots < 2 || publicationSlots > 4)) {
    errors.push(`${label}: pending review requires 2–4 publication slots`);
  }
  for (const snapshotKey of ['blogRadarUpdatedAt', 'paperRadarUpdatedAt']) {
    if (!isoDate.test(scalar(frontmatter, snapshotKey) || '')) errors.push(`${label}: ${snapshotKey} must use YYYY-MM-DD`);
  }

  const blogMarkers = (source.match(/^### BLOG-\d+\s+—/gm) || []).length;
  const paperMarkers = (source.match(/^### PAPER-\d+\s+—/gm) || []).length;
  const slotMarkers = (source.match(/^### SLOT-\d+\s+—/gm) || []).length;
  if (blogMarkers !== blogCandidates) errors.push(`${label}: declared ${blogCandidates} blog candidates but found ${blogMarkers}`);
  if (paperMarkers !== paperCandidates) errors.push(`${label}: declared ${paperCandidates} paper candidates but found ${paperMarkers}`);
  if (slotMarkers !== publicationSlots) errors.push(`${label}: declared ${publicationSlots} publication slots but found ${slotMarkers}`);

  for (const heading of ['## Decision required', '## Recommended publication slate', '## Blog candidates', '## Paper candidates', '## Deferred and rejected', '## Handoff boundary']) {
    if (!source.includes(heading)) errors.push(`${label}: missing heading ${heading}`);
  }
}

if (errors.length) {
  console.error('Editorial review validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Editorial review validation passed (${files.length} generated reviews).`);
