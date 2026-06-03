import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const PAPER_READING_DIR = path.resolve(ROOT_DIR, 'src/content/paperReading');
const BLOG_DIR = path.resolve(ROOT_DIR, 'src/content/blog');

/** Files exempt from single-article rules (PRD-002 legacy). */
const LEGACY_PART_FILE_RE = /-part-[12]\.md$/;

const BANNED_HEADING_RES = [
  /^##\s*第一部分/m,
  /^##\s*第二部分/m,
  /^##\s*第[一二三四五六七八九十]+部分/m,
  /^##\s*[^#\n]*海選/m,
  /^##\s*[\u{1F300}-\u{1FAFF}]/mu,
];

const ANCHOR_RES = [
  /§\s*\d/,
  /\bFigure\s+\d+\b/i,
  /\bTable\s+\d+\b/i,
  /\bFig\.\s*\d+\b/i,
  /表\s*\d+/,
  /圖\s*\d+/,
];

const LIMITATION_RES = /限制|局限|編者|不足|尚未|失敗|overclaim|brittle| caveat/i;

const SIMPLIFIED_ONLY_CHARS = '这国说对时会过还与为门';

function stripForLanguageCheck(body) {
  return body
    .replace(/```[\s\S]*?```/g, '')
    .replace(/!?\[[^\]]*\]\([^)]*\)/g, '')
    .replace(/`[^`]+`/g, '');
}

const MIN_PAPER_BODY_CHARS = 3500;
const MIN_BLOG_DEEP_READ_CHARS = 2000;
const MIN_ANCHORS = 3;
const MIN_METHOD_SIGNALS = 2;

function splitFrontmatter(content, filePath) {
  const match = content.match(/^---\r?\n([\s\S]*?)\r?\n---(?:\r?\n|$)/);
  if (!match) {
    throw new Error(`Invalid frontmatter block in ${filePath}`);
  }
  return { frontmatter: match[1], body: content.slice(match[0].length) };
}

function parseSeriesTotalParts(frontmatter) {
  const block = frontmatter.match(/^series:\s*\n([\s\S]*?)(?:\n[A-Za-z_][A-Za-z0-9_]*:|\s*$)/m);
  if (!block) {
    return null;
  }
  const match = block[1].match(/^\s*totalParts:\s*(\d+)\s*$/m);
  return match ? Number(match[1]) : null;
}

function countAnchors(body) {
  let count = 0;
  for (const pattern of ANCHOR_RES) {
    const matches = body.match(new RegExp(pattern.source, pattern.flags + 'g'));
    if (matches) {
      count += matches.length;
    }
  }
  return count;
}

function countMethodSignals(body) {
  const numberedSteps = body.match(/^\s*\d+\.\s+\S+/gm) ?? [];
  const arrowSteps = body.match(/→/g) ?? [];
  return numberedSteps.length + arrowSteps.length;
}

function findSimplifiedChinese(body) {
  const hits = [];
  for (const char of SIMPLIFIED_ONLY_CHARS) {
    if (body.includes(char)) {
      hits.push(char);
    }
  }
  return hits;
}

function findBannedHeadings(body) {
  const hits = [];
  for (const pattern of BANNED_HEADING_RES) {
    const match = body.match(pattern);
    if (match) {
      hits.push(match[0].trim());
    }
  }
  return hits;
}

function isBlogDeepRead(body) {
  return /原文出處/.test(body);
}

/**
 * @param {{ basename: string, frontmatter: string, body: string, filePath: string }} file
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validatePaperReadingFile({ basename, frontmatter, body, filePath }) {
  const errors = [];
  const warnings = [];
  const legacy = LEGACY_PART_FILE_RE.test(basename);

  if (!legacy) {
    const totalParts = parseSeriesTotalParts(frontmatter);
    if (totalParts !== null && totalParts !== 1) {
      errors.push(`series.totalParts must be 1 (got ${totalParts}) in ${filePath}`);
    }
    if (/-part-\d+\.md$/.test(basename)) {
      errors.push(`New paperReading files must not use -part-N filename: ${filePath}`);
    }
  }

  for (const heading of findBannedHeadings(body)) {
    errors.push(`Banned heading pattern "${heading}" in ${filePath}`);
  }

  if (/\bTODO\b/i.test(body)) {
    errors.push(`TODO placeholder in body: ${filePath}`);
  }

  if (/\\[\(\[]/.test(body)) {
    errors.push(
      `Use KaTeX $...$ / $$...$$ instead of \\(...\\) or \\[...\\]: ${filePath}`,
    );
  }

  const simplifiedHits = findSimplifiedChinese(stripForLanguageCheck(body));
  if (simplifiedHits.length > 0) {
    errors.push(
      `Possible simplified Chinese characters [${simplifiedHits.join(', ')}] in ${filePath}`,
    );
  }

  if (!legacy) {
    const anchors = countAnchors(body);
    if (anchors < MIN_ANCHORS) {
      errors.push(
        `Need at least ${MIN_ANCHORS} source anchors (§/Figure/Table); found ${anchors} in ${filePath}`,
      );
    }

    const methodSignals = countMethodSignals(body);
    if (methodSignals < MIN_METHOD_SIGNALS) {
      warnings.push(
        `Method skeleton may be thin (numbered/arrow steps: ${methodSignals}) in ${filePath}`,
      );
    }

    if (!LIMITATION_RES.test(body)) {
      warnings.push(`No explicit limitation/editor-skepticism signal in ${filePath}`);
    }

    if (body.length < MIN_PAPER_BODY_CHARS) {
      warnings.push(
        `Body length ${body.length} chars below ${MIN_PAPER_BODY_CHARS} (detailed-note heuristic) in ${filePath}`,
      );
    }
  }

  const pdfLink = frontmatter.match(/^\s*pdf:\s*["']?(https:\/\/[^"'\n]+)["']?/m);
  if (pdfLink && !pdfLink[1].startsWith('https://')) {
    errors.push(`paper.links.pdf must be HTTPS in ${filePath}`);
  }

  return { errors, warnings };
}

/**
 * @param {{ body: string, filePath: string }} file
 * @returns {{ errors: string[], warnings: string[] }}
 */
export function validateBlogDeepReadFile({ body, filePath }) {
  const errors = [];
  const warnings = [];

  if (!/原文出處/.test(body)) {
    errors.push(`Missing 原文出處 block in ${filePath}`);
  }

  const anchors = countAnchors(body);
  if (anchors < MIN_ANCHORS) {
    errors.push(
      `Need at least ${MIN_ANCHORS} source anchors; found ${anchors} in ${filePath}`,
    );
  }

  if (!LIMITATION_RES.test(body)) {
    warnings.push(`No critical judgment/limitation signal in ${filePath}`);
  }

  const simplifiedHits = findSimplifiedChinese(stripForLanguageCheck(body));
  if (simplifiedHits.length > 0) {
    errors.push(
      `Possible simplified Chinese characters [${simplifiedHits.join(', ')}] in ${filePath}`,
    );
  }

  if (body.length < MIN_BLOG_DEEP_READ_CHARS) {
    warnings.push(`Body length ${body.length} below ${MIN_BLOG_DEEP_READ_CHARS} in ${filePath}`);
  }

  return { errors, warnings };
}

function loadMarkdownFiles(dir) {
  return fs
    .readdirSync(dir)
    .filter((name) => name.endsWith('.md'))
    .map((name) => path.join(dir, name));
}

/**
 * @param {{ paperReadingDir?: string, blogDir?: string }} [options]
 */
export function validateReadingQuality(options = {}) {
  const paperDir = options.paperReadingDir ?? PAPER_READING_DIR;
  const blogDir = options.blogDir ?? BLOG_DIR;
  const errors = [];
  const warnings = [];

  for (const filePath of loadMarkdownFiles(paperDir)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { frontmatter, body } = splitFrontmatter(raw, filePath);
    const result = validatePaperReadingFile({
      basename: path.basename(filePath),
      frontmatter,
      body,
      filePath,
    });
    errors.push(...result.errors);
    warnings.push(...result.warnings);
  }

  // Blog deep-read checks are advisory until spec-016 retrofit (warnings only).
  for (const filePath of loadMarkdownFiles(blogDir)) {
    const raw = fs.readFileSync(filePath, 'utf8');
    const { body } = splitFrontmatter(raw, filePath);
    if (!isBlogDeepRead(body)) {
      continue;
    }
    const result = validateBlogDeepReadFile({ body, filePath });
    warnings.push(...result.errors.map((e) => `[advisory] ${e}`));
    warnings.push(...result.warnings);
  }

  return { ok: errors.length === 0, errors, warnings };
}

function runCli() {
  const { ok, errors, warnings } = validateReadingQuality();

  if (warnings.length > 0) {
    console.warn('Reading quality warnings:');
    for (const warning of warnings) {
      console.warn(`- ${warning}`);
    }
  }

  if (!ok) {
    console.error('Reading quality validation failed:');
    for (const error of errors) {
      console.error(`- ${error}`);
    }
    process.exit(1);
  }

  console.log('Reading quality validation passed.');
}

if (import.meta.url === `file://${__filename}`) {
  runCli();
}
