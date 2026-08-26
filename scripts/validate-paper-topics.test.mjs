import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import os from 'node:os';
import path from 'node:path';
import { validatePaperTopics } from './validate-paper-topics.mjs';

function writePaper(dir, fileName, topics) {
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, fileName), `---\ntitle: "Demo"\ntopics:\n${topics.map((topic) => `  - ${topic}`).join('\n')}\n---\n`, 'utf8');
}

test('validatePaperTopics accepts complete paired coverage', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-topics-ok-'));
  const topicIds = ['retrieval-rag', 'agent-evaluation-observability'];
  try {
    for (const fileName of ['one.md', 'two.md']) {
      writePaper(root, fileName, topicIds);
      writePaper(path.join(root, 'en'), fileName, topicIds);
    }
    const result = validatePaperTopics({ contentDir: root, topicIds });
    assert.equal(result.ok, true, result.errors.join('\n'));
    assert.deepEqual(result.counts, {
      'retrieval-rag': 2,
      'agent-evaluation-observability': 2,
    });
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});

test('validatePaperTopics rejects invalid and mismatched topic metadata', () => {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), 'paper-topics-invalid-'));
  try {
    writePaper(root, 'one.md', ['retrieval-rag', 'unknown-topic', 'retrieval-rag', 'too-many']);
    writePaper(path.join(root, 'en'), 'one.md', ['retrieval-rag']);
    const result = validatePaperTopics({ contentDir: root, topicIds: ['retrieval-rag'], minEntries: 2 });
    assert.equal(result.ok, false);
    assert.match(result.errors.join('\n'), /must contain 1–3 IDs/);
    assert.match(result.errors.join('\n'), /must not repeat an ID/);
    assert.match(result.errors.join('\n'), /unknown topic ID/);
    assert.match(result.errors.join('\n'), /same order/);
    assert.match(result.errors.join('\n'), /needs at least 2 Chinese entries/);
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
});
