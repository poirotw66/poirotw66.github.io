import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');
const MARKDOWN_EXTENSIONS = new Set(['.md', '.mdx']);

function listMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return MARKDOWN_EXTENSIONS.has(path.extname(entry.name)) ? [fullPath] : [];
  });
}

function splitBody(source) {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
  if (!frontmatter) return { body: source, lineOffset: 0 };
  return {
    body: source.slice(frontmatter[0].length),
    lineOffset: (frontmatter[0].match(/\n/g) ?? []).length,
  };
}

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

function hasUnescapedStrongMarker(raw) {
  return /(^|[^\\])\*\*/.test(raw);
}

export function validateMarkdownEmphasis(source, file = '<memory>') {
  const { body, lineOffset } = splitBody(source);
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(body);
  const errors = [];

  visit(tree, (node) => {
    if (node.type !== 'text' || !node.value.includes('**') || !node.position) return;
    const start = node.position.start.offset;
    const end = node.position.end.offset;
    const raw = Number.isInteger(start) && Number.isInteger(end)
      ? body.slice(start, end)
      : node.value;
    if (!hasUnescapedStrongMarker(raw)) return;

    const line = node.position.start.line + lineOffset;
    const preview = node.value.replace(/\s+/g, ' ').trim().slice(0, 100);
    errors.push(
      `${file}:${line}: literal ** reached rendered prose; add delimiter spacing or move punctuation outside the bold span (${preview})`,
    );
  });

  return errors;
}

export function validateMarkdownEmphasisCorpus(directory = CONTENT_DIR) {
  const files = listMarkdownFiles(directory);
  const errors = files.flatMap((filePath) => {
    const source = fs.readFileSync(filePath, 'utf8');
    return validateMarkdownEmphasis(source, path.relative(ROOT, filePath));
  });
  return { errors, fileCount: files.length };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateMarkdownEmphasisCorpus();
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Markdown emphasis validation passed (${result.fileCount} files).`);
  }
}
