import test from 'node:test';
import assert from 'node:assert/strict';
import { extractPaperEssence } from './paperEssence.ts';

test('extracts four labelled points from a bilingual ninety-second map', () => {
  const body = `
## 90 秒地圖 / The paper in 90 seconds

- **問題**：要解決什麼。
- **核心想法**：如何解決。
- **最強證據**：Table 1。
- **邊界**：不能外推。

## 下一節
`;
  assert.deepEqual(extractPaperEssence(body), [
    { label: '問題', text: '要解決什麼。' },
    { label: '核心想法', text: '如何解決。' },
    { label: '最強證據', text: 'Table 1。' },
    { label: '邊界', text: '不能外推。' },
  ]);
});

test('accepts English punctuation inside the strong label', () => {
  const body = `## The paper in 90 seconds\n\n- **Problem:** What changes.\n- **Boundary:** What does not.`;
  assert.deepEqual(extractPaperEssence(body), [
    { label: 'Problem', text: 'What changes.' },
    { label: 'Boundary', text: 'What does not.' },
  ]);
});

test('accepts the compact Chinese ninety-second heading', () => {
  const body = `## 90 秒掌握論文\n\n- **問題**：One.\n- **直覺**：Two.\n- **證據**：Three.\n- **邊界**：Four.`;
  assert.equal(extractPaperEssence(body).length, 4);
});
