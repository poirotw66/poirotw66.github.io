export const BLOG_INDEX_PAGE_SIZE = 18;

export interface BlogIndexManifest<T> {
  version: 1;
  total: number;
  pageSize: number;
  items: T[];
  pages: string[];
}

export function chunkBlogIndexItems<T>(
  items: T[],
  pageSize = BLOG_INDEX_PAGE_SIZE,
): T[][] {
  if (!Number.isInteger(pageSize) || pageSize <= 0) {
    throw new RangeError('Blog index page size must be a positive integer.');
  }

  const chunks: T[][] = [];
  for (let offset = 0; offset < items.length; offset += pageSize) {
    chunks.push(items.slice(offset, offset + pageSize));
  }
  return chunks;
}

export function createBlogIndexManifest<T>(
  items: T[],
  lang: 'zh' | 'en',
  pageSize = BLOG_INDEX_PAGE_SIZE,
): BlogIndexManifest<T> {
  const chunks = chunkBlogIndexItems(items, pageSize);
  const localePrefix = lang === 'en' ? '/en' : '';
  return {
    version: 1,
    total: items.length,
    pageSize,
    items: chunks[0] ?? [],
    pages: chunks.slice(1).map((_, index) => `${localePrefix}/blog/data/${index + 2}.json`),
  };
}
