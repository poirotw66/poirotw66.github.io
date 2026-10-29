import test from 'node:test';
import assert from 'node:assert/strict';
import { hasReachedArticleRead75 } from './articleReadingProgress.ts';

test('a long article reaches the milestone only when its 75% position enters the viewport', () => {
  assert.equal(hasReachedArticleRead75(200, 2000, 800), false);
  assert.equal(hasReachedArticleRead75(-699, 2000, 800), false);
  assert.equal(hasReachedArticleRead75(-700, 2000, 800), true);
  assert.equal(hasReachedArticleRead75(-1000, 2000, 800), true);
});

test('short articles count on initial display only when the milestone is visible', () => {
  assert.equal(hasReachedArticleRead75(100, 400, 800), true);
  assert.equal(hasReachedArticleRead75(600, 400, 800), false);
});

test('viewport resizing uses the same visible article position', () => {
  assert.equal(hasReachedArticleRead75(100, 1000, 800), false);
  assert.equal(hasReachedArticleRead75(100, 1000, 850), true);
});

test('unmeasurable articles and viewports cannot produce a milestone', () => {
  assert.equal(hasReachedArticleRead75(0, 0, 800), false);
  assert.equal(hasReachedArticleRead75(0, 400, 0), false);
});
