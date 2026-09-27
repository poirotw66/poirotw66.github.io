import assert from 'node:assert/strict';
import test from 'node:test';
import { unified } from 'unified';
import remarkParse from 'remark-parse';
import remarkGfm from 'remark-gfm';
import remarkRehype from 'remark-rehype';
import rehypeRoleComparison from '../src/utils/rehypeRoleComparison.mjs';

function renderTree(markdown) {
  const processor = unified()
    .use(remarkParse)
    .use(remarkGfm)
    .use(remarkRehype, { allowDangerousHtml: true })
    .use(rehypeRoleComparison);
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

test('role comparison recognizes current article 100 role headers', () => {
  const tree = renderTree([
    '| 工作角色 | 本文的當前例子 | 應留下的成果 | 需要守住的邊界 |',
    '| --- | --- | --- | --- |',
    '| 規劃層 | GPT-6 Astra | SPEC v0 | 非驗證 |',
    '| 執行層 | Flash High | diff | 不擴權 |',
    '| 人類關卡 | 工程師 | 交付決策 | 測試不等於授權 |',
  ].join('\n'));
  assert.deepEqual(tree.children.map((child) => child.tagName), ['table', 'div']);
  assert.equal(tree.children[1].children.length, 3);
});

test('explicit role-comparison marker enables cards regardless of custom headers', () => {
  const tree = renderTree([
    '<!-- role-comparison -->',
    '',
    '| 參與角色 | 負責項目 | 產出 |',
    '| --- | --- | --- |',
    '| 代理人 A | 檢索 | 候選集 |',
    '| 代理人 B | 總結 | 報告 |',
  ].join('\n'));
  assert.deepEqual(tree.children.map((child) => child.tagName), ['table', 'div']);
  assert.equal(tree.children[1].children.length, 2);
});

