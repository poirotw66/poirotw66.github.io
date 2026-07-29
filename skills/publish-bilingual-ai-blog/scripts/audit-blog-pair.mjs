#!/usr/bin/env node

import fs from 'node:fs';
import path from 'node:path';
import { pathToFileURL } from 'node:url';

const root = process.cwd();
const zhDir = path.join(root, 'src/content/blog');
const enDir = path.join(zhDir, 'en');
const fallbackCategories = [
  'Enterprise AI',
  'AI Engineering',
  'Cloud & Platform',
  'Industry Pulse',
  'Creator Tools',
  'Startup',
  'Practice Notes',
];

async function loadCategories() {
  const taxonomyFile = path.join(root, 'src/data/blogTaxonomy.mjs');
  if (!fs.existsSync(taxonomyFile)) return fallbackCategories;
  const taxonomy = await import(pathToFileURL(taxonomyFile).href);
  return taxonomy.BLOG_CATEGORIES ?? fallbackCategories;
}

const validCategories = new Set(await loadCategories());
const strictRequiredFields = [
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
const legacyRequiredFields = ['title', 'description', 'pubDate', 'category'];
const allowedCallouts = {
  zh: new Set(['花花的一句話', '花花的工程提醒', '花花的判斷']),
  en: new Set(['Huahua in one sentence', "Huahua's engineering note", "Huahua's take"]),
};
const legacyEnglishCallouts = new Set([
  '花花的一句話',
  '花花的工程提醒',
  '花花的判斷',
  "Bloom's Mascot Quote",
  "Bloom's Engineering Advice",
]);

function usage(exitCode = 0) {
  console.log('Usage: node skills/publish-bilingual-ai-blog/scripts/audit-blog-pair.mjs [options] <post-id-or-basename>...');
  console.log('');
  console.log('Options:');
  console.log('  --mode=new      Strict publication gate for named new or rewritten posts (default).');
  console.log('  --mode=legacy   Compatibility gate; accepts schema defaults and reports editorial debt as warnings.');
  console.log('  --mode=audit    Audit named posts or the whole corpus when no post is named.');
  console.log('  --format=json   Emit a machine-readable report.');
  process.exit(exitCode);
}

function parseArgs(argv) {
  let mode = 'new';
  let format = 'text';
  const inputs = [];
  for (const arg of argv) {
    if (arg === '--help' || arg === '-h') usage();
    if (arg.startsWith('--mode=')) {
      mode = arg.slice('--mode='.length);
      continue;
    }
    if (arg.startsWith('--format=')) {
      format = arg.slice('--format='.length);
      continue;
    }
    inputs.push(arg);
  }
  if (!['new', 'legacy', 'audit'].includes(mode)) {
    throw new Error(`Unsupported mode "${mode}".`);
  }
  if (!['text', 'json'].includes(format)) {
    throw new Error(`Unsupported format "${format}".`);
  }
  if (mode === 'new' && inputs.length === 0) {
    throw new Error('Strict new-post mode requires at least one post id or basename.');
  }
  return { mode, format, inputs };
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
    const value = frontmatter.match(new RegExp(`^${key}:\\s*["']?([^\\n"']*)["']?\\s*$`, 'm'));
    return value?.[1]?.trim();
  };
  const hasField = (key) => new RegExp(`^${key}:`, 'm').test(frontmatter);
  return { frontmatter, body, scalar, hasField };
}

