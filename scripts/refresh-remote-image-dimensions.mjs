import fs from 'node:fs/promises';
import path from 'node:path';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import sharp from 'sharp';

// Run explicitly when remote Markdown illustrations change. Builds remain offline.
const output = 'src/data/remoteImageDimensions.json';
const allowedHosts = new Set(['arxiv.org', 'github.com', 'raw.githubusercontent.com', 'media.githubusercontent.com']);
const urls = new Set();
const processor = unified().use(remarkParse);
async function scan(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const file = path.join(directory, entry.name);
    if (entry.isDirectory()) await scan(file);
    else if (/\.mdx?$/.test(file)) {
      const text = (await fs.readFile(file, 'utf8')).replace(/^---\r?\n[\s\S]*?\r?\n---(?:\r?\n|$)/, '');
      const visit = (node) => {
        if (node.type === 'image' && /^https:\/\//.test(node.url)) urls.add(node.url);
        for (const child of node.children ?? []) visit(child);
      };
      visit(processor.parse(text));
    }
  }
}
async function readMetadata(source) {
  let url = source;
  const signal = AbortSignal.timeout(15000);
  for (let hop = 0; hop < 5; hop += 1) {
    const parsed = new URL(url);
    if (parsed.protocol !== 'https:' || !allowedHosts.has(parsed.hostname)) throw new Error('Unsupported source host');
    const response = await fetch(url, { headers: { Range: 'bytes=0-262143' }, redirect: 'manual', signal });
    if (response.status >= 300 && response.status < 400 && response.headers.has('location')) {
      await response.body?.cancel();
      url = new URL(response.headers.get('location'), url).href;
      continue;
    }
    if (!response.ok) { await response.body?.cancel(); throw new Error(`HTTP ${response.status}`); }
    const chunks = [];
    let size = 0;
    const reader = response.body.getReader();
    while (size < 262144) {
      const chunk = await reader.read();
      if (chunk.done) break;
      chunks.push(Buffer.from(chunk.value));
      size += chunk.value.length;
    }
    await reader.cancel();
    const { width, height } = await sharp(Buffer.concat(chunks), { failOn: 'none' }).metadata();
    if (!width || !height) throw new Error('Missing intrinsic dimensions');
    return { width, height };
  }
  throw new Error('Too many redirects');
}
await scan('src/content');
const queue = [...urls].sort();
const dimensions = {};
const failures = [];
await Promise.all(Array.from({ length: 4 }, async () => {
  while (queue.length) {
    const url = queue.shift();
    try { dimensions[url] = await readMetadata(url); }
    catch (error) { failures.push({ url, error: error.message }); }
  }
}));
await fs.writeFile(output, JSON.stringify(Object.fromEntries(Object.entries(dimensions).sort(([a], [b]) => a.localeCompare(b))), null, 2) + '\n');
console.log(JSON.stringify({ sources: urls.size, verified: Object.keys(dimensions).length, failures }, null, 2));
if (failures.length) process.exitCode = 1;
