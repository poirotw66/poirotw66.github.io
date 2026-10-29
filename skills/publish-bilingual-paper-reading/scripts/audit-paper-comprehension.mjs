#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';
import { teachingSignals, paperTypeFromFrontmatter } from './teaching-signals.mjs';

const root = process.cwd();
const paperDir = path.join(root, 'src', 'content', 'paperReading');

const LABELS = {
  essenceMap: 'problem and core idea',
  priorLimitation: 'prior limitation or problem',
  coreIntuition: 'explanatory relation behind the idea',
  workedExample: 'representative example or trace',
  mechanism: 'substantive mechanism or reasoning',
  evidenceInterpretation: 'interpreted source evidence',
  boundary: 'claim boundary',
  engineeringTransfer: 'reader consequence or adoption condition',
  exitRecap: 'bounded takeaway (no separate recap required)',
};

export function auditComprehensionBody(body, options = {}) {
  const all = teachingSignals(body, options.paperType ?? 'empirical');
  const dimensions = Object.fromEntries(Object.keys(LABELS).map((key) => [key, all[key]]));
  const missing = Object.entries(dimensions).filter(([, value]) => !value)
    .map(([key]) => ({ key, label: LABELS[key] }));
  const passed = Object.values(dimensions).filter(Boolean).length;
  return { dimensions, missing, passed, total: Object.keys(LABELS).length,
    score: Math.round(100 * passed / Object.keys(LABELS).length),
    semanticReviewRequired: true };
}

function availableIds() {
  return fs
    .readdirSync(paperDir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
    .map((entry) => entry.name.replace(/\.md$/i, ''))
    .sort();
}

export function auditComprehensionPairs(ids, options = {}) {
  const results = [];
  const errors = [];
  for (const id of ids) {
    for (const locale of ['zh', 'en']) {
      const filePath = path.join(paperDir, ...(locale === 'en' ? ['en'] : []), `${id}.md`);
      if (!fs.existsSync(filePath)) {
        errors.push(`${id}: missing ${locale} article`);
        continue;
      }
      const raw = fs.readFileSync(filePath, 'utf8');
      const body = raw.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u, '');
      const yaml = raw.match(/^---\r?\n([\s\S]*?)\r?\n---/)?.[1] ?? '';
      const audit = auditComprehensionBody(body, { paperType: paperTypeFromFrontmatter(yaml) });
      results.push({ id, locale, filePath: path.relative(root, filePath), ...audit });
      if (options.strict && audit.missing.length > 0) {
        errors.push(
          `${id} (${locale}): ${audit.missing.map((item) => item.label).join('; ')}`,
        );
      }
    }
  }
  return { results, errors };
}

function runCli() {
  const args = process.argv.slice(2);
  const strict = args.includes('--strict');
  const json = args.includes('--json');
  const requested = args.filter((arg) => !arg.startsWith('--')).map((arg) => arg.replace(/\.md$/i, ''));
  const ids = args.includes('--all') ? availableIds() : requested;
  if (ids.length === 0) {
    console.error('Usage: audit-paper-comprehension.mjs [--strict] [--json] <basename... | --all>');
    process.exit(2);
  }

  const report = auditComprehensionPairs(ids, { strict });
  if (json) {
    console.log(JSON.stringify(report, null, 2));
  } else {
    for (const result of report.results) {
      const missing = result.missing.length
        ? `missing: ${result.missing.map((item) => item.label).join(', ')}`
        : 'contract structurally complete';
      console.log(`${result.id} (${result.locale}): ${result.score}% (${result.passed}/${result.total}) — ${missing}`);
    }
  }
  if (strict && report.errors.length > 0) process.exit(1);
}

const invokedPath = process.argv[1] ? pathToFileURL(path.resolve(process.argv[1])).href : null;
if (invokedPath === import.meta.url) runCli();
