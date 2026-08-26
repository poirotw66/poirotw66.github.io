/**
 * Paper Reading topic taxonomy gate.
 *
 * Astro validates the schema at build time; this lightweight check gives a
 * direct editorial error for coverage, bilingual parity, and thin topics.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import {
  MIN_PAPER_READING_TOPIC_ENTRIES,
  PAPER_READING_TOPIC_IDS,
} from '../src/data/paperReadingTopics.mjs';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const DEFAULT_CONTENT_DIR = path.resolve(__dirname, '../src/content/paperReading');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function listMarkdownFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  return fs.readdirSync(dir, { withFileTypes: true })
    .filter((entry) => entry.isFile() && MARKDOWN_EXTENSIONS.has(path.extname(entry.name)))
    .map((entry) => entry.name)
    .sort();
}

function readFrontmatter(filePath) {
  const raw = fs.readFileSync(filePath, 'utf8');
  const match = raw.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) throw new Error(`Invalid frontmatter block in ${filePath}`);
  return match[1];
}

export function collectYamlList(frontmatter, key) {
  const lines = frontmatter.replace(/\r\n/g, '\n').replace(/\r/g, '\n').split('\n');
  const values = [];
  let inList = false;
  for (const line of lines) {
    if (/^[A-Za-z_]/.test(line)) {
      inList = line.startsWith(`${key}:`);
      continue;
    }
    if (!inList) continue;
    const match = line.match(/^\s+-\s*(.*?)\s*$/);
    if (!match) {
      if (line.trim() === '' || line.trim().startsWith('#')) continue;
      break;
    }
    values.push(match[1].replace(/^['"]|['"]$/g, ''));
  }
  return values;
}

function loadTopics(filePath) {
  return collectYamlList(readFrontmatter(filePath), 'topics');
}

export function validatePaperTopics({
  contentDir = DEFAULT_CONTENT_DIR,
  topicIds = PAPER_READING_TOPIC_IDS,
  minEntries = MIN_PAPER_READING_TOPIC_ENTRIES,
} = {}) {
  const errors = [];
  const topicSet = new Set(topicIds);
  const counts = new Map(topicIds.map((id) => [id, 0]));
  const zhFiles = listMarkdownFiles(contentDir);
  const enDir = path.join(contentDir, 'en');
  const enFiles = new Set(listMarkdownFiles(enDir));

  for (const fileName of zhFiles) {
    const zhTopics = loadTopics(path.join(contentDir, fileName));
    const enPath = path.join(enDir, fileName);
    const enTopics = fs.existsSync(enPath) ? loadTopics(enPath) : null;
    const label = `paperReading/${fileName}`;

    for (const [locale, topics] of [['zh', zhTopics], ['en', enTopics]]) {
      if (!topics) {
        errors.push(`[${label}] missing ${locale} topics because the counterpart file is absent`);
        continue;
      }
      if (topics.length < 1 || topics.length > 3) {
        errors.push(`[${label}] ${locale} topics must contain 1–3 IDs; found ${topics.length}`);
      }
      if (new Set(topics).size !== topics.length) {
        errors.push(`[${label}] ${locale} topics must not repeat an ID`);
      }
      for (const topic of topics) {
        if (!topicSet.has(topic)) {
          errors.push(`[${label}] ${locale} has unknown topic ID: ${topic}`);
        }
      }
    }

    if (enTopics && JSON.stringify(zhTopics) !== JSON.stringify(enTopics)) {
      errors.push(`[${label}] zh/en topics must match in the same order`);
    }
    for (const topic of new Set(zhTopics)) {
      if (topicSet.has(topic)) counts.set(topic, (counts.get(topic) ?? 0) + 1);
    }
  }

  for (const fileName of enFiles) {
    if (!zhFiles.includes(fileName)) {
      errors.push(`[paperReading/en/${fileName}] orphan English file without Chinese counterpart`);
    }
  }

  for (const topicId of topicIds) {
    const count = counts.get(topicId) ?? 0;
    if (count < minEntries) {
      errors.push(`[paperReading/topics/${topicId}] needs at least ${minEntries} Chinese entries; found ${count}`);
    }
  }

  return { ok: errors.length === 0, errors, counts: Object.fromEntries(counts) };
}

function runCli() {
  const result = validatePaperTopics();
  if (!result.ok) {
    console.error('Paper Reading topic validation failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(`Paper Reading topic validation passed: ${JSON.stringify(result.counts)}.`);
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  runCli();
}
