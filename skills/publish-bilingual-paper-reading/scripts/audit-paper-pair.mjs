#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const paperDir = path.join(root, 'src', 'content', 'paperReading');
const strict = process.argv.includes('--strict');
const requestedIds = process.argv
  .slice(2)
  .filter((value) => value !== '--strict' && value !== '--all')
  .map((value) => value.replace(/\.md$/i, ''));
const ids = process.argv.includes('--all')
  ? fs
      .readdirSync(paperDir, { withFileTypes: true })
      .filter((entry) => entry.isFile() && entry.name.endsWith('.md'))
      .map((entry) => entry.name.replace(/\.md$/i, ''))
      .sort()
  : requestedIds;
const errors = [];
const warnings = [];
const advisories = [];
const qualityModuleUrl = pathToFileURL(
  path.join(root, 'scripts', 'validate-reading-quality.mjs'),
).href;
const { splitFrontmatter, validatePaperReadingFile, validatePaperReadingPair } = await import(
  qualityModuleUrl
);

function frontmatter(raw, file) {
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/u);
  if (!match) throw new Error(`invalid frontmatter: ${file}`);
  return match[1];
}

function topLevel(yaml, key) {
  return yaml.match(new RegExp(`^${key}:\\s*(.+)$`, 'm'))?.[1]?.trim();
}

function block(yaml, key) {
  return yaml.match(new RegExp(`^${key}:\\s*\\n([\\s\\S]*?)(?=^[A-Za-z_][A-Za-z0-9_]*:|$)`, 'm'))?.[1] ?? '';
}

function normalizedBlock(yaml, key, localizedKeys = []) {
  let value = block(yaml, key).replace(/\r\n/g, '\n').trim();
  for (const localizedKey of localizedKeys) {
    value = value.replace(new RegExp(`^\\s*${localizedKey}:.*$`, 'gm'), '');
  }
  return value.replace(/\n{2,}/g, '\n').trim();
}

function listCount(yaml, key) {
  return (block(yaml, key).match(/^\s+-\s+.+$/gm) ?? []).length;
}

function localLinks(raw) {
  return [...raw.matchAll(/\]\((\/(?:en\/)?paper-reading\/[^)]+)\)/g)].map((match) => match[1]);
}

function audit(id) {
  if (!/^\d{2}-[A-Za-z0-9][A-Za-z0-9-]*$/.test(id)) errors.push(`${id}: basename must use a two-digit prefix and ASCII slug`);
  const zhPath = path.join(paperDir, `${id}.md`);
  const enPath = path.join(paperDir, 'en', `${id}.md`);
  for (const file of [zhPath, enPath]) {
    if (!fs.existsSync(file)) errors.push(`${id}: missing ${path.relative(root, file)}`);
  }
  if (!fs.existsSync(zhPath) || !fs.existsSync(enPath)) return;

  const zhRaw = fs.readFileSync(zhPath, 'utf8');
  const enRaw = fs.readFileSync(enPath, 'utf8');
  const zh = frontmatter(zhRaw, zhPath);
  const en = frontmatter(enRaw, enPath);

  for (const key of ['pubDate', 'updatedDate', 'image', 'field', 'difficulty', 'showToc']) {
    if (topLevel(zh, key) !== topLevel(en, key)) errors.push(`${id}: mismatched ${key}`);
  }
  for (const [locale, yaml] of [['zh', zh], ['en', en]]) {
    if (listCount(yaml, 'tldr') < 1) errors.push(`${id}: ${locale} tldr is required`);
    if (listCount(yaml, 'audience') < 1) errors.push(`${id}: ${locale} audience is required`);
    const topicCount = listCount(yaml, 'topics');
    if (topicCount < 1 || topicCount > 3) errors.push(`${id}: ${locale} topics must contain 1–3 IDs`);
    if (!block(yaml, 'paper')) errors.push(`${id}: ${locale} paper metadata is required`);
  }

  if (normalizedBlock(zh, 'topics') !== normalizedBlock(en, 'topics')) errors.push(`${id}: topics must match exactly across languages`);
  if (normalizedBlock(zh, 'paper') !== normalizedBlock(en, 'paper')) errors.push(`${id}: paper metadata must match exactly across languages`);
  if (normalizedBlock(zh, 'series', ['title']) !== normalizedBlock(en, 'series', ['title'])) errors.push(`${id}: series id, part, and totalParts must match across languages`);

  const image = topLevel(zh, 'image')?.replace(/^['"]|['"]$/g, '');
  if (image) {
    const imagePath = path.join(root, 'public', image.replace(/^\//, ''));
    if (!fs.existsSync(imagePath)) errors.push(`${id}: cover does not exist: ${image}`);
  }

  for (const link of localLinks(enRaw)) {
    if (!link.startsWith('/en/paper-reading/')) errors.push(`${id}: English internal link is not localized: ${link}`);
  }

  const zhDocument = splitFrontmatter(zhRaw, zhPath);
  const enDocument = splitFrontmatter(enRaw, enPath);
  for (const [locale, document, filePath] of [
    ['zh', zhDocument, zhPath],
    ['en', enDocument, enPath],
  ]) {
    const result = validatePaperReadingFile({
      basename: `${id}.md`,
      frontmatter: document.frontmatter,
      body: document.body,
      filePath,
      locale,
    });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
    advisories.push(...result.advisories);
  }
  const pairResult = validatePaperReadingPair({
    id,
    zhBody: zhDocument.body,
    enBody: enDocument.body,
  });
  warnings.push(...pairResult.warnings);
  advisories.push(...pairResult.advisories);
}

if (ids.length === 0) {
  console.error('Usage: audit-paper-pair.mjs [--strict] <basename... | --all>');
  process.exit(2);
}

for (const id of ids) audit(id);

if (warnings.length) {
  console.warn('Paper pair audit warnings:');
  for (const warning of warnings) console.warn(`- ${warning}`);
}
if (advisories.length) {
  console.warn('Paper pair audit advisories:');
  for (const advisory of advisories) console.warn(`- ${advisory}`);
}

if (strict && warnings.length) {
  errors.push(`Strict quality gate rejected ${warnings.length} warning${warnings.length === 1 ? '' : 's'}`);
}

if (errors.length) {
  console.error('Paper pair audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(
  `Paper pair audit passed (${ids.length} pair${ids.length === 1 ? '' : 's'}, ${warnings.length} warning${warnings.length === 1 ? '' : 's'}, ${advisories.length} advisor${advisories.length === 1 ? 'y' : 'ies'}).`,
);
