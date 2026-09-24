import assert from 'node:assert/strict';
import test from 'node:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRoleComparison from '../src/utils/rehypeRoleComparison.mjs';

function renderTree(markdown) {
  const processor = unified().use(remarkParse).use(remarkGfm).use(remarkRehype).use(rehypeRoleComparison);
  return processor.runSync(processor.parse(markdown));
}

test('role comparison retains its table and adds three semantic mobile cards', () => {
  const tree = renderTree([
    '| 工作站 | 主要責任 | 我期待的輸出 | 不能直接假設的事 |',
    '| --- | --- | --- | --- |',
    '| Astra | 規劃 | SPEC | 免審查 |',
    '| Flash | 執行 | diff | 免測試 |',
    '| 人類 | 審查 | 決定 | 測試萬能 |',
  ].join('\n'));
  assert.deepEqual(tree.children.map((child) => child.tagName), ['table', 'div']);
  assert.deepEqual(tree.children[0].properties.className, ['role-comparison-table']);
  const cards = tree.children[1].children;
  assert.equal(cards.length, 3);
  assert.ok(cards.every((card) => card.children[0].tagName === 'p'));
  assert.deepEqual(cards.map((card) => card.properties.ariaLabel), ['Astra', 'Flash', '人類']);
  assert.deepEqual(cards.map((card) => card.children[0].children[0].value), ['Astra', 'Flash', '人類']);
  assert.deepEqual(cards[0].children[1].children.map((item) => item.tagName), ['dt', 'dd', 'dt', 'dd', 'dt', 'dd']);
});

test('numeric tables remain unchanged', () => {
  const tree = renderTree('| 模型設定 | 完成率 |\n| --- | ---: |\n| Astra | 74% |');
  assert.deepEqual(tree.children.map((child) => child.tagName), ['table']);
  assert.equal(tree.children[0].properties.className, undefined);
});
