#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const paperDir = path.join(root, 'src', 'content', 'paperReading');
const ids = process.argv.slice(2).map((value) => value.replace(/\.md$/i, ''));
const errors = [];

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
    if (!block(yaml, 'paper')) errors.push(`${id}: ${locale} paper metadata is required`);
  }

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
}

if (ids.length === 0) {
  console.error('Usage: audit-paper-pair.mjs <basename> [...]');
  process.exit(2);
}

for (const id of ids) audit(id);

if (errors.length) {
  console.error('Paper pair audit failed:');
  for (const error of errors) console.error(`- ${error}`);
  process.exit(1);
}

console.log(`Paper pair audit passed (${ids.length} pair${ids.length === 1 ? '' : 's'}).`);
