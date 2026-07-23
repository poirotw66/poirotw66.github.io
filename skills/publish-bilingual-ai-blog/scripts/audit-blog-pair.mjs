#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';

const root = process.cwd();
const zhDir = path.join(root, 'src/content/blog');
const enDir = path.join(zhDir, 'en');
const validCategories = new Set([
  'Enterprise AI',
  'AI Engineering',
  'Cloud & Platform',
  'Industry Pulse',
  'Creator Tools',
  'Startup',
  'Practice Notes',
]);
const requiredFields = [
  'title',
  'description',
  'pubDate',
  'updatedDate',
  'tldr',
  'audience',
  'category',
  'tags',
  'kind',
  'showToc',
  'image',
];
const allowedCallouts = {
  zh: new Set(['花花的一句話', '花花的工程提醒', '花花的判斷']),
  en: new Set(['Huahua in one sentence', "Huahua's engineering note", "Huahua's take"]),
};

function usage(exitCode = 0) {
  console.log('Usage: node skills/publish-bilingual-ai-blog/scripts/audit-blog-pair.mjs <post-id-or-basename>...');
  console.log('Example: node skills/publish-bilingual-ai-blog/scripts/audit-blog-pair.mjs 66 67-gemini-3-6-flash-cyber');
  process.exit(exitCode);
}

function listMarkdown(dir) {
  return fs.readdirSync(dir).filter((name) => /\.(md|mdx)$/.test(name));
}

function resolveBasename(input, names) {
  const normalized = input.replace(/\.(md|mdx)$/, '');
  const matches = names.filter((name) => {
    const stem = name.replace(/\.(md|mdx)$/, '');
    return stem === normalized || stem.startsWith(`${normalized}-`);
  });
  if (matches.length !== 1) {
    throw new Error(matches.length === 0
      ? `No post matches "${input}".`
      : `Multiple posts match "${input}": ${matches.join(', ')}`);
  }
  return matches[0];
}

function parseDocument(file) {
  const raw = fs.readFileSync(file, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---\r?\n?([\s\S]*)$/);
  if (!match) throw new Error(`${file}: missing or malformed YAML frontmatter.`);
  const [, frontmatter, body] = match;
  const scalar = (key) => {
    const value = frontmatter.match(new RegExp(`^${key}:\\s*[\"']?([^\\n\"']*)[\"']?\\s*$`, 'm'));
    return value?.[1]?.trim();
  };
  const hasField = (key) => new RegExp(`^${key}:`, 'm').test(frontmatter);
  return { raw, frontmatter, body, scalar, hasField };
}

function auditDocument(file, locale) {
  const doc = parseDocument(file);
  const errors = [];
  const warnings = [];

  for (const field of requiredFields) {
    if (!doc.hasField(field)) errors.push(`missing frontmatter field "${field}"`);
  }

  const category = doc.scalar('category');
  if (category && !validCategories.has(category)) {
    errors.push(`invalid category "${category}"`);
  }

  const calloutPattern = /^>\s+\*\*([^*]+)\*\*/gm;
  const detected = [...doc.body.matchAll(calloutPattern)]
    .map((match) => match[1].replace(/[:：]\s*$/, '').trim())
    .filter((label) => /花花|Huahua|Bloom/i.test(label));
  for (const label of detected) {
    if (!allowedCallouts[locale].has(label)) errors.push(`unsupported Huahua callout label "${label}"`);
  }
  if (detected.length > 3) errors.push(`too many Huahua callouts (${detected.length}; maximum 3)`);
  if (detected.length === 0) warnings.push('no recognized Huahua callout');

  if (/^#{2,3}\s+.*[\p{Extended_Pictographic}]/mu.test(doc.body)) {
    warnings.push('emoji detected in a section heading');
  }
  if (/^---\s*$/m.test(doc.body)) warnings.push('decorative horizontal rule detected in article body');
  if (/^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]/m.test(doc.body)) {
    warnings.push('raw Obsidian callout detected');
  }
  if (!/https?:\/\//.test(doc.body)) warnings.push('no external source link detected');
  const markdownLinks = [...doc.body.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1]);
  if (!markdownLinks.some((href) => /^\/(?:en\/)?blog\//.test(href))) {
    warnings.push('no internal Bloss0m reading link detected');
  }
  if (locale === 'en' && markdownLinks.some((href) => href.startsWith('/blog/'))) {
    errors.push('English article contains a non-localized /blog/ internal link; expected /en/blog/');
  }

  const image = doc.scalar('image');
  if (image?.startsWith('/')) {
    const imageFile = path.join(root, 'public', image);
    if (!fs.existsSync(imageFile)) errors.push(`referenced image does not exist: ${image}`);
  }

  return { doc, errors, warnings };
}

if (process.argv.includes('--help') || process.argv.includes('-h')) usage();
const inputs = process.argv.slice(2);
if (inputs.length === 0) usage(1);

const zhNames = listMarkdown(zhDir);
let errorCount = 0;
let warningCount = 0;

for (const input of inputs) {
  let basename;
  try {
    basename = resolveBasename(input, zhNames);
  } catch (error) {
    console.error(`ERROR ${error.message}`);
    errorCount += 1;
    continue;
  }

  const zhFile = path.join(zhDir, basename);
  const enFile = path.join(enDir, basename);
  if (!fs.existsSync(enFile)) {
    console.error(`ERROR ${basename}: missing English pair`);
    errorCount += 1;
    continue;
  }

  const zh = auditDocument(zhFile, 'zh');
  const en = auditDocument(enFile, 'en');
  for (const [locale, result] of [['zh', zh], ['en', en]]) {
    for (const message of result.errors) {
      console.error(`ERROR ${basename} [${locale}]: ${message}`);
      errorCount += 1;
    }
    for (const message of result.warnings) {
      console.warn(`WARN  ${basename} [${locale}]: ${message}`);
      warningCount += 1;
    }
  }

  for (const key of ['pubDate', 'updatedDate', 'category', 'kind', 'image']) {
    const zhValue = zh.doc.scalar(key);
    const enValue = en.doc.scalar(key);
    if (zhValue !== enValue) {
      console.error(`ERROR ${basename}: bilingual "${key}" mismatch (${zhValue ?? 'missing'} vs ${enValue ?? 'missing'})`);
      errorCount += 1;
    }
  }
}

console.log(`Audit complete: ${errorCount} error(s), ${warningCount} warning(s).`);
process.exit(errorCount > 0 ? 1 : 0);
