import fs from 'node:fs/promises';
import path from 'node:path';
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

export function formatKilobytes(bytes) {
  return `${(bytes / 1024).toFixed(1)} KB`;
}

async function main() {
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
