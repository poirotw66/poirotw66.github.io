import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const BLOG_DIR = path.join(ROOT, 'src', 'content', 'blog');

const LABELS = {
  zh: new Set(['花花的一句話', '花花的工程提醒', '花花的判斷']),
  en: new Set(['Huahua in one sentence', "Huahua's engineering note", "Huahua's take"]),
};

function listMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return /\.mdx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function bodyWithoutFrontmatter(source) {
  return source.replace(/^---\r?\n[\s\S]*?\r?\n---\r?\n/, '');
}

function linesOutsideFences(body) {
  const result = [];
  let fence = null;
  body.split(/\r?\n/).forEach((line, index) => {
    const match = line.match(/^\s*(`{3,}|~{3,})/);
    if (match) {
      const marker = match[1][0];
      fence = fence === marker ? null : (fence ?? marker);
      return;
    }
    if (!fence) result.push({ line, number: index + 1 });
  });
  return result;
}

export function validateBlogDocument(source, locale, file = '<memory>') {
  const errors = [];
  const body = bodyWithoutFrontmatter(source);
  const lines = linesOutsideFences(body);
  let calloutCount = 0;

  for (const { line, number } of lines) {
    if (/^\s*---\s*$/.test(line)) {
      errors.push(`${file}:${number}: decorative horizontal rule; use headings for section hierarchy`);
    }
    if (/^\s*>\s*\[!(NOTE|TIP|WARNING|CAUTION|IMPORTANT)\]/i.test(line)) {
      errors.push(`${file}:${number}: raw Obsidian callout; use a supported Huahua callout`);
    }
    if (/^\s*<img\b[^>]*\bstyle\s*=/i.test(line)) {
      errors.push(`${file}:${number}: styled raw image; use Markdown image syntax`);
    }
    if (/^\s*#{2,3}\s+.*\p{Extended_Pictographic}/u.test(line)) {
      errors.push(`${file}:${number}: emoji in section heading; keep headings text-only`);
    }
    if (/(?<!\\)\b(?:US|NT)\$\d/.test(line)) {
      errors.push(`${file}:${number}: unescaped currency dollar; write US\\$ or NT\\$ so remark-math does not parse it as KaTeX`);
    }

    const callout = line.match(/^\s*>\s*\*\*([^*]+)\*\*/);
    if (callout) {
      const label = callout[1].replace(/[:：\s]*$/, '').trim();
      if (/花花|Huahua|Bloom/i.test(label)) {
        calloutCount += 1;
        if (!LABELS[locale].has(label)) {
          errors.push(`${file}:${number}: unsupported ${locale} Huahua label "${label}"`);
        }
        if (line.replace(callout[0], '').trim()) {
          errors.push(`${file}:${number}: Huahua label must be on its own quoted line`);
        }
      }
    }

    if (locale === 'en') {
      for (const match of line.matchAll(/(?<!!)\[[^\]]+\]\((\/blog\/[^)\s]+)\)/g)) {
        const pathname = match[1].split(/[?#]/, 1)[0];
        if (pathname.endsWith('/')) {
          errors.push(`${file}:${number}: English internal article link must start with /en/blog/`);
        }
      }
    }
  }

  if (calloutCount > 3) {
    errors.push(`${file}: too many Huahua callouts (${calloutCount}; maximum 3)`);
  }
  return errors;
}

export function validateBlogCorpus(directory = BLOG_DIR) {
  const errors = [];
  const files = listMarkdownFiles(directory);
  for (const filePath of files) {
    const locale = filePath.includes(`${path.sep}en${path.sep}`) ? 'en' : 'zh';
    const source = fs.readFileSync(filePath, 'utf8');
    errors.push(...validateBlogDocument(source, locale, path.relative(ROOT, filePath)));
  }
  return { errors, fileCount: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateBlogCorpus();
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Blog format validation passed (${result.fileCount} files).`);
  }
}
