/** Small, explicit concept groups shared by both language versions of site search. */
const CONCEPTS = [
  ['rag', 'retrieval augmented generation', '檢索增強生成', '檢索增強', '检索增强生成', '检索增强'],
  ['agent', 'agents', 'ai agent', 'ai agents', 'agentic', '智能體', '智能体', '智慧代理', '智能代理'],
  ['llm', 'llms', 'large language model', 'large language models', '大型語言模型', '大語言模型', '大型语言模型', '大语言模型'],
  ['mcp', 'model context protocol', '模型上下文協定', '模型上下文协议', '模型情境協定'],
  ['retrieval', '檢索', '检索'],
  ['evaluation', 'evaluations', 'eval', 'evals', '評測', '評估', '评测', '评估'],
  ['enterprise', '企業', '企业'],
  ['governance', '治理'],
];

function normalize(value) {
  return String(value ?? '').normalize('NFKC').toLowerCase()
    .replace(/[^\p{L}\p{N}+#]+/gu, ' ').trim().replace(/\s+/g, ' ');
}

function escapePattern(value) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, '\\$&');
}

function aliasPattern(value) {
  // Latin aliases are words, so RAG does not accidentally match storage or fragment.
  const start = /^[a-z0-9]/.test(value) ? '(?<![a-z0-9])' : '';
  const end = /[a-z0-9]$/.test(value) ? '(?![a-z0-9])' : '';
  return start + escapePattern(value) + end;
}

const concepts = CONCEPTS.map((aliases) => {
  const values = [...new Set(aliases.map(normalize))];
  return { key: values[0], values, patterns: values.map((value) => new RegExp(aliasPattern(value), 'u')) };
});
const conceptByAlias = new Map(concepts.flatMap((concept) => concept.values.map((value) => [value, concept])));
const aliasMatcher = new RegExp([...conceptByAlias.keys()]
  .sort((a, b) => b.length - a.length).map(aliasPattern).join('|'), 'gu');

function queryTerms(query) {
  const text = normalize(query);
  const terms = new Map();
  const addLiteral = (value) => {
    for (const token of value.match(/[\p{L}\p{N}+#]+/gu) ?? []) {
      terms.set(`text:${token}`, { matches: (field) => field.includes(token) });
    }
  };
  let offset = 0;
  // Find complete aliases first: English phrases stay together and Chinese aliases
  // can be recognized beside other terms even when the reader omits spaces.
  for (const match of text.matchAll(aliasMatcher)) {
    addLiteral(text.slice(offset, match.index));
    const concept = conceptByAlias.get(match[0]);
    terms.set(`concept:${concept.key}`, { matches: (field) => concept.patterns.some((pattern) => pattern.test(field)) });
    offset = match.index + match[0].length;
  }
  addLiteral(text.slice(offset));
  return [...terms.values()];
}

/** Normalize each field once when the lazily fetched search index arrives. */
export function createSearchIndex(items) {
  return items.map((item, position) => ({
    item, position,
    title: normalize(item.title),
    tags: (item.tags ?? []).map(normalize),
    category: normalize(item.category),
    description: normalize(item.description),
  }));
}

/** AND between query concepts, OR between a concept's bilingual aliases. */
export function searchItems(index, query = '', selectedType = 'all') {
  const terms = queryTerms(query);
  const candidates = index.filter(({ item }) => selectedType === 'all' || item.type === selectedType);
  if (terms.length === 0) return candidates.map(({ item }) => item);

  return candidates.flatMap((entry) => {
    let title = 0;
    let tags = 0;
    let category = 0;
    let description = 0;
    for (const term of terms) {
      if (term.matches(entry.title)) title += 1;
      else if (entry.tags.some(term.matches)) tags += 1;
      else if (term.matches(entry.category)) category += 1;
      else if (term.matches(entry.description)) description += 1;
      else return [];
    }
    return [{ entry, title, tags, category, description }];
  }).sort((a, b) => b.title - a.title || b.tags - a.tags
    || b.category - a.category || b.description - a.description
    || a.entry.position - b.entry.position).map(({ entry }) => entry.item);
}
