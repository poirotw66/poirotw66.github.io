import test from 'node:test';
import assert from 'node:assert/strict';

import {
  validateBlogCategory,
  validateRequiredFields,
  validateNoLocalFileUris,
} from './validate-content.mjs';

test('rejects local file URIs that cannot work on the published site', () => {
  const issues = validateNoLocalFileUris(
    'Read [the source](file:///home/user/workspace/source.py#L10).',
    'example.md',
  );

  assert.equal(issues.length, 1);
  assert.match(issues[0], /Local file URI is not publishable/);
  assert.match(issues[0], /example\.md/);
});

test('accepts public HTTPS and site-relative links', () => {
  const issues = validateNoLocalFileUris(
    '[source](https://github.com/example/repo) [image](/blog/cover.webp)',
    'example.md',
  );

  assert.deepEqual(issues, []);
});

test('accepts canonical blog categories from the shared taxonomy', () => {
  assert.deepEqual(validateBlogCategory('AI Engineering', 'post.md'), []);
});

test('rejects categories outside the shared taxonomy', () => {
  const issues = validateBlogCategory('Research', 'post.md');
  assert.equal(issues.length, 1);
  assert.match(issues[0], /Invalid blog category "Research"/);
});


test('sticker tools may omit an unavailable public repository', () => {
  const fields = new Map([['title', 'Tool'], ['description', 'Summary'], ['order', '1']]);
  assert.deepEqual(validateRequiredFields('stickerTools', fields, 'tool.md'), []);
});

test('optional repository does not weaken required sticker-tool metadata', () => {
  const fields = new Map([['title', 'Tool'], ['repoUrl', 'https://github.com/example/tool']]);
  assert.deepEqual(validateRequiredFields('stickerTools', fields, 'tool.md'), [
    'Missing required frontmatter field "description" in tool.md',
    'Missing required frontmatter field "order" in tool.md',
  ]);
});
