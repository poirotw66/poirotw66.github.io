import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';
import sharp from 'sharp';
import { cacheImageDerivative } from '../src/utils/imageDerivativeCache.mjs';

import {
  COVER_VARIANTS,
  generateResponsiveCovers,
  extractFrontmatterImage,
  responsiveCoverPath,
} from './generate-responsive-covers.mjs';

test('extracts a quoted frontmatter image path', () => {
  const image = extractFrontmatterImage('---\ntitle: Demo\nimage: "/blog/demo/title.jpg"\n---\n');
  assert.equal(image, '/blog/demo/title.jpg');
});

test('creates predictable WebP variant paths', () => {
  assert.equal(
    responsiveCoverPath('/blog/demo/title.jpg', 'card'),
    '/blog/demo/title-card.webp',
  );
  assert.deepEqual(
    Object.fromEntries(Object.entries(COVER_VARIANTS).map(([name, value]) => [name, [value.width, value.height]])),
    {
      thumb: [200, 125],
      card: [480, 300],
      hero: [1200, 750],
    },
  );
});

test('leaves remote image paths unchanged', () => {
  assert.equal(
    responsiveCoverPath('https://example.com/cover.jpg', 'hero'),
    'https://example.com/cover.jpg',
  );
});

test('restores cover variants after a fresh checkout without trusting timestamps', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'cover-cache-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const contentDir = path.join(root, 'content');
  const publicDir = path.join(root, 'public');
  const cacheDir = path.join(root, 'cache');
  await fs.mkdir(contentDir); await fs.mkdir(publicDir);
  await fs.writeFile(path.join(contentDir, 'demo.md'), '---\nimage: "/cover.png"\n---\n');
  const source = path.join(publicDir, 'cover.png');
  await sharp({ create: { width: 40, height: 30, channels: 3, background: 'red' } }).png().toFile(source);
  const options = { contentDir, publicDir, cacheDir };
  assert.equal((await generateResponsiveCovers(options)).generated, 3);
  const original = await fs.readFile(source);
  const expected = await fs.readFile(path.join(publicDir, 'cover-card.webp'));
  for (const variant of Object.keys(COVER_VARIANTS)) await fs.rm(path.join(publicDir, `cover-${variant}.webp`));
  await fs.utimes(source, new Date(), new Date(Date.now() + 60000));
  assert.deepEqual(await generateResponsiveCovers(options), { sourceCount: 1, generated: 0, current: 3 });
  assert.deepEqual(await fs.readFile(path.join(publicDir, 'cover-card.webp')), expected);
  assert.deepEqual(await fs.readFile(source), original);
  const mtime = (await fs.stat(source)).mtime;
  await fs.writeFile(source, await sharp({ create: { width: 40, height: 30, channels: 3, background: 'blue' } }).png().toBuffer());
  await fs.utimes(source, mtime, mtime);
  assert.equal((await generateResponsiveCovers(options)).generated, 3);
  assert.notDeepEqual(await fs.readFile(path.join(publicDir, 'cover-card.webp')), expected);
});

test('cache invalidation covers recipes, tool code, damaged payloads and unavailable storage', async (t) => {
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'image-cache-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const sourcePath = path.join(root, 'source.png');
  const outputPath = path.join(root, 'output.webp');
  const cacheDir = path.join(root, 'cache');
  await sharp({ create: { width: 20, height: 20, channels: 3, background: 'red' } }).png().toFile(sourcePath);
  let calls = 0;
  const options = { sourcePath, outputPath, cacheDir, id: '/output.webp', recipe: { quality: 70 }, implementation: import.meta.url,
    generate: (source) => { calls++; return sharp(source).webp({ quality: 70 }).toBuffer(); } };
  assert.equal((await cacheImageDerivative(options)).generated, true);
  await fs.writeFile(outputPath, 'damaged output');
  assert.equal((await cacheImageDerivative(options)).generated, false);
  assert.equal((await sharp(outputPath).metadata()).format, 'webp');
  assert.equal(calls, 1);
  const changed = { ...options, recipe: { quality: 60 } };
  assert.equal((await cacheImageDerivative(changed)).generated, true);
  const changedTool = { ...changed, implementation: new URL('./generate-responsive-covers.mjs', import.meta.url).href };
  assert.equal((await cacheImageDerivative(changedTool)).generated, true);
  const slot = path.join(cacheDir, (await fs.readdir(cacheDir))[0]);
  const bytes = await fs.readFile(slot); bytes[bytes.length - 1] ^= 1; await fs.writeFile(slot, bytes);
  assert.equal((await cacheImageDerivative(changedTool)).generated, true);
  await fs.writeFile(slot, '{invalid header');
  assert.equal((await cacheImageDerivative(changedTool)).generated, true);
  const unavailable = path.join(root, 'not-a-directory'); await fs.writeFile(unavailable, 'x');
  const warnings = []; const warn = console.warn; console.warn = (message) => warnings.push(message);
  try {
    assert.equal((await cacheImageDerivative({ ...options, cacheDir: unavailable })).generated, true);
  } finally { console.warn = warn; }
  assert.equal(warnings.length, 1);
  assert.equal((await sharp(outputPath).metadata()).format, 'webp');
});
