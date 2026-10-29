import fs from 'node:fs';
import path from 'node:path';
import { execFileSync } from 'node:child_process';
import { fileURLToPath } from 'node:url';

const CONTENT_MARKDOWN = /^src\/content\/(?:blog|paperReading|projects)\/(?:en\/)?[^/]+\.md$/;
const HOMEPAGE = /^(?:public\/(?:css\/home\.css|js\/home-[^/]+\.js)|scripts\/home-[^/]+\.mjs|src\/components\/Home[^/]*\.astro|src\/components\/pages\/HomePageContent\.astro|src\/data\/home(?:Brand|Roadmap)\.ts|src\/pages\/(?:en\/)?index\.astro)$/;
const DOCUMENTATION = /^(?:docs\/|ops\/editorial\/|(?:README|AGENTS)\.md$|LICENSE(?:\.md)?$)/;

function proseEnvelope(body) {
  // Raw HTML can contain scripts, attributes or multiline embeds. Do not guess.
  if (/<!--|<\/?[A-Za-z]/.test(body) || /\\[[(]/.test(body) || /^ {0,3}(?:=+|-+)\s*$/m.test(body)) return null;
  let fence = null;
  return body.split(/\r?\n/).map((line) => {
    const marker = line.match(/^ {0,3}(`{3,}|~{3,}|\${2,})(.*)$/);
    if (fence) {
      if (marker && marker[1][0] === fence.character && marker[1].length >= fence.length && !marker[2].trim()) fence = null;
      return [0, line];
    }
    if (marker) {
      // A one-line math block is complete without opening a multiline fence.
      if (!(marker[1][0] === '$' && marker[2].trimEnd().endsWith(marker[1]))) {
        fence = { character: marker[1][0], length: marker[1].length };
      }
      return [0, line];
    }
    const plain = line.trim() && !/^(?: {4}|\t|\s*[-+>:]|\s*\d+[.)]\s)/.test(line)
      && !/[<>\[\]!`$\\*_{}|#=~@]/.test(line) && !/(?:https?:\/\/|www\.)/i.test(line);
    return plain ? [1] : [0, line];
  });
}

/** Existing prose lines may change only when metadata and rendering structure stay fixed. */
export function isPureProseEdit(before, after) {
  if (typeof before !== 'string' || typeof after !== 'string' || before === after) return false;
  const frontmatter = /^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/;
  const oldHeader = before.match(frontmatter)?.[0];
  const newHeader = after.match(frontmatter)?.[0];
  if (!oldHeader || oldHeader !== newHeader) return false;
  const oldBody = before.slice(oldHeader.length);
  const newBody = after.slice(newHeader.length);
  const growth = Math.abs(Buffer.byteLength(newBody) - Buffer.byteLength(oldBody));
  if (growth > Math.max(512, Buffer.byteLength(oldBody) * 0.1)) return false;
  const oldEnvelope = proseEnvelope(oldBody);
  const newEnvelope = proseEnvelope(newBody);
  return oldEnvelope !== null && newEnvelope !== null && JSON.stringify(oldEnvelope) === JSON.stringify(newEnvelope);
}

/** Classify explicit changed files independently of Git and the working tree. */
export function classifyChangedFiles(changes) {
  let performance = false;
  let homepage = false;
  const proseOnly = [];
  for (const { status, file, before, after } of changes) {
    if (!/^[ACDMRT]$/.test(status) || typeof file !== 'string' || !file) {
      return { performance: true, homepage: true, proseOnly: [], fallback: true };
    }
    if (HOMEPAGE.test(file)) homepage = true;
    if (DOCUMENTATION.test(file)) continue;
    if (status === 'M' && CONTENT_MARKDOWN.test(file) && isPureProseEdit(before, after)) {
      proseOnly.push(file);
      continue;
    }
    performance = true;
  }
  return { performance, homepage, proseOnly, fallback: false };
}

/** Missing refs, failed Git commands and unknown paths retain conservative coverage. */
export function classifySiteChanges({ cwd = process.cwd(), base, head } = {}) {
  const git = (...args) => execFileSync('git', args, { cwd, encoding: 'utf8', maxBuffer: 16 * 1024 * 1024, stdio: ['ignore', 'pipe', 'pipe'] });
  try {
    if (![base, head].every((sha) => /^[a-f0-9]{40,64}$/i.test(sha ?? '') && !/^0+$/.test(sha))) throw new Error('Missing comparison refs');
    for (const sha of [base, head]) git('cat-file', '-e', `${sha}^{commit}`);
    const fields = git('diff', '--name-status', '-z', '--no-renames', '--diff-filter=ACDMRT', base, head, '--').split('\0');
    if (fields.pop() !== '' || fields.length % 2) throw new Error('Unexpected Git diff format');
    const changes = [];
    for (let index = 0; index < fields.length; index += 2) {
      const [status, file] = fields.slice(index, index + 2);
      changes.push({ status, file, ...(status === 'M' && CONTENT_MARKDOWN.test(file)
        ? { before: git('show', `${base}:${file}`), after: git('show', `${head}:${file}`) } : {}) });
    }
    return classifyChangedFiles(changes);
  } catch {
    return { performance: true, homepage: true, proseOnly: [], fallback: true };
  }
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  const result = classifySiteChanges({ base: process.env.BASE_SHA, head: process.env.HEAD_SHA });
  if (process.env.GITHUB_OUTPUT) fs.appendFileSync(process.env.GITHUB_OUTPUT, `performance=${result.performance}\nhomepage=${result.homepage}\n`);
  console.log(`Site change coverage: ${JSON.stringify(result)}`);
}
