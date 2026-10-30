import test from 'node:test';
import assert from 'node:assert/strict';
import path from 'node:path';
import remarkImageDimensions from '../src/utils/remarkImageDimensions.mjs';

test('adds intrinsic dimensions and lazy-loading hints to local Markdown images', async () => {
  const tree = {
    type: 'root',
    children: [{
      type: 'image',
      url: '/brand/bloom-mark.webp',
      alt: 'Bloss0m',
    }],
  };
  const transform = remarkImageDimensions({ publicDir: path.resolve('public') });
  await transform(tree);
  const properties = tree.children[0].data.hProperties;
  assert.equal(typeof properties.width, 'number');
  assert.equal(typeof properties.height, 'number');
  assert.equal(properties.loading, 'lazy');
  assert.equal(properties.decoding, 'async');
});

test('lazy-loads remote images without inventing unknown dimensions', async () => {
  const tree = {
    type: 'root',
    children: [{ type: 'image', url: 'https://example.com/image.png', alt: '' }],
  };
  await remarkImageDimensions() (tree);
  assert.deepEqual(tree.children[0].data.hProperties, { loading: 'lazy', decoding: 'async' });
});

test('uses verified remote dimensions without network access', async () => {
  const { default: manifest } = await import('../src/data/remoteImageDimensions.json', { with: { type: 'json' } });
  const [url, dimensions] = Object.entries(manifest)[0];
  const tree = { type: 'root', children: [{ type: 'image', url }] };
  await remarkImageDimensions()(tree);
  assert.deepEqual(tree.children[0].data.hProperties, { ...dimensions, loading: 'lazy', decoding: 'async' });
});

test('creates a bounded body derivative, preserves the original, and reuses it', async (t) => {
  const fs = await import('node:fs/promises');
  const os = await import('node:os');
  const { default: sharp } = await import('sharp');
  const root = await fs.mkdtemp(path.join(os.tmpdir(), 'body-image-'));
  t.after(() => fs.rm(root, { recursive: true, force: true }));
  const pixels = Buffer.alloc(3000 * 1000 * 3);
  const { randomFillSync } = await import('node:crypto');
  randomFillSync(pixels);
  const original = path.join(root, 'large.webp');
  await sharp(pixels, { raw: { width: 3000, height: 1000, channels: 3 } }).webp({ quality: 90 }).toFile(original);
  const before = await fs.readFile(original);
  const tree = { type: 'root', children: [{ type: 'image', url: '/large.webp?v=1' }, { type: 'image', url: '/large.webp' }] };
  const options = { publicDir: root, cacheDir: path.join(root, 'cache') };
  await remarkImageDimensions(options)(tree);
  assert.deepEqual(tree.children.map((node) => node.url), ['/large-body.webp', '/large-body.webp']);
  assert.ok((await sharp(path.join(root, 'large-body.webp')).metadata()).width <= 2400);
  assert.ok((await fs.stat(path.join(root, 'large-body.webp'))).size <= 500 * 1024);
  assert.deepEqual(await fs.readFile(original), before);
  const modified = (await fs.stat(path.join(root, 'large-body.webp'))).mtimeMs;
  await remarkImageDimensions(options)({ type: 'root', children: [{ type: 'image', url: '/large.webp' }] });
  assert.equal((await fs.stat(path.join(root, 'large-body.webp'))).mtimeMs, modified);
  const { preparePublicImage } = await import('../src/utils/remarkImageDimensions.mjs');
  const narrow = { ...options, bodyImageWidth: 900 };
  await preparePublicImage('/large.webp', narrow);
  assert.equal((await sharp(await fs.readFile(path.join(root, 'large-body.webp'))).metadata()).width, 900);
  const previous = await fs.readFile(path.join(root, 'large-body.webp'));
  const timestamp = (await fs.stat(original)).mtime;
  await fs.writeFile(original, await sharp(before).negate().webp({ quality: 90 }).toBuffer());
  await fs.utimes(original, timestamp, timestamp);
  await preparePublicImage('/large.webp', narrow);
  assert.notDeepEqual(await fs.readFile(path.join(root, 'large-body.webp')), previous);
});