function withoutFencedCode(markdown) {
  const lines = markdown.split(/\r?\n/);
  let fence = null;

  return lines
    .map((line) => {
      const marker = line.match(/^\s*(`{3,}|~{3,})/);
      if (!fence && marker) {
        fence = marker[1][0];
        return '';
      }
      if (fence && new RegExp(`^\\s*${fence}{3,}`).test(line)) {
        fence = null;
        return '';
      }
      return fence ? '' : line;
    })
    .join('\n');
}

function auditDocument(file, locale, mode) {
  const doc = parseDocument(file);
  const visibleBody = withoutFencedCode(doc.body);
  const strict = mode === 'new';
  const errors = [];
  const warnings = [];
  const requiredFields = strict ? strictRequiredFields : legacyRequiredFields;

  for (const field of requiredFields) {
    if (!doc.hasField(field)) errors.push(`missing frontmatter field "${field}"`);
  }

  const category = doc.scalar('category');
  if (category && !validCategories.has(category)) {
    errors.push(`invalid category "${category}"`);
  }

  const calloutPattern = /^>\s+\*\*([^*]+)\*\*/gm;
  const detected = [...visibleBody.matchAll(calloutPattern)]
    .map((match) => match[1].replace(/[:：\s]*$/, '').trim())
    .filter((label) => /花花|Huahua|Bloom/i.test(label));
  for (const label of detected) {
    if (allowedCallouts[locale].has(label)) continue;
    if (locale === 'en' && legacyEnglishCallouts.has(label) && !strict) {
      if (mode === 'legacy') warnings.push(`legacy English callout label "${label}"`);
      continue;
    }
    const message = `unsupported Huahua callout label "${label}"`;
    (strict ? errors : warnings).push(message);
  }
  if (detected.length > 3) errors.push(`too many Huahua callouts (${detected.length}; maximum 3)`);
  if (detected.length === 0 && mode !== 'audit') {
    (strict ? errors : warnings).push('no recognized Huahua callout');
  }

  if (/^#{2,3}\s+.*[\p{Extended_Pictographic}]/mu.test(visibleBody)) {
    warnings.push('emoji detected in a section heading');
  }
  if (/^---\s*$/m.test(visibleBody)) {
    warnings.push('decorative horizontal rule detected in article body');
  }
  if (/^>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]/m.test(visibleBody)) {
    (strict ? errors : warnings).push('raw Obsidian callout detected');
  }
  if (/^\s*<img\b[^>]*\bstyle\s*=/im.test(visibleBody)) {
    (strict ? errors : warnings).push('styled raw image detected; use Markdown image syntax');
  }

  const markdownLinks = [...visibleBody.matchAll(/(?<!!)\[[^\]]+\]\(([^)]+)\)/g)]
    .map((match) => match[1]);
  const externalLinks = markdownLinks.filter((href) => /^https?:\/\//.test(href));
  const isArticleLink = (href) => /^\/(?:en\/)?blog\/[^/()?#]+\/(?:[?#][^)]*)?$/.test(href);
  const internalLinks = markdownLinks.filter(isArticleLink);
  if (mode !== 'audit' && externalLinks.length === 0) {
    (strict ? errors : warnings).push('no external source link detected');
  }
  if (strict && internalLinks.length < 2) {
    errors.push(`only ${internalLinks.length} internal Bloss0m reading link(s); expected at least 2`);
  } else if (mode === 'legacy' && internalLinks.length === 0) {
    warnings.push('no internal Bloss0m reading link detected');
  }
  if (locale === 'en' && internalLinks.some((href) => href.startsWith('/blog/'))) {
    (strict ? errors : warnings).push(
      'English article contains a non-localized /blog/ internal link; expected /en/blog/',
    );
  }

  const image = doc.scalar('image');
  if (image?.startsWith('/')) {
    const imageFile = path.join(root, 'public', image);
    if (!fs.existsSync(imageFile)) errors.push(`referenced image does not exist: ${image}`);
  }

  return { doc, errors, warnings };
}

function emitText(report) {
  for (const item of report.items) {
    for (const message of item.errors) {
      console.error(`ERROR ${item.basename} [${item.locale}]: ${message}`);
    }
    for (const message of item.warnings) {
      console.warn(`WARN  ${item.basename} [${item.locale}]: ${message}`);
    }
  }
  for (const message of report.globalErrors) console.error(`ERROR ${message}`);
  console.log(
    `Audit complete (${report.mode}): ${report.errorCount} error(s), ${report.warningCount} warning(s), ${report.postCount} pair(s).`,
  );
}

const options = parseArgs(process.argv.slice(2));
const zhNames = listMarkdown(zhDir);
const requested = options.inputs.length > 0
  ? options.inputs
  : zhNames.map((name) => name.replace(/\.(md|mdx)$/, ''));
const report = {
  mode: options.mode,
  postCount: 0,
  errorCount: 0,
  warningCount: 0,
  globalErrors: [],
  items: [],
};

for (const input of requested) {
  let basename;
  try {
    basename = resolveBasename(input, zhNames);
  } catch (error) {
    report.globalErrors.push(error.message);
    report.errorCount += 1;
    continue;
  }

  const zhFile = path.join(zhDir, basename);
  const enFile = path.join(enDir, basename);
  if (!fs.existsSync(enFile)) {
    report.globalErrors.push(`${basename}: missing English pair`);
    report.errorCount += 1;
    continue;
  }

  const zh = auditDocument(zhFile, 'zh', options.mode);
  const en = auditDocument(enFile, 'en', options.mode);
  report.postCount += 1;
  for (const [locale, result] of [['zh', zh], ['en', en]]) {
    report.items.push({
      basename,
      locale,
      errors: result.errors,
      warnings: result.warnings,
    });
    report.errorCount += result.errors.length;
    report.warningCount += result.warnings.length;
  }

  for (const key of ['pubDate', 'updatedDate', 'category', 'kind', 'image']) {
    const zhValue = zh.doc.scalar(key);
    const enValue = en.doc.scalar(key);
    if (zhValue !== enValue) {
      report.globalErrors.push(
        `${basename}: bilingual "${key}" mismatch (${zhValue ?? 'missing'} vs ${enValue ?? 'missing'})`,
      );
      report.errorCount += 1;
    }
  }
}

if (options.format === 'json') {
  console.log(JSON.stringify(report, null, 2));
} else {
  emitText(report);
}
process.exit(report.errorCount > 0 ? 1 : 0);
