import fs from 'node:fs/promises';
import { readFileSync } from 'node:fs';
import path from 'node:path';
import { createHash, randomUUID } from 'node:crypto';
import { fileURLToPath } from 'node:url';
import sharp from 'sharp';

const defaultDirectory = fileURLToPath(new URL('../../.cache/image-derivatives/', import.meta.url));
const digest = (bytes) => createHash('sha256').update(bytes).digest('hex');
const implementationHashes = new Map();
const pending = new Map();
const warnedDirectories = new Set();
const engine = JSON.stringify({ platform: process.platform, arch: process.arch, node: process.versions.node, versions: sharp.versions });
const cacheImplementation = digest(readFileSync(fileURLToPath(import.meta.url)));

async function atomicWrite(file, bytes) {
  await fs.mkdir(path.dirname(file), { recursive: true });
  const temporary = `${file}.${randomUUID()}.tmp`;
  try {
    await fs.writeFile(temporary, bytes);
    await fs.rename(temporary, file);
  } finally {
    await fs.rm(temporary, { force: true });
  }
}

async function deliver(file, bytes) {
  try {
    if ((await fs.readFile(file)).equals(bytes)) return;
  } catch (error) {
    if (error.code !== 'ENOENT') throw error;
  }
  await atomicWrite(file, bytes);
}

/** Restore only verified WebP bytes for this source, recipe and implementation. */
export async function cacheImageDerivative({ sourcePath, sourceBytes, outputPath, id, recipe, implementation, generate, cacheDir = defaultDirectory }) {
  const source = sourceBytes ?? await fs.readFile(sourcePath);
  if (!implementationHashes.has(implementation)) implementationHashes.set(implementation, digest(readFileSync(new URL(implementation))));
  const key = digest(JSON.stringify({ source: digest(source), recipe, engine, implementation: implementationHashes.get(implementation), cacheImplementation }));
  // One replaceable slot per public output keeps older source versions from accumulating.
  const slot = path.join(cacheDir, `${digest(id)}.cache`);
  const pendingKey = `${slot}:${key}:${outputPath}`;
  if (!pending.has(pendingKey)) {
    pending.set(pendingKey, (async () => {
      let bytes;
      try {
        const entry = await fs.readFile(slot);
        const newline = entry.indexOf(10);
        if (newline < 0 || newline > 512) throw new Error('Invalid image cache header');
        const header = JSON.parse(entry.subarray(0, newline).toString('utf8'));
        const payload = entry.subarray(newline + 1);
        if (header.key !== key || header.sha256 !== digest(payload)) throw new Error('Image cache mismatch');
        const metadata = await sharp(payload).metadata();
        if (metadata.format !== 'webp' || !metadata.width || !metadata.height) throw new Error('Invalid cached WebP');
        bytes = payload;
      } catch {
        // Missing, stale or damaged cache entries are ordinary cold builds.
      }
      const generated = !bytes;
      if (generated) bytes = await generate(source);
      await deliver(outputPath, bytes);
      if (generated) {
        try {
          const header = Buffer.from(`${JSON.stringify({ key, sha256: digest(bytes) })}\n`);
          await atomicWrite(slot, Buffer.concat([header, bytes]));
        } catch (error) {
          if (!warnedDirectories.has(cacheDir)) {
            console.warn(`Image cache unavailable; generated outputs remain valid: ${error.message}`);
            warnedDirectories.add(cacheDir);
          }
        }
      }
      return { generated };
    })().finally(() => pending.delete(pendingKey)));
  }
  return pending.get(pendingKey);
}
