import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { TAG_SLUG_MAP } from '../src/utils/tag.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const ASCII_SLUG_RE = /^[a-z0-9-]+$/;
const ASCII_ONLY_RE = /^[\x00-\x7F]+$/;

export function validateTagMappings({ posts, mapping }) {
  const errors = [];
  const slugToTag = new Map();

  for (const [tag, slug] of Object.entries(mapping)) {
    if (!ASCII_SLUG_RE.test(slug)) {
      errors.push(`Invalid slug format for tag "${tag}": ${slug}`);
    }

    const existingTag = slugToTag.get(slug);
    if (existingTag && existingTag !== tag) {
      errors.push(`Duplicate slug "${slug}" for tags "${existingTag}" and "${tag}"`);
    } else {
      slugToTag.set(slug, tag);
    }
  }

  for (const post of posts) {
    for (const tag of post.data.tags ?? []) {
      if (!ASCII_ONLY_RE.test(tag) && !mapping[tag]) {
        errors.push(`Unknown non-ASCII tag: ${tag}. Add mapping in TAG_SLUG_MAP.`);
      }
    }
  }

  return { ok: errors.length === 0, errors };
}

function getBlogMarkdownPaths() {
  return fs
    .readdirSync(BLOG_DIR)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => path.join(BLOG_DIR, fileName));
}

function parseTagArrayFromFile(filePath) {
  const content = fs.readFileSync(filePath, 'utf8');
  const tagLine = content.match(/^tags:\s*(\[[^\n]*\])/m);
  if (!tagLine) {
    return [];
  }

  try {
    return JSON.parse(tagLine[1]);
  } catch {
    throw new Error(`Unable to parse tags array in ${filePath}`);
  }
}

function loadPostsForValidation() {
  return getBlogMarkdownPaths().map((filePath) => ({
    id: path.basename(filePath, '.md'),
    data: { tags: parseTagArrayFromFile(filePath) },
  }));
}

function runCli() {
  const posts = loadPostsForValidation();
  const result = validateTagMappings({ posts, mapping: TAG_SLUG_MAP });

  if (!result.ok) {
    console.error('Tag validation failed:');
    for (const error of result.errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Tag validation passed.');
}

if (process.argv[1] === __filename) {
  runCli();
}

