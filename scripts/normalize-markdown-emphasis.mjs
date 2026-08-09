import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src', 'content');

function listMarkdownFiles(directory) {
  return fs.readdirSync(directory, { withFileTypes: true }).flatMap((entry) => {
    const fullPath = path.join(directory, entry.name);
    if (entry.isDirectory()) return listMarkdownFiles(fullPath);
    return /\.mdx?$/.test(entry.name) ? [fullPath] : [];
  });
}

function splitSource(source) {
  const match = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/);
  if (!match) return { prefix: '', body: source };
  return { prefix: match[0], body: source.slice(match[0].length) };
}

function visit(node, callback) {
  callback(node);
  for (const child of node.children ?? []) visit(child, callback);
}

function normalizePair(content) {
  const trimmed = content.trim();
  const quotedWithEnglish = trimmed.match(/^「([^」]+)」\s*\(([^)]+)\)$/u);
  if (quotedWithEnglish) return `「**${quotedWithEnglish[1]}**」（${quotedWithEnglish[2]}）`;

  const quoted = trimmed.match(/^「([^」]+)」$/u);
  if (quoted) return `「**${quoted[1]}**」`;

  const asciiQuoted = trimmed.match(/^"([^"]+)"$/u);
  if (asciiQuoted) return `"**${asciiQuoted[1]}**"`;

  if (trimmed.startsWith('「')) return `「**${trimmed.slice(1)}**`;

  const parenthetical = trimmed.match(/^(.+?)（([^）]+)）$/u);
  if (parenthetical) return `**${parenthetical[1]}**（${parenthetical[2]}）`;

  const trailing = trimmed.match(/^(.+?)([：:；;。！？!?，、])$/u);
  if (trailing) return `**${trailing[1]}**${trailing[2]}`;

  return `**${trimmed}**`;
}

export function normalizeMarkdownEmphasis(source) {
  const { prefix, body } = splitSource(source);
  const tree = unified().use(remarkParse).use(remarkGfm).use(remarkMath).parse(body);
  const replacements = [];

  visit(tree, (node) => {
    if (node.type !== 'text' || !node.value.includes('**') || !node.position) return;
    const { start, end } = node.position;
    const raw = body.slice(start.offset, end.offset);
    const normalized = raw.replace(/\*\*([^*\r\n]+?)\*\*/gu, (_, content) => normalizePair(content));
    if (normalized !== raw) replacements.push({ start: start.offset, end: end.offset, normalized });
  });

  let normalizedBody = body;
  replacements
    .sort((a, b) => b.start - a.start)
    .forEach(({ start, end, normalized }) => {
      normalizedBody = `${normalizedBody.slice(0, start)}${normalized}${normalizedBody.slice(end)}`;
    });
  return `${prefix}${normalizedBody}`;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  let changed = 0;
  for (const filePath of listMarkdownFiles(CONTENT_DIR)) {
    const source = fs.readFileSync(filePath, 'utf8');
    const normalized = normalizeMarkdownEmphasis(source);
    if (normalized === source) continue;
    fs.writeFileSync(filePath, normalized);
    changed += 1;
  }
  console.log(`Normalized ${changed} Markdown files with parser-confirmed literal emphasis.`);
}
