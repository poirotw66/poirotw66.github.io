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

test('leaves remote images unchanged', async () => {
  const tree = {
    type: 'root',
    children: [{ type: 'image', url: 'https://example.com/image.png', alt: '' }],
  };
  await remarkImageDimensions() (tree);
  assert.equal(tree.children[0].data, undefined);
});
