const LABEL_VARIANTS = new Map([
  ['花花的一句話', 'note'],
  ['花花的工程提醒', 'engineering'],
  ['花花的判斷', 'judgment'],
  ['Huahua in one sentence', 'note'],
  ["Huahua's engineering note", 'engineering'],
  ['Huahua’s engineering note', 'engineering'],
  ["Huahua's take", 'judgment'],
  ['Huahua’s take', 'judgment'],
]);

function textContent(node) {
  if (!node || typeof node !== 'object') return '';
  if (typeof node.value === 'string') return node.value;
  return Array.isArray(node.children) ? node.children.map(textContent).join('') : '';
}

export function detectHuahuaCallout(node) {
  if (node?.type !== 'blockquote') return null;
  const firstParagraph = node.children?.[0];
  const firstChild = firstParagraph?.type === 'paragraph' ? firstParagraph.children?.[0] : null;
  if (firstChild?.type !== 'strong') return null;
  const label = textContent(firstChild).trim();
  const variant = LABEL_VARIANTS.get(label);
  return variant ? { label, variant } : null;
}

export default function remarkHuahuaCallout() {
  return (tree) => {
    const walk = (node) => {
      if (!node || typeof node !== 'object') return;
      const callout = detectHuahuaCallout(node);
      if (callout) {
        node.data ??= {};
        node.data.hName = 'aside';
        node.data.hProperties = {
          className: ['huahua-callout', `huahua-callout--${callout.variant}`],
          role: 'note',
          'data-huahua-variant': callout.variant,
          'aria-label': callout.label,
        };
      }
      if (Array.isArray(node.children)) node.children.forEach(walk);
    };
    walk(tree);
  };
}
