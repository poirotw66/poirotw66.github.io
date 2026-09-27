const KNOWN_ROLE_HEADERS = [
  ['工作角色', '本文的當前例子', '應留下的成果', '需要守住的邊界'],
  ['Role', 'Current example in this article', 'Expected artifact', 'Boundary to preserve'],
  ['工作站', '主要責任', '我期待的輸出', '不能直接假設的事'],
  ['Workstation', 'Primary responsibility', 'Expected output', 'What I do not assume'],
];

function isRoleHeaderMatch(headers) {
  if (headers.length < 3) return false;
  if (KNOWN_ROLE_HEADERS.some((expected) => expected.every((label, pos) => headers[pos] === label))) {
    return true;
  }
  return /^(?:工作角色|工作站|角色|role|workstation|agent\s*role)$/iu.test(headers[0]);
}

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

        // Check for an explicit preceding comment marker: <!-- role-comparison -->
        let hasExplicitMarker = false;
        let markerIndex = -1;
        for (let j = index - 1; j >= 0; j -= 1) {
          const prev = parent.children[j];
          if (prev.type === 'text' && !prev.value.trim()) continue;
          if ((prev.type === 'raw' || prev.type === 'comment') && /<!--\s*role-comparison\s*-->/iu.test(prev.value ?? '')) {
            hasExplicitMarker = true;
            markerIndex = j;
          }
          break;
        }

        const headerCells = node.children.find((child) => child.tagName === 'thead')
          ?.children.find((child) => child.tagName === 'tr')?.children
          .filter((child) => child.tagName === 'th') ?? [];
        const headers = headerCells.map((cell) => textContent(cell).trim());

        const shouldRenderCards = hasExplicitMarker || isRoleHeaderMatch(headers);
        if (!shouldRenderCards) continue;

        node.properties.className = [...(node.properties.className ?? []), 'role-comparison-table'];
        const cards = roleCards(node, headers);
        if (cards.children.length > 0) {
          parent.children.splice(index + 1, 0, cards);
          index += 1;
        }

        if (markerIndex !== -1) {
          let deleteCount = 1;
          while (
            markerIndex + deleteCount < parent.children.length &&
            parent.children[markerIndex + deleteCount].type === 'text' &&
            !parent.children[markerIndex + deleteCount].value.trim()
          ) {
            deleteCount += 1;
          }
          parent.children.splice(markerIndex, deleteCount);
          index -= deleteCount;
        }
      }
    };
    walk(tree);
  };
}
