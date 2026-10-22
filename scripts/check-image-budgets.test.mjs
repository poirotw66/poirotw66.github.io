import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs/promises';
import os from 'node:os';
import path from 'node:path';

import {
  findOversizedSourceImages,
  formatKilobytes,
  MAX_SOURCE_IMAGE_BYTES,
} from './check-image-budgets.mjs';

test('findOversizedSourceImages reports PNG/JPEG files over the source budget', async () => {
  const publicDir = await fs.mkdtemp(path.join(os.tmpdir(), 'bloss0m-image-budget-'));
  await fs.writeFile(path.join(publicDir, 'ok.webp'), Buffer.alloc(MAX_SOURCE_IMAGE_BYTES * 2));
  await fs.writeFile(path.join(publicDir, 'ok.png'), Buffer.alloc(MAX_SOURCE_IMAGE_BYTES));
  await fs.writeFile(path.join(publicDir, 'too-large.jpg'), Buffer.alloc(MAX_SOURCE_IMAGE_BYTES + 1));

  await assert.doesNotReject(async () => {
    const oversized = await findOversizedSourceImages(publicDir);
    assert.deepEqual(oversized, [{
      bytes: MAX_SOURCE_IMAGE_BYTES + 1,
      relativePath: 'too-large.jpg',
    }]);
  });

  await fs.rm(publicDir, { recursive: true, force: true });
});

test('formatKilobytes uses a readable binary-kilobyte label', () => {
  assert.equal(formatKilobytes(512 * 1024), '512.0 KB');
});

test('checks delivered formats, responsive candidates and compressed SVGs without counting unused originals', async (t) => {
  const { inspectDeliveredImages } = await import('./check-image-budgets.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'delivered-images-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'index.html'), '<img src="/ok.webp" srcset="/too%20large.avif 1200w, /ok.webp 200w" width="200" height="100"><img src="/diagram.svg"><img src="/animation.gif" width="1" height="1"><img src="/missing.png"><img src="https://example.org/image.png">');
  await fs.writeFile(path.join(root, 'ok.webp'), Buffer.alloc(100));
  await fs.writeFile(path.join(root, 'unused.webp'), Buffer.alloc(2 * MAX_SOURCE_IMAGE_BYTES));
  await fs.writeFile(path.join(root, 'too large.avif'), Buffer.alloc(MAX_SOURCE_IMAGE_BYTES + 1));
  await fs.writeFile(path.join(root, 'diagram.svg'), '<svg>' + ' '.repeat(MAX_SOURCE_IMAGE_BYTES * 2) + '</svg>');
  await fs.writeFile(path.join(root, 'animation.gif'), Buffer.alloc(700 * 1024));
  const result = await inspectDeliveredImages(root);
  assert.equal(result.assetCount, 5);
  assert.deepEqual(result.oversized.map((item) => item.relativePath), ['too large.avif']);
  assert.deepEqual(result.missing, ['missing.png']);
  assert.equal(result.missingDimensions.length, 3);
});

test('rejects local references escaping the build directory', async (t) => {
  const { inspectDeliveredImages } = await import('./check-image-budgets.mjs');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'delivered-images-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  await fs.writeFile(path.join(root, 'index.html'), '<img src="/%2e%2e/secret.png">');
  await assert.rejects(inspectDeliveredImages(root), /outside build directory/);
});
