#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { BLOG_CATEGORIES, BLOG_CLUSTER_IDS } from '../../../src/data/blogTaxonomy.mjs';

const root = process.cwd();
const radarDir = path.join(root, 'ops', 'editorial', 'blog-radar');
const ledgerPath = path.join(radarDir, 'ledger.json');
const briefTemplatePath = path.join(radarDir, 'brief-template.md');
const blogDir = path.join(root, 'src', 'content', 'blog');
const allowedStatuses = new Set([
  'discovered',
  'watch',
  'shortlist',
  'durable-post-candidate',
  'approved',
  'published',
  'deferred',
  'rejected',
]);
const allowedSourceTypes = new Set([
  'official-documentation',
  'release-notes',
  'engineering-blog',
  'repository',
  'standard',
  'research-lab',
  'company-announcement',
]);
const scoreKeys = ['topicRelevance', 'durability', 'evidenceQuality', 'engineeringValue', 'archiveFit'];
const isoDate = /^\d{4}-\d{2}-\d{2}$/;
const errors = [];

for (const file of [ledgerPath, briefTemplatePath]) {
  if (!fs.existsSync(file)) errors.push(`missing required Blog Radar file: ${path.relative(root, file)}`);
}

let ledger;
try {
  ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
} catch (error) {
  errors.push(`Blog Radar ledger is not valid JSON: ${error.message}`);
}

if (ledger) {
  if (ledger.schemaVersion !== 1) errors.push('Blog Radar schemaVersion must be 1');
  if (!isoDate.test(ledger.updatedAt || '')) errors.push('Blog Radar updatedAt must use YYYY-MM-DD');
  if (!Array.isArray(ledger.items)) errors.push('Blog Radar items must be an array');

  const stableIds = new Set();
  const canonicalUrls = new Set();
  for (const [index, item] of (ledger.items || []).entries()) {
    const label = `items[${index}]`;
    if (!item.stableId?.startsWith('url:https://')) errors.push(`${label}: stableId must be url:<canonical https URL>`);
    if (stableIds.has(item.stableId)) errors.push(`${label}: duplicate stableId ${item.stableId}`);
    stableIds.add(item.stableId);

    if (!item.title) errors.push(`${label}: title is required`);
    if (!item.publisher) errors.push(`${label}: publisher is required`);
    try {
      const url = new URL(item.canonicalUrl);
      if (url.protocol !== 'https:') errors.push(`${label}: canonicalUrl must use https`);
      if (url.search || url.hash) errors.push(`${label}: canonicalUrl must omit query strings and fragments`);
    } catch {
      errors.push(`${label}: canonicalUrl must be a valid URL`);
    }
    if (item.stableId !== `url:${item.canonicalUrl}`) errors.push(`${label}: stableId must match canonicalUrl exactly`);
    if (canonicalUrls.has(item.canonicalUrl)) errors.push(`${label}: duplicate canonicalUrl ${item.canonicalUrl}`);
    canonicalUrls.add(item.canonicalUrl);

    if (!allowedSourceTypes.has(item.sourceType)) errors.push(`${label}: unsupported sourceType ${item.sourceType}`);
    if (!allowedStatuses.has(item.status)) errors.push(`${label}: unsupported status ${item.status}`);
    if (!BLOG_CATEGORIES.includes(item.primaryCategory)) errors.push(`${label}: unknown primaryCategory ${item.primaryCategory}`);
    if (item.primaryCluster && !BLOG_CLUSTER_IDS.includes(item.primaryCluster)) errors.push(`${label}: unknown primaryCluster ${item.primaryCluster}`);
    for (const dateKey of ['firstSeenAt', 'lastSeenAt']) {
      if (!isoDate.test(item[dateKey] || '')) errors.push(`${label}: ${dateKey} must use YYYY-MM-DD`);
    }
    if (!Array.isArray(item.contentEntries)) errors.push(`${label}: contentEntries must be an array`);
    if (!Array.isArray(item.history)) errors.push(`${label}: history must be an array`);

    if (item.status !== 'published') {
      if (!item.score || typeof item.score !== 'object') {
        errors.push(`${label}: editorial candidates require score`);
      } else {
        for (const key of scoreKeys) {
          if (!Number.isInteger(item.score[key]) || item.score[key] < 0 || item.score[key] > 5) {
            errors.push(`${label}: score.${key} must be an integer from 0 to 5`);
          }
        }
        const total = scoreKeys.reduce((sum, key) => sum + (item.score[key] || 0), 0);
        if (item.score.total !== total) errors.push(`${label}: score.total must equal ${total}`);
        if (item.status === 'durable-post-candidate' && (total < 20 || item.score.evidenceQuality < 3)) {
          errors.push(`${label}: durable-post-candidate requires total >= 20 and evidenceQuality >= 3`);
        }
      }
    }

    if (item.brief && !fs.existsSync(path.join(root, item.brief))) errors.push(`${label}: missing brief ${item.brief}`);
    if (item.status === 'durable-post-candidate' && !item.brief) errors.push(`${label}: durable-post-candidate requires a brief`);
    for (const entry of item.contentEntries || []) {
      if (!fs.existsSync(path.join(blogDir, `${entry}.md`))) errors.push(`${label}: missing Traditional Chinese blog entry ${entry}`);
      if (!fs.existsSync(path.join(blogDir, 'en', `${entry}.md`))) errors.push(`${label}: missing English blog entry ${entry}`);
    }
  }
}

if (errors.length) {
  console.error('Blog Radar validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Blog Radar validation passed (${ledger.items.length} items).`);
