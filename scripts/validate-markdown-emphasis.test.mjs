import test from 'node:test';
import assert from 'node:assert/strict';
import { validateMarkdownEmphasis } from './validate-markdown-emphasis.mjs';

test('accepts strong emphasis that remark parses successfully', () => {
  const source = `---\ntitle: Test\n---\n\n- **問題**：傳統方法遺失結構。\n\n這是「**核心洞見**」的說明。\n`;
  assert.deepEqual(validateMarkdownEmphasis(source), []);
});

test('rejects strong markers that remark leaves as visible text', () => {
  const source = `---\ntitle: Test\n---\n\n- **問題：**傳統方法遺失結構。\n\n這是**「核心洞見」**的說明。\n`;
  const errors = validateMarkdownEmphasis(source, 'example.md');
  assert.equal(errors.length, 2);
  assert.match(errors[0], /literal \*\*/);
  assert.match(errors[1], /literal \*\*/);
});

test('ignores code examples and escaped literal markers', () => {
  const source = `Use \`**literal**\` when documenting Markdown.\n\n\\*\\*escaped\\*\\*\n\n\`\`\`markdown\n**code**\n\`\`\`\n`;
  assert.deepEqual(validateMarkdownEmphasis(source), []);
});
