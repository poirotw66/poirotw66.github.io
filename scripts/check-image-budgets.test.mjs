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
