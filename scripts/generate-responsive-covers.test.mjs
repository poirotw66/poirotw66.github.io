import test from 'node:test';
import assert from 'node:assert/strict';

import {
  COVER_VARIANTS,
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
