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
    ['問題', '要解決什麼。'],
    ['核心想法', '如何解決。'],
    ['最強證據', 'Table 1。'],
    ['邊界', '不能外推。'],
  ]);
});

test('accepts English punctuation inside the strong label', () => {
  const body = `## The paper in 90 seconds\n\n- **Problem:** What changes.\n- **Boundary:** What does not.`;
  assert.deepEqual(extractPaperEssence(body), [
    ['Problem', 'What changes.'],
    ['Boundary', 'What does not.'],
  ]);
});

test('accepts the compact Chinese ninety-second heading', () => {
  const body = `## 90 秒掌握論文\n\n- **問題**：One.\n- **直覺**：Two.\n- **證據**：Three.\n- **邊界**：Four.`;
  assert.equal(extractPaperEssence(body).length, 4);
});

test('uses explicit hub points without requiring a body map or duplicating it', () => {
  const points: [string, string][] = [['Problem','Persistent edits'],['Idea','Bounded operations'],['Evidence','Author comparison'],['Boundary','No user study']];
  assert.deepEqual(extractPaperEssence('Natural narrative without a ninety-second section.', points), points);
  assert.deepEqual(extractPaperEssence('## The paper in 90 seconds\n\n- **Old:** Old point.', points), points);
});

test('does not invent hub points from unrelated prose', () => {
  assert.deepEqual(extractPaperEssence('A detailed mechanism is explained in ordinary prose.'), []);
});

test('rejects incomplete or blank explicit points', () => {
  assert.throws(() => extractPaperEssence('', [['Problem','Only one']]), /four non-empty/);
  assert.throws(() => extractPaperEssence('', [['Problem','One'],['Idea','Two'],['Evidence','Three'],['Boundary','  ']]), /four non-empty/);
});
