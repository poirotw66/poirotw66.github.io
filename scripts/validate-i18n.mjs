/**
 * Bilingual content completeness gate.
 * Ensures every zh entry under localizable collections has a matching en/<slug>.md
 * (and vice versa), with shared structural metadata.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.resolve(ROOT_DIR, 'src/content');

const LOCALIZED_COLLECTIONS = [
  'blog',
  'paperReading',
  'projects',
  'stickers',
  'stickerTools',
];

const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

/** Top-level scalar fields that must match across zh/en counterparts. */
const SHARED_SCALAR_FIELDS = {
  blog: ['pubDate', 'image', 'category', 'kind', 'showToc', 'wideHeader', 'guideVersion'],
  paperReading: ['pubDate', 'image', 'field', 'difficulty', 'showToc'],
  projects: ['pubDate', 'image', 'tier', 'featuredOrder', 'labZone', 'repoUrl'],
  stickers: ['pubDate', 'image', 'lineStoreUrl'],
  stickerTools: ['order', 'image', 'repoUrl'],
};

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs
    .readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => entry.name);
}

function splitFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`Invalid frontmatter block in ${filePath}`);
  }
  return match[1];
}

function parseTopLevelFields(frontmatter) {
  const fields = new Map();
  const lines = frontmatter.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  for (const line of lines) {
    if (!line || line.startsWith(' ') || line.startsWith('\t') || line.trim().startsWith('#')) {
      continue;
    }
    const match = line.match(/^([A-Za-z_][A-Za-z0-9_]*):\s*(.*)$/);
    if (!match) continue;
    fields.set(match[1], match[2].trim());
  }
  return fields;
}

function parseNestedScalar(frontmatter, parentKey, childKey) {
  const lines = frontmatter.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  let inParent = false;
  for (const line of lines) {
    if (/^[A-Za-z_]/.test(line)) {
      inParent = line.startsWith(`${parentKey}:`);
      continue;
    }
    if (!inParent) continue;
    const match = line.match(new RegExp(`^\\s+${childKey}:\\s*(.*)$`));
    if (match) {
      return match[1].trim().replace(/^['"]|['"]$/g, '');
    }
  }
  return undefined;
}

function normalizeScalar(value) {
  if (value == null) return undefined;
  const trimmed = String(value).trim();
  if (!trimmed || trimmed === 'null' || trimmed === '~') return undefined;
  return trimmed.replace(/^['"]|['"]$/g, '');
}

function loadEntry(collection, locale, fileName, contentDir) {
  const filePath =
    locale === 'zh'
      ? path.join(contentDir, collection, fileName)
      : path.join(contentDir, collection, 'en', fileName);
  const raw = fs.readFileSync(filePath, 'utf8');
  const frontmatter = splitFrontmatter(raw, filePath);
  const fields = parseTopLevelFields(frontmatter);
  return { filePath, fileName, fields, frontmatter };
}

export function validateI18nPairing({ contentDir = CONTENT_DIR } = {}) {
  const errors = [];

  for (const collection of LOCALIZED_COLLECTIONS) {
    const zhDir = path.join(contentDir, collection);
    const enDir = path.join(zhDir, 'en');
    const zhFiles = new Set(listMarkdownFiles(zhDir));
    const enFiles = new Set(listMarkdownFiles(enDir));

    for (const fileName of zhFiles) {
      if (!enFiles.has(fileName)) {
        errors.push(`[${collection}] missing English counterpart: en/${fileName}`);
      }
    }
    for (const fileName of enFiles) {
      if (!zhFiles.has(fileName)) {
        errors.push(`[${collection}] orphan English file without zh original: en/${fileName}`);
      }
    }

    const sharedFields = SHARED_SCALAR_FIELDS[collection] ?? [];
    for (const fileName of zhFiles) {
      if (!enFiles.has(fileName)) continue;
      const zh = loadEntry(collection, 'zh', fileName, contentDir);
      const en = loadEntry(collection, 'en', fileName, contentDir);

      for (const field of sharedFields) {
        const zhValue = normalizeScalar(zh.fields.get(field));
        const enValue = normalizeScalar(en.fields.get(field));
        if (zhValue !== enValue) {
          errors.push(
            `[${collection}/${fileName}] mismatched ${field}: zh=${JSON.stringify(zhValue)} en=${JSON.stringify(enValue)}`,
          );
        }
      }

      if (collection === 'paperReading') {
        const zhSeriesId = parseNestedScalar(zh.frontmatter, 'series', 'id');
        const enSeriesId = parseNestedScalar(en.frontmatter, 'series', 'id');
        const zhPart = parseNestedScalar(zh.frontmatter, 'series', 'part');
        const enPart = parseNestedScalar(en.frontmatter, 'series', 'part');
        if (zhSeriesId !== enSeriesId) {
          errors.push(
            `[${collection}/${fileName}] mismatched series.id: zh=${JSON.stringify(zhSeriesId)} en=${JSON.stringify(enSeriesId)}`,
          );
        }
        if (zhPart !== enPart) {
          errors.push(
            `[${collection}/${fileName}] mismatched series.part: zh=${JSON.stringify(zhPart)} en=${JSON.stringify(enPart)}`,
          );
        }
      }

      if (collection === 'stickers') {
        const zhList = collectYamlList(zh.frontmatter, 'spriteImages');
        const enList = collectYamlList(en.frontmatter, 'spriteImages');
        if (JSON.stringify(zhList) !== JSON.stringify(enList)) {
          errors.push(
            `[${collection}/${fileName}] mismatched spriteImages: zh=${JSON.stringify(zhList)} en=${JSON.stringify(enList)}`,
          );
        }
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function collectYamlList(frontmatter, key) {
  const lines = frontmatter.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const items = [];
  let inList = false;
  for (const line of lines) {
    if (/^[A-Za-z_]/.test(line)) {
      inList = line.startsWith(`${key}:`);
      continue;
    }
    if (!inList) continue;
    const match = line.match(/^\s+-\s*(.*)$/);
    if (!match) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      break;
    }
    items.push(normalizeScalar(match[1]));
  }
  return items;
}

function runCli() {
  const result = validateI18nPairing();
  if (!result.ok) {
    console.error('i18n validation failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }
  console.log('i18n validation passed.');
}

const isDirectRun =
  process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url);

if (isDirectRun) {
  runCli();
}
