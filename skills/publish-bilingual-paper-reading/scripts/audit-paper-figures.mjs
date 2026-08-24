#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const paperDir = path.join(root, 'src', 'content', 'paperReading');
const strict = process.argv.includes('--strict');
const allowNoBodyFigures = process.argv.includes('--allow-no-body-figures');
const reasonIndex = process.argv.indexOf('--reason');
const exceptionReason = reasonIndex >= 0 ? (process.argv[reasonIndex + 1] || '').trim() : '';
const minFigureIndex = process.argv.indexOf('--min-body-figures');
const minBodyFigures = minFigureIndex >= 0 ? Number(process.argv[minFigureIndex + 1]) : 1;
const requestedIds = process.argv
  .slice(2)
  .filter((value, index, args) => {
    if (['--strict', '--all', '--allow-no-body-figures', '--reason', '--min-body-figures'].includes(value)) return false;
    if (args[index - 1] === '--reason' || args[index - 1] === '--min-body-figures') return false;
    return value !== exceptionReason;
  })
  .map((value) => value.replace(/\.md$/iu, ''));
const ids = process.argv.includes('--all')
  ? fs
      .readdirSync(paperDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name.replace(/\.md$/u, ''))
      .sort()
  : requestedIds;

const errors = [];
const warnings = [];

if (allowNoBodyFigures && !exceptionReason) {
  errors.push('--allow-no-body-figures requires --reason "..."');
}
if (!Number.isInteger(minBodyFigures) || minBodyFigures < 1) {
  errors.push('--min-body-figures must be a positive integer');
}

function splitBody(raw, file) {
  const match = raw.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/u);
  if (!match) throw new Error('invalid frontmatter: ' + file);
  return raw.slice(match[0].length);
}

function normalizeUrl(value) {
  return value.trim().replace(/^<|>$/gu, '');
}

function localAssetPath(url) {
  const normalized = normalizeUrl(url);
  if (!normalized.startsWith('/')) return null;
  return path.join(root, 'public', normalized.replace(/^\/+/u, ''));
}

function extractImages(body) {
  const imagePattern = /!\[[^\]\r\n]*\]\(([^)\s]+)(?:\s+["'][^)]*["'])?\)/gu;
  return [...body.matchAll(imagePattern)].map((match) => {
    const offset = match.index ?? 0;
    const nextHeading = body.slice(offset).search(/^#{2,3}\s+\S.*$/mu);
    const sectionEnd = nextHeading >= 0 ? offset + nextHeading : body.length;
    return {
      url: normalizeUrl(match[1]),
      context: body.slice(offset, Math.min(sectionEnd, offset + 3200)),
    };
  });
}

function auditDocument(id, locale, filePath) {
  if (!fs.existsSync(filePath)) {
    errors.push(id + ': missing ' + locale + ' file ' + path.relative(root, filePath));
    return [];
  }

  const raw = fs.readFileSync(filePath, 'utf8');
  const body = splitBody(raw, filePath);
  const images = extractImages(body);

  for (const [index, image] of images.entries()) {
    const localPath = localAssetPath(image.url);
    if (localPath && !fs.existsSync(localPath)) {
      errors.push(id + ' (' + locale + ') figure ' + (index + 1) + ': local asset does not exist: ' + image.url);
    }
    if (!/^https?:\/\//iu.test(image.url) && !localPath) {
      errors.push(id + ' (' + locale + ') figure ' + (index + 1) + ': image URL must be absolute or a local public path: ' + image.url);
    }

    const context = image.context;
    if (!/(?:figure|圖|原文)/iu.test(context)) {
      errors.push(id + ' (' + locale + ') figure ' + (index + 1) + ': caption must identify the paper figure');
    }
    if (!/(?:section|§|段落|章節|appendix|附錄|teaser|overview)/iu.test(context) && !/https?:\/\/[^)\s]+#[^)\s]*(?:S|A)\d+\.F\d+/iu.test(context)) {
      errors.push(id + ' (' + locale + ') figure ' + (index + 1) + ': caption must identify a paper section or locatable figure anchor');
    }
    if (!/https?:\/\//iu.test(context)) {
      errors.push(id + ' (' + locale + ') figure ' + (index + 1) + ': caption must link to the original source');
    }
    if (!/(?:license|licence|授權|版權|copyright|reuse|權利|CC\s*BY|creative\s+commons)/iu.test(context)) {
      errors.push(id + ' (' + locale + ') figure ' + (index + 1) + ': caption must record licensing or copyright/reuse status');
    }
  }

  return images.map((image) => image.url);
}

function audit(id) {
  if (!/^\d{2}-[A-Za-z0-9][A-Za-z0-9-]*$/u.test(id)) {
    errors.push(id + ': basename must use a two-digit prefix and ASCII slug');
  }

  const zhPath = path.join(paperDir, id + '.md');
  const enPath = path.join(paperDir, 'en', id + '.md');
  const zhImages = auditDocument(id, 'zh', zhPath);
  const enImages = auditDocument(id, 'en', enPath);

  if (strict && !allowNoBodyFigures && zhImages.length < minBodyFigures) {
    errors.push(id + ': requires at least ' + minBodyFigures + ' body figure' + (minBodyFigures === 1 ? '' : 's') + ' per language; found ' + zhImages.length + ' in zh');
  }
  if (strict && !allowNoBodyFigures && enImages.length < minBodyFigures) {
    errors.push(id + ': requires at least ' + minBodyFigures + ' body figure' + (minBodyFigures === 1 ? '' : 's') + ' per language; found ' + enImages.length + ' in en');
  }

  if (zhImages.length === 0 && enImages.length === 0) {
    if (strict && !allowNoBodyFigures) {
      errors.push(id + ': no body figure found; use an original paper figure or document an explicit no-figure exception');
    } else if (allowNoBodyFigures) {
      warnings.push(id + ': no body figure accepted under exception: ' + exceptionReason);
    }
    return;
  }

  if (zhImages.length !== enImages.length) {
    errors.push(id + ': bilingual body-figure counts differ (' + zhImages.length + ' zh vs ' + enImages.length + ' en)');
    return;
  }

  for (let index = 0; index < zhImages.length; index += 1) {
    if (zhImages[index] !== enImages[index]) {
      errors.push(
        id + ': bilingual figure ' + (index + 1) + ' paths differ (' + zhImages[index] + ' vs ' + enImages[index] + ')',
      );
    }
  }
}

if (ids.length === 0) {
  console.error(
    'Usage: audit-paper-figures.mjs [--strict] [--min-body-figures N] [--allow-no-body-figures --reason "..." ] <basename... | --all>',
  );
  process.exit(2);
}

for (const id of ids) audit(id);

if (warnings.length) {
  console.warn('Paper figure audit warnings:');
  for (const warning of warnings) console.warn('- ' + warning);
}

if (errors.length) {
  console.error('Paper figure audit failed:');
  for (const error of errors) console.error('- ' + error);
  process.exit(1);
}

console.log(
  'Paper figure audit passed (' + ids.length + ' pair' + (ids.length === 1 ? '' : 's') + ').',
);
