#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const radarDir = path.join(root, 'ops', 'editorial', 'paper-radar');
const ledgerPath = path.join(radarDir, 'ledger.json');
const seriesMapPath = path.join(radarDir, 'series-map.yaml');
const briefTemplatePath = path.join(radarDir, 'brief-template.md');
const paperDir = path.join(root, 'src', 'content', 'paperReading');
const allowedStatuses = new Set([
  'discovered',
  'watch',
  'shortlist',
  'deep-read-candidate',
  'approved',
  'published',
  'deferred',
  'rejected',
  'withdrawn',
]);
const scoreKeys = [
  'topicRelevance',
  'novelty',
  'evidenceQuality',
  'reproducibility',
  'engineeringValue',
  'seriesValue',
];
const errors = [];

for (const file of [ledgerPath, seriesMapPath, briefTemplatePath]) {
  if (!fs.existsSync(file)) errors.push(`missing required Paper Radar file: ${path.relative(root, file)}`);
}

let ledger;
try {
  ledger = JSON.parse(fs.readFileSync(ledgerPath, 'utf8'));
} catch (error) {
  errors.push(`ledger.json is not valid JSON: ${error.message}`);
}

const seriesMap = fs.existsSync(seriesMapPath) ? fs.readFileSync(seriesMapPath, 'utf8') : '';
const trackIds = new Set([...seriesMap.matchAll(/^  - id: ([a-z0-9-]+)$/gm)].map((match) => match[1]));
if (trackIds.size === 0) errors.push('series-map.yaml must define at least one track');

if (ledger) {
  if (ledger.schemaVersion !== 1) errors.push('ledger schemaVersion must be 1');
  if (!Array.isArray(ledger.papers)) errors.push('ledger papers must be an array');

  const stableIds = new Set();
  for (const [index, paper] of (ledger.papers || []).entries()) {
    const label = `papers[${index}]`;
    if (!paper.stableId) errors.push(`${label}: stableId is required`);
    if (stableIds.has(paper.stableId)) errors.push(`${label}: duplicate stableId ${paper.stableId}`);
    stableIds.add(paper.stableId);
    if (!paper.title) errors.push(`${label}: title is required`);
    if (!allowedStatuses.has(paper.status)) errors.push(`${label}: unsupported status ${paper.status}`);
    if (!trackIds.has(paper.primaryTrack)) errors.push(`${label}: unknown primaryTrack ${paper.primaryTrack}`);
    if (!Array.isArray(paper.contentEntries)) errors.push(`${label}: contentEntries must be an array`);

    if (paper.status !== 'published') {
      if (!paper.score || typeof paper.score !== 'object') {
        errors.push(`${label}: scored editorial candidates require score`);
      } else {
        for (const key of scoreKeys) {
          if (!Number.isInteger(paper.score[key]) || paper.score[key] < 0 || paper.score[key] > 5) {
            errors.push(`${label}: score.${key} must be an integer from 0 to 5`);
          }
        }
        const total = scoreKeys.reduce((sum, key) => sum + (paper.score[key] || 0), 0);
        if (paper.score.total !== total) errors.push(`${label}: score.total must equal ${total}`);
        if (paper.status === 'deep-read-candidate' && (total < 24 || paper.score.evidenceQuality < 3)) {
          errors.push(`${label}: deep-read-candidate requires total >= 24 and evidenceQuality >= 3`);
        }
      }
    }

    if (paper.brief) {
      const briefPath = path.join(root, paper.brief);
      if (!fs.existsSync(briefPath)) errors.push(`${label}: missing brief ${paper.brief}`);
    }
    if (paper.status === 'deep-read-candidate' && !paper.brief) {
      errors.push(`${label}: deep-read-candidate requires a brief`);
    }

    for (const entry of paper.contentEntries || []) {
      const zh = path.join(paperDir, `${entry}.md`);
      const en = path.join(paperDir, 'en', `${entry}.md`);
      if (!fs.existsSync(zh)) errors.push(`${label}: missing Traditional Chinese entry ${entry}`);
      if (!fs.existsSync(en)) errors.push(`${label}: missing English entry ${entry}`);
    }
  }
}

if (errors.length) {
  console.error('Paper Radar validation failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Paper Radar validation passed (${ledger.papers.length} papers, ${trackIds.size} tracks).`);
