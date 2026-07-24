import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.resolve(ROOT_DIR, 'src/content');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);
const CJK_RE = /[\u3400-\u9fff]+/g;
const ALLOWED_BRAND_TERMS = ['花花'];

function walkEnglishFiles(dir) {
  if (!fs.existsSync(dir)) return [];
  const files = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      files.push(...walkEnglishFiles(fullPath));
    } else if (
      path.basename(path.dirname(fullPath)) === 'en'
      && MARKDOWN_EXTENSIONS.has(path.extname(entry.name))
    ) {
      files.push(fullPath);
    }
  }
  return files;
}

function bodyAfterFrontmatter(content) {
  return content.replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
}

function visibleMarkdownText(line) {
  let text = line
    .replace(/`[^`]*`/g, '')
    .replace(/!\[([^\]]*)]\([^)]+\)/g, '$1')
    .replace(/\[([^\]]+)]\([^)]+\)/g, '$1')
    .replace(/<https?:\/\/[^>]+>/g, '')
    .replace(/https?:\/\/\S+/g, '')
    .replace(/<[^>]+>/g, '');

  for (const term of ALLOWED_BRAND_TERMS) {
    text = text.replaceAll(term, '');
  }
  return text;
}

export function validateEnglishBody(content, filePath = 'English content') {
  const errors = [];
  const lines = bodyAfterFrontmatter(content).replace(/\r\n/g, '\n').split('\n');
  let inFence = false;
  let inBrandedCallout = false;

  lines.forEach((line, index) => {
    if (/^\s*(```|~~~)/.test(line)) {
      inFence = !inFence;
      return;
    }
    if (inFence) return;

    if (/^>\s*\*\*花花/.test(line)) {
      inBrandedCallout = true;
    } else if (!/^>/.test(line)) {
      inBrandedCallout = false;
    }
    if (inBrandedCallout && /^>/.test(line)) return;

    const visibleText = visibleMarkdownText(line);
    const matches = [...new Set(visibleText.match(CJK_RE) ?? [])];
    if (matches.length > 0) {
      errors.push(
        `${filePath}:${index + 1} contains untranslated CJK text: ${matches.join(', ')}`,
      );
    }
  });

  return errors;
}

export function validateEnglishPurity({ contentDir = CONTENT_DIR } = {}) {
  const files = walkEnglishFiles(contentDir);
  const errors = [];
  for (const filePath of files) {
    const content = fs.readFileSync(filePath, 'utf8');
    errors.push(...validateEnglishBody(content, filePath));
  }
  return { ok: errors.length === 0, errors, fileCount: files.length };
}

function runCli() {
  const result = validateEnglishPurity();
  if (!result.ok) {
    console.error('English content purity validation failed:');
    for (const error of result.errors) console.error(`- ${error}`);
    process.exit(1);
  }
  console.log(
    `English content purity validation passed (${result.fileCount} files; branded Huahua callouts allowed).`,
  );
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli();
}
