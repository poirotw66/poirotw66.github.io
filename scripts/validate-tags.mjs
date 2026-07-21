import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

import { resolveCanonicalTagSlug, TAG_SLUG_MAP } from '../src/utils/tag.ts';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const BLOG_DIR = path.resolve(__dirname, '../src/content/blog');
const ASCII_SLUG_RE = /^[a-z0-9-]+$/;
const ASCII_ONLY_RE = /^[\x00-\x7F]+$/;

/**
 * Canonical slugs that may intentionally appear on only one Chinese post.
 * Keep this list small and document the reason beside every entry.
 */
export const SINGLETON_TAG_SLUG_EXCEPTIONS = new Set([
  // Exceptional singleton tags for the Bundesliga post
  'generative-ai',
  'sports-tech',
  'bundesliga',
  'digital-transformation',
]);

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

export function validateTagTaxonomy({
  zhPosts,
  enPosts,
  singletonExceptions = SINGLETON_TAG_SLUG_EXCEPTIONS,
  resolveSlug = resolveCanonicalTagSlug,
}) {
  const errors = [];
  const zhById = new Map(zhPosts.map((post) => [post.id, post]));
  const enById = new Map(enPosts.map((post) => [post.id, post]));
  const slugCounts = new Map();

  const resolvePostSlugs = (post, locale) => {
    const slugs = new Set();
    for (const tag of post.data.tags ?? []) {
      try {
        slugs.add(resolveSlug(tag));
      } catch (error) {
        errors.push(`[${locale}/${post.id}] ${error.message}`);
      }
    }
    return [...slugs].sort();
  };

  for (const post of zhPosts) {
    const zhSlugs = resolvePostSlugs(post, 'zh');
    for (const slug of zhSlugs) {
      slugCounts.set(slug, (slugCounts.get(slug) ?? 0) + 1);
    }

    const enPost = enById.get(post.id);
    if (!enPost) {
      errors.push(`[${post.id}] missing English tag counterpart`);
      continue;
    }
    const enSlugs = resolvePostSlugs(enPost, 'en');
    if (JSON.stringify(zhSlugs) !== JSON.stringify(enSlugs)) {
      errors.push(
        `[${post.id}] mismatched bilingual tag slugs: zh=${JSON.stringify(zhSlugs)} en=${JSON.stringify(enSlugs)}`,
      );
    }
  }

  for (const post of enPosts) {
    if (!zhById.has(post.id)) {
      errors.push(`[${post.id}] orphan English tag entry`);
    }
  }

  for (const [slug, count] of slugCounts) {
    if (count === 1 && !singletonExceptions.has(slug)) {
      errors.push(
        `Singleton tag slug "${slug}" appears on one Chinese post. Reuse or merge it, or add a documented exception.`,
      );
    }
  }

  for (const slug of singletonExceptions) {
    const count = slugCounts.get(slug) ?? 0;
    if (count !== 1) {
      errors.push(`Stale singleton exception "${slug}" has usage count ${count}; remove the exception.`);
    }
  }

  return { ok: errors.length === 0, errors, slugCounts };
}

function getBlogMarkdownPaths(locale = 'zh') {
  const dir = locale === 'en' ? path.join(BLOG_DIR, 'en') : BLOG_DIR;
  return fs
    .readdirSync(dir)
    .filter((fileName) => fileName.endsWith('.md'))
    .map((fileName) => path.join(dir, fileName));
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

function loadPostsForValidation(locale = 'zh') {
  return getBlogMarkdownPaths(locale).map((filePath) => ({
    id: path.basename(filePath, '.md'),
    data: { tags: parseTagArrayFromFile(filePath) },
  }));
}

function runCli() {
  const zhPosts = loadPostsForValidation('zh');
  const enPosts = loadPostsForValidation('en');
  const mappingResult = validateTagMappings({ posts: [...zhPosts, ...enPosts], mapping: TAG_SLUG_MAP });
  const taxonomyResult = validateTagTaxonomy({ zhPosts, enPosts });
  const errors = [...mappingResult.errors, ...taxonomyResult.errors];

  if (errors.length > 0) {
    console.error('Tag validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log(`Tag validation passed (${taxonomyResult.slugCounts.size} canonical slugs, no unapproved singletons).`);
}

if (process.argv[1] === __filename) {
  runCli();
}

