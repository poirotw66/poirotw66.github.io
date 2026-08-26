import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';

import { validateI18nPairing } from './validate-i18n.mjs';

function writeEntry(dir, fileName, frontmatter) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(
    path.join(dir, fileName),
    `---\n${frontmatter}\n---\n\nBody.\n`,
    'utf8',
  );
}

test('validateI18nPairing rejects missing English counterparts', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-missing-'));
  try {
    writeEntry(
      path.join(root, 'blog'),
      '01-demo.md',
      'title: "ZH"\ndescription: "d"\npubDate: 2025-01-01\ncategory: "AI"',
    );
    const result = validateI18nPairing({ contentDir: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /missing English counterpart/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validateI18nPairing rejects orphan English files', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-orphan-'));
  try {
    writeEntry(
      path.join(root, 'blog', 'en'),
      '01-demo.md',
      'title: "EN"\ndescription: "d"\npubDate: 2025-01-01\ncategory: "AI"',
    );
    const result = validateI18nPairing({ contentDir: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /orphan English file/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validateI18nPairing rejects mismatched shared metadata', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-mismatch-'));
  try {
    writeEntry(
      path.join(root, 'projects'),
      'demo.md',
      'title: "ZH"\ndescription: "d"\npubDate: 2025-01-01\ntier: flagship\nfeaturedOrder: 1',
    );
    writeEntry(
      path.join(root, 'projects', 'en'),
      'demo.md',
      'title: "EN"\ndescription: "d"\npubDate: 2025-01-02\ntier: flagship\nfeaturedOrder: 1',
    );
    const result = validateI18nPairing({ contentDir: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /mismatched pubDate/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validateI18nPairing accepts matched bilingual pairs', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-ok-'));
  try {
    for (const collection of ['blog', 'paperReading', 'projects', 'stickers', 'stickerTools']) {
      fs.mkdirSync(path.join(root, collection, 'en'), { recursive: true });
    }

    writeEntry(
      path.join(root, 'blog'),
      '01-demo.md',
      'title: "ZH"\ndescription: "d"\npubDate: 2025-01-01\ncategory: "AI"\nimage: "/blog/01/x.webp"',
    );
    writeEntry(
      path.join(root, 'blog', 'en'),
      '01-demo.md',
      'title: "EN"\ndescription: "d"\npubDate: 2025-01-01\ncategory: "AI"\nimage: "/blog/01/x.webp"',
    );

    writeEntry(
      path.join(root, 'projects'),
      'demo.md',
      'title: "ZH"\ndescription: "d"\npubDate: 2025-01-01\ntier: main',
    );
    writeEntry(
      path.join(root, 'projects', 'en'),
      'demo.md',
      'title: "EN"\ndescription: "d"\npubDate: 2025-01-01\ntier: main',
    );

    writeEntry(
      path.join(root, 'stickers'),
      'demo.md',
      'title: "ZH"\ndescription: "d"\nlineStoreUrl: "https://example.com"\npubDate: 2025-01-01\nimage: "preview.webp"\nspriteImages:\n  - "a.webp"',
    );
    writeEntry(
      path.join(root, 'stickers', 'en'),
      'demo.md',
      'title: "EN"\ndescription: "d"\nlineStoreUrl: "https://example.com"\npubDate: 2025-01-01\nimage: "preview.webp"\nspriteImages:\n  - "a.webp"',
    );

    writeEntry(
      path.join(root, 'stickerTools'),
      'demo.md',
      'title: "ZH"\ndescription: "d"\nrepoUrl: "https://example.com"\norder: 1',
    );
    writeEntry(
      path.join(root, 'stickerTools', 'en'),
      'demo.md',
      'title: "EN"\ndescription: "d"\nrepoUrl: "https://example.com"\norder: 1',
    );

    writeEntry(
      path.join(root, 'paperReading'),
      '01-demo.md',
      'title: "ZH"\ndescription: "d"\npubDate: 2025-01-01\npaper:\n  title: "P"\n  authors:\n    - "A"\n  year: 2024\nseries:\n  id: "s1"\n  title: "Series"\n  part: 1\n  totalParts: 1',
    );
    writeEntry(
      path.join(root, 'paperReading', 'en'),
      '01-demo.md',
      'title: "EN"\ndescription: "d"\npubDate: 2025-01-01\npaper:\n  title: "P"\n  authors:\n    - "A"\n  year: 2024\nseries:\n  id: "s1"\n  title: "Series EN"\n  part: 1\n  totalParts: 1',
    );

    const result = validateI18nPairing({ contentDir: root });
    assert.equal(result.ok, true, result.errors.join('\n'));
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validateI18nPairing rejects incomplete or duplicated paper series', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-series-'));
  try {
    for (const localeDir of [path.join(root, 'paperReading'), path.join(root, 'paperReading', 'en')]) {
      writeEntry(
        localeDir,
        '01-demo.md',
        'title: "One"\ndescription: "d"\npubDate: 2025-01-01\nseries:\n  id: "s1"\n  title: "Series"\n  part: 1\n  totalParts: 2',
      );
      writeEntry(
        localeDir,
        '02-demo.md',
        'title: "Two"\ndescription: "d"\npubDate: 2025-01-01\nseries:\n  id: "s1"\n  title: "Series"\n  part: 1\n  totalParts: 2',
      );
    }

    const result = validateI18nPairing({ contentDir: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /duplicate part numbers/);
    assert.match(result.errors.join('\n'), /expected parts 1-2; found 1/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validateI18nPairing rejects mismatched Paper Reading topic order', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'i18n-paper-topics-'));
  try {
    writeEntry(
      path.join(root, 'paperReading'),
      '01-demo.md',
      'title: "ZH"\ndescription: "d"\npubDate: 2025-01-01\ntopics:\n  - retrieval-rag\n  - agent-memory-adaptation',
    );
    writeEntry(
      path.join(root, 'paperReading', 'en'),
      '01-demo.md',
      'title: "EN"\ndescription: "d"\npubDate: 2025-01-01\ntopics:\n  - agent-memory-adaptation\n  - retrieval-rag',
    );

    const result = validateI18nPairing({ contentDir: root });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /mismatched topics/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
