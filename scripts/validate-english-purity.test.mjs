import test from 'node:test';
import assert from 'node:assert/strict';

import { validateEnglishBody } from './validate-english-purity.mjs';

test('rejects untranslated CJK in ordinary English prose', () => {
  const errors = validateEnglishBody('## Overview\n\nThis paragraph 還沒翻譯。\n', 'demo.md');
  assert.equal(errors.length, 1);
  assert.match(errors[0], /還沒翻譯/);
});

test('allows branded Huahua callouts written in Traditional Chinese', () => {
  const errors = validateEnglishBody(
    '> **花花的一句話**：這是品牌角色保留的中文語氣。\n>\n> **花花的工程提醒**：這一段也屬於品牌引言。\n',
    'demo.md',
  );
  assert.deepEqual(errors, []);
});

test('ignores CJK in code, URLs, and asset paths', () => {
  const errors = validateEnglishBody(
    'Use `docs/中文檔名.md` and ![English alt](/images/中文圖片.webp).\n',
    'demo.md',
  );
  assert.deepEqual(errors, []);
});

test('allows the Huahua brand name in otherwise English prose', () => {
  const errors = validateEnglishBody('花花 recommends checking the evaluation contract.\n', 'demo.md');
  assert.deepEqual(errors, []);
});
