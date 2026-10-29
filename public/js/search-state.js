const TYPES = new Set(['all', 'blog', 'paperReading', 'projects']);
const MAX_PAGE = 100;
const MAX_QUERY_LENGTH = 500;

export function normalizeSearchState({ query = '', type = 'all', page = 1 } = {}) {
  return {
    query: String(query).trim().slice(0, MAX_QUERY_LENGTH),
    type: TYPES.has(type) ? type : 'all',
    page: /^\d+$/.test(String(page)) && Number.isSafeInteger(Number(page))
      ? Math.min(MAX_PAGE, Math.max(1, Number(page))) : 1,
  };
}

export function readSearchState(url) {
  const params = new URL(url).searchParams;
  return normalizeSearchState({ query: params.get('q') ?? '', type: params.get('type') ?? 'all', page: params.get('page') ?? 1 });
}

export function writeSearchState(url, state) {
  const result = new URL(url);
  const normalized = normalizeSearchState(state);
  for (const [key, value, defaultValue] of [
    ['q', normalized.query, ''],
    ['type', normalized.type, 'all'],
    ['page', String(normalized.page), '1'],
  ]) {
    if (value === defaultValue) result.searchParams.delete(key);
    else result.searchParams.set(key, value);
  }
  return result;
}
