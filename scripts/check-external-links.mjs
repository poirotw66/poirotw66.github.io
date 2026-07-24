import fs from 'node:fs/promises';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const ROOT_DIR = path.resolve(__dirname, '..');
const CONTENT_DIR = path.join(ROOT_DIR, 'src', 'content');
const CONCURRENCY = 8;
const TIMEOUT_MS = 15_000;
const RETRIES = 2;
const SOFT_STATUS = new Set([401, 403, 405, 406, 418, 429, 999]);
const RESTRICTED_HOSTS = new Set([
  'gemini.google.com',
  'kaggle.com',
  'www.kaggle.com',
]);

async function walkMarkdownFiles(dir) {
  const files = [];
  for (const entry of await fs.readdir(dir, { withFileTypes: true })) {
    const fullPath = path.join(dir, entry.name);
    if (entry.isDirectory()) files.push(...await walkMarkdownFiles(fullPath));
    else if (/\.(?:md|mdx)$/i.test(entry.name)) files.push(fullPath);
  }
  return files;
}

function trimUrl(raw) {
  let url = raw.replaceAll('&amp;', '&');
  while (/[.,;:!?}\]]$/.test(url)) url = url.slice(0, -1);
  while (url.endsWith(')')) {
    const opens = (url.match(/\(/g) ?? []).length;
    const closes = (url.match(/\)/g) ?? []).length;
    if (closes <= opens) break;
    url = url.slice(0, -1);
  }
  return url;
}

function removeCodeSamples(content) {
  return content
    .replace(/^[ \t]*(```|~~~)[^\n]*\n[\s\S]*?^[ \t]*\1[ \t]*$/gm, '')
    .replace(/`[^`\n]+`/g, '');
}

export function extractExternalUrls(content) {
  const urls = new Set();
  const prose = removeCodeSamples(content);
  // Keep extraction ASCII-only. This prevents adjacent CJK prose and Markdown
  // delimiters from becoming percent-encoded parts of an otherwise valid URL.
  for (const match of prose.matchAll(/https?:\/\/[A-Za-z0-9\-._~:/?#@!$&()+,;=%]+/g)) {
    const candidate = trimUrl(match[0]);
    try {
      const url = new URL(candidate);
      const hostname = url.hostname.toLowerCase();
      const isLocalOrReserved = (
        ['localhost', '127.0.0.1', '::1'].includes(hostname)
        || hostname.endsWith('.local')
        || hostname.endsWith('.localhost')
        || hostname.endsWith('.example')
        || hostname.endsWith('.invalid')
        || hostname.endsWith('.test')
      );
      if (!isLocalOrReserved) urls.add(url.toString());
    } catch {
      // Malformed URLs are handled by normal content review instead of network checks.
    }
  }
  return [...urls];
}

export function classifyStatus(status, url = '') {
  if (status >= 200 && status < 400) return 'ok';
  if (url && RESTRICTED_HOSTS.has(new URL(url).hostname.toLowerCase())) return 'reachable';
  if (SOFT_STATUS.has(status)) return 'reachable';
  return 'failed';
}

async function request(url, method) {
  const response = await fetch(url, {
    method,
    redirect: 'follow',
    signal: AbortSignal.timeout(TIMEOUT_MS),
    headers: {
      'User-Agent': 'Bloss0m-Link-Checker/1.0 (+https://poirotw66.github.io)',
      Accept: 'text/html,application/xhtml+xml,application/pdf,*/*;q=0.8',
      ...(method === 'GET' ? { Range: 'bytes=0-1023' } : {}),
    },
  });
  await response.body?.cancel();
  return response.status;
}

async function checkUrl(url) {
  let lastError;
  for (let attempt = 1; attempt <= RETRIES; attempt += 1) {
    try {
      let status = await request(url, 'HEAD');
      if ([403, 405, 406].includes(status)) status = await request(url, 'GET');
      return { url, status, outcome: classifyStatus(status, url) };
    } catch (error) {
      lastError = error;
    }
  }
  return {
    url,
    status: 0,
    outcome: RESTRICTED_HOSTS.has(new URL(url).hostname.toLowerCase()) ? 'reachable' : 'failed',
    error: lastError instanceof Error ? lastError.message : String(lastError),
  };
}

async function mapWithConcurrency(items, concurrency, worker) {
  const results = new Array(items.length);
  let cursor = 0;
  async function run() {
    while (cursor < items.length) {
      const index = cursor;
      cursor += 1;
      results[index] = await worker(items[index]);
    }
  }
  await Promise.all(Array.from({ length: Math.min(concurrency, items.length) }, run));
  return results;
}

export async function collectContentUrls({ contentDir = CONTENT_DIR } = {}) {
  const sourcesByUrl = new Map();
  for (const filePath of await walkMarkdownFiles(contentDir)) {
    const relativePath = path.relative(ROOT_DIR, filePath).replaceAll(path.sep, '/');
    for (const url of extractExternalUrls(await fs.readFile(filePath, 'utf8'))) {
      const sources = sourcesByUrl.get(url) ?? [];
      sources.push(relativePath);
      sourcesByUrl.set(url, sources);
    }
  }
  return sourcesByUrl;
}

async function runCli() {
  const sourcesByUrl = await collectContentUrls();
  const urls = [...sourcesByUrl.keys()].sort();
  console.log(`Checking ${urls.length} unique external links...`);
  const results = await mapWithConcurrency(urls, CONCURRENCY, checkUrl);
  const failed = results.filter((result) => result.outcome === 'failed');
  const reachable = results.filter((result) => result.outcome === 'reachable');

  for (const result of reachable) {
    console.warn(`WARN ${result.status || 'network'} ${result.url} (automated check restricted or inconclusive)`);
  }
  for (const result of failed) {
    const sources = sourcesByUrl.get(result.url)?.slice(0, 3).join(', ');
    console.error(
      `FAIL ${result.status || result.error} ${result.url}${sources ? ` (${sources})` : ''}`,
    );
  }

  console.log(
    `External link check complete: ${results.length - failed.length - reachable.length} healthy, ${reachable.length} restricted, ${failed.length} failed.`,
  );
  if (failed.length > 0) process.exit(1);
}

if (process.argv[1] && path.resolve(process.argv[1]) === __filename) {
  runCli().catch((error) => {
    console.error(error);
    process.exit(1);
  });
}
