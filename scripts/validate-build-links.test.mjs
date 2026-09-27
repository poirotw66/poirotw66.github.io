import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';

import { validateBuildLinks } from './validate-build-links.mjs';

test('validateBuildLinks passes on valid internal links and valid anchors', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'valid-links-test-'));
  try {
    fs.mkdirSync(path.join(tmpDir, 'blog', 'first-post'), { recursive: true });
    fs.mkdirSync(path.join(tmpDir, 'about'), { recursive: true });

    fs.writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<a href="/blog/first-post/">First Post</a><a href="/about/#team">About Team</a>',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'blog', 'first-post', 'index.html'),
      '<a href="/">Home</a>',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'about', 'index.html'),
      '<h2 id="team">Team Section</h2>',
    );

    const result = validateBuildLinks(tmpDir);
    assert.equal(result.totalFiles, 3);
    assert.equal(result.issues.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateBuildLinks catches non-existent routes and missing anchors', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'broken-links-test-'));
  try {
    fs.mkdirSync(path.join(tmpDir, 'blog'), { recursive: true });

    fs.writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<a href="/non-existent-route/">404 Link</a><a href="/blog/#missing-anchor">Broken Anchor</a>',
    );
    fs.writeFileSync(
      path.join(tmpDir, 'blog', 'index.html'),
      '<h1 id="existing-heading">Blog</h1>',
    );

    const result = validateBuildLinks(tmpDir);
    assert.equal(result.totalFiles, 2);
    assert.equal(result.issues.length, 2);

    const brokenPath = result.issues.find((issue) => issue.type === 'broken-path');
    assert.ok(brokenPath);
    assert.equal(brokenPath.href, '/non-existent-route/');

    const brokenAnchor = result.issues.find((issue) => issue.type === 'broken-anchor');
    assert.ok(brokenAnchor);
    assert.equal(brokenAnchor.href, '/blog/#missing-anchor');
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});

test('validateBuildLinks ignores external links and template literals', () => {
  const tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'template-links-test-'));
  try {
    fs.writeFileSync(
      path.join(tmpDir, 'index.html'),
      '<a href="https://example.com/external">External</a>' +
      '<a href="${escapeHtml(item.url)}">Template</a>' +
      '<a href="mailto:test@example.com">Email</a>' +
      '<a href="#top">Top</a>',
    );

    const result = validateBuildLinks(tmpDir);
    assert.equal(result.issues.length, 0);
  } finally {
    fs.rmSync(tmpDir, { recursive: true, force: true });
  }
});
