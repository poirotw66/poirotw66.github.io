const ROLE_HEADERS = [
  ['工作站', '主要責任', '我期待的輸出', '不能直接假設的事'],
  ['Workstation', 'Primary responsibility', 'Expected output', 'What I do not assume'],
];

function textContent(node) {
  if (typeof node?.value === 'string') return node.value;
  return node?.children?.map(textContent).join('') ?? '';
}

function element(tagName, properties = {}, children = []) {
  return { type: 'element', tagName, properties, children };
}

function roleCards(table, headers) {
  const rows = table.children.find((child) => child.tagName === 'tbody')?.children
    .filter((child) => child.tagName === 'tr') ?? [];
  return element('div', { className: ['role-comparison-cards'] }, rows.map((row) => {
    const cells = row.children.filter((child) => child.tagName === 'td');
    if (cells.length !== headers.length) return null;
    return element('section', {
      className: ['role-comparison-card'],
      ariaLabel: textContent(cells[0]),
    }, [
      element('p', { className: ['role-comparison-card-title'] }, structuredClone(cells[0].children)),
      element('dl', {}, cells.slice(1).flatMap((cell, index) => [
        element('dt', {}, [{ type: 'text', value: headers[index + 1] }]),
        element('dd', {}, structuredClone(cell.children)),
      ])),
    ]);
  }).filter(Boolean));
}

export default function rehypeRoleComparison() {
  return (tree) => {
    const walk = (parent) => {
      if (!Array.isArray(parent.children)) return;
      for (let index = 0; index < parent.children.length; index += 1) {
        const node = parent.children[index];
        if (node.tagName !== 'table') {
          walk(node);
          continue;
        }
        const headerCells = node.children.find((child) => child.tagName === 'thead')
          ?.children.find((child) => child.tagName === 'tr')?.children
          .filter((child) => child.tagName === 'th') ?? [];
        const headers = headerCells.map((cell) => textContent(cell).trim());
        if (!ROLE_HEADERS.some((expected) => expected.every((label, position) => headers[position] === label))) continue;
        node.properties.className = [...(node.properties.className ?? []), 'role-comparison-table'];
        const cards = roleCards(node, headers);
        if (cards.children.length > 0) parent.children.splice(index + 1, 0, cards);
        index += 1;
      }
    };
    walk(tree);
  };
}
