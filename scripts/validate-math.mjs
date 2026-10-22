import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkMath from 'remark-math';
import katex from 'katex';

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), '..');
const CONTENT_DIR = path.join(ROOT, 'src/content');
const parser = unified().use(remarkParse).use(remarkGfm).use(remarkMath);

export function validateMarkdownMath(source, file = '<memory>') {
  const frontmatter = source.match(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/)?.[0] ?? '';
  const lineOffset = (frontmatter.match(/\n/g) ?? []).length;
  const tree = parser.parse(source.slice(frontmatter.length));
  const errors = [];
  let mathCount = 0;

  function visit(node) {
    if (node.type === 'math' || node.type === 'inlineMath' || (node.type === 'code' && node.lang === 'math')) {
      mathCount += 1;
      try {
        katex.renderToString(node.value, {
          displayMode: node.type !== 'inlineMath',
          strict: 'error',
          throwOnError: true,
        });
      } catch (error) {
        const line = node.position.start.line + lineOffset;
        errors.push(`${file}:${line}: ${error.message.replace(/\s+/g, ' ')}`);
      }
    }
    for (const child of node.children ?? []) visit(child);
  }

  visit(tree);
  return { errors, mathCount };
}

export function validateMathCorpus(directory = CONTENT_DIR) {
  const errors = [];
  let fileCount = 0;
  let mathCount = 0;

  function scan(target) {
    for (const entry of fs.readdirSync(target, { withFileTypes: true })) {
      const file = path.join(target, entry.name);
      if (entry.isDirectory()) {
        scan(file);
      } else if (/\.mdx?$/.test(entry.name)) {
        const result = validateMarkdownMath(fs.readFileSync(file, 'utf8'), path.relative(ROOT, file));
        fileCount += 1;
        mathCount += result.mathCount;
        errors.push(...result.errors);
      }
    }
  }

  scan(directory);
  return { errors, fileCount, mathCount };
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = validateMathCorpus();
  if (result.errors.length) {
    console.error(result.errors.join('\n'));
    process.exitCode = 1;
  } else {
    console.log(`Math validation passed (${result.mathCount} expressions across ${result.fileCount} files).`);
  }
}
