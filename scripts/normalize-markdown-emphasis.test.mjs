import test from 'node:test';
import assert from 'node:assert/strict';
import { normalizeMarkdownEmphasis } from './normalize-markdown-emphasis.mjs';
import { validateMarkdownEmphasis } from './validate-markdown-emphasis.mjs';

test('repairs CJK labels, quotations, and parenthetical emphasis', () => {
  const source = [
    '- **問題：**傳統方法遺失結構。',
    '',
    '這是**「核心洞見」**的說明。',
    '',
    '使用**有向無環圖（DAG）**依賴模型。',
  ].join('\n');
  const normalized = normalizeMarkdownEmphasis(source);
  assert.match(normalized, /\*\*問題\*\*：傳統/);
  assert.match(normalized, /「\*\*核心洞見\*\*」/);
  assert.match(normalized, /\*\*有向無環圖\*\*（DAG）依賴/);
  assert.deepEqual(validateMarkdownEmphasis(normalized), []);
});

test('does not rewrite emphasis that remark already parses', () => {
  const source = '**Already valid** and **also valid**.';
  assert.equal(normalizeMarkdownEmphasis(source), source);
});
