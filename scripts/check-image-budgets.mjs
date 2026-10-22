import fs from 'node:fs/promises';
import path from 'node:path';
import { gzipSync } from 'node:zlib';
import { fileURLToPath } from 'node:url';

const SCRIPT_DIR = path.dirname(fileURLToPath(import.meta.url));
const DEFAULT_PUBLIC_DIR = path.resolve(SCRIPT_DIR, '..', 'public');
export const MAX_SOURCE_IMAGE_BYTES = 500 * 1024;
export const SOURCE_IMAGE_EXTENSIONS = new Set(['.png', '.jpg', '.jpeg']);

async function* walkFiles(directory) {
  for (const entry of await fs.readdir(directory, { withFileTypes: true })) {
    const filePath = path.join(directory, entry.name);
    if (entry.isDirectory()) {
      yield* walkFiles(filePath);
    } else {
      yield filePath;
    }
  }
}

export async function findOversizedSourceImages(
  publicDir = DEFAULT_PUBLIC_DIR,
  maxBytes = MAX_SOURCE_IMAGE_BYTES,
) {
  const oversized = [];

  for await (const filePath of walkFiles(publicDir)) {
    const extension = path.extname(filePath).toLowerCase();
    if (!SOURCE_IMAGE_EXTENSIONS.has(extension)) continue;

    const bytes = (await fs.stat(filePath)).size;
    if (bytes > maxBytes) {
      oversized.push({
        bytes,
        relativePath: path.relative(publicDir, filePath).split(path.sep).join('/'),
      });
    }
  }

  return oversized.sort((a, b) => b.bytes - a.bytes);
}

export async function inspectDeliveredImages(distDir) {
  const root = path.resolve(distDir);
  const assets = new Set();
  const missingDimensions = [];
  for await (const file of walkFiles(root)) {
    if (!file.endsWith('.html')) continue;
    const html = await fs.readFile(file, 'utf8');
    for (const match of html.matchAll(/<(img|source)\b[^>]*>/gi)) {
      const attrs = Object.fromEntries([...match[0].matchAll(/([\w-]+)\s*=\s*["']([^"']*)["']/g)].map((item) => [item[1].toLowerCase(), item[2].replaceAll('&amp;', '&')]));
      if (match[1].toLowerCase() === 'img' && !(attrs.width && attrs.height)) missingDimensions.push({ page: path.relative(root, file), src: attrs.src });
      const urls = [attrs.src, ...(attrs.srcset?.split(',').map((value) => value.trim().replace(/\s+\d+(?:\.\d+)?[wx]$/, '')) ?? [])].filter(Boolean);
      for (const url of urls) {
        if (/^(?:[a-z]+:|\/\/|#)/i.test(url)) continue;
        const pathname = decodeURIComponent(url.split(/[?#]/, 1)[0]);
        const target = pathname.startsWith('/') ? path.resolve(root, `.${pathname}`) : path.resolve(path.dirname(file), pathname);
        if (!target.startsWith(`${root}${path.sep}`)) throw new Error(`Image outside build directory: ${url}`);
        assets.add(target);
      }
    }
  }
  const oversized = [];
  const missing = [];
  for (const file of assets) {
    const stat = await fs.stat(file).catch(() => null);
    if (!stat) { missing.push(path.relative(root, file)); continue; }
    const extension = path.extname(file).toLowerCase();
    if (!['.webp', '.avif', '.png', '.jpg', '.jpeg', '.svg', '.gif'].includes(extension)) continue;
    const bytes = stat.size;
    const measuredBytes = extension === '.svg' ? gzipSync(await fs.readFile(file)).length : bytes;
    const max = extension === '.svg' ? 256 * 1024 : extension === '.gif' ? 1024 * 1024 : MAX_SOURCE_IMAGE_BYTES;
    if (measuredBytes > max) oversized.push({ relativePath: path.relative(root, file), bytes, measuredBytes, max, encoding: extension === '.svg' ? 'gzip estimate' : 'uncompressed' });
  }
  return { assetCount: assets.size, oversized, missing, missingDimensions };
}

export function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
  const dist = process.argv.find((arg) => arg.startsWith('--dist='))?.slice(7);
  if (dist) {
    const result = await inspectDeliveredImages(dist);
    console.log(`Delivered image audit: ${result.assetCount} local assets; ${result.oversized.length} over budget; ${result.missing.length} missing; ${result.missingDimensions.length} img occurrences without intrinsic dimensions.`);
    for (const item of result.oversized) console.error(`  ${item.relativePath}: ${formatKilobytes(item.measuredBytes)} ${item.encoding}, limit ${formatKilobytes(item.max)}`);
    for (const item of result.missing) console.error(`  Missing image: ${item}`);
    if (result.missingDimensions.length) console.warn('Some images still lack intrinsic dimensions; review raw HTML and remote sources.');
    if (result.oversized.length || result.missing.length) process.exitCode = 1;
    return;
  }
  const oversized = await findOversizedSourceImages();

  if (oversized.length === 0) {
    console.log(`Image budget passed: PNG/JPEG files are ≤ ${formatKilobytes(MAX_SOURCE_IMAGE_BYTES)}.`);
    return;
  }

  console.error(`Image budget failed: ${oversized.length} PNG/JPEG file(s) exceed ${formatKilobytes(MAX_SOURCE_IMAGE_BYTES)}.`);
  for (const image of oversized) {
    console.error(`  - ${image.relativePath}: ${formatKilobytes(image.bytes)}`);
  }
  console.error('Convert large source images to WebP/AVIF before committing them.');
  process.exitCode = 1;
}

if (process.argv[1] && path.resolve(process.argv[1]) === fileURLToPath(import.meta.url)) {
  main().catch((error) => {
    console.error(error);
    process.exitCode = 1;
  });
}
